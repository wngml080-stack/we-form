"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building, Phone, User, Pencil, ChevronRight, ChevronDown, MapPin } from "lucide-react";

export default function SystemAdminPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 확장 상태 관리
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedGyms, setExpandedGyms] = useState<Set<string>>(new Set());
  const [companyGyms, setCompanyGyms] = useState<Record<string, any[]>>({});
  const [gymStaffs, setGymStaffs] = useState<Record<string, any[]>>({});

  // 수정 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", representative_name: "", contact_phone: "", status: "" });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: me } = await supabase.from("staffs").select("role").eq("user_id", user.id).single();
      
      // 시스템 관리자가 아니면 쫓아내기
      if (me?.role !== "system_admin") {
        alert("접근 권한이 없습니다.");
        return router.push("/admin");
      }

      fetchCompanies();
    };
    init();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (data) setCompanies(data);
    setIsLoading(false);
  };

  // 회사 클릭 시 지점 목록 가져오기
  const toggleCompany = async (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);

    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
      setExpandedCompanies(newExpanded);
    } else {
      newExpanded.add(companyId);
      setExpandedCompanies(newExpanded);

      // 지점 목록이 없으면 가져오기
      if (!companyGyms[companyId]) {
        const { data } = await supabase
          .from("gyms")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (data) {
          setCompanyGyms(prev => ({ ...prev, [companyId]: data }));
        }
      }
    }
  };

  // 지점 클릭 시 직원 목록 가져오기
  const toggleGym = async (gymId: string) => {
    const newExpanded = new Set(expandedGyms);

    if (newExpanded.has(gymId)) {
      newExpanded.delete(gymId);
      setExpandedGyms(newExpanded);
    } else {
      newExpanded.add(gymId);
      setExpandedGyms(newExpanded);

      // 직원 목록이 없으면 가져오기
      if (!gymStaffs[gymId]) {
        const { data } = await supabase
          .from("staffs")
          .select("id, name, email, phone, job_title, role, employment_status")
          .eq("gym_id", gymId)
          .order("name", { ascending: true });

        if (data) {
          setGymStaffs(prev => ({ ...prev, [gymId]: data }));
        }
      }
    }
  };

  // 승인 처리 함수
  const handleApprove = async (companyId: string, companyName: string) => {
    if (!confirm(`'${companyName}' 업체의 가입을 승인하시겠습니까?`)) return;

    const { error } = await supabase
      .from("companies")
      .update({ status: "active" })
      .eq("id", companyId);

    if (!error) {
      alert("승인 완료! 이제 해당 업체 대표가 로그인할 수 있습니다.");
      fetchCompanies();
    } else {
      alert("에러: " + error.message);
    }
  };

  // 수정 모달 열기
  const openEdit = (e: any, comp: any) => {
    e.stopPropagation(); // 카드 클릭 시 상세페이지 이동 방지
    setEditForm({
        id: comp.id,
        name: comp.name || "",
        representative_name: comp.representative_name || "",
        contact_phone: comp.contact_phone || "",
        status: comp.status || "pending"
    });
    setIsEditOpen(true);
  };

  // 수정 저장
  const handleUpdate = async () => {
    try {
        const res = await fetch("/api/admin/system/update-company", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            alert("수정 완료!");
            setIsEditOpen(false);
            fetchCompanies();
        } else {
            alert("수정 실패: " + result.error);
        }
    } catch (error: any) {
        alert("오류 발생: " + error.message);
    }
  };

  if (isLoading) return <div className="p-10 text-center">데이터 로딩 중...</div>;

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string }> = {
      system_admin: { label: "시스템", color: "bg-purple-100 text-purple-700" },
      company_admin: { label: "본사", color: "bg-blue-100 text-blue-700" },
      admin: { label: "관리자", color: "bg-emerald-100 text-emerald-700" },
      staff: { label: "직원", color: "bg-gray-100 text-gray-700" }
    };
    return config[role] || { label: role, color: "bg-gray-100 text-gray-700" };
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">시스템 관리</h1>
          <p className="text-gray-500 mt-2 font-medium">서비스를 이용 중인 고객사를 관리합니다</p>
        </div>
      </div>

      <div className="space-y-3">
        {companies.map((comp) => {
          const isCompanyExpanded = expandedCompanies.has(comp.id);
          const gyms = companyGyms[comp.id] || [];

          return (
            <div key={comp.id} className="border rounded-lg bg-white shadow-sm">
              {/* 회사 헤더 */}
              <div
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${comp.status === 'active' ? 'border-l-[#2F80ED]' : 'border-l-[#F2994A]'}`}
                onClick={() => toggleCompany(comp.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {isCompanyExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <Building className="w-5 h-5 text-[#2F80ED]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{comp.name}</span>
                        {comp.status === 'active'
                          ? <Badge className="bg-[#2F80ED] hover:bg-[#2F80ED]">운영중</Badge>
                          : <Badge className="bg-[#F2994A] text-black hover:bg-[#F2994A]">대기</Badge>
                        }
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {comp.representative_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {comp.contact_phone || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {comp.status === 'pending' && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleApprove(comp.id, comp.name); }}
                        size="sm"
                        className="bg-[#F2994A] hover:bg-[#d68238] text-black font-bold"
                      >
                        <CheckCircle className="w-4 h-4 mr-1"/> 승인
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => openEdit(e, comp)}
                    >
                      <Pencil className="w-4 h-4 text-gray-400 hover:text-[#2F80ED]"/>
                    </Button>
                  </div>
                </div>
              </div>

              {/* 지점 목록 (회사가 확장되었을 때만) */}
              {isCompanyExpanded && (
                <div className="border-t bg-gray-50">
                  {gyms.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      등록된 지점이 없습니다.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {gyms.map((gym) => {
                        const isGymExpanded = expandedGyms.has(gym.id);
                        const staffs = gymStaffs[gym.id] || [];

                        return (
                          <div key={gym.id}>
                            {/* 지점 헤더 */}
                            <div
                              className="p-4 pl-12 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => toggleGym(gym.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  {isGymExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                  <MapPin className="w-4 h-4 text-emerald-600" />
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">{gym.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                      {gym.category && <span>🏋️ {gym.category}</span>}
                                      {gym.size && <span>📏 {gym.size}평</span>}
                                      {gym.open_date && <span>📅 {gym.open_date}</span>}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {staffs.length > 0 ? `${staffs.length}명` : '직원 보기'}
                                </Badge>
                              </div>
                            </div>

                            {/* 직원 목록 (지점이 확장되었을 때만) */}
                            {isGymExpanded && (
                              <div className="bg-white border-t">
                                {staffs.length === 0 ? (
                                  <div className="p-6 pl-20 text-center text-gray-400 text-sm">
                                    등록된 직원이 없습니다.
                                  </div>
                                ) : (
                                  <div className="divide-y">
                                    {staffs.map((staff) => {
                                      const roleBadge = getRoleBadge(staff.role);
                                      return (
                                        <div
                                          key={staff.id}
                                          className="p-3 pl-20 hover:bg-gray-50 transition-colors"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <User className="w-4 h-4 text-gray-400" />
                                              <div>
                                                <div className="font-medium text-sm">{staff.name}</div>
                                                <div className="text-xs text-gray-500">{staff.email}</div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-500">{staff.job_title}</span>
                                              <Badge className={`border-0 text-xs ${roleBadge.color}`}>
                                                {roleBadge.label}
                                              </Badge>
                                              <Badge
                                                variant="outline"
                                                className={`text-xs ${
                                                  staff.employment_status === '재직'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}
                                              >
                                                {staff.employment_status}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>회사 정보 수정</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2"><Label>회사명</Label><Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}/></div>
                <div className="space-y-2"><Label>대표자</Label><Input value={editForm.representative_name} onChange={(e) => setEditForm({...editForm, representative_name: e.target.value})}/></div>
                <div className="space-y-2"><Label>연락처</Label><Input value={editForm.contact_phone} onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})}/></div>
                <div className="space-y-2"><Label>상태</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="active">운영중</SelectItem>
                            <SelectItem value="pending">승인대기</SelectItem>
                            <SelectItem value="suspended">이용정지</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter><Button onClick={handleUpdate} className="bg-[#2F80ED]">저장</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}