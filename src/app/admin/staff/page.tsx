"use client";

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
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";

const JOB_TITLES = ["대표", "이사", "실장", "지점장", "FC사원", "FC주임", "FC팀장", "PT팀장", "트레이너", "프리랜서", "필라팀장", "필라전임", "필라파트", "골프프로", "기타"];

export default function AdminStaffPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { staffFilter, isInitialized: filterInitialized } = useAdminFilter();

  const [activeStaffs, setActiveStaffs] = useState<any[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<any[]>([]);

  // 지점 목록 (이동 발령용)
  const [gymList, setGymList] = useState<any[]>([]);

  // 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  // 수정 폼 (gym_id, work_start_time, work_end_time 추가됨)
  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", job_title: "", employment_status: "", joined_at: "", gym_id: "", work_start_time: "", work_end_time: ""
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", phone: "", job_title: "트레이너", joined_at: "" });
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
      setPendingStaffs(data.filter(s => s.employment_status === '가입대기'));
      setActiveStaffs(data.filter(s => s.employment_status !== '가입대기'));
    }
  };

  // 승인 처리
  const handleApprove = async (staffId: string) => {
    if (!confirm("이 직원의 가입을 승인하시겠습니까?")) return;
    const { error } = await supabase.from("staffs").update({ employment_status: "재직", role: "staff" }).eq("id", staffId);
    if (!error) { alert("승인되었습니다."); fetchStaffs(selectedGymId, selectedCompanyId); }
  };

  // 수정 모달 열기
  const openEditModal = (staff: any) => {
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

    const updateData: any = { ...editForm };
    // 'none'이나 빈값이면 null로 처리 (소속 없음)
    if (updateData.gym_id === "none" || updateData.gym_id === "") {
        updateData.gym_id = null;
    }
    // 빈 문자열은 time 타입에서 오류 발생하므로 null로 변환
    if (updateData.work_start_time === "") {
        updateData.work_start_time = null;
    }
    if (updateData.work_end_time === "") {
        updateData.work_end_time = null;
    }

    const { error } = await supabase.from("staffs").update(updateData).eq("id", editTarget.id);
    if (!error) {
        alert("정보가 수정되었습니다.");
        setIsEditOpen(false);
        fetchStaffs(selectedGymId, selectedCompanyId);
    } else {
        alert("실패: " + error.message);
    }
  };

  // 신규 등록 실행
  const handleCreateStaff = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return alert("필수 정보를 입력해주세요.");

    setIsCreating(true);
    try {
        const res = await fetch("/api/admin/create-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // gym_id를 null로 설정하여 발령 대기 상태로 생성
            body: JSON.stringify({ ...createForm, gym_id: null, company_id: selectedCompanyId })
        });
        if (!res.ok) throw new Error("등록 실패");
        alert("직원이 등록되었습니다. 본사관리에서 발령을 진행해주세요.");
        setIsCreateOpen(false);
        setCreateForm({ name: "", email: "", password: "", phone: "", job_title: "트레이너", joined_at: "" });
        fetchStaffs(selectedGymId, selectedCompanyId);
    } catch (e: any) { alert(e.message); }
    finally { setIsCreating(false); }
  };

  const getStatusColor = (status: string) => {
    if (status === "재직") return "bg-emerald-500 text-white";
    if (status === "퇴사") return "bg-gray-400 text-white";
    return "bg-blue-500 text-white";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">직원 관리</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">{gymName}의 직원을 관리합니다</p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold px-4 sm:px-6 py-2 shadow-sm">
          <Plus className="mr-2 h-4 w-4"/> 직원 등록
        </Button>
      </div>

      {/* 대기 인원 */}
      {pendingStaffs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            승인 대기 인원 ({pendingStaffs.length})
          </h3>
          <div className="space-y-2">
            {pendingStaffs.map((staff: any) => (
              <div key={staff.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-orange-100">
                <div>
                  <span className="font-semibold text-gray-900">{staff.name}</span>
                  <span className="text-gray-500 ml-2">({staff.email})</span>
                  <span className="text-xs text-gray-400 ml-2">- {staff.gyms?.name || "소속미정"}</span>
                </div>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleApprove(staff.id)}>
                  <CheckCircle className="w-4 h-4 mr-1"/> 승인
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 직원 리스트 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">이름</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">연락처</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">소속 지점</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">직책</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">상태</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">입사일</th>
                <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase tracking-wider text-xs">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeStaffs.map((staff: any) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{staff.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{staff.phone || "-"}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {staff.gyms?.name || <span className="text-red-500 text-xs">미지정</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{staff.job_title}</td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(staff.employment_status)}>
                      {staff.employment_status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{staff.joined_at || "-"}</td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(staff)}
                      className="hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="h-4 w-4 text-gray-600"/>
                    </Button>
                  </td>
                </tr>
              ))}
              {activeStaffs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-gray-400">
                    등록된 직원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">직원 정보 수정</DialogTitle>
            <DialogDescription className="sr-only">직원 정보를 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {/* 소속 지점 변경 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">소속 지점 이동</Label>
              <Select value={editForm.gym_id} onValueChange={(v) => setEditForm({...editForm, gym_id: v})}>
                <SelectTrigger><SelectValue placeholder="지점 선택" /></SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  <SelectItem value="none">-- 소속 없음 (대기) --</SelectItem>
                  {gymList.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">이름</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}/>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">연락처</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: formatPhoneNumberOnChange(e.target.value)})} placeholder="010-0000-0000"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">입사일</Label>
              <Input type="date" value={editForm.joined_at} onChange={(e) => setEditForm({...editForm, joined_at: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">직책</Label>
              <Select value={editForm.job_title} onValueChange={(v) => setEditForm({...editForm, job_title: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">상태</Label>
              <Select value={editForm.employment_status} onValueChange={(v) => setEditForm({...editForm, employment_status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="재직">재직</SelectItem>
                  <SelectItem value="퇴사">퇴사</SelectItem>
                  <SelectItem value="휴직">휴직</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 근무시간 설정 */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-bold text-gray-800 mb-3 block">근무시간 설정 (스케줄 근무내/외 분류용)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">근무 시작 시간</Label>
                  <Input
                    type="time"
                    value={editForm.work_start_time}
                    onChange={(e) => setEditForm({...editForm, work_start_time: e.target.value})}
                    placeholder="예: 09:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">근무 종료 시간</Label>
                  <Input
                    type="time"
                    value={editForm.work_end_time}
                    onChange={(e) => setEditForm({...editForm, work_end_time: e.target.value})}
                    placeholder="예: 18:00"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">※ 이 시간을 기준으로 스케줄이 근무내/근무외로 자동 분류됩니다</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 신규 등록 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">신규 직원 등록</DialogTitle>
            <DialogDescription className="sr-only">새로운 직원을 등록합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">이름 <span className="text-red-500">*</span></Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})}/>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">연락처</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({...createForm, phone: formatPhoneNumberOnChange(e.target.value)})} placeholder="010-0000-0000"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">이메일 <span className="text-red-500">*</span></Label>
              <Input value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">비밀번호 <span className="text-red-500">*</span></Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">입사일</Label>
              <Input type="date" value={createForm.joined_at} onChange={(e) => setCreateForm({...createForm, joined_at: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">직책</Label>
              <Select value={createForm.job_title} onValueChange={(v) => setCreateForm({...createForm, job_title: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateStaff} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isCreating}>
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
