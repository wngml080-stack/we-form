"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseClient } from "@/lib/supabase/client";
import { showError } from "@/lib/utils/error-handler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building, Phone, User, Pencil, ChevronRight, ChevronDown, MapPin, Plus, Trash2, Dumbbell, Ruler, Calendar, Building2, Users, Bell, Megaphone, AlertTriangle, Info, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function SystemAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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

  // 고객사 생성 모달 상태
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [createCompanyForm, setCreateCompanyForm] = useState({ name: "", representative_name: "", contact_phone: "", status: "pending" });

  // 시스템 공지사항 상태
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([]);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
  const [isEditAnnouncementOpen, setIsEditAnnouncementOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    announcement_type: "general",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    is_active: true
  });
  const [editAnnouncementForm, setEditAnnouncementForm] = useState({
    id: "",
    title: "",
    content: "",
    priority: "normal",
    announcement_type: "general",
    start_date: "",
    end_date: "",
    is_active: true
  });

  // 전체 통계
  const [totalGymsCount, setTotalGymsCount] = useState(0);
  const [totalStaffsCount, setTotalStaffsCount] = useState(0);

  // Supabase 클라이언트 한 번만 생성 (메모이제이션)
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {

    if (authLoading) return;

    // 시스템 관리자가 아니면 쫓아내기
    if (user?.role !== "system_admin") {
      showError("접근 권한이 없습니다.", "권한 확인");
      router.push("/admin");
      return;
    }

    fetchCompanies();
    fetchSystemAnnouncements();
  }, [authLoading, user, router]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/system/companies");
      const result = await response.json();
      if (result.success) {
        setCompanies(result.companies || []);
        setTotalGymsCount(result.totalGymsCount || 0);
        setTotalStaffsCount(result.totalStaffsCount || 0);
      }
    } catch (error) {
      console.error("회사 목록 조회 실패:", error);
    }
    setIsLoading(false);
  };

  // 시스템 공지사항 가져오기
  const fetchSystemAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/system/announcements");
      const result = await response.json();

      if (result.success) {
        setSystemAnnouncements(result.announcements || []);
      } else {
        console.error("[fetchSystemAnnouncements] API Error:", result.error);
      }
    } catch (error) {
      console.error("[fetchSystemAnnouncements] Fetch error:", error);
    }
  };

  // 시스템 공지사항 생성
  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/admin/system/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementForm.title,
          content: announcementForm.content,
          priority: announcementForm.priority,
          is_active: announcementForm.is_active,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert("공지사항 생성 실패: " + result.error);
        return;
      }

      alert("시스템 공지사항이 생성되었습니다!");
      setIsCreateAnnouncementOpen(false);
      setAnnouncementForm({
        title: "",
        content: "",
        priority: "normal",
        announcement_type: "general",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        is_active: true
      });
      fetchSystemAnnouncements();
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
  };

  // 시스템 공지사항 수정 모달 열기
  const openEditAnnouncement = (announcement: any) => {
    setEditAnnouncementForm({
      id: announcement.id,
      title: announcement.title || "",
      content: announcement.content || "",
      priority: announcement.priority || "normal",
      announcement_type: announcement.announcement_type || "general",
      start_date: announcement.start_date || "",
      end_date: announcement.end_date || "",
      is_active: announcement.is_active ?? true
    });
    setIsEditAnnouncementOpen(true);
  };

  // 시스템 공지사항 수정
  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncementForm.title || !editAnnouncementForm.content) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/admin/system/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editAnnouncementForm.id,
          title: editAnnouncementForm.title,
          content: editAnnouncementForm.content,
          priority: editAnnouncementForm.priority,
          is_active: editAnnouncementForm.is_active,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert("공지사항 수정 실패: " + result.error);
        return;
      }

      alert("시스템 공지사항이 수정되었습니다!");
      setIsEditAnnouncementOpen(false);
      fetchSystemAnnouncements();
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
  };

  // 시스템 공지사항 삭제
  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!confirm(`'${title}' 공지사항을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/system/announcements?id=${id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) {
        alert("공지사항 삭제 실패: " + result.error);
        return;
      }

      alert("공지사항이 삭제되었습니다.");
      fetchSystemAnnouncements();
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
  };

  // 시스템 공지사항 활성화 토글
  const toggleAnnouncementActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/system/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert("상태 변경 실패: " + result.error);
        return;
      }

      fetchSystemAnnouncements();
    } catch (error: any) {
      alert("오류 발생: " + error.message);
    }
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
        try {
          const response = await fetch(`/api/admin/system/gyms?company_id=${companyId}`);
          const result = await response.json();
          if (result.success) {
            setCompanyGyms(prev => ({ ...prev, [companyId]: result.gyms }));
          }
        } catch (error) {
          console.error("Error fetching gyms:", error);
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
        try {
          const response = await fetch(`/api/admin/system/staffs?gym_id=${gymId}`);
          const result = await response.json();
          if (result.success) {
            setGymStaffs(prev => ({ ...prev, [gymId]: result.staffs }));
          }
        } catch (error) {
          console.error("Error fetching staffs:", error);
        }
      }
    }
  };

  // 상태 변경 함수
  const handleStatusChange = async (companyId: string, newStatus: string, companyName: string) => {
    const statusText = newStatus === 'active' ? '운영중' : newStatus === 'pending' ? '승인대기' : '이용정지';
    if (!confirm(`'${companyName}' 업체의 상태를 '${statusText}'로 변경하시겠습니까?`)) return;

    try {
      const response = await fetch("/api/admin/system/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status: newStatus }),
      });
      const result = await response.json();

      if (result.success) {
        alert(`상태가 '${statusText}'로 변경되었습니다.`);
        fetchCompanies();
      } else {
        alert("에러: " + result.error);
      }
    } catch (error: any) {
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

  // 고객사 생성 모달 열기
  const openCreateCompany = () => {
    setCreateCompanyForm({ name: "", representative_name: "", contact_phone: "", status: "pending" });
    setIsCreateCompanyOpen(true);
  };

  // 고객사 생성
  const handleCreateCompany = async () => {
    if (!createCompanyForm.name || !createCompanyForm.representative_name) {
      alert("회사명과 대표자명을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/admin/system/create-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createCompanyForm),
      });

      const result = await res.json();

      if (res.ok) {
        alert("고객사가 생성되었습니다!");
        setIsCreateCompanyOpen(false);
        fetchCompanies();
      } else {
        alert("생성 실패: " + result.error);
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
  const pendingCompanies = companies.filter(c => c.status === 'pending');

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">시스템 관리</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">서비스를 이용 중인 고객사를 관리합니다</p>
        </div>
        <Button
          onClick={openCreateCompany}
          className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          고객사 추가
        </Button>
      </div>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalGymsCount}</div>
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
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalStaffsCount}</div>
          <p className="text-sm text-gray-500">명 등록</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              승인 대기
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{pendingCompanies.length}</div>
          <p className="text-sm text-gray-500">개 업체 대기 중</p>
        </div>
      </div>

      {/* 시스템 공지사항 관리 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] rounded-xl">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">시스템 공지사항</h2>
                <p className="text-sm text-gray-500">전체 사용자에게 표시되는 공지사항을 관리합니다</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateAnnouncementOpen(true)}
              className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              공지 추가
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {systemAnnouncements.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">등록된 시스템 공지사항이 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">새 공지사항을 추가하여 전체 사용자에게 알림을 보내세요</p>
            </div>
          ) : (
            systemAnnouncements.map((announcement) => {
              const priorityConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
                urgent: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", label: "긴급" },
                normal: { icon: Bell, color: "text-blue-600", bg: "bg-blue-100", label: "일반" },
                info: { icon: Info, color: "text-cyan-600", bg: "bg-cyan-100", label: "안내" },
                update: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-100", label: "업데이트" }
              };
              const typeConfig: Record<string, string> = {
                general: "일반",
                update: "업데이트",
                maintenance: "점검",
                feature: "신기능",
                notice: "공지"
              };
              const priority = priorityConfig[announcement.priority] || priorityConfig.normal;
              const PriorityIcon = priority.icon;

              return (
                <div
                  key={announcement.id}
                  className={`p-4 sm:p-5 hover:bg-gray-50 transition-colors ${!announcement.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${priority.bg} flex-shrink-0`}>
                      <PriorityIcon className={`w-5 h-5 ${priority.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                            <Badge className={`text-xs ${priority.bg} ${priority.color} border-0`}>
                              {priority.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {typeConfig[announcement.announcement_type] || announcement.announcement_type}
                            </Badge>
                            {!announcement.is_active && (
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                                비활성
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{announcement.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {announcement.start_date}
                              {announcement.end_date && ` ~ ${announcement.end_date}`}
                            </span>
                            <span>조회 {announcement.view_count || 0}회</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2 ${announcement.is_active ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => toggleAnnouncementActive(announcement.id, announcement.is_active)}
                          >
                            {announcement.is_active ? "활성" : "비활성"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditAnnouncement(announcement)}
                          >
                            <Pencil className="w-4 h-4 text-gray-400 hover:text-[#2F80ED]"/>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteAnnouncement(announcement.id, announcement.title)}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500"/>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-3">
        {companies.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">등록된 고객사가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">새 고객사를 추가하거나 기존 데이터를 확인해주세요</p>
          </div>
        )}
        {companies.map((comp) => {
          const isCompanyExpanded = expandedCompanies.has(comp.id);
          const gyms = companyGyms[comp.id] || [];

          return (
            <div key={comp.id} className="border rounded-lg bg-white shadow-sm">
              {/* 회사 헤더 */}
              <div
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                  comp.status === 'active'
                    ? 'border-l-[#2F80ED]'
                    : comp.status === 'pending'
                    ? 'border-l-[#F2994A]'
                    : 'border-l-red-400'
                }`}
                onClick={() => toggleCompany(comp.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {isCompanyExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div className={`p-1.5 rounded-lg ${
                      comp.status === 'active'
                        ? 'bg-blue-100'
                        : comp.status === 'pending'
                        ? 'bg-orange-100'
                        : 'bg-red-100'
                    }`}>
                      <Building className={`w-4 h-4 ${
                        comp.status === 'active'
                          ? 'text-blue-600'
                          : comp.status === 'pending'
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{comp.name}</span>
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
                    <Select
                      value={comp.status}
                      onValueChange={(newStatus) => handleStatusChange(comp.id, newStatus, comp.name)}
                    >
                      <SelectTrigger
                        className={`w-[130px] h-9 ${
                          comp.status === 'active'
                            ? 'bg-[#2F80ED] text-white border-[#2F80ED] hover:bg-[#1c6cd7]'
                            : comp.status === 'pending'
                            ? 'bg-[#F2994A] text-black border-[#F2994A] hover:bg-[#d68238]'
                            : 'bg-red-400 text-white border-red-400 hover:bg-red-500'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white" onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="pending">승인대기</SelectItem>
                        <SelectItem value="active">운영중</SelectItem>
                        <SelectItem value="suspended">이용정지</SelectItem>
                      </SelectContent>
                    </Select>
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
            <DialogHeader><DialogTitle>회사 정보 수정</DialogTitle><DialogDescription className="sr-only">회사 정보를 수정합니다</DialogDescription></DialogHeader>
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
            <DialogDescription className="sr-only">새로운 지점을 추가합니다</DialogDescription>
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
            <DialogDescription className="sr-only">지점 정보를 수정합니다</DialogDescription>
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
            <DialogDescription className="sr-only">직원 정보를 수정합니다</DialogDescription>
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

      {/* 고객사 생성 모달 */}
      <Dialog open={isCreateCompanyOpen} onOpenChange={setIsCreateCompanyOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>고객사 추가</DialogTitle>
            <DialogDescription className="sr-only">새로운 고객사를 추가합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input
                value={createCompanyForm.name}
                onChange={(e) => setCreateCompanyForm({...createCompanyForm, name: e.target.value})}
                placeholder="회사명을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>대표자명 *</Label>
              <Input
                value={createCompanyForm.representative_name}
                onChange={(e) => setCreateCompanyForm({...createCompanyForm, representative_name: e.target.value})}
                placeholder="대표자명을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                value={createCompanyForm.contact_phone}
                onChange={(e) => setCreateCompanyForm({...createCompanyForm, contact_phone: e.target.value})}
                placeholder="010-0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={createCompanyForm.status} onValueChange={(v) => setCreateCompanyForm({...createCompanyForm, status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="pending">승인대기</SelectItem>
                  <SelectItem value="active">운영중</SelectItem>
                  <SelectItem value="suspended">이용정지</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateCompanyOpen(false)}>취소</Button>
            <Button onClick={handleCreateCompany} className="bg-[#2F80ED]">추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시스템 공지사항 생성 모달 */}
      <Dialog open={isCreateAnnouncementOpen} onOpenChange={setIsCreateAnnouncementOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#2F80ED]" />
              시스템 공지사항 추가
            </DialogTitle>
            <DialogDescription className="sr-only">새로운 시스템 공지사항을 추가합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>내용 *</Label>
              <Textarea
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                placeholder="공지사항 내용을 입력하세요"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select value={announcementForm.priority} onValueChange={(v) => setAnnouncementForm({...announcementForm, priority: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="urgent">긴급</SelectItem>
                    <SelectItem value="normal">일반</SelectItem>
                    <SelectItem value="info">안내</SelectItem>
                    <SelectItem value="update">업데이트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={announcementForm.announcement_type} onValueChange={(v) => setAnnouncementForm({...announcementForm, announcement_type: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="update">업데이트</SelectItem>
                    <SelectItem value="maintenance">점검</SelectItem>
                    <SelectItem value="feature">신기능</SelectItem>
                    <SelectItem value="notice">공지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={announcementForm.start_date}
                  onChange={(e) => setAnnouncementForm({...announcementForm, start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>종료일 (선택)</Label>
                <Input
                  type="date"
                  value={announcementForm.end_date}
                  onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={announcementForm.is_active}
                onChange={(e) => setAnnouncementForm({...announcementForm, is_active: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">즉시 활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateAnnouncementOpen(false)}>취소</Button>
            <Button onClick={handleCreateAnnouncement} className="bg-[#2F80ED]">추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시스템 공지사항 수정 모달 */}
      <Dialog open={isEditAnnouncementOpen} onOpenChange={setIsEditAnnouncementOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#2F80ED]" />
              시스템 공지사항 수정
            </DialogTitle>
            <DialogDescription className="sr-only">시스템 공지사항을 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                value={editAnnouncementForm.title}
                onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, title: e.target.value})}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>내용 *</Label>
              <Textarea
                value={editAnnouncementForm.content}
                onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, content: e.target.value})}
                placeholder="공지사항 내용을 입력하세요"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select value={editAnnouncementForm.priority} onValueChange={(v) => setEditAnnouncementForm({...editAnnouncementForm, priority: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="urgent">긴급</SelectItem>
                    <SelectItem value="normal">일반</SelectItem>
                    <SelectItem value="info">안내</SelectItem>
                    <SelectItem value="update">업데이트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={editAnnouncementForm.announcement_type} onValueChange={(v) => setEditAnnouncementForm({...editAnnouncementForm, announcement_type: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="update">업데이트</SelectItem>
                    <SelectItem value="maintenance">점검</SelectItem>
                    <SelectItem value="feature">신기능</SelectItem>
                    <SelectItem value="notice">공지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={editAnnouncementForm.start_date}
                  onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>종료일 (선택)</Label>
                <Input
                  type="date"
                  value={editAnnouncementForm.end_date}
                  onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, end_date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editAnnouncementForm.is_active}
                onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, is_active: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="edit_is_active" className="cursor-pointer">활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditAnnouncementOpen(false)}>취소</Button>
            <Button onClick={handleUpdateAnnouncement} className="bg-[#2F80ED]">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}