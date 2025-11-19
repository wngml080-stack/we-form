"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus } from "lucide-react";

export default function AdminStaffPage() {
  // 상태 관리
  const [staffs, setStaffs] = useState<any[]>([]);
  const [gymId, setGymId] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");
  
  // 🚨 아까 에러난 부분 해결 (변수 추가)
  const [adminName, setAdminName] = useState(""); 

  // 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // 등록 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("트레이너");
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. 초기 데이터 로드
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase
        .from("staffs")
        .select("gym_id, name, gyms(name)")
        .eq("user_id", user.id)
        .single();

      if (me) {
        setGymId(me.gym_id);
        setAdminName(me.name); // 👈 이제 에러 안 남!
        // @ts-ignore
        setGymName(me.gyms?.name ?? "We:form");
        fetchStaffs(me.gym_id);
      }
    };
    init();
  }, []);

  // 2. 직원 목록 조회
  const fetchStaffs = async (targetGymId: string) => {
    const { data } = await supabase
      .from("staffs")
      .select(`
        id,
        name,
        job_title,
        employment_status,
        joined_at,
        email: user_id ( email ), 
        gyms ( name )
      `)
      .eq("gym_id", targetGymId)
      .order("name", { ascending: true });
      
    // user_id로 조인된 email 정보 등 처리 필요시 여기서 가공
    // 현재는 단순 조회
    if (data) setStaffs(data);
  };

  // 3. 직원 정보 수정 (직책/상태)
  const handleUpdate = async () => {
    if (!editTarget) return;

    const { error } = await supabase
      .from("staffs")
      .update({
        job_title: editJobTitle,
        employment_status: editStatus,
      })
      .eq("id", editTarget.id);

    if (!error) {
      setIsEditOpen(false);
      if (gymId) fetchStaffs(gymId);
    } else {
      alert("수정 실패: " + error.message);
    }
  };

  // 4. 수정 모달 열기
  const openEditModal = (staff: any) => {
    setEditTarget(staff);
    setEditJobTitle(staff.job_title || "");
    setEditStatus(staff.employment_status || "재직");
    setIsEditOpen(true);
  };

  // 5. 직원 신규 등록 (API 호출)
  const handleCreateStaff = async () => {
    if (!newName || !newEmail || !newPassword || !gymId) {
        alert("모든 정보를 입력해주세요.");
        return;
    }
    setIsCreating(true);

    try {
        const response = await fetch("/api/admin/create-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: newEmail,
                password: newPassword,
                name: newName,
                job_title: newJobTitle,
                gym_id: gymId
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "등록 실패");

        alert("직원이 성공적으로 등록되었습니다!");
        setIsCreateOpen(false);
        // 입력폼 초기화
        setNewName(""); setNewEmail(""); setNewPassword("");
        // 목록 새로고침
        fetchStaffs(gymId);

    } catch (error: any) {
        alert("오류 발생: " + error.message);
    } finally {
        setIsCreating(false);
    }
  };

  // 상태 뱃지 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case "재직": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "퇴사": return "bg-slate-100 text-slate-500 hover:bg-slate-100";
      case "휴직": return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      default: return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">직원 관리</h2>
          <p className="text-muted-foreground">
            {gymName}의 직원 현황을 관리합니다.
          </p>
        </div>
        <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#0F4C5C] hover:bg-[#09313b]"
        >
            <Plus className="mr-2 h-4 w-4" /> 직원 등록
        </Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">이름</th>
              <th className="px-4 py-3 font-medium text-gray-500">직책</th>
              <th className="px-4 py-3 font-medium text-gray-500">상태</th>
              <th className="px-4 py-3 font-medium text-gray-500">입사일</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((staff) => (
              <tr key={staff.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{staff.name}</td>
                <td className="px-4 py-3 text-gray-600">{staff.job_title || "-"}</td>
                <td className="px-4 py-3">
                  <Badge className={`border-0 ${getStatusColor(staff.employment_status)}`}>
                    {staff.employment_status || "미지정"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {staff.joined_at || "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(staff)}
                  >
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                </td>
              </tr>
            ))}
            {staffs.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                        등록된 직원이 없습니다.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>직원 정보 수정 ({editTarget?.name})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>직책</Label>
              <Input
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="재직">재직</SelectItem>
                  <SelectItem value="휴직">휴직</SelectItem>
                  <SelectItem value="퇴사">퇴사</SelectItem>
                  <SelectItem value="지점이동">지점이동</SelectItem>
                  <SelectItem value="보직변경">보직변경</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} className="bg-[#0F4C5C]">저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 신규 등록 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>신규 직원 등록</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                placeholder="예: 김신입"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>이메일 (아이디)</Label>
              <Input
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>비밀번호</Label>
              <Input
                type="password"
                placeholder="초기 비밀번호 설정"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>직책</Label>
              <Input
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
                onClick={handleCreateStaff} 
                className="bg-[#0F4C5C]"
                disabled={isCreating}
            >
                {isCreating ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}