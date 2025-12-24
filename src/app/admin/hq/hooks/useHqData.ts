"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { toast } from "@/lib/toast";

// 카테고리 목록 정의
export const CATEGORY_OPTIONS = ["헬스", "PT", "필라테스", "골프", "GX", "요가"];

// Types
export interface Stats {
  totalGyms: number;
  totalStaffs: number;
  totalMembers: number;
  newMembersThisMonth: number;
}

export interface GymStats {
  id: string;
  name: string;
  status: string;
  staffCount: number;
  memberCount: number;
  newMembersCount: number;
}

export interface GymFormData {
  gymName: string;
  managerId: string;
  category: string[];
  size: string;
  open_date: string;
  memo: string;
  status: string;
}

export interface StaffEditForm {
  job_title: string;
  role: string;
  employment_status: string;
}

export interface BepForm {
  fc_bep: number;
  pt_bep: number;
}

export interface EventForm {
  title: string;
  description: string;
  event_type: string;
  gym_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  target_audience: string;
  color: string;
  is_active: boolean;
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  activityType: string;
  gymName: string;
  jobTitle: string;
  roleText: string;
  created_at: string;
  badgeColor: string;
}

const initialFormData: GymFormData = {
  gymName: "",
  managerId: "",
  category: [],
  size: "",
  open_date: "",
  memo: "",
  status: "active"
};

const initialEventForm: EventForm = {
  title: "",
  description: "",
  event_type: "general",
  gym_id: "all",
  event_date: new Date().toISOString().split('T')[0],
  start_time: "",
  end_time: "",
  location: "",
  target_audience: "all",
  color: "blue",
  is_active: true
};

