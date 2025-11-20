"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function HQPage() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<any[]>([]);
  
  // 발령용 상태 (왼쪽 카드)
  const [selectedGym, setSelectedGym] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // 지점 생성 모달 상태 (오른쪽 버튼)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGymName, setNewGymName] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState(""); // 지점장으로 임명할 사람 ID
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 데이터 불러오기
  const fetchData = async () => {
    // 1. 센터 목록
    const { data: gymData } = await supabase.from("gyms").select("*").order("created_at", { ascending: false });
    if (gymData) setGyms(gymData);

    // 2. 소속 없는(pending) 직원 목록
    const { data: staffData } = await supabase
      .from("staffs")
      .select("*")
      .is("gym_id", null)
      .order("created_at", { ascending: false });
    
    if (staffData) setPendingStaffs(staffData);
  };

  useEffect(() => { fetchData(); }, []);

  // 발령(Assign) 함수 - 기존 지점으로 보내기
  const handleAssign = async (staffId: string) => {
    if (!selectedGym || !selectedRole) return alert("지점과 권한을 선택해주세요.");
    if (!window.confirm("해당 직원을 발령 보내시겠습니까?")) return;

    const { error } = await supabase
      .from("staffs")
      .update({ gym_id: selectedGym, role: selectedRole, employment_status: "재직" })
      .eq("id", staffId);

    if (!error) { alert("발령 완료!"); fetchData(); } 
    else { alert("에러: " + error.message); }
  };

  // 지점 생성 함수 - 새 지점 만들면서 지점장 임명
  const handleCreateBranch = async () => {
    if (!newGymName || !selectedManagerId) {
        return alert("지점명과 지점장(대기자)을 선택해주세요.");
    }
    setIsCreating(true);

    try {
        const res = await fetch("/api/admin/create-branch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gymName: newGymName,
                managerId: selectedManagerId // 선택한 대기자 ID 전송
            })
        });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error);

        alert("지점이 생성되고 관리자가 임명되었습니다!");
        setIsCreateOpen(false);
        setNewGymName("");
        setSelectedManagerId("");
        fetchData();
    } catch (e: any) {
        alert("생성 실패: " + e.message);
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#0F4C5C]">🏢 본사(HQ) 통합 관리</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 가입 승인 및 발령 대기 */}
        <Card className="border-t-4 border-t-amber-500 shadow-lg h-fit">
          <CardHeader><CardTitle>📝 가입 승인 및 발령 대기 ({pendingStaffs.length}명)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pendingStaffs.length === 0 ? (
                <p className="text-gray-400 text-center py-10">대기 중인 인원이 없습니다.</p>
            ) : (
                pendingStaffs.map((staff) => (
                    <div key={staff.id} className="flex flex-col p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">{staff.name} ({staff.job_title})</span>
                            <span className="text-xs text-gray-500">{staff.email}</span>
                        </div>
                        <div className="flex gap-2">
                            <Select onValueChange={setSelectedGym}>
                                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="지점 선택" /></SelectTrigger>
                                <SelectContent>{gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select onValueChange={setSelectedRole}>
                                <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="권한" /></SelectTrigger>
                                <SelectContent><SelectItem value="admin">관리자</SelectItem><SelectItem value="staff">직원</SelectItem></SelectContent>
                            </Select>
                            <Button size="sm" className="h-8 bg-[#0F4C5C]" onClick={() => handleAssign(staff.id)}>승인</Button>
                        </div>
                    </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* 2. 운영 중인 센터 목록 */}
        <Card className="border-t-4 border-t-[#0F4C5C] shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>🏢 운영 중인 센터 ({gyms.length}개)</CardTitle>
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="bg-[#0F4C5C] hover:bg-[#09313b]">
                <Plus className="mr-2 h-4 w-4" /> 지점 생성
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                {gyms.map((gym) => (
                    <div key={gym.id} className="flex justify-between items-center p-4 bg-white border rounded-lg shadow-sm">
                        <div>
                            <span className="font-bold text-lg">{gym.name}</span>
                            <div className="text-xs text-gray-500 mt-1">
                                상태: <span className="text-emerald-600 font-medium">{gym.status}</span>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-[#0F4C5C] border-[#0F4C5C]">{gym.plan}</Badge>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 지점 생성 모달 (수정됨: 기존 대기자 선택) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>새로운 지점 생성</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label>지점명</Label>
                <Input placeholder="예: We:form 부산점" value={newGymName} onChange={(e) => setNewGymName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>지점장 선택 (가입 대기자 중 선택)</Label>
                <Select onValueChange={setSelectedManagerId}>
                    <SelectTrigger>
                        <SelectValue placeholder="지점장을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                        {pendingStaffs.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} ({staff.email})
                            </SelectItem>
                        ))}
                        {pendingStaffs.length === 0 && (
                            <SelectItem value="none" disabled>대기 중인 인원이 없습니다.</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                    * 목록에 없는 경우 해당 직원이 먼저 [가입 신청]을 해야 합니다.
                </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateBranch} className="bg-[#0F4C5C]" disabled={isCreating}>
                {isCreating ? "생성 중..." : "지점 생성하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}