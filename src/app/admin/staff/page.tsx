"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, CheckCircle } from "lucide-react";

const JOB_TITLES = ["대표", "이사", "실장", "지점장", "FC사원", "FC주임", "FC팀장", "PT팀장", "트레이너", "프리랜서", "필라팀장", "필라전임", "필라파트", "골프프로", "기타"];

export default function AdminStaffPage() {
  const [activeStaffs, setActiveStaffs] = useState<any[]>([]); 
  const [pendingStaffs, setPendingStaffs] = useState<any[]>([]); 
  
  const [myRole, setMyRole] = useState<string>(""); 
  const [gymId, setGymId] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");

  // 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", job_title: "", employment_status: "", joined_at: "" });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", phone: "", job_title: "트레이너", joined_at: "" });
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 내 정보 가져오기
      const { data: me } = await supabase
        .from("staffs")
        .select("gym_id, role, gyms(name)")
        .eq("user_id", user.id)
        .single();

      if (me) {
        setGymId(me.gym_id);
        setMyRole(me.role);
        // @ts-ignore
        setGymName(me.gyms?.name || "We:form");
        fetchStaffs(me.gym_id, me.role);
      }
    };
    init();
  }, []);

  // 직원 목록 조회 (권한에 따라 다르게 조회)
  const fetchStaffs = async (targetGymId: string | null, role: string) => {
    let query = supabase
      .from("staffs")
      .select(`
        id, name, email, phone, job_title, employment_status, joined_at, gym_id,
        gyms ( name ) 
      `)
      .order("name", { ascending: true });

    // 슈퍼 관리자가 아니면 자기 지점만 조회
    if (role !== 'super_admin' && targetGymId) {
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
    if (!error) { alert("승인되었습니다."); fetchStaffs(gymId, myRole); }
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
    });
    setIsEditOpen(true);
  };

  // 수정 실행
  const handleUpdate = async () => {
    if (!editTarget) return;
    const { error } = await supabase.from("staffs").update(editForm).eq("id", editTarget.id);
    if (!error) { setIsEditOpen(false); fetchStaffs(gymId, myRole); } else alert("실패: " + error.message);
  };

  // 신규 등록 실행
  const handleCreateStaff = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return alert("필수 정보를 입력해주세요.");
    
    const targetGymId = gymId; 
    
    setIsCreating(true);
    try {
        const res = await fetch("/api/admin/create-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...createForm, gym_id: targetGymId })
        });
        if (!res.ok) throw new Error("등록 실패");
        alert("등록 완료!");
        setIsCreateOpen(false);
        setCreateForm({ name: "", email: "", password: "", phone: "", job_title: "트레이너", joined_at: "" });
        fetchStaffs(gymId, myRole);
    } catch (e: any) { alert(e.message); } 
    finally { setIsCreating(false); }
  };

  const getStatusColor = (status: string) => {
    if (status === "재직") return "bg-emerald-100 text-emerald-700";
    if (status === "퇴사") return "bg-slate-100 text-slate-500";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">직원 리스트</h2>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
        >
            <Plus className="mr-2 h-4 w-4"/> 직원 등록
        </Button>
      </div>

      {/* 대기 인원 섹션 */}
      <div className="border rounded-lg bg-amber-50/50 border-amber-200 p-4">
        <h3 className="font-semibold text-amber-800 mb-4 flex items-center">
            ⏳ 승인 대기 인원 ({pendingStaffs.length})
        </h3>
        {pendingStaffs.length === 0 ? <p className="text-sm text-gray-400 italic">대기 인원 없음</p> :
            pendingStaffs.map((staff: any) => (
                <div key={staff.id} className="flex items-center justify-between bg-white p-3 rounded border mb-2">
                    <span>
                        {staff.name} ({staff.email}) 
                        <span className="text-xs text-gray-400 ml-2">
                            - {staff.gyms?.name || "소속미정"}
                        </span>
                    </span>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(staff.id)}>
                        <CheckCircle className="w-4 h-4 mr-1"/> 승인
                    </Button>
                </div>
            ))
        }
      </div>

      {/* 직원 리스트 테이블 */}
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">소속 지점</th>
              <th className="px-4 py-3">연락처</th>
              <th className="px-4 py-3">직책</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">입사일</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {activeStaffs.map((staff: any) => (
              <tr key={staff.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                    <div>{staff.name}</div>
                    <div className="text-xs text-gray-400">{staff.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 font-medium">
                    {staff.gyms?.name || "-"}
                </td>
                <td className="px-4 py-3 text-gray-600">{staff.phone || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{staff.job_title}</td>
                <td className="px-4 py-3"><Badge className={`border-0 ${getStatusColor(staff.employment_status)}`}>{staff.employment_status}</Badge></td>
                <td className="px-4 py-3 text-gray-500">{staff.joined_at || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(staff)}><Pencil className="h-4 w-4 text-gray-500"/></Button>
                </td>
              </tr>
            ))}
             {activeStaffs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-20 text-gray-400">등록된 직원이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 신규 등록 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>신규 직원 등록</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>이름 <span className="text-red-500">*</span></Label><Input value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})}/></div>
                <div className="space-y-2"><Label>연락처</Label><Input value={createForm.phone} onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}/></div>
            </div>
            <div className="space-y-2"><Label>이메일 <span className="text-red-500">*</span></Label><Input value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})}/></div>
            <div className="space-y-2"><Label>비밀번호 <span className="text-red-500">*</span></Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})}/></div>
            <div className="space-y-2"><Label>입사일</Label><Input type="date" value={createForm.joined_at} onChange={(e) => setCreateForm({...createForm, joined_at: e.target.value})}/></div>
            <div className="space-y-2"><Label>직책</Label>
                <Select value={createForm.job_title} onValueChange={(v) => setCreateForm({...createForm, job_title: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{JOB_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateStaff}
              className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
              disabled={isCreating}
            >
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>직원 수정</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>이름</Label><Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}/></div>
                <div className="space-y-2"><Label>연락처</Label><Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})}/></div>
            </div>
            <div className="space-y-2"><Label>입사일</Label><Input type="date" value={editForm.joined_at} onChange={(e) => setEditForm({...editForm, joined_at: e.target.value})}/></div>
            <div className="space-y-2"><Label>직책</Label>
                <Select value={editForm.job_title} onValueChange={(v) => setEditForm({...editForm, job_title: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{JOB_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2"><Label>상태</Label>
                <Select value={editForm.employment_status} onValueChange={(v) => setEditForm({...editForm, employment_status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="재직">재직</SelectItem><SelectItem value="퇴사">퇴사</SelectItem><SelectItem value="휴직">휴직</SelectItem></SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpdate}
              className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}