export function useHqData() {
  // 기본 데이터 상태
  const [gyms, setGyms] = useState<any[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<any[]>([]);
  const [allStaffs, setAllStaffs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  // 회사 정보
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("");

  // system_admin용 회사 목록
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // 통계 데이터
  const [stats, setStats] = useState<Stats>({
    totalGyms: 0,
    totalStaffs: 0,
    totalMembers: 0,
    newMembersThisMonth: 0
  });
  const [gymStats, setGymStats] = useState<GymStats[]>([]);

  // 발령 관련
  const [selectedGym, setSelectedGym] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // 지점 필터
  const [selectedGymFilter, setSelectedGymFilter] = useState<string>("all");

  // 지점 상세보기 모달
  const [selectedGymDetail, setSelectedGymDetail] = useState<any | null>(null);
  const [isGymDetailOpen, setIsGymDetailOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("current");
  const [isEditingBep, setIsEditingBep] = useState(false);
  const [bepForm, setBepForm] = useState<BepForm>({ fc_bep: 75000000, pt_bep: 100000000 });

  // 직원 정보 수정 모달
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isStaffEditOpen, setIsStaffEditOpen] = useState(false);
  const [staffEditForm, setStaffEditForm] = useState<StaffEditForm>({
    job_title: "",
    role: "",
    employment_status: ""
  });

  // 회사 일정 & 행사 관리
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>(initialEventForm);

  // 지점 생성/수정 폼
  const [formData, setFormData] = useState<GymFormData>(initialFormData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // AuthContext에서 사용자 정보 가져오기
  const { user: authUser, isLoading: authLoading, companyName: authCompanyName } = useAuth();
  const { companies: filterCompanies, selectedCompanyId: filterSelectedCompanyId } = useAdminFilter();

  // 유틸리티 함수
  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes("필라테스")) return "bg-pink-100 text-pink-700 border-pink-200";
    if (cat.includes("골프")) return "bg-green-100 text-green-700 border-green-200";
    if (cat.includes("PT")) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  // 초기화: AuthContext가 로드되면 데이터 가져오기
  useEffect(() => {
    if (authLoading || !authUser) return;

    setCompanyId(authUser.company_id);
    setMyRole(authUser.role);
    setCompanyName(authCompanyName || "");

    // system_admin인 경우 회사 목록 설정
    if (authUser.role === 'system_admin' && filterCompanies.length > 0) {
      setCompanies(filterCompanies);
      setSelectedCompanyId(filterSelectedCompanyId || authUser.company_id || "");
    }

    // 데이터 조회
    if (authUser.company_id) {
      fetchData(authUser.company_id);
    }
  }, [authLoading, authUser, authCompanyName, filterCompanies, filterSelectedCompanyId]);

  // system_admin이 회사를 변경했을 때 데이터 다시 가져오기
  useEffect(() => {
    if (selectedCompanyId && myRole === 'system_admin') {
      fetchData(selectedCompanyId);
      // 선택된 회사의 이름 업데이트
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      if (selectedCompany) {
        setCompanyName(selectedCompany.name);
      }
      // 지점 필터를 '전체'로 초기화
      setSelectedGymFilter("all");
    }
  }, [selectedCompanyId]);

  const fetchData = async (targetCompanyId: string | null) => {
    if (!targetCompanyId) return;

    try {
      const response = await fetch(`/api/admin/hq/data?company_id=${targetCompanyId}`);
      const result = await response.json();

      if (!result.success) {
        console.error('❌ 데이터 조회 오류:', result.error);
        return;
      }

      const { gyms: gymData, allStaffs: allData, pendingStaffs: pendingData, members: memberData, payments: paymentData, events: eventsData, stats: statsData } = result;

      // 지점 목록 설정
      if (gymData) setGyms(gymData);

      // 대기 직원 설정
      if (pendingData) setPendingStaffs(pendingData);

      // 전체 직원 설정
      if (allData) setAllStaffs(allData);

      // 회원 데이터 설정 (결제 정보 연결)
      if (memberData && paymentData) {
        const membersWithPayments = memberData.map((member: any) => {
          const payments = paymentData.filter((p: any) => p.member_id === member.id);
          return { ...member, payments };
        });
        setMembers(membersWithPayments);
      } else if (memberData) {
        setMembers(memberData);
      }

      // 최근 활동 데이터 생성 (최근 30일 이내 직원 활동만)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activities: Activity[] = [];
      const recentStaffs = allData?.filter((s: any) =>
        s.created_at && new Date(s.created_at) >= thirtyDaysAgo
      ) || [];

      recentStaffs.forEach((staff: any) => {
        const gymName = staff.gyms?.name || '미배정';
        const isManualAdd = !staff.user_id;
        const activityType = isManualAdd ? '수동 추가' : '자체 가입';
        const badgeColor = isManualAdd ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';
        const jobTitle = staff.job_title || '-';
        const roleText = staff.role === 'admin' ? '관리자' : staff.role === 'company_admin' ? '본사 관리자' : '직원';

        activities.push({
          id: `staff-${staff.id}`,
          name: staff.name,
          type: 'staff',
          activityType,
          gymName,
          jobTitle,
          roleText,
          created_at: staff.created_at,
          badgeColor
        });
      });

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivities(activities.slice(0, 15));

      // 통계 설정
      setStats(statsData);

      // 지점별 통계
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const gymStatsData: GymStats[] = gymData?.map((gym: any) => {
        const staffCount = allData?.filter((s: any) => s.gym_id === gym.id).length || 0;
        const memberCount = memberData?.filter((m: any) => m.gym_id === gym.id).length || 0;
        const newMembersCount = memberData?.filter((m: any) => {
          if (m.gym_id !== gym.id) return false;
          const createdAt = new Date(m.created_at);
          return createdAt >= firstDayOfMonth;
        }).length || 0;

        return {
          id: gym.id,
          name: gym.name,
          status: gym.status,
          staffCount,
          memberCount,
          newMembersCount
        };
      }) || [];

      setGymStats(gymStatsData);

      // 회사 일정 & 행사 설정
      if (eventsData) setCompanyEvents(eventsData);

    } catch (error) {
      console.error('❌ 데이터 조회 오류:', error);
    }
  };

  // 발령 처리
  const handleAssign = async (staffId: string) => {
    if (!selectedGym || !selectedRole) return toast.warning("지점과 권한을 선택해주세요.");
    if (!confirm("발령 보내시겠습니까?")) return;

    try {
      const response = await fetch("/api/admin/hq/assign-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          gymId: selectedGym,
          role: selectedRole
        })
      });
      const result = await response.json();

      if (result.success) {
        toast.success("발령 완료!");
        fetchData(companyId || selectedCompanyId);
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // 회사 일정 & 행사 관리 함수들
  const openEventModal = (event: any = null) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        gym_id: event.gym_id || "all",
        event_date: event.event_date,
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        location: event.location || "",
        target_audience: event.target_audience,
        color: event.color,
        is_active: event.is_active
      });
    } else {
      setEditingEvent(null);
      setEventForm(initialEventForm);
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) {
      return toast.warning("행사 제목을 입력해주세요.");
    }

    setIsLoading(true);
    try {
      const targetCompanyId = companyId || selectedCompanyId;
      if (!targetCompanyId) {
        throw new Error("회사 정보를 찾을 수 없습니다.");
      }

      const eventData = {
        company_id: targetCompanyId,
        gym_id: eventForm.gym_id === "all" ? null : eventForm.gym_id,
        title: eventForm.title,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        event_date: eventForm.event_date,
        start_time: eventForm.start_time || null,
        end_time: eventForm.end_time || null,
        location: eventForm.location || null,
        target_audience: eventForm.target_audience,
        color: eventForm.color,
        is_active: eventForm.is_active
      };

      const response = await fetch("/api/admin/hq/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: editingEvent?.id || null,
          eventData
        })
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      toast.success(editingEvent ? "회사 일정 & 행사가 수정되었습니다." : "회사 일정 & 행사가 등록되었습니다.");

      setIsEventModalOpen(false);
      fetchData(targetCompanyId);
    } catch (error: any) {
      toast.error("오류: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/admin/hq/events?id=${id}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      toast.success("회사 일정 & 행사가 삭제되었습니다.");
      const targetCompanyId = companyId || selectedCompanyId;
      fetchData(targetCompanyId);
    } catch (error: any) {
      toast.error("오류: " + error.message);
    }
  };

  const handleToggleEventActive = async (event: any) => {
    try {
      const response = await fetch("/api/admin/hq/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          isActive: !event.is_active
        })
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      const targetCompanyId = companyId || selectedCompanyId;
      fetchData(targetCompanyId);
    } catch (error: any) {
      toast.error("오류: " + error.message);
    }
  };

  // 카테고리 토글
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

  // 지점 생성
  const handleCreateBranch = async () => {
    if (!formData.gymName || !formData.managerId) return toast.warning("필수 정보(지점명, 지점장)를 입력해주세요.");

    setIsLoading(true);
    try {
      const targetCompanyId = companyId || selectedCompanyId;
      const res = await fetch("/api/admin/create-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category: formData.category.join(", "),
          company_id: targetCompanyId
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "지점 생성 실패");
      toast.success("생성 완료!");
      setIsCreateOpen(false);
      setFormData(initialFormData);
      fetchData(targetCompanyId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 지점 수정
  const handleUpdateGym = async () => {
    if (!editTargetId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/update-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          gymId: editTargetId,
          newManagerId: formData.managerId,
          category: formData.category.join(", ")
        })
      });
      if (!res.ok) throw new Error("실패");
      toast.success("수정 완료!");
      setIsEditOpen(false);
      setEditTargetId(null);
      setFormData(initialFormData);
      fetchData(companyId || selectedCompanyId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 지점 수정 모달 열기
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

  // 지점 삭제
  const handleDeleteGym = async (gymId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`/api/admin/hq/delete-gym?id=${gymId}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);
      fetchData(companyId || selectedCompanyId);
    } catch (error: any) {
      toast.error("오류: " + error.message);
    }
  };

  // 직원 수정 모달 열기
  const openStaffEditModal = (staff: any) => {
    setEditingStaff(staff);
    setStaffEditForm({
      job_title: staff.job_title || "",
      role: staff.role || "staff",
      employment_status: staff.employment_status || "재직"
    });
    setIsStaffEditOpen(true);
  };

  // 직원 정보 수정
  const handleStaffUpdate = async () => {
    if (!editingStaff) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/hq/update-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: editingStaff.id,
          jobTitle: staffEditForm.job_title,
          role: staffEditForm.role,
          employmentStatus: staffEditForm.employment_status
        })
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);
      toast.success("직원 정보가 수정되었습니다.");
      setIsStaffEditOpen(false);
      fetchData(companyId || selectedCompanyId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 지점 상세 모달 열기
  const openGymDetailModal = (gym: any) => {
    const gymStat = gymStats.find(g => g.id === gym.id);
    setSelectedGymDetail({ ...gym, stats: gymStat });
    setBepForm({
      fc_bep: gym.fc_bep || 75000000,
      pt_bep: gym.pt_bep || 100000000
    });
    setSelectedMonth("current");
    setIsEditingBep(false);
    setIsGymDetailOpen(true);
  };

  // BEP 업데이트
  const handleUpdateBep = async () => {
    if (!selectedGymDetail) return;

    try {
      const res = await fetch("/api/admin/update-gym-bep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gym_id: selectedGymDetail.id,
          fc_bep: bepForm.fc_bep,
          pt_bep: bepForm.pt_bep
        })
      });

      if (!res.ok) throw new Error("BEP 업데이트 실패");

      toast.success("BEP가 업데이트되었습니다!");
      setIsEditingBep(false);
      fetchData(companyId || selectedCompanyId);

      setSelectedGymDetail({
        ...selectedGymDetail,
        fc_bep: bepForm.fc_bep,
        pt_bep: bepForm.pt_bep
      });
    } catch (error: any) {
      toast.error("오류: " + error.message);
    }
  };

  // 필터링된 데이터
  const filteredStats = selectedGymFilter === "all" ? stats : (() => {
    const selectedGymData = gyms.find(g => g.id === selectedGymFilter);
    if (!selectedGymData) return stats;

    const staffCount = allStaffs.filter(s => s.gym_id === selectedGymFilter).length;
    const memberCount = members.filter(m => m.gym_id === selectedGymFilter).length;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newMembersCount = members.filter(m => {
      if (m.gym_id !== selectedGymFilter) return false;
      const createdAt = new Date(m.created_at);
      return createdAt >= firstDayOfMonth;
    }).length;

    return {
      totalGyms: 1,
      totalStaffs: staffCount,
      totalMembers: memberCount,
      newMembersThisMonth: newMembersCount
    };
  })();

  const filteredGymStats = selectedGymFilter === "all"
    ? gymStats
    : gymStats.filter(g => g.id === selectedGymFilter);

  const filteredMembers = selectedGymFilter === "all"
    ? members
    : members.filter(m => m.gym_id === selectedGymFilter);

  return {
    // 기본 데이터
    gyms,
    pendingStaffs,
    allStaffs,
    members,
    recentActivities,

    // 회사 정보
    companyId,
    companyName,
    myRole,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,

    // 통계
    stats,
    gymStats,
    filteredStats,
    filteredGymStats,
    filteredMembers,

    // 발령
    selectedGym,
    setSelectedGym,
    selectedRole,
    setSelectedRole,
    handleAssign,

    // 필터
    selectedGymFilter,
    setSelectedGymFilter,

    // 지점 상세
    selectedGymDetail,
    setSelectedGymDetail,
    isGymDetailOpen,
    setIsGymDetailOpen,
    selectedMonth,
    setSelectedMonth,
    isEditingBep,
    setIsEditingBep,
    bepForm,
    setBepForm,
    openGymDetailModal,
    handleUpdateBep,

    // 직원 수정
    editingStaff,
    isStaffEditOpen,
    setIsStaffEditOpen,
    staffEditForm,
    setStaffEditForm,
    openStaffEditModal,
    handleStaffUpdate,

    // 이벤트
    companyEvents,
    isEventModalOpen,
    setIsEventModalOpen,
    editingEvent,
    eventForm,
    setEventForm,
    openEventModal,
    handleSaveEvent,
    handleDeleteEvent,
    handleToggleEventActive,

    // 지점 CRUD
    formData,
    setFormData,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    editTargetId,
    isLoading,
    toggleCategory,
    handleCreateBranch,
    handleUpdateGym,
    openEditModal,
    handleDeleteGym,

    // 유틸리티
    formatDate,
    getCategoryColor,
    initialFormData
  };
}
