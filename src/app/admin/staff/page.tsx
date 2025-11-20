"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus } from "lucide-react";

const JOB_TITLES = ["대표", "이사", "실장", "지점장", "FC사원", "FC주임", "FC팀장", "PT팀장", "트레이너", "프리랜서", "필라팀장", "필라전임", "필라파트", "골프프로", "기타"];

export default function AdminStaffPage() {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [gymId, setGymId] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // 수정 모달
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", job_title: "", employment_status: "", joined_at: "" });

  // 등록 모달
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
      const { data: me } = await supabase.from("staffs").select("gym_id, gyms(name)").eq("user_id", user.id).single();
      if (me) {
        setGymId(me.gym_id);
        // @ts-ignore
        setGymName(me.gyms?.name ?? "We:form");
        fetchStaffs(me.gym_id);
      }
    };
    init();
  }, []);

  const fetchStaffs = async (targetGymId: string) => {
    const { data } = await supabase
      .from("staffs")
      .select(`id, name, email, phone, job_title, employment_status, joined_at`)
      .eq("gym_id", targetGymId)
      .order("name", { ascending: true });
    if (data) setStaffs(data);
  };

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

  const handleUpdate = async () => {
    if (!editTarget) return;
    const { error } = await supabase.from("staffs").update(editForm).eq("id", editTarget.id);
    if (!error) {
      setIsEditOpen(false);
      if (gymId) fetchStaffs(gymId);
    } else {
      alert("수정 실패: " + error.message);
    }
  };

  const handleCreateStaff = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !gymId) return alert("필수 정보를 입력해주세요.");
    setIsCreating(true);
    try {
        const response = await fetch("/api/admin/create-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...createForm, gym_id: gymId })
        });
        if (!response.ok) throw new Error("등록 실패");
        alert("등록 완료!");
        setIsCreateOpen(false);
        setCreateForm({ name: "", email: "", password: "", phone: "", job_title: "트레이너", joined_at: "" });
        fetchStaffs(gymId);
    } catch (error: any) {
        alert("오류: " + error.message);
    } finally {
        setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "재직") return "bg-emerald-100 text-emerald-700";
    if (status === "퇴사") return "bg-slate-100 text-slate-500";
     if (status === "가입대기") return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  const handleApprove = async (staffId: string) => {
    if (!gymId) return;
    setApprovingId(staffId);
    const { error } = await supabase
      .from("staffs")
      .update({ employment_status: "재직" })
      .eq("id", staffId)
      .eq("gym_id", gymId);

    if (error) {
      alert("승인 실패: " + error.message);
    } else {
      alert("승인되었습니다.");
      await fetchStaffs(gymId);
    }
    setApprovingId(null);
  };

  const pendingStaffs = staffs.filter(
    (staff) => staff.employment_status === "가입대기"
  );
  const visibleStaffs = staffs.filter(
    (staff) => staff.employment_status !== "가입대기"
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{gymName} 직원 관리</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#0F4C5C]"><Plus className="mr-2 h-4 w-4"/> 직원 등록</Button>
      </div>

      {/* 승인 대기 인원 섹션 */}
      <div className="rounded-md border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">승인 대기 인원</h3>
          <span className="text-xs text-gray-500">
            현재 가입 신청 후 승인 대기 중인 직원 목록입니다.
          </span>
        </div>
        {pendingStaffs.length === 0 ? (
          <p className="px-4 py-3 text-xs text-gray-400">
            승인 대기 중인 직원이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">연락처</th>
                  <th className="px-4 py-3">직책</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3 text-right">승인</th>
                </tr>
              </thead>
              <tbody>
                {pendingStaffs.map((staff) => (
                  <tr key={staff.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <div>{staff.name}</div>
                      <div className="text-xs text-gray-400">
                        {staff.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {staff.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {staff.job_title}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 ${getStatusColor(
                          staff.employment_status
                        )}`}
                      >
                        {staff.employment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="bg-[#0F4C5C]"
                        onClick={() => handleApprove(staff.id)}
                        disabled={approvingId === staff.id}
                      >
                        {approvingId === staff.id ? "승인 중..." : "승인"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 전체 직원 목록 */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">연락처</th>
              <th className="px-4 py-3">직책</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">입사일</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {visibleStaffs.map((staff) => (
              <tr key={staff.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                    <div>{staff.name}</div>
                    <div className="text-xs text-gray-400">{staff.email}</div>
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
          </tbody>
        </table>
      </div>

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
          <DialogFooter><Button onClick={handleUpdate} className="bg-[#0F4C5C]">저장</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 등록 모달 (생략 없이 UI 구현됨, 내용은 위 edit과 유사하므로 생략하지만 실제 코드는 포함됨) */}
      {/* (지면 관계상 위에서 드린 등록 로직과 동일하게 Input들만 phone, joined_at 추가해서 넣으시면 됩니다!) */}
       <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>신규 직원 등록</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>이름</Label><Input value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})}/></div>
                <div className="space-y-2"><Label>연락처</Label><Input value={createForm.phone} onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}/></div>
            </div>
            <div className="space-y-2"><Label>이메일</Label><Input value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})}/></div>
            <div className="space-y-2"><Label>비밀번호</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})}/></div>
            <div className="space-y-2"><Label>입사일</Label><Input type="date" value={createForm.joined_at} onChange={(e) => setCreateForm({...createForm, joined_at: e.target.value})}/></div>
            <div className="space-y-2"><Label>직책</Label>
                <Select value={createForm.job_title} onValueChange={(v) => setCreateForm({...createForm, job_title: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{JOB_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateStaff} className="bg-[#0F4C5C]" disabled={isCreating}>등록하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}