"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { usePaginatedMembers } from "@/lib/hooks/usePaginatedMembers";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { MembershipProduct } from "@/types/membership";

export interface AddonItem {
  addon_type: string;
  custom_addon_name: string;
  locker_number: string;
  amount: string;
  duration: string;
  duration_type: "months" | "days";
  start_date: string;
  end_date: string;
  method: string;
}

export interface MembershipFormData {
  name: string;
  total_sessions: string;
  start_date: string;
  end_date: string;
  amount: string;
  method: string;
  member_name: string;
  member_phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
  memo: string;
}

export interface MemberEditFormData {
  name: string;
  phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
  memo: string;
}

export interface MembershipEditFormData {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_sessions: string;
  used_sessions: string;
}

const INITIAL_MEMBERSHIP_FORM: MembershipFormData = {
  name: "",
  total_sessions: "",
  start_date: "",
  end_date: "",
  amount: "",
  method: "card",
  member_name: "",
  member_phone: "",
  birth_date: "",
  gender: "",
  exercise_goal: "",
  weight: "",
  body_fat_mass: "",
  skeletal_muscle_mass: "",
  trainer_id: "",
  memo: ""
};

const INITIAL_MEMBER_EDIT_FORM: MemberEditFormData = {
  name: "",
  phone: "",
  birth_date: "",
  gender: "",
  exercise_goal: "",
  weight: "",
  body_fat_mass: "",
  skeletal_muscle_mass: "",
  trainer_id: "",
  memo: ""
};

const INITIAL_MEMBERSHIP_EDIT_FORM: MembershipEditFormData = {
  id: "",
  name: "",
  start_date: "",
  end_date: "",
  total_sessions: "",
  used_sessions: ""
};

interface UseMembersPageDataProps {
  registrationType: string | null;
}

