"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseClient } from "@/lib/supabase/client";
import { showError } from "@/lib/utils/error-handler";
import { toast } from "@/lib/toast";

// Types
export interface CompanyEditForm {
  id: string;
  name: string;
  representative_name: string;
  contact_phone: string;
  status: string;
}

export interface GymForm {
  name: string;
  categories: string[];
  size: string;
  open_date: string;
  memo: string;
}

export interface EditGymForm extends GymForm {
  id: string;
  status: string;
}

export interface StaffEditForm {
  id: string;
  name: string;
  phone: string;
  job_title: string;
  role: string;
  employment_status: string;
  gym_id: string;
  company_id: string;
}

export interface CreateCompanyForm {
  name: string;
  representative_name: string;
  contact_phone: string;
  status: string;
}

export interface AnnouncementForm {
  title: string;
  content: string;
  priority: string;
  announcement_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface EditAnnouncementForm extends AnnouncementForm {
  id: string;
}

// Initial form values
const initialGymForm: GymForm = { name: "", categories: [], size: "", open_date: "", memo: "" };
const initialEditGymForm: EditGymForm = { id: "", name: "", categories: [], size: "", open_date: "", memo: "", status: "active" };
const initialStaffEditForm: StaffEditForm = { id: "", name: "", phone: "", job_title: "", role: "staff", employment_status: "재직", gym_id: "", company_id: "" };
const initialCreateCompanyForm: CreateCompanyForm = { name: "", representative_name: "", contact_phone: "", status: "pending" };
const initialAnnouncementForm: AnnouncementForm = {
  title: "", content: "", priority: "normal", announcement_type: "general",
  start_date: new Date().toISOString().split('T')[0], end_date: "", is_active: true
};
const initialEditAnnouncementForm: EditAnnouncementForm = {
  id: "", title: "", content: "", priority: "normal", announcement_type: "general",
  start_date: "", end_date: "", is_active: true
};

// 카테고리 목록
export const CATEGORY_OPTIONS = [
  { name: "헬스", bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500", hoverBg: "hover:bg-blue-600" },
  { name: "필라테스", bg: "bg-pink-500", border: "border-pink-500", text: "text-pink-500", hoverBg: "hover:bg-pink-600" },
  { name: "PT", bg: "bg-yellow-500", border: "border-yellow-500", text: "text-yellow-600", hoverBg: "hover:bg-yellow-600" },
  { name: "GX", bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-500", hoverBg: "hover:bg-purple-600" },
  { name: "골프", bg: "bg-green-500", border: "border-green-500", text: "text-green-500", hoverBg: "hover:bg-green-600" },
  { name: "하이록스", bg: "bg-cyan-500", border: "border-cyan-500", text: "text-cyan-500", hoverBg: "hover:bg-cyan-600" },
  { name: "러닝", bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-500", hoverBg: "hover:bg-orange-600" },
  { name: "크로스핏", bg: "bg-red-500", border: "border-red-500", text: "text-red-500", hoverBg: "hover:bg-red-600" },
];

export function useSystemData() {
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
  const [editForm, setEditForm] = useState<CompanyEditForm>({ id: "", name: "", representative_name: "", contact_phone: "", status: "" });

  // 지점 생성 모달 상태
  const [isCreateGymOpen, setIsCreateGymOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [gymForm, setGymForm] = useState<GymForm>(initialGymForm);

  // 지점 수정 모달 상태
  const [isEditGymOpen, setIsEditGymOpen] = useState(false);
  const [editGymForm, setEditGymForm] = useState<EditGymForm>(initialEditGymForm);

  // 직원 수정 모달 상태
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState<StaffEditForm>(initialStaffEditForm);

  // 고객사 생성 모달 상태
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [createCompanyForm, setCreateCompanyForm] = useState<CreateCompanyForm>(initialCreateCompanyForm);

  // 시스템 공지사항 상태
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([]);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
  const [isEditAnnouncementOpen, setIsEditAnnouncementOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>(initialAnnouncementForm);
  const [editAnnouncementForm, setEditAnnouncementForm] = useState<EditAnnouncementForm>(initialEditAnnouncementForm);

  // 전체 통계
  const [totalGymsCount, setTotalGymsCount] = useState(0);
  const [totalStaffsCount, setTotalStaffsCount] = useState(0);

  // Supabase 클라이언트
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

  const fetchSystemAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/system/announcements");
      const result = await response.json();
      if (result.success) {
        setSystemAnnouncements(result.announcements || []);
      }
    } catch (error) {
      console.error("[fetchSystemAnnouncements] Fetch error:", error);
    }
  };

  // 시스템 공지사항 CRUD
  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast.warning("제목과 내용을 입력해주세요.");
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
        toast.error("공지사항 생성 실패: " + result.error);
        return;
      }

      toast.success("시스템 공지사항이 생성되었습니다!");
      setIsCreateAnnouncementOpen(false);
      setAnnouncementForm(initialAnnouncementForm);
      fetchSystemAnnouncements();
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

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

  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncementForm.title || !editAnnouncementForm.content) {
      toast.warning("제목과 내용을 입력해주세요.");
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
        toast.error("공지사항 수정 실패: " + result.error);
        return;
      }

      toast.success("시스템 공지사항이 수정되었습니다!");
      setIsEditAnnouncementOpen(false);
      fetchSystemAnnouncements();
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!confirm(`'${title}' 공지사항을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/system/announcements?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) {
        toast.error("공지사항 삭제 실패: " + result.error);
        return;
      }

      toast.success("공지사항이 삭제되었습니다.");
      fetchSystemAnnouncements();
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  const toggleAnnouncementActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/system/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error("상태 변경 실패: " + result.error);
        return;
      }

      fetchSystemAnnouncements();
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  // 회사/지점/직원 토글 함수
  const toggleCompany = async (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);

    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
      setExpandedCompanies(newExpanded);
    } else {
      newExpanded.add(companyId);
      setExpandedCompanies(newExpanded);

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

  const toggleGym = async (gymId: string) => {
    const newExpanded = new Set(expandedGyms);

    if (newExpanded.has(gymId)) {
      newExpanded.delete(gymId);
      setExpandedGyms(newExpanded);
    } else {
      newExpanded.add(gymId);
      setExpandedGyms(newExpanded);

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

  // 회사 상태 변경
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
        toast.success(`상태가 '${statusText}'로 변경되었습니다.`);
        fetchCompanies();
      } else {
        toast.error("에러: " + result.error);
      }
    } catch (error: any) {
      toast.error("에러: " + error.message);
    }
  };

  // 회사 수정
  const openEdit = (e: any, comp: any) => {
    e.stopPropagation();
    setEditForm({
      id: comp.id,
      name: comp.name || "",
      representative_name: comp.representative_name || "",
      contact_phone: comp.contact_phone || "",
      status: comp.status || "pending"
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/admin/system/update-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("수정 완료!");
        setIsEditOpen(false);
        fetchCompanies();
      } else {
        toast.error("수정 실패: " + result.error);
      }
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  // 지점 CRUD
  const openCreateGym = (e: any, companyId: string) => {
    e.stopPropagation();
    setSelectedCompanyId(companyId);
    setGymForm(initialGymForm);
    setIsCreateGymOpen(true);
  };

  const toggleCategory = (category: string) => {
    setGymForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleCreateGym = async () => {
    if (!gymForm.name) {
      toast.warning("지점명을 입력해주세요.");
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
        toast.error("지점 생성 실패: " + error.message);
        return;
      }

      toast.success("지점이 생성되었습니다!");
      setIsCreateGymOpen(false);

      const { data: gymsData } = await supabase
        .from("gyms")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("created_at", { ascending: false });

      if (gymsData) {
        setCompanyGyms(prev => ({ ...prev, [selectedCompanyId]: gymsData }));
      }
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

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

  const toggleEditCategory = (category: string) => {
    setEditGymForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleUpdateGym = async () => {
    if (!editGymForm.name) {
      toast.warning("지점명을 입력해주세요.");
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
        toast.error("지점 수정 실패: " + error.message);
        return;
      }

      toast.success("지점이 수정되었습니다!");
      setIsEditGymOpen(false);

      const { data: gymsData } = await supabase
        .from("gyms")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("created_at", { ascending: false });

      if (gymsData) {
        setCompanyGyms(prev => ({ ...prev, [selectedCompanyId]: gymsData }));
      }
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  const handleDeleteGym = async (e: any, gymId: string, gymName: string, companyId: string) => {
    e.stopPropagation();
    if (!confirm(`'${gymName}' 지점을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const { error } = await supabase.from("gyms").delete().eq("id", gymId);

      if (error) {
        toast.error("지점 삭제 실패: " + error.message);
        return;
      }

      toast.success("지점이 삭제되었습니다.");

      const { data: gymsData } = await supabase
        .from("gyms")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (gymsData) {
        setCompanyGyms(prev => ({ ...prev, [companyId]: gymsData }));
      }
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  // 직원 CRUD
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

  const handleUpdateStaff = async () => {
    if (!editStaffForm.name) {
      toast.warning("이름을 입력해주세요.");
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
        toast.error("직원 정보 수정 실패: " + error.message);
        return;
      }

      toast.success("직원 정보가 수정되었습니다!");
      setIsEditStaffOpen(false);

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
      toast.error("오류 발생: " + error.message);
    }
  };

  const handleDeleteStaff = async (e: any, staffId: string, staffName: string, gymId: string) => {
    e.stopPropagation();
    if (!confirm(`'${staffName}' 직원을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const { error } = await supabase.from("staffs").delete().eq("id", staffId);

      if (error) {
        toast.error("직원 삭제 실패: " + error.message);
        return;
      }

      toast.success("직원이 삭제되었습니다.");

      const { data: staffsData } = await supabase
        .from("staffs")
        .select("id, name, email, phone, job_title, role, employment_status")
        .eq("gym_id", gymId)
        .order("name", { ascending: true });

      if (staffsData) {
        setGymStaffs(prev => ({ ...prev, [gymId]: staffsData }));
      }
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  // 고객사 생성
  const openCreateCompany = () => {
    setCreateCompanyForm(initialCreateCompanyForm);
    setIsCreateCompanyOpen(true);
  };

  const handleCreateCompany = async () => {
    if (!createCompanyForm.name || !createCompanyForm.representative_name) {
      toast.warning("회사명과 대표자명을 입력해주세요.");
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
        toast.success("고객사가 생성되었습니다!");
        setIsCreateCompanyOpen(false);
        fetchCompanies();
      } else {
        toast.error("생성 실패: " + result.error);
      }
    } catch (error: any) {
      toast.error("오류 발생: " + error.message);
    }
  };

  // 유틸리티 함수
  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string }> = {
      system_admin: { label: "시스템", color: "bg-purple-100 text-purple-700" },
      company_admin: { label: "본사", color: "bg-blue-100 text-blue-700" },
      admin: { label: "관리자", color: "bg-emerald-100 text-emerald-700" },
      staff: { label: "직원", color: "bg-gray-100 text-gray-700" }
    };
    return config[role] || { label: role, color: "bg-gray-100 text-gray-700" };
  };

  // 통계
  const totalCompanies = companies.length;
  const pendingCompanies = companies.filter(c => c.status === 'pending');

  return {
    // 로딩
    isLoading,

    // 데이터
    companies, systemAnnouncements,
    totalCompanies, pendingCompanies, totalGymsCount, totalStaffsCount,

    // 확장 상태
    expandedCompanies, expandedGyms, companyGyms, gymStaffs,
    toggleCompany, toggleGym,

    // 회사 수정
    isEditOpen, setIsEditOpen, editForm, setEditForm, openEdit, handleUpdate, handleStatusChange,

    // 지점 생성
    isCreateGymOpen, setIsCreateGymOpen, selectedCompanyId, gymForm, setGymForm,
    openCreateGym, toggleCategory, handleCreateGym,

    // 지점 수정
    isEditGymOpen, setIsEditGymOpen, editGymForm, setEditGymForm,
    openEditGym, toggleEditCategory, handleUpdateGym, handleDeleteGym,

    // 직원 수정
    isEditStaffOpen, setIsEditStaffOpen, editStaffForm, setEditStaffForm,
    openEditStaff, handleUpdateStaff, handleDeleteStaff,

    // 고객사 생성
    isCreateCompanyOpen, setIsCreateCompanyOpen, createCompanyForm, setCreateCompanyForm,
    openCreateCompany, handleCreateCompany,

    // 공지사항
    isCreateAnnouncementOpen, setIsCreateAnnouncementOpen,
    isEditAnnouncementOpen, setIsEditAnnouncementOpen,
    announcementForm, setAnnouncementForm,
    editAnnouncementForm, setEditAnnouncementForm,
    handleCreateAnnouncement, openEditAnnouncement, handleUpdateAnnouncement,
    handleDeleteAnnouncement, toggleAnnouncementActive,

    // 유틸리티
    getRoleBadge
  };
}
