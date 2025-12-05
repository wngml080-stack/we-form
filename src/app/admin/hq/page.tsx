"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin, Calendar, User } from "lucide-react";

// 카테고리 목록 정의
const CATEGORY_OPTIONS = ["헬스", "PT", "필라테스", "골프", "GX", "요가"];

export default function HQPage() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<any[]>([]);
  const [allStaffs, setAllStaffs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("");

  const [selectedGym, setSelectedGym] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // 폼 상태
  const initialForm = {
    gymName: "", managerId: "", category: [] as string[], size: "", open_date: "", memo: "", status: "active"
  };
  const [formData, setFormData] = useState(initialForm);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 내 정보 가져오기
    const { data: me } = await supabase
      .from("staffs")
      .select("company_id, role, companies(name)")
      .eq("user_id", user.id)
      .single();

    if (me) {
      setCompanyId(me.company_id);
      setMyRole(me.role);
      // @ts-ignore
      setCompanyName(me.companies?.name ?? "");

      // company_id 기준으로 데이터 조회
      fetchData(me.company_id, me.role);
    }
  };

  const fetchData = async (targetCompanyId: string | null, role: string) => {
    if (!targetCompanyId) return;

    // 지점 목록 (자기 회사 것만)
    const { data: gymData } = await supabase
        .from("gyms")
        .select(`*, staffs(id, name, role, email)`)
        .eq("company_id", targetCompanyId)
        .order("created_at", { ascending: false });
    if (gymData) setGyms(gymData);

    // 대기 직원 (자기 회사 것만, gym_id가 null인 사람)
    const { data: pendingData } = await supabase
      .from("staffs")
      .select("*")
      .eq("company_id", targetCompanyId)
      .is("gym_id", null)
      .order("created_at", { ascending: false });
    if (pendingData) setPendingStaffs(pendingData);

    // 전체 직원 (자기 회사 것만)
    const { data: allData } = await supabase
        .from("staffs")
        .select("id, name, email, role, gym_id, gyms(name)")
        .eq("company_id", targetCompanyId)
        .order("name", { ascending: true });
    if (allData) setAllStaffs(allData);

    // 회원 데이터 (자기 회사 것만, 최근 20명)
    const { data: memberData } = await supabase
      .from("members")
      .select("id, name, phone, status, created_at, gyms(name)")
      .eq("company_id", targetCompanyId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (memberData) setMembers(memberData);
  };

  const handleAssign = async (staffId: string) => {
    if (!selectedGym || !selectedRole) return alert("지점과 권한을 선택해주세요.");
    if (!confirm("발령 보내시겠습니까?")) return;
    const { error } = await supabase.from("staffs").update({ gym_id: selectedGym, role: selectedRole, employment_status: "재직" }).eq("id", staffId);
    if (!error) { alert("발령 완료!"); fetchData(companyId, myRole); } else { alert(error.message); }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => {
        const exists = prev.category.includes(cat);
        if (exists) {
            return { ...prev, category: prev.category.filter(c => c !== cat) };
        } else {
            return { ...prev, category: [...prev.category, cat] };
        }
    });
  };

  const handleCreateBranch = async () => {
    // 필수값 체크 강화
    if (!formData.gymName || !formData.managerId) return alert("필수 정보(지점명, 지점장)를 입력해주세요.");
    
    setIsLoading(true);
    try {
        const res = await fetch("/api/admin/create-branch", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                category: formData.category.join(", ") 
            })
        });
        if (!res.ok) throw new Error("실패");
        alert("생성 완료!");
        setIsCreateOpen(false); setFormData(initialForm); fetchData(companyId, myRole);
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleUpdateGym = async () => {
    if (!editTargetId) return;
    setIsLoading(true);
    try {
        const res = await fetch("/api/admin/update-branch", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                ...formData, 
                gymId: editTargetId, 
                newManagerId: formData.managerId,
                category: formData.category.join(", ") 
            })
        });
        if (!res.ok) throw new Error("실패");
        alert("수정 완료!");
        setIsEditOpen(false); setEditTargetId(null); setFormData(initialForm); fetchData(companyId, myRole);
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const openEditModal = (gym: any) => {
    setEditTargetId(gym.id);
    setFormData({
        gymName: gym.name || "",
        managerId: "none",
        category: gym.category ? gym.category.split(", ") : [],
        size: gym.size || "",
        open_date: gym.open_date || "",
        memo: gym.memo || "",
        status: gym.status || "active"
    });
    setIsEditOpen(true);
  };

  const handleDeleteGym = async (gymId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("gyms").delete().eq("id", gymId);
    fetchData(companyId, myRole);
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes("필라테스")) return "bg-pink-100 text-pink-700 border-pink-200";
    if (cat.includes("골프")) return "bg-green-100 text-green-700 border-green-200";
    if (cat.includes("PT")) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  return (
    <div className="space-y-6 p-4 md:p-6 md:space-y-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-heading font-bold text-[#2F80ED] mb-2">🏢 본사(HQ) 통합 관리</h2>
        <p className="text-sm md:text-base text-gray-600 mt-2 font-sans">{companyName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 대기자 */}
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
                                <SelectContent className="bg-white">{gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select onValueChange={setSelectedRole}>
                                <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="권한" /></SelectTrigger>
                                <SelectContent className="bg-white"><SelectItem value="admin">관리자</SelectItem><SelectItem value="staff">직원</SelectItem></SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-8 bg-[#2F80ED] hover:bg-[#1c6cd7]"
                              onClick={() => handleAssign(staff.id)}
                            >
                              승인
                            </Button>
                        </div>
                    </div>
                ))
            }
          </CardContent>
        </Card>

        {/* 2. 운영 센터 목록 */}
        <Card className="border-t-4 border-t-[#2F80ED] shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>🏢 운영 중인 센터 ({gyms.length})</CardTitle>
            <Button
              onClick={() => { setFormData(initialForm); setIsCreateOpen(true); }}
              size="sm"
              className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
            >
              <Plus className="mr-2 h-4 w-4" /> 지점 생성
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {gyms.map((gym) => {
                    const manager = gym.staffs?.find((s:any) => s.role === 'admin') || gym.staffs?.[0];
                    const categories = gym.category ? gym.category.split(", ") : [];

                    return (
                        <div key={gym.id} className="flex flex-col p-4 bg-white border rounded-lg shadow-sm gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-lg">{gym.name}</span>
                                        {categories.map((cat: string) => (
                                            <Badge key={cat} variant="outline" className={getCategoryColor(cat)}>{cat}</Badge>
                                        ))}
                                        {gym.status === 'pending' && <Badge className="bg-amber-500">승인대기</Badge>}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 flex gap-3 items-center">
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
                            {gym.memo && <div className="text-xs bg-gray-50 p-2 rounded text-gray-600 whitespace-pre-line">{gym.memo}</div>}
                        </div>
                    );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 최근 회원 리스트 */}
      <Card className="border-t-4 border-t-emerald-500 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>👥 최근 가입 회원 (상위 20명)</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              아직 등록된 회원이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-3 py-2 text-left">이름</th>
                    <th className="px-3 py-2 text-left">소속 지점</th>
                    <th className="px-3 py-2 text-left">연락처</th>
                    <th className="px-3 py-2 text-left">상태</th>
                    <th className="px-3 py-2 text-left">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{m.name}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {m.gyms?.name || "-"}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {m.phone || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="border-0 bg-emerald-50 text-emerald-700">
                          {m.status || "active"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {formatDate(m.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통합 모달 */}
      {[ 
        { isOpen: isCreateOpen, setIsOpen: setIsCreateOpen, title: "지점 생성", action: handleCreateBranch, btn: "생성하기" },
        { isOpen: isEditOpen, setIsOpen: setIsEditOpen, title: "지점 수정", action: handleUpdateGym, btn: "저장하기" }
      ].map((modal, idx) => (
        <Dialog key={idx} open={modal.isOpen} onOpenChange={modal.setIsOpen}>
            <DialogContent className="bg-white sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{modal.title}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 👇 필수 항목에 빨간색 * 표시 추가 */}
                        <div className="space-y-2"><Label>지점명 <span className="text-red-500">*</span></Label><Input value={formData.gymName} onChange={(e) => setFormData({...formData, gymName: e.target.value})}/></div>
                        
                        <div className="space-y-2 col-span-2">
                            <Label>운영 종목 (다중 선택) <span className="text-red-500">*</span></Label>
                            <div className="flex gap-2 flex-wrap">
                                {CATEGORY_OPTIONS.map((cat) => {
                                    const isSelected = formData.category.includes(cat);
                                    return (
                                            <Badge 
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={`cursor-pointer text-sm py-1 px-3 select-none border ${
                                                isSelected 
                                                ? "bg-[#2F80ED] text-white hover:bg-[#1c6cd7] border-[#2F80ED]" 
                                                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {cat} {isSelected && "✓"}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>평수</Label><Input value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} placeholder="예: 100"/></div>
                        <div className="space-y-2"><Label>오픈일</Label><Input type="date" value={formData.open_date} onChange={(e) => setFormData({...formData, open_date: e.target.value})}/></div>
                    </div>

                    <div className="space-y-2">
                        <Label>지점장 선택 <span className="text-red-500">*</span></Label>
                        <Select value={formData.managerId} onValueChange={(v) => setFormData({...formData, managerId: v})}>
                            <SelectTrigger><SelectValue placeholder={modal.title.includes("수정") ? "변경 시 선택" : "선택"} /></SelectTrigger>
                            <SelectContent className="bg-white max-h-[200px]">
                                {modal.title.includes("수정") && <SelectItem value="none">-- 변경 안함 --</SelectItem>}
                                {allStaffs.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} <span className="text-xs text-gray-400">({s.gyms?.name || '소속없음'})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {modal.title.includes("수정") && (
                        <div className="space-y-2">
                             <Label>상태 <span className="text-red-500">*</span></Label>
                             <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent className="bg-white"><SelectItem value="active">운영중</SelectItem><SelectItem value="pending">대기</SelectItem><SelectItem value="closed">폐업</SelectItem></SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2"><Label>메모</Label><Textarea value={formData.memo} onChange={(e) => setFormData({...formData, memo: e.target.value})} placeholder="특이사항 입력"/></div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={modal.action}
                    className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
                    disabled={isLoading}
                  >
                    {modal.btn}
                  </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}