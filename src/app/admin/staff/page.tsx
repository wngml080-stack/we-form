"use client";

import { use } from "react";
import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, CheckCircle, Users } from "lucide-react";
import { formatPhoneNumber, formatPhoneNumberOnChange } from "@/lib/utils/phone-format";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  employment_status: string;
  joined_at?: string;
  gym_id?: string;
  work_start_time?: string;
  work_end_time?: string;
  gyms?: { name: string } | null;
}

interface Gym {
  id: string;
  name: string;
}

interface StaffUpdateData {
  name: string;
  email: string;
  phone: string;
  job_title: string;
  employment_status: string;
  joined_at: string;
  gym_id: string | null;
  work_start_time: string | null;
  work_end_time: string | null;
}

const JOB_TITLES = ["대표", "이사", "실장", "지점장", "FC사원", "FC주임", "FC팀장", "PT팀장", "트레이너", "프리랜서", "필라팀장", "필라전임", "필라파트", "골프프로", "기타"];

export default function AdminStaffPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const { user, isLoading: authLoading } = useAuth();
  const { staffFilter, isInitialized: filterInitialized } = useAdminFilter();

  const [activeStaffs, setActiveStaffs] = useState<Staff[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<Staff[]>([]);

  // 지점 목록 (이동 발령용)
  const [gymList, setGymList] = useState<Gym[]>([]);

  // 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);

  // 수정 폼 (gym_id, work_start_time, work_end_time 추가됨)
  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", job_title: "", employment_status: "", joined_at: "", gym_id: "", work_start_time: "", work_end_time: ""
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", job_title: "트레이너", joined_at: "" });
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createSupabaseClient();

  // 현재 선택된 필터 정보
  const selectedCompanyId = staffFilter.selectedCompanyId;
  const selectedGymId = staffFilter.selectedGymId;
  const gyms = staffFilter.gyms;

  // 현재 선택된 지점명
  const gymName = gyms.find(g => g.id === selectedGymId)?.name || "We:form";

  useEffect(() => {
    if (authLoading || !filterInitialized) return;
    if (!user) return;

    // 직원 목록 조회
    if (selectedGymId) {
      fetchStaffs(selectedGymId, selectedCompanyId);
    }

    // 지점 목록 조회 (이동 발령을 위해)
    const fetchGymList = async () => {
      const { data: allGyms } = await supabase.from("gyms").select("id, name").eq("company_id", selectedCompanyId).order("name");
      if (allGyms) setGymList(allGyms);
    };
    if (selectedCompanyId) {
      fetchGymList();
    }
  }, [authLoading, filterInitialized, selectedGymId, selectedCompanyId, user]);

  // 직원 목록 조회
  const fetchStaffs = async (targetGymId: string, targetCompanyId: string) => {
    let query = supabase
      .from("staffs")
      .select(`
        id, name, email, phone, job_title, employment_status, joined_at, gym_id,
        work_start_time, work_end_time,
        gyms ( name )
      `)
      .eq("company_id", targetCompanyId)
      .order("name", { ascending: true });

    // 선택한 지점이 있으면 해당 지점만 조회 (관리자도 지점 선택 시 해당 지점만 표시)
    if (targetGymId) {
      query = query.eq("gym_id", targetGymId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("직원 조회 에러:", error);
        return;
    }

    if (data) {
      // gyms 배열을 객체로 변환
      const transformedData = data.map((s: Staff & { gyms: { name: string }[] | { name: string } | null }) => ({
        ...s,
        gyms: Array.isArray(s.gyms) && s.gyms.length > 0 ? s.gyms[0] : s.gyms
      }));
      setPendingStaffs(transformedData.filter(s => s.employment_status === '가입대기'));
      setActiveStaffs(transformedData.filter(s => s.employment_status !== '가입대기'));
    }
  };

  // 승인 처리
  const handleApprove = async (staffId: string) => {
    if (!confirm("이 직원의 가입을 승인하시겠습니까?")) return;
    const { error } = await supabase.from("staffs").update({ employment_status: "재직", role: "staff" }).eq("id", staffId);
    if (!error) { toast.success("승인되었습니다."); fetchStaffs(selectedGymId, selectedCompanyId); }
  };

  // 수정 모달 열기
  const openEditModal = (staff: Staff) => {
    setEditTarget(staff);
    setEditForm({
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
      job_title: staff.job_title || "트레이너",
      employment_status: staff.employment_status || "재직",
      joined_at: staff.joined_at || "",
      gym_id: staff.gym_id || "none",
      work_start_time: staff.work_start_time || "",
      work_end_time: staff.work_end_time || "",
    });
    setIsEditOpen(true);
  };

  // 수정 실행 (지점 이동 포함)
  const handleUpdate = async () => {
    if (!editTarget) return;

    const updateData: StaffUpdateData = {
      ...editForm,
      gym_id: editForm.gym_id === "none" || editForm.gym_id === "" ? null : editForm.gym_id,
      work_start_time: editForm.work_start_time === "" ? null : editForm.work_start_time,
      work_end_time: editForm.work_end_time === "" ? null : editForm.work_end_time,
    };

    const { error } = await supabase.from("staffs").update(updateData).eq("id", editTarget.id);
    if (!error) {
        toast.success("정보가 수정되었습니다.");
        setIsEditOpen(false);
        fetchStaffs(selectedGymId, selectedCompanyId);
    } else {
        toast.error("실패: " + error.message);
    }
  };

  // 신규 등록 실행 (Supabase Auth 방식: staffs 테이블에만 등록, 직원이 로그인 시 이메일로 자동 연결)
  const handleCreateStaff = async () => {
    if (!createForm.name || !createForm.email) { toast.warning("이름과 이메일은 필수입니다."); return; }

    setIsCreating(true);
    try {
        const res = await fetch("/api/admin/create-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // gym_id를 null로 설정하여 발령 대기 상태로 생성
            body: JSON.stringify({ ...createForm, gym_id: null, company_id: selectedCompanyId })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "등록 실패");
        toast.success("직원이 등록되었습니다. 해당 이메일로 로그인하면 자동으로 연결됩니다.");
        setIsCreateOpen(false);
        setCreateForm({ name: "", email: "", phone: "", job_title: "트레이너", joined_at: "" });
        fetchStaffs(selectedGymId, selectedCompanyId);
    } catch (e) { toast.error(e instanceof Error ? e.message : "등록 실패"); }
    finally { setIsCreating(false); }
  };

  const getStatusColor = (status: string) => {
    if (status === "재직") return "bg-emerald-500 text-white";
    if (status === "퇴사") return "bg-gray-400 text-white";
    return "bg-blue-500 text-white";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-10 animate-in fade-in duration-700">
      {/* 헤더 - 더 고급스러운 디자인 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-[0.2em]">
            <span className="w-8 h-[2px] bg-blue-600"></span>
            Staff Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
            직원 통합 관리
          </h1>
          <p className="text-slate-500 font-bold text-lg flex items-center gap-2">
            <span className="text-[#2F80ED] border-b-2 border-blue-100 px-1">{gymName}</span> 지점의 우수한 파트너들을 관리합니다.
          </p>
        </div>

        <Button 
          onClick={() => setIsCreateOpen(true)} 
          className="h-14 px-8 bg-[#2F80ED] hover:bg-[#2570d6] text-white rounded-2xl font-black shadow-xl shadow-blue-200 flex items-center gap-2 transition-all hover:-translate-y-1 active:scale-95"
        >
          <Plus className="w-6 h-6"/> 신규 직원 등록
        </Button>
      </div>

      {/* 대기 인원 - 긴급 알림 스타일 */}
      {pendingStaffs.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 shadow-sm shadow-amber-100/50 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="font-black text-amber-900 text-xl tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Users className="w-5 h-5 text-white" />
                </div>
                승인 대기 중인 파트너
              </h3>
              <p className="text-amber-700 font-bold text-sm ml-13">새로운 직원이 가입을 기다리고 있습니다. 정보를 확인 후 승인해주세요.</p>
            </div>
            <Badge className="bg-amber-500 text-white border-none font-black px-3 py-1 rounded-lg">{pendingStaffs.length} PENDING</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingStaffs.map((staff: Staff) => (
              <div key={staff.id} className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-100 shadow-sm transition-all hover:shadow-md">
                <div className="space-y-1">
                  <div className="font-black text-slate-900">{staff.name}</div>
                  <div className="text-xs font-bold text-slate-400">{staff.email}</div>
                  <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">{staff.gyms?.name || "No Assignment"}</div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-100"
                  onClick={() => handleApprove(staff.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5"/> 승인하기
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 직원 리스트 - 오픈형 테이블 스타일 */}
      <div className="bg-white rounded-[40px] shadow-xl shadow-slate-100/50 border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">직원 정보</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">연락처</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">소속 정보</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">상태 / 입사일</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeStaffs.map((staff: Staff) => (
                <tr key={staff.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="font-black text-slate-900 text-base tracking-tighter">{staff.name}</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{staff.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-600 font-bold tracking-tight">{staff.phone ? formatPhoneNumber(staff.phone) : "-"}</td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <div className="font-black text-slate-900 text-sm">{staff.job_title}</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        <span className="text-xs font-bold text-blue-600/60 uppercase tracking-widest">{staff.gyms?.name || "미지정"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <Badge className={`${getStatusColor(staff.employment_status)} border-none font-black text-[10px] px-2.5 py-0.5 rounded-lg shadow-sm shadow-slate-100`}>
                        {staff.employment_status.toUpperCase()}
                      </Badge>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">{staff.joined_at || "No Date"}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(staff)}
                      className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-lg text-slate-300 hover:text-blue-600 transition-all"
                    >
                      <Pencil className="h-5 w-5"/>
                    </Button>
                  </td>
                </tr>
              ))}
              {activeStaffs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-200">
                      <Users className="w-20 h-20 mb-6 opacity-20" />
                      <h4 className="text-xl font-black text-slate-400 tracking-tighter">등록된 직원이 없습니다</h4>
                      <p className="text-sm font-bold text-slate-300 mt-2">상단의 신규 직원 등록 버튼을 통해 새로운 파트너를 추가하세요.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 수정 모달 - 다크 & 라이트 혼합 디자인 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white max-w-2xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 lg:p-10 text-white">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-[18px] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/20">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-3xl font-black text-white !text-white tracking-tighter">직원 정보 수정</DialogTitle>
              </div>
              <DialogDescription className="text-slate-400 font-bold text-base">
                파트너의 개인 정보 및 업무 설정을 업데이트합니다.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 lg:p-10 space-y-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"/>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: formatPhoneNumberOnChange(e.target.value)})} placeholder="010-0000-0000" className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"/>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Branch</Label>
              <Select value={editForm.gym_id} onValueChange={(v) => setEditForm({...editForm, gym_id: v})}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 shadow-inner">
                  <SelectValue placeholder="지점 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="none" className="rounded-xl font-bold py-3 text-slate-400">-- 소속 없음 (대기) --</SelectItem>
                  {gymList.map(g => (
                    <SelectItem key={g.id} value={g.id} className="rounded-xl font-bold py-3">{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</Label>
                <Select value={editForm.job_title} onValueChange={(v) => setEditForm({...editForm, job_title: v})}>
                  <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[300px]">
                    {JOB_TITLES.map((t) => <SelectItem key={t} value={t} className="rounded-xl font-bold py-3">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Joined Date</Label>
                <Input type="date" value={editForm.joined_at} onChange={(e) => setEditForm({...editForm, joined_at: e.target.value})} className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 shadow-inner"/>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Employment Status</Label>
              <Select value={editForm.employment_status} onValueChange={(v) => setEditForm({...editForm, employment_status: v})}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="재직" className="rounded-xl font-bold py-3 text-emerald-600">재직 중</SelectItem>
                  <SelectItem value="퇴사" className="rounded-xl font-bold py-3 text-slate-400">퇴사 완료</SelectItem>
                  <SelectItem value="휴직" className="rounded-xl font-bold py-3 text-amber-600">휴직 중</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 space-y-6">
              <div className="space-y-1">
                <Label className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  업무 시간 설정
                </Label>
                <p className="text-xs text-slate-400 font-bold ml-4">수업 정산 시 근무내/외 자동 분류를 위한 기준입니다.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Start</Label>
                  <Input type="time" value={editForm.work_start_time} onChange={(e) => setEditForm({...editForm, work_start_time: e.target.value})} className="h-12 bg-white border-slate-200 rounded-xl px-5 font-black shadow-sm"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift End</Label>
                  <Input type="time" value={editForm.work_end_time} onChange={(e) => setEditForm({...editForm, work_end_time: e.target.value})} className="h-12 bg-white border-slate-200 rounded-xl px-5 font-black shadow-sm"/>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">취소</Button>
              <Button onClick={handleUpdate} className="h-14 px-12 bg-[#2F80ED] hover:bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95">정보 업데이트</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 신규 등록 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white max-w-2xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-blue-600 p-8 lg:p-10 text-white">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-[18px] bg-white flex items-center justify-center shadow-xl shadow-blue-900/20">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle className="text-3xl font-black text-white !text-white tracking-tighter">신규 직원 등록</DialogTitle>
              </div>
              <DialogDescription className="text-blue-100 font-bold text-base">
                센터 운영을 함께할 새로운 파트너를 시스템에 등록합니다.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 lg:p-10 space-y-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name <span className="text-red-500">*</span></Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"/>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({...createForm, phone: formatPhoneNumberOnChange(e.target.value)})} placeholder="010-0000-0000" className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"/>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Login Email <span className="text-red-500">*</span></Label>
              <Input value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} placeholder="직원이 로그인할 이메일 주소" className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"/>
              <p className="text-[11px] text-slate-400 font-bold ml-1">※ 직원이 이 이메일로 가입하면 시스템에 자동으로 매칭됩니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</Label>
                <Select value={createForm.job_title} onValueChange={(v) => setCreateForm({...createForm, job_title: v})}>
                  <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[300px]">
                    {JOB_TITLES.map((t) => <SelectItem key={t} value={t} className="rounded-xl font-bold py-3">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Joined Date</Label>
                <Input type="date" value={createForm.joined_at} onChange={(e) => setCreateForm({...createForm, joined_at: e.target.value})} className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 shadow-inner"/>
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">취소</Button>
              <Button onClick={handleCreateStaff} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95" disabled={isCreating}>
                직원 정보 등록하기
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
