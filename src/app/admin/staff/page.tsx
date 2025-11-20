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

      console.log("🔍 내 정보 조회 시작...");

      // 1. 내 정보 가져오기 (조인 없이 일단 가져와봄 - 안전장치)
      const { data: me, error: meError } = await supabase
        .from("staffs")
        .select("id, gym_id, name, role")
        .eq("user_id", user.id)
        .single();

      if (meError) {
          console.error("❌ 내 정보 조회 실패 (상세):", JSON.stringify(meError, null, 2));
          return;
      }

      console.log("✅ 내 정보:", me);

      if (me && me.gym_id) {
        setGymId(me.gym_id);
        
        // 2. 지점 이름은 따로 가져오기 (조인 에러 방지)
        const { data: gym } = await supabase.from("gyms").select("name").eq("id", me.gym_id).single();
        setGymName(gym?.name || "소속 없음");

        fetchStaffs(me.gym_id);
      }
    };
    init();
  }, []);

  const fetchStaffs = async (targetGymId: string) => {
    const { data, error } = await supabase
      .from("staffs")
      .select(`id, name, email, phone, job_title, employment_status, joined_at`)
      .eq("gym_id", targetGymId)
      .order("name", { ascending: true });

    if (error) {
        console.error("❌ 직원 목록 조회 실패:", JSON.stringify(error, null, 2));
        return;
    }

    if (data) {
      setPendingStaffs(data.filter(s => s.employment_status === '가입대기'));
      setActiveStaffs(data.filter(s => s.employment_status !== '가입대기'));
    }
  };

  // ... (이하 나머지 함수들은 기존과 동일. 생략 없이 사용하려면 이전 코드 복사해서 여기 아래에 붙여넣으시면 됩니다) ...
  // 편의를 위해 핵심 로직만 바꿨습니다. 아래 모달/핸들러 부분은 이전 코드 그대로 두셔도 됩니다!
  
  // (혹시 모르니 전체 코드 필요하시면 다시 말씀해주세요!)
  
  // 승인 처리
  const handleApprove = async (staffId: string) => {
    if (!confirm("승인하시겠습니까?")) return;
    const { error } = await supabase.from("staffs").update({ employment_status: "재직", role: "staff" }).eq("id", staffId);
    if (!error) { alert("승인됨"); if(gymId) fetchStaffs(gymId); }
  };
  
  const openEditModal = (staff: any) => {
    setEditTarget(staff);
    setEditForm({
      name: staff.name || "", email: staff.email || "", phone: staff.phone || "",
      job_title: staff.job_title || "트레이너", employment_status: staff.employment_status || "재직", joined_at: staff.joined_at || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    const { error } = await supabase.from("staffs").update(editForm).eq("id", editTarget.id);
    if (!error) { setIsEditOpen(false); if(gymId) fetchStaffs(gymId); } else alert("실패: " + error.message);
  };

  const handleCreateStaff = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !gymId) return alert("필수 정보 입력");
    setIsCreating(true);
    try {
        const res = await fetch("/api/admin/create-staff", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...createForm, gym_id: gymId })
        });
        if (!res.ok) throw new Error("등록 실패");
        alert("등록 완료!");
        setIsCreateOpen(false);
        setCreateForm({ name: "", email: "", password: "", phone: "", job_title: "트레이너", joined_at: "" });
        fetchStaffs(gymId);
    } catch (e: any) { alert(e.message); } finally { setIsCreating(false); }
  };

  const getStatusColor = (status: string) => {
    if (status === "재직") return "bg-emerald-100 text-emerald-700";
    if (status === "퇴사") return "bg-slate-100 text-slate-500";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{gymName} 직원 관리</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#0F4C5C] hover:bg-[#09313b]"><Plus className="mr-2 h-4 w-4"/> 직원 등록</Button>
      </div>
      <div className="border rounded-lg bg-amber-50/50 border-amber-200 p-4">
        <h3 className="font-semibold text-amber-800 mb-4">⏳ 승인 대기 인원 ({pendingStaffs.length})</h3>
        {pendingStaffs.map(staff => (
            <div key={staff.id} className="flex items-center justify-between bg-white p-3 rounded border mb-2">
                <span>{staff.name} ({staff.email})</span>
                <Button size="sm" className="bg-emerald-600" onClick={() => handleApprove(staff.id)}>승인</Button>
            </div>
        ))}
        {pendingStaffs.length === 0 && <p className="text-sm text-gray-400">대기 인원 없음</p>}
      </div>
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr><th className="px-4 py-3">이름</th><th className="px-4 py-3">연락처</th><th className="px-4 py-3">직책</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">입사일</th><th className="px-4 py-3 text-right">관리</th></tr>
          </thead>
          <tbody>
            {activeStaffs.map((staff) => (
              <tr key={staff.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{staff.name}<div className="text-xs text-gray-400">{staff.email}</div></td>
                <td className="px-4 py-3">{staff.phone}</td>
                <td className="px-4 py-3">{staff.job_title}</td>
                <td className="px-4 py-3"><Badge className={`border-0 ${getStatusColor(staff.employment_status)}`}>{staff.employment_status}</Badge></td>
                <td className="px-4 py-3">{staff.joined_at}</td>
                <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => openEditModal(staff)}><Pencil className="h-4 w-4"/></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 모달 UI는 위 코드 참고해서 넣어주세요 (너무 길어져서 생략했지만, 기존 코드 그대로 쓰시면 됩니다!) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>정보 수정</DialogTitle></DialogHeader>
            {/* ... 기존 입력 필드들 ... */}
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>이름</Label><Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}/></div>
                    <div className="space-y-2"><Label>연락처</Label><Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})}/></div>
                </div>
                <div className="space-y-2"><Label>직책</Label>
                    <Select value={editForm.job_title} onValueChange={(v) => setEditForm({...editForm, job_title: v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{JOB_TITLES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2"><Label>상태</Label>
                    <Select value={editForm.employment_status} onValueChange={(v) => setEditForm({...editForm, employment_status: v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="재직">재직</SelectItem><SelectItem value="퇴사">퇴사</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter><Button onClick={handleUpdate} className="bg-[#0F4C5C]">저장</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white">
             <DialogHeader><DialogTitle>신규 등록</DialogTitle></DialogHeader>
             {/* ... 등록 폼 ... */}
             <div className="grid gap-4 py-4">
                <div className="space-y-2"><Label>이름</Label><Input value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})}/></div>
                <div className="space-y-2"><Label>이메일</Label><Input value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})}/></div>
                <div className="space-y-2"><Label>비밀번호</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})}/></div>
             </div>
             <DialogFooter><Button onClick={handleCreateStaff} className="bg-[#0F4C5C]">등록</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}