export function useMembersPageData({ registrationType }: UseMembersPageDataProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { membersFilter, isInitialized: filterInitialized } = useAdminFilter();

  // Feature flags
  const usePagination = process.env.NEXT_PUBLIC_USE_PAGINATED_MEMBERS === "true";
  const useTanStackTable = process.env.NEXT_PUBLIC_USE_TANSTACK_TABLE === "true";

  // Tab state
  const [activeTab, setActiveTab] = useState<"members" | "products">("members");

  // Member data
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter context values
  const selectedCompanyId = membersFilter.selectedCompanyId;
  const selectedGymId = membersFilter.selectedGymId;
  const gyms = membersFilter.gyms;
  const userRole = user?.role || "";
  const companyId = selectedCompanyId;
  const gymId = selectedGymId;
  const gymName = gyms.find(g => g.id === selectedGymId)?.name || "We:form";

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSimpleMemberCreateOpen, setIsSimpleMemberCreateOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [isExistingSalesOpen, setIsExistingSalesOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isAddonSalesOpen, setIsAddonSalesOpen] = useState(false);
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [isMemberEditOpen, setIsMemberEditOpen] = useState(false);
  const [isMembershipEditOpen, setIsMembershipEditOpen] = useState(false);
  const [isAddonEditOpen, setIsAddonEditOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  // 트레이너 관련 모달 상태
  const [isTrainerAssignOpen, setIsTrainerAssignOpen] = useState(false);
  const [isTrainerTransferOpen, setIsTrainerTransferOpen] = useState(false);

  // Selected member and forms
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<any[]>([]);
  const [memberAllMemberships, setMemberAllMemberships] = useState<any[]>([]);
  const [memberActivityLogs, setMemberActivityLogs] = useState<any[]>([]);
  const [memberTrainers, setMemberTrainers] = useState<any[]>([]);
  const [transferMember, setTransferMember] = useState<any>(null);
  const [transferMembership, setTransferMembership] = useState<any>(null);
  // 트레이너 인계 관련 상태
  const [trainerTransferTarget, setTrainerTransferTarget] = useState<any>(null);
  const [trainerTransferCategory, setTrainerTransferCategory] = useState<string>("");
  const [isPtTransfer, setIsPtTransfer] = useState(false);
  const [membershipEditForm, setMembershipEditForm] = useState<MembershipEditFormData>(INITIAL_MEMBERSHIP_EDIT_FORM);
  const [memberEditForm, setMemberEditForm] = useState<MemberEditFormData>(INITIAL_MEMBER_EDIT_FORM);
  const [selectedAddon, setSelectedAddon] = useState<any>(null);
  const [membershipForm, setMembershipForm] = useState<MembershipFormData>(INITIAL_MEMBERSHIP_FORM);
  const [membershipModalAddons, setMembershipModalAddons] = useState<AddonItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Staff and products
  const [staffList, setStaffList] = useState<any[]>([]);
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>("");
  const [products, setProducts] = useState<MembershipProduct[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Supabase client
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Paginated data hook
  const paginatedData = usePaginatedMembers({
    gymId: selectedGymId,
    companyId: selectedCompanyId,
    trainerId: userRole === "staff" ? myStaffId : null,
    search: debouncedSearch,
    status: statusFilter,
    page: currentPage,
    enabled: usePagination,
  });

  // Fetch staff list
  const fetchStaffList = useCallback(async (targetGymId: string | null) => {
    if (!targetGymId) return;
    const { data } = await supabase
      .from("staffs")
      .select("id, name, job_title")
      .eq("gym_id", targetGymId)
      .eq("employment_status", "재직")
      .order("name");
    if (data) setStaffList(data);
  }, [supabase]);

  // Fetch products (API를 통해 조회하여 RLS 우회)
  const fetchProducts = useCallback(async (targetGymId: string | null) => {
    if (!targetGymId) return;
    try {
      const response = await fetch(`/api/admin/products?gym_id=${targetGymId}`);
      const result = await response.json();
      if (response.ok && result.data) {
        const activeProducts = result.data.filter((p: any) => p.is_active === true);
        setProducts(activeProducts);
      }
    } catch (error) {
      // 에러 무시
    }
  }, []);

  // Fetch members
  const fetchMembers = useCallback(async (targetGymId: string | null, targetCompanyId: string | null, role: string, staffId: string) => {
    if (!targetGymId || !targetCompanyId) return;

    let query = supabase
      .from("members")
      .select(`
        *,
        trainer:staffs!trainer_id (
          id, name
        ),
        member_memberships!left (
          id, name, membership_type, total_sessions, used_sessions, start_date, end_date, status
        )
      `)
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId);

    if (role === "staff") {
      query = query.eq("trainer_id", staffId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) return;

    const today = new Date().toISOString().split('T')[0];

    const membersWithMemberships = (data || []).map((member: any) => {
      const memberships = member.member_memberships || [];
      const activeMembership = memberships.find((m: any) => m.status === 'active');

      let newStatus = member.status;
      let shouldUpdate = false;

      // 홀딩(paused) 상태는 유지 - 자동으로 expired로 변경하지 않음
      if (member.status !== 'paused') {
        if (!activeMembership) {
          if (member.status !== 'expired') {
            newStatus = 'expired';
            shouldUpdate = true;
          }
        } else if (activeMembership.end_date && activeMembership.end_date < today) {
          if (member.status !== 'expired') {
            newStatus = 'expired';
            shouldUpdate = true;
          }
        }
      }

      if (shouldUpdate) {
        supabase.from('members').update({ status: 'expired' }).eq('id', member.id);
      }

      return { ...member, status: newStatus, activeMembership, totalMemberships: memberships.length };
    });

    setMembers(membersWithMemberships);
  }, [supabase]);

  // Filter members (client-side)
  const filterMembers = useCallback(() => {
    let filtered = [...members];
    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(query) || m.phone?.includes(query)
      );
    }
    setFilteredMembers(filtered);
  }, [members, searchQuery, statusFilter]);

  // Effects
  useEffect(() => {
    if (authLoading || !filterInitialized || !user) return;
    setMyStaffId(user.id);
    console.log("[Members] 회원 조회 시작:", {
      selectedGymId,
      selectedCompanyId,
      userGymId: user.gym_id,
      userCompanyId: user.company_id
    });
    if (selectedGymId && selectedCompanyId) {
      fetchMembers(selectedGymId, selectedCompanyId, userRole, user.id);
      fetchStaffList(selectedGymId);
      fetchProducts(selectedGymId);
    }
  }, [authLoading, filterInitialized, selectedGymId, selectedCompanyId, user, userRole, fetchMembers, fetchStaffList, fetchProducts]);

  useEffect(() => {
    if (!usePagination) filterMembers();
  }, [members, searchQuery, statusFilter, usePagination, filterMembers]);

  useEffect(() => {
    if (usePagination && currentPage !== 1) setCurrentPage(1);
  }, [debouncedSearch, statusFilter, usePagination]);

  useEffect(() => {
    if (registrationType === 'new' && members.length > 0) {
      setIsCreateOpen(true);
    } else if (registrationType === 'existing' && members.length > 0) {
      setIsExistingSalesOpen(true);
    }
  }, [registrationType, members]);

  // Addon helpers
  const createEmptyAddon = (): AddonItem => ({
    addon_type: "",
    custom_addon_name: "",
    locker_number: "",
    amount: "",
    duration: "",
    duration_type: "months",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    method: "card"
  });

  const addMembershipModalAddon = () => setMembershipModalAddons([...membershipModalAddons, createEmptyAddon()]);
  const removeMembershipModalAddon = (index: number) => setMembershipModalAddons(membershipModalAddons.filter((_, i) => i !== index));

  const updateMembershipModalAddon = (index: number, field: keyof AddonItem, value: string) => {
    const updated = [...membershipModalAddons];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "duration" || field === "duration_type" || field === "start_date") {
      const addon = updated[index];
      if (addon.duration && addon.start_date) {
        const num = parseInt(addon.duration);
        const startDate = new Date(addon.start_date);
        const endDate = new Date(startDate);
        if (addon.duration_type === "months") {
          endDate.setMonth(endDate.getMonth() + num);
          endDate.setDate(endDate.getDate() - 1);
        } else {
          endDate.setDate(endDate.getDate() + num - 1);
        }
        updated[index].end_date = endDate.toISOString().split('T')[0];
      }
    }
    setMembershipModalAddons(updated);
  };

  // Modal openers
  const openMembershipModal = (member: any) => {
    setSelectedMember(member);
    setSelectedProductId("");
    setMembershipForm({
      ...INITIAL_MEMBERSHIP_FORM,
      start_date: new Date().toISOString().split('T')[0],
      member_name: member.name || "",
      member_phone: member.phone || "",
      birth_date: member.birth_date || "",
      gender: member.gender || "",
      exercise_goal: member.exercise_goal || "",
      weight: member.weight?.toString() || "",
      body_fat_mass: member.body_fat_mass?.toString() || "",
      skeletal_muscle_mass: member.skeletal_muscle_mass?.toString() || "",
      trainer_id: member.trainer_id || "",
      memo: member.memo || ""
    });
    setIsMembershipOpen(true);
  };

  const openMemberEditModal = (member: any) => {
    setSelectedMember(member);
    setMemberEditForm({
      name: member.name || "",
      phone: member.phone || "",
      birth_date: member.birth_date || "",
      gender: member.gender || "",
      exercise_goal: member.exercise_goal || "",
      weight: member.weight?.toString() || "",
      body_fat_mass: member.body_fat_mass?.toString() || "",
      skeletal_muscle_mass: member.skeletal_muscle_mass?.toString() || "",
      trainer_id: member.trainer_id || "",
      memo: member.memo || ""
    });
    setIsMemberEditOpen(true);
  };

  const openMembershipEditModal = (member: any, membership?: any) => {
    setSelectedMember(member);
    const targetMembership = membership || member.activeMembership;
    if (targetMembership) {
      setMembershipEditForm({
        id: targetMembership.id || "",
        name: targetMembership.name || "",
        start_date: targetMembership.start_date || "",
        end_date: targetMembership.end_date || "",
        total_sessions: targetMembership.total_sessions?.toString() || "",
        used_sessions: targetMembership.used_sessions?.toString() || ""
      });
    }
    setIsMembershipEditOpen(true);
  };

  const fetchMemberTrainers = useCallback(async (memberId: string) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}/trainers`);
      const result = await response.json();
      if (response.ok) {
        setMemberTrainers(result.trainers || []);
      } else {
        setMemberTrainers([]);
      }
    } catch (e) {
      setMemberTrainers([]);
    }
  }, []);

  const openMemberDetailModal = async (member: any) => {
    setSelectedMember(member);
    const memberGymId = member.gym_id || gymId;

    try {
      const response = await fetch(`/api/admin/members/${member.id}/detail?gym_id=${memberGymId}`);
      const result = await response.json();

      if (!response.ok) {
        setMemberAllMemberships(member.member_memberships || []);
        setMemberPaymentHistory([]);
        setMemberActivityLogs([]);
      } else {
        const membershipsWithCreatedAt = (result.memberships || []).map((m: any) => ({
          ...m,
          created_at: m.created_at || new Date().toISOString()
        }));
        setMemberAllMemberships(membershipsWithCreatedAt);
        setMemberPaymentHistory(result.payments || []);
        setMemberActivityLogs(result.activityLogs || []);
      }
    } catch (e) {
      setMemberAllMemberships(member.member_memberships || []);
      setMemberPaymentHistory([]);
      setMemberActivityLogs([]);
    }

    // 트레이너 정보 조회
    await fetchMemberTrainers(member.id);

    setIsMemberDetailOpen(true);
  };

  const openAddonEditModal = (member: any, addon: any) => {
    setSelectedMember(member);
    setSelectedAddon(addon);
    setIsAddonEditOpen(true);
  };

  const openTransferModal = (member: any, membership?: any) => {
    setTransferMember(member);
    setTransferMembership(membership || member.activeMembership || null);
    setIsTransferModalOpen(true);
  };

  // 트레이너 모달 핸들러
  const openTrainerAssignModal = () => {
    setIsTrainerAssignOpen(true);
  };

  const openTrainerTransferModal = (trainer: any | null, category: string, isPt: boolean) => {
    setTrainerTransferTarget(trainer);
    setTrainerTransferCategory(category);
    setIsPtTransfer(isPt);
    setIsTrainerTransferOpen(true);
  };

  const handleAssignTrainer = async (data: { category: string; trainer_id: string }) => {
    if (!selectedMember) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/members/${selectedMember.id}/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "트레이너 배정에 실패했습니다.");
        return;
      }
      // 트레이너 목록 새로고침
      await fetchMemberTrainers(selectedMember.id);
      setIsTrainerAssignOpen(false);
    } catch (e: any) {
      alert(e.message || "트레이너 배정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferTrainer = async (data: { to_trainer_id: string; reason: string; reason_detail?: string }) => {
    if (!selectedMember) return;
    setIsLoading(true);
    try {
      const body: any = {
        ...data,
        is_pt_transfer: isPtTransfer
      };

      if (isPtTransfer) {
        body.from_trainer_id = selectedMember.trainer_id;
      } else if (trainerTransferTarget) {
        body.member_trainer_id = trainerTransferTarget.id;
        body.category = trainerTransferCategory;
        body.from_trainer_id = trainerTransferTarget.trainer_id;
      }

      const response = await fetch(`/api/admin/members/${selectedMember.id}/trainers/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "트레이너 인계에 실패했습니다.");
        return;
      }

      // 회원 정보 새로고침 (PT 인계 시)
      if (isPtTransfer) {
        refreshMembers();
      }
      // 트레이너 목록 새로고침
      await fetchMemberTrainers(selectedMember.id);
      // 활동 로그 새로고침
      try {
        const detailResponse = await fetch(`/api/admin/members/${selectedMember.id}/detail?gym_id=${selectedMember.gym_id || gymId}`);
        const detailResult = await detailResponse.json();
        if (detailResponse.ok) {
          setMemberActivityLogs(detailResult.activityLogs || []);
        }
      } catch (e) { /* ignore */ }

      setIsTrainerTransferOpen(false);
    } catch (e: any) {
      alert(e.message || "트레이너 인계 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!selectedMember) return;
    if (!confirm("해당 트레이너 배정을 해제하시겠습니까?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/members/${selectedMember.id}/trainers?trainer_id=${trainerId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "트레이너 배정 해제에 실패했습니다.");
        return;
      }
      // 트레이너 목록 새로고침
      await fetchMemberTrainers(selectedMember.id);
    } catch (e: any) {
      alert(e.message || "트레이너 배정 해제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 권한 체크
  const isAdmin = useMemo(() => {
    return ["system_admin", "company_admin", "admin"].includes(userRole);
  }, [userRole]);

  // Sort handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Display members with sorting
  let displayMembers = usePagination ? paginatedData.members : filteredMembers;
  displayMembers = [...displayMembers].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case "name":
        aValue = a.name || "";
        bValue = b.name || "";
        break;
      case "created_at":
        aValue = new Date(a.created_at || 0).getTime();
        bValue = new Date(b.created_at || 0).getTime();
        break;
      case "membership_start_date":
        aValue = a.activeMembership?.start_date ? new Date(a.activeMembership.start_date).getTime() : 0;
        bValue = b.activeMembership?.start_date ? new Date(b.activeMembership.start_date).getTime() : 0;
        break;
      case "membership_end_date":
        aValue = a.activeMembership?.end_date ? new Date(a.activeMembership.end_date).getTime() : 0;
        bValue = b.activeMembership?.end_date ? new Date(b.activeMembership.end_date).getTime() : 0;
        break;
      default:
        return 0;
    }
    if (typeof aValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue);
    }
    return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });

  const isDataLoading = usePagination ? paginatedData.isLoading : isLoading;

  const refreshMembers = useCallback(() => {
    if (usePagination) {
      paginatedData.mutate();
    } else if (gymId && companyId && myRole && myStaffId) {
      fetchMembers(gymId, companyId, myRole, myStaffId);
    }
  }, [usePagination, paginatedData, gymId, companyId, myRole, myStaffId, fetchMembers]);

  const refreshProducts = useCallback(() => {
    if (gymId) {
      fetchProducts(gymId);
    }
  }, [gymId, fetchProducts]);

  return {
    // Feature flags
    usePagination, useTanStackTable,
    // Tab
    activeTab, setActiveTab,
    // Filter data
    gymId, companyId, gymName, userRole,
    // Search and filter
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    currentPage, setCurrentPage,
    sortBy, sortOrder, handleSort,
    // Members data
    members, displayMembers, isDataLoading,
    paginatedData,
    // Staff and products
    staffList, myStaffId, myRole, products, selectedProductId, setSelectedProductId,
    // Modal states
    isCreateOpen, setIsCreateOpen,
    isSimpleMemberCreateOpen, setIsSimpleMemberCreateOpen,
    isMembershipOpen, setIsMembershipOpen,
    isExistingSalesOpen, setIsExistingSalesOpen,
    isExcelImportOpen, setIsExcelImportOpen,
    isAddonSalesOpen, setIsAddonSalesOpen,
    isMemberDetailOpen, setIsMemberDetailOpen,
    isMemberEditOpen, setIsMemberEditOpen,
    isMembershipEditOpen, setIsMembershipEditOpen,
    isAddonEditOpen, setIsAddonEditOpen,
    isTransferModalOpen, setIsTransferModalOpen,
    // 트레이너 모달 상태
    isTrainerAssignOpen, setIsTrainerAssignOpen,
    isTrainerTransferOpen, setIsTrainerTransferOpen,
    // Selected member and forms
    selectedMember, memberPaymentHistory, memberAllMemberships, memberActivityLogs,
    memberTrainers, // 종목별 트레이너 목록
    selectedAddon, transferMember, transferMembership,
    // 트레이너 인계 관련 상태
    trainerTransferTarget, trainerTransferCategory, isPtTransfer,
    membershipEditForm, setMembershipEditForm,
    memberEditForm, setMemberEditForm,
    membershipForm, setMembershipForm,
    membershipModalAddons,
    addMembershipModalAddon, removeMembershipModalAddon, updateMembershipModalAddon,
    // Modal openers
    openMembershipModal, openMemberEditModal, openMembershipEditModal, openMemberDetailModal, openAddonEditModal, openTransferModal,
    // 트레이너 모달 핸들러
    openTrainerAssignModal, openTrainerTransferModal,
    handleAssignTrainer, handleTransferTrainer, handleDeleteTrainer,
    isAdmin, // 관리자 권한 여부
    // Refresh and utilities
    refreshMembers, refreshProducts, fetchMembers, setIsLoading,
    supabase
  };
}
