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
  membership_type: string;
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
  membership_type: "",
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

  // Selected member and forms
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<any[]>([]);
  const [membershipEditForm, setMembershipEditForm] = useState<MembershipEditFormData>(INITIAL_MEMBERSHIP_EDIT_FORM);
  const [memberEditForm, setMemberEditForm] = useState<MemberEditFormData>(INITIAL_MEMBER_EDIT_FORM);
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

  // Fetch products
  const fetchProducts = useCallback(async (targetGymId: string | null) => {
    if (!targetGymId) return;
    const { data } = await supabase
      .from("membership_products")
      .select("*")
      .eq("gym_id", targetGymId)
      .eq("is_active", true)
      .order("display_order")
      .order("name");
    if (data) setProducts(data);
  }, [supabase]);

  // Fetch members
  const fetchMembers = useCallback(async (targetGymId: string | null, targetCompanyId: string | null, role: string, staffId: string) => {
    if (!targetGymId || !targetCompanyId) return;

    let query = supabase
      .from("members")
      .select(`
        *,
        member_memberships!left (
          id, name, total_sessions, used_sessions, start_date, end_date, status
        )
      `)
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId);

    if (role === "staff") {
      query = query.eq("trainer_id", staffId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("회원 조회 에러:", error.message);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const membersWithMemberships = (data || []).map((member: any) => {
      const memberships = member.member_memberships || [];
      const activeMembership = memberships.find((m: any) => m.status === 'active');

      let newStatus = member.status;
      let shouldUpdate = false;

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
    if (authLoading || !filterInitialized) return;
    if (!user) return;
    setMyStaffId(user.id);
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

  const openMembershipEditModal = (member: any) => {
    setSelectedMember(member);
    const membership = member.activeMembership;
    if (membership) {
      setMembershipEditForm({
        id: membership.id || "",
        name: membership.name || "",
        membership_type: membership.membership_type || "",
        start_date: membership.start_date || "",
        end_date: membership.end_date || "",
        total_sessions: membership.total_sessions?.toString() || "",
        used_sessions: membership.used_sessions?.toString() || ""
      });
    }
    setIsMembershipEditOpen(true);
  };

  const openMemberDetailModal = async (member: any) => {
    setSelectedMember(member);
    try {
      const { data: payments, error } = await supabase
        .from("member_payments")
        .select(`id, amount, method, memo, created_at, member_memberships (name, membership_type)`)
        .eq("member_id", member.id)
        .order("created_at", { ascending: false });
      setMemberPaymentHistory(error ? [] : payments || []);
    } catch {
      setMemberPaymentHistory([]);
    }
    setIsMemberDetailOpen(true);
  };

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
    // Selected member and forms
    selectedMember, memberPaymentHistory,
    membershipEditForm, setMembershipEditForm,
    memberEditForm, setMemberEditForm,
    membershipForm, setMembershipForm,
    membershipModalAddons,
    addMembershipModalAddon, removeMembershipModalAddon, updateMembershipModalAddon,
    // Modal openers
    openMembershipModal, openMemberEditModal, openMembershipEditModal, openMemberDetailModal,
    // Refresh and utilities
    refreshMembers, fetchMembers, setIsLoading,
    supabase
  };
}
