"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // 메모용
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin, Calendar, User } from "lucide-react";

export default function HQPage() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<any[]>([]);
  const [allStaffs, setAllStaffs] = useState<any[]>([]);

  // 발령용 상태
  const [selectedGym, setSelectedGym] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // 폼 상태 (생성/수정 공용으로 쓸 데이터 구조)
  const initialForm = {
    gymName: "", managerId: "", category: "헬스", size: "", open_date: "", memo: "", status: "active"
  };
  const [formData, setFormData] = useState(initialForm);
  
  // 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    // 1. 센터 목록 (+ staffs 조인해서 지점장 정보 가져오기)
    const { data: gymData } = await supabase
        .from("gyms")
        .select(`*, staffs(id, name, role, email)`)
        .order("created_at", { ascending: false });
    if (gymData) setGyms(gymData);

    // 2. 소속 없는 대기자 (왼쪽 카드용)
    const { data: pendingData } = await supabase
      .from("staffs")
      .select("*")
      .is("gym_id", null) // 소속 없는 사람
      .order("created_at", { ascending: false });
    if (pendingData) setPendingStaffs(pendingData);

    // 3. 전체 직원 (관리자 변경용)
    const { data: allData } = await supabase
        .from("staffs")
        .select("id, name, email, role, gym_id, gyms(name)")
        .order("name", { ascending: true });
    if (allData) setAllStaffs(allData);
  };

  useEffect(() => { fetchData(); }, []);

  // 발령
  const handleAssign = async (staffId: string) => {
    if (!selectedGym || !selectedRole) return alert("지점과 권한을 선택해주세요.");
    if (!confirm("발령 보내시겠습니까?")) return;
    const { error } = await supabase.from("staffs").update({ gym_id: selectedGym, role: selectedRole, employment_status: "재직" }).eq("id", staffId);
    if (!error) { alert("발령 완료!"); fetchData(); } else { alert(error.message); }
  };

  // 지점 생성
  const handleCreateBranch = async () => {
    if (!formData.gymName || !formData.managerId) return alert("필수 정보 입력");
    setIsLoading(true);
    try {
        const res = await fetch("/api/admin/create-branch", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error("실패");
        alert("생성 완료!");
        setIsCreateOpen(false); setFormData(initialForm); fetchData();
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  // 지점 수정
  const handleUpdateGym = async () => {
    if (!editTargetId) return;
    setIsLoading(true);
    try {
        const res = await fetch("/api/admin/update-branch", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, gymId: editTargetId, newManagerId: formData.managerId })
        });
        if (!res.ok) throw new Error("실패");
        alert("수정 완료!");
        setIsEditOpen(false); setEditTargetId(null); setFormData(initialForm); fetchData();
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const openEditModal = (gym: any) => {
    setEditTargetId(gym.id);
    setFormData({
        gymName: gym.name,
        managerId: "none", // 변경 시 선택
        category: gym.category || "헬스",
        size: gym.size || "",
        open_date: gym.open_date || "",
        memo: gym.memo || "",
        status: gym.status
    });
    setIsEditOpen(true);
  };

  const handleDeleteGym = async (gymId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("gyms").delete().eq("id", gymId);
    fetchData();
  };

  // 카테고리 뱃지 색상
  const getCategoryBadge = (cat: string) => {
    if (cat === "필라테스") return "bg-pink-100 text-pink-700 border-pink-200";
    if (cat === "골프") return "bg-green-100 text-green-700 border-green-200";
    return "bg-blue-100 text-blue-700 border-blue-200"; // 헬스 등
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#0F4C5C]">🏢 본사(HQ) 통합 관리</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 대기자 (소속 없는 직원) */}
        <Card className="border-t-4 border-t-amber-500 shadow-lg h-fit">
          <CardHeader><CardTitle>📝 가입 승인 및 발령 대기 ({pendingStaffs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pendingStaffs.length === 0 ? <p className="text-gray-400 text-center py-4">대기 인원 없음</p> : 
                pendingStaffs.map((staff) => (
                    <div key={staff.id} className="flex flex-col p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">{staff.name}</span>
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
            }
          </CardContent>
        </Card>

        {/* 2. 운영 센터 목록 */}
        <Card className="border-t-4 border-t-[#0F4C5C] shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>🏢 운영 중인 센터 ({gyms.length})</CardTitle>
            <Button onClick={() => { setFormData(initialForm); setIsCreateOpen(true); }} size="sm" className="bg-[#0F4C5C] hover:bg-[#09313b]"><Plus className="mr-2 h-4 w-4"/> 지점 생성</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {gyms.map((gym) => {
                    // 현재 지점장 찾기
                    const manager = gym.staffs?.find((s:any) => s.role === 'admin') || gym.staffs?.[0];
                    
                    return (
                        <div key={gym.id} className="flex flex-col p-4 bg-white border rounded-lg shadow-sm gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{gym.name}</span>
                                        <Badge variant="outline" className={getCategoryBadge(gym.category)}>{gym.category}</Badge>
                                        {gym.status === 'pending' && <Badge className="bg-amber-500">승인대기</Badge>}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {gym.size || '-'}평</span>
                                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {gym.open_date || '-'}</span>
                                        <span className="flex items-center"><User className="w-3 h-3 mr-1"/> {manager?.name || '미정'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(gym)}><Pencil className="h-4 w-4 text-gray-500"/></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteGym(gym.id)}><Trash2 className="h-4 w-4 text-red-300"/></Button>
                                </div>
                            </div>
                            {gym.memo && <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">{gym.memo}</div>}
                        </div>
                    );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 통합 모달 (생성/수정 공용 UI 함수) */}
      {[ 
        { isOpen: isCreateOpen, setIsOpen: setIsCreateOpen, title: "지점 생성", action: handleCreateBranch, btn: "생성하기" },
        { isOpen: isEditOpen, setIsOpen: setIsEditOpen, title: "지점 수정", action: handleUpdateGym, btn: "저장하기" }
      ].map((modal, idx) => (
        <Dialog key={idx} open={modal.isOpen} onOpenChange={modal.setIsOpen}>
            <DialogContent className="bg-white sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{modal.title}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>지점명</Label><Input value={formData.gymName} onChange={(e) => setFormData({...formData, gymName: e.target.value})}/></div>
                        <div className="space-y-2"><Label>카테고리</Label>
                            <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent><SelectItem value="헬스">헬스</SelectItem><SelectItem value="필라테스">필라테스</SelectItem><SelectItem value="골프">골프</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>평수</Label><Input value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} placeholder="예: 100"/></div>
                        <div className="space-y-2"><Label>오픈일</Label><Input type="date" value={formData.open_date} onChange={(e) => setFormData({...formData, open_date: e.target.value})}/></div>
                    </div>
                    <div className="space-y-2"><Label>지점장 선택</Label>
                        <Select value={formData.managerId} onValueChange={(v) => setFormData({...formData, managerId: v})}>
                            <SelectTrigger><SelectValue placeholder={modal.title.includes("수정") ? "변경 시 선택" : "선택"} /></SelectTrigger>
                            <SelectContent>
                                {modal.title.includes("수정") && <SelectItem value="none">-- 변경 안함 --</SelectItem>}
                                {/* 생성일 땐 대기자만, 수정일 땐 전체 직원 보여줌 */}
                                {(modal.title.includes("생성") ? pendingStaffs : allStaffs).map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.gyms?.name || '소속없음'})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {modal.title.includes("수정") && (
                        <div className="space-y-2"><Label>상태</Label>
                             <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent><SelectItem value="active">운영중</SelectItem><SelectItem value="pending">대기</SelectItem><SelectItem value="closed">폐업</SelectItem></SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2"><Label>메모</Label><Textarea value={formData.memo} onChange={(e) => setFormData({...formData, memo: e.target.value})} placeholder="특이사항 입력"/></div>
                </div>
                <DialogFooter><Button onClick={modal.action} className="bg-[#0F4C5C]" disabled={isLoading}>{modal.btn}</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}