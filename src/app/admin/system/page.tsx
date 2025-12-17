"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { showError } from "@/lib/utils/error-handler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building, Phone, User, Pencil, ChevronRight, ChevronDown, MapPin, Plus, Trash2, Dumbbell, Ruler, Calendar, Building2, Users } from "lucide-react";

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

  // 지점 생성 모달 상태
  const [isCreateGymOpen, setIsCreateGymOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [gymForm, setGymForm] = useState({ name: "", categories: [] as string[], size: "", open_date: "", memo: "" });

  // 지점 수정 모달 상태
  const [isEditGymOpen, setIsEditGymOpen] = useState(false);
  const [editGymForm, setEditGymForm] = useState({ id: "", name: "", categories: [] as string[], size: "", open_date: "", memo: "", status: "active" });

  // 직원 수정 모달 상태
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState({ id: "", name: "", phone: "", job_title: "", role: "staff", employment_status: "재직", gym_id: "", company_id: "" });

  const supabase = createSupabaseClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: me } = await supabase.from("staffs").select("role").eq("user_id", user.id).single();
      
      // 시스템 관리자가 아니면 쫓아내기
      if (me?.role !== "system_admin") {
        showError("접근 권한이 없습니다.", "권한 확인");
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

  // 지점 생성 모달 열기
  const openCreateGym = (e: any, companyId: string) => {
    e.stopPropagation();
    setSelectedCompanyId(companyId);
    setGymForm({ name: "", categories: [], size: "", open_date: "", memo: "" });
    setIsCreateGymOpen(true);
  };

  // 카테고리 토글
  const toggleCategory = (category: string) => {
    setGymForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // 지점 생성
  const handleCreateGym = async () => {
    if (!gymForm.name) {
      alert("지점명을 입력해주세요.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("gyms")
        .insert({
          company_id: selectedCompanyId,
          name: gymForm.name,
          category: gymForm.categories.length > 0 ? gymForm.categories.join(", ") : null,
          size: gymForm.size ? Number(gymForm.size) : null,
          open_date: gymForm.open_date || null,
          memo: gymForm.memo || null,
          plan: "enterprise",
          status: "active",
        })
        .select()
        .single();

      if (error) {
        alert("지점 생성 실패: " + error.message);
        return;
      }

      alert("지점이 생성되었습니다!");
      setIsCreateGymOpen(false);

      // 해당 회사의 지점 목록 새로고침
      const { data: gymsData } = await supabase
        .from("gyms")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("created_at", { ascending: false });

      if (gymsData) {
        setCompanyGyms(prev => ({ ...prev, [selectedCompanyId]: gymsData }));
      }
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
  };

  // 지점 수정 모달 열기
  const openEditGym = (e: any, gym: any, companyId: string) => {
    e.stopPropagation();
    const categories = gym.category ? gym.category.split(", ").map((c: string) => c.trim()) : [];
    setEditGymForm({
      id: gym.id,
      name: gym.name || "",
      categories: categories,
      size: gym.size?.toString() || "",
      open_date: gym.open_date || "",
      memo: gym.memo || "",
      status: gym.status || "active",
    });
    setSelectedCompanyId(companyId);
    setIsEditGymOpen(true);
  };

  // 지점 수정 저장
  const handleUpdateGym = async () => {
    if (!editGymForm.name) {
      alert("지점명을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("gyms")
        .update({
          name: editGymForm.name,
          category: editGymForm.categories.length > 0 ? editGymForm.categories.join(", ") : null,
          size: editGymForm.size ? Number(editGymForm.size) : null,
          open_date: editGymForm.open_date || null,
          memo: editGymForm.memo || null,
          status: editGymForm.status,
        })
        .eq("id", editGymForm.id);

      if (error) {
        alert("지점 수정 실패: " + error.message);
        return;
      }

      alert("지점이 수정되었습니다!");
      setIsEditGymOpen(false);

      // 해당 회사의 지점 목록 새로고침
      const { data: gymsData } = await supabase
        .from("gyms")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("created_at", { ascending: false });

      if (gymsData) {
        setCompanyGyms(prev => ({ ...prev, [selectedCompanyId]: gymsData }));
      }
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
  };

  // 지점 삭제
  const handleDeleteGym = async (e: any, gymId: string, gymName: string, companyId: string) => {
    e.stopPropagation();
    if (!confirm(`'${gymName}' 지점을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const { error } = await supabase
        .from("gyms")
        .delete()
        .eq("id", gymId);

      if (error) {
        alert("지점 삭제 실패: " + error.message);
        return;
      }

      alert("지점이 삭제되었습니다.");

      // 해당 회사의 지점 목록 새로고침
      const { data: gymsData } = await supabase
        .from("gyms")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (gymsData) {
        setCompanyGyms(prev => ({ ...prev, [companyId]: gymsData }));
      }
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
  };

  // 카테고리 토글 (수정 모달용)
  const toggleEditCategory = (category: string) => {
    setEditGymForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // 직원 수정 모달 열기
  const openEditStaff = (e: any, staff: any, companyId: string) => {
    e.stopPropagation();
    setEditStaffForm({
      id: staff.id,
      name: staff.name || "",
      phone: staff.phone || "",
      job_title: staff.job_title || "",
      role: staff.role || "staff",
      employment_status: staff.employment_status || "재직",
      gym_id: staff.gym_id || "",
      company_id: companyId,
    });
    setSelectedCompanyId(companyId);
    setIsEditStaffOpen(true);
  };

  // 직원 정보 수정
  const handleUpdateStaff = async () => {
    if (!editStaffForm.name) {
      alert("이름을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("staffs")
        .update({
          name: editStaffForm.name,
          phone: editStaffForm.phone || null,
          job_title: editStaffForm.job_title || null,
          role: editStaffForm.role,
          employment_status: editStaffForm.employment_status,
          gym_id: editStaffForm.gym_id || null,
        })
        .eq("id", editStaffForm.id);

      if (error) {
        alert("직원 정보 수정 실패: " + error.message);
        return;
      }

      alert("직원 정보가 수정되었습니다!");
      setIsEditStaffOpen(false);

      // 해당 지점의 직원 목록 새로고침
      if (editStaffForm.gym_id) {
        const { data: staffsData } = await supabase
          .from("staffs")
          .select("id, name, email, phone, job_title, role, employment_status")
          .eq("gym_id", editStaffForm.gym_id)
          .order("name", { ascending: true });

        if (staffsData) {
          setGymStaffs(prev => ({ ...prev, [editStaffForm.gym_id]: staffsData }));
        }
      }
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
  };

  // 직원 삭제
  const handleDeleteStaff = async (e: any, staffId: string, staffName: string, gymId: string) => {
    e.stopPropagation();
    if (!confirm(`'${staffName}' 직원을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const { error } = await supabase
        .from("staffs")
        .delete()
        .eq("id", staffId);

      if (error) {
        alert("직원 삭제 실패: " + error.message);
        return;
      }

      alert("직원이 삭제되었습니다.");

      // 해당 지점의 직원 목록 새로고침
      const { data: staffsData } = await supabase
        .from("staffs")
        .select("id, name, email, phone, job_title, role, employment_status")
        .eq("gym_id", gymId)
        .order("name", { ascending: true });

      if (staffsData) {
        setGymStaffs(prev => ({ ...prev, [gymId]: staffsData }));
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

  // 통계 계산
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const totalGyms = Object.values(companyGyms).reduce((sum, gyms) => sum + gyms.length, 0);
  const totalStaffs = Object.values(gymStaffs).reduce((sum, staffs) => sum + staffs.length, 0);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">시스템 관리</h1>
          <p className="text-gray-500 mt-2 font-medium">서비스를 이용 중인 고객사를 관리합니다</p>
        </div>
      </div>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              고객사
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalCompanies}</div>
          <p className="text-sm text-gray-500">전체 고객사 수</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              지점
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalGyms}</div>
          <p className="text-sm text-gray-500">개 지점 운영 중</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              직원
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalStaffs}</div>
          <p className="text-sm text-gray-500">명 등록</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              활성 고객사
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{activeCompanies}</div>
          <p className="text-sm text-gray-500">개 업체 운영 중</p>
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
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
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
                  {/* 지점 추가 버튼 */}
                  <div className="p-3 border-b bg-white">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => openCreateGym(e, comp.id)}
                      className="w-full border-dashed border-2 hover:border-[#2F80ED] hover:text-[#2F80ED]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      새 지점 추가
                    </Button>
                  </div>

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
                                  <div className="p-1 bg-emerald-100 rounded-lg">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900">{gym.name}</span>
                                      <Badge
                                        className={`text-xs ${
                                          gym.status === 'active'
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            : gym.status === 'closed'
                                            ? 'bg-red-100 text-red-700 border-red-200'
                                            : 'bg-orange-100 text-orange-700 border-orange-200'
                                        }`}
                                      >
                                        {gym.status === 'active' ? '운영중' : gym.status === 'closed' ? '폐업' : '이용중단'}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                      {gym.category && (
                                        <span className="flex items-center gap-1">
                                          <Dumbbell className="w-3 h-3" /> {gym.category}
                                        </span>
                                      )}
                                      {gym.size && (
                                        <span className="flex items-center gap-1">
                                          <Ruler className="w-3 h-3" /> {gym.size}평
                                        </span>
                                      )}
                                      {gym.open_date && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" /> {gym.open_date}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {staffs.length > 0 ? `${staffs.length}명` : '직원 보기'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => openEditGym(e, gym, comp.id)}
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-[#2F80ED]"/>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => handleDeleteGym(e, gym.id, gym.name, comp.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/>
                                  </Button>
                                </div>
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
                                              <div className="p-1 bg-purple-100 rounded-lg">
                                                <User className="w-3.5 h-3.5 text-purple-600" />
                                              </div>
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
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => openEditStaff(e, staff, comp.id)}
                                              >
                                                <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-[#2F80ED]"/>
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => handleDeleteStaff(e, staff.id, staff.name, gym.id)}
                                              >
                                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/>
                                              </Button>
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

      {/* 회사 수정 모달 */}
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

      {/* 지점 생성 모달 */}
      <Dialog open={isCreateGymOpen} onOpenChange={setIsCreateGymOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>새 지점 추가</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>지점명 *</Label>
              <Input
                value={gymForm.name}
                onChange={(e) => setGymForm({...gymForm, name: e.target.value})}
                placeholder="예: 강남점"
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리 (중복 선택 가능)</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "헬스", color: "blue", bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500", hoverBg: "hover:bg-blue-600" },
                  { name: "필라테스", color: "pink", bg: "bg-pink-500", border: "border-pink-500", text: "text-pink-500", hoverBg: "hover:bg-pink-600" },
                  { name: "PT", color: "yellow", bg: "bg-yellow-500", border: "border-yellow-500", text: "text-yellow-600", hoverBg: "hover:bg-yellow-600" },
                  { name: "GX", color: "purple", bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-500", hoverBg: "hover:bg-purple-600" },
                  { name: "골프", color: "green", bg: "bg-green-500", border: "border-green-500", text: "text-green-500", hoverBg: "hover:bg-green-600" },
                  { name: "하이록스", color: "cyan", bg: "bg-cyan-500", border: "border-cyan-500", text: "text-cyan-500", hoverBg: "hover:bg-cyan-600" },
                  { name: "러닝", color: "orange", bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-500", hoverBg: "hover:bg-orange-600" },
                  { name: "크로스핏", color: "red", bg: "bg-red-500", border: "border-red-500", text: "text-red-500", hoverBg: "hover:bg-red-600" },
                ].map((cat) => {
                  const isSelected = gymForm.categories.includes(cat.name);
                  return (
                    <Button
                      key={cat.name}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={isSelected
                        ? `${cat.bg} ${cat.hoverBg} text-white border-transparent`
                        : `${cat.border} ${cat.text} hover:${cat.bg} hover:text-white bg-white`
                      }
                      onClick={() => toggleCategory(cat.name)}
                    >
                      {cat.name}
                    </Button>
                  );
                })}
              </div>
              {gymForm.categories.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  선택됨: {gymForm.categories.join(", ")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>평수</Label>
              <Input
                type="number"
                value={gymForm.size}
                onChange={(e) => setGymForm({...gymForm, size: e.target.value})}
                placeholder="예: 100"
              />
            </div>
            <div className="space-y-2">
              <Label>오픈일</Label>
              <Input
                type="date"
                value={gymForm.open_date}
                onChange={(e) => setGymForm({...gymForm, open_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <Input
                value={gymForm.memo}
                onChange={(e) => setGymForm({...gymForm, memo: e.target.value})}
                placeholder="참고사항"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateGymOpen(false)}>취소</Button>
            <Button onClick={handleCreateGym} className="bg-[#2F80ED]">생성하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 지점 수정 모달 */}
      <Dialog open={isEditGymOpen} onOpenChange={setIsEditGymOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>지점 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>지점명 *</Label>
              <Input
                value={editGymForm.name}
                onChange={(e) => setEditGymForm({...editGymForm, name: e.target.value})}
                placeholder="예: 강남점"
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리 (중복 선택 가능)</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "헬스", color: "blue", bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500", hoverBg: "hover:bg-blue-600" },
                  { name: "필라테스", color: "pink", bg: "bg-pink-500", border: "border-pink-500", text: "text-pink-500", hoverBg: "hover:bg-pink-600" },
                  { name: "PT", color: "yellow", bg: "bg-yellow-500", border: "border-yellow-500", text: "text-yellow-600", hoverBg: "hover:bg-yellow-600" },
                  { name: "GX", color: "purple", bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-500", hoverBg: "hover:bg-purple-600" },
                  { name: "골프", color: "green", bg: "bg-green-500", border: "border-green-500", text: "text-green-500", hoverBg: "hover:bg-green-600" },
                  { name: "하이록스", color: "cyan", bg: "bg-cyan-500", border: "border-cyan-500", text: "text-cyan-500", hoverBg: "hover:bg-cyan-600" },
                  { name: "러닝", color: "orange", bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-500", hoverBg: "hover:bg-orange-600" },
                  { name: "크로스핏", color: "red", bg: "bg-red-500", border: "border-red-500", text: "text-red-500", hoverBg: "hover:bg-red-600" },
                ].map((cat) => {
                  const isSelected = editGymForm.categories.includes(cat.name);
                  return (
                    <Button
                      key={cat.name}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={isSelected
                        ? `${cat.bg} ${cat.hoverBg} text-white border-transparent`
                        : `${cat.border} ${cat.text} hover:${cat.bg} hover:text-white bg-white`
                      }
                      onClick={() => toggleEditCategory(cat.name)}
                    >
                      {cat.name}
                    </Button>
                  );
                })}
              </div>
              {editGymForm.categories.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  선택됨: {editGymForm.categories.join(", ")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>평수</Label>
              <Input
                type="number"
                value={editGymForm.size}
                onChange={(e) => setEditGymForm({...editGymForm, size: e.target.value})}
                placeholder="예: 100"
              />
            </div>
            <div className="space-y-2">
              <Label>오픈일</Label>
              <Input
                type="date"
                value={editGymForm.open_date}
                onChange={(e) => setEditGymForm({...editGymForm, open_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <Input
                value={editGymForm.memo}
                onChange={(e) => setEditGymForm({...editGymForm, memo: e.target.value})}
                placeholder="참고사항"
              />
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={editGymForm.status} onValueChange={(v) => setEditGymForm({...editGymForm, status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="active">운영중</SelectItem>
                  <SelectItem value="closed">폐업</SelectItem>
                  <SelectItem value="suspended">이용중단</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditGymOpen(false)}>취소</Button>
            <Button onClick={handleUpdateGym} className="bg-[#2F80ED]">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 직원 수정 모달 */}
      <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>직원 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={editStaffForm.name}
                onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})}
                placeholder="직원 이름"
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                value={editStaffForm.phone}
                onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})}
                placeholder="010-0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>직책</Label>
              <Input
                value={editStaffForm.job_title}
                onChange={(e) => setEditStaffForm({...editStaffForm, job_title: e.target.value})}
                placeholder="예: 트레이너, 매니저"
              />
            </div>
            <div className="space-y-2">
              <Label>권한</Label>
              <Select value={editStaffForm.role} onValueChange={(v) => setEditStaffForm({...editStaffForm, role: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="system_admin">시스템 관리자</SelectItem>
                  <SelectItem value="company_admin">본사 관리자</SelectItem>
                  <SelectItem value="admin">지점 관리자</SelectItem>
                  <SelectItem value="staff">직원</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>재직 상태</Label>
              <Select value={editStaffForm.employment_status} onValueChange={(v) => setEditStaffForm({...editStaffForm, employment_status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="재직">재직</SelectItem>
                  <SelectItem value="퇴사">퇴사</SelectItem>
                  <SelectItem value="가입대기">가입대기</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditStaffOpen(false)}>취소</Button>
            <Button onClick={handleUpdateStaff} className="bg-[#2F80ED]">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}