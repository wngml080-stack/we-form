"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, CreditCard, Upload, Eye, ArrowUpDown } from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { usePaginatedMembers } from "@/lib/hooks/usePaginatedMembers";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { MembersTable } from "./components/MembersTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductsTab } from "./components/ProductsTab";
import { MembershipProduct } from "@/types/membership";
import { SimpleMemberCreateModal } from "./components/modals/SimpleMemberCreateModal";
import { AddonSalesModal } from "./components/modals/AddonSalesModal";
import { ExcelImportModal } from "./components/modals/ExcelImportModal";
import { ExistingSalesModal } from "./components/modals/ExistingSalesModal";
import { NewMemberCreateModal } from "./components/modals/NewMemberCreateModal";
import { MemberDetailModal } from "./components/modals/MemberDetailModal";
import { MemberEditModal } from "./components/modals/MemberEditModal";
import { MembershipEditModal } from "./components/modals/MembershipEditModal";
import { AddMembershipModal } from "./components/modals/AddMembershipModal";
import { useMemberOperations, getStatusBadge } from "./hooks/useMemberOperations";

// 동적 렌더링 강제 (useSearchParams 사용)
export const dynamic = 'force-dynamic';

// 실제 컨텐츠 컴포넌트 (useSearchParams 사용)
function AdminMembersPageContent() {
  const searchParams = useSearchParams();
  const registrationType = searchParams.get('type'); // 'new' or 'existing'

  // Auth & Filter Context
  const { user, isLoading: authLoading } = useAuth();
  const { membersFilter, isInitialized: filterInitialized } = useAdminFilter();

  // Feature flags
  const usePagination = process.env.NEXT_PUBLIC_USE_PAGINATED_MEMBERS === "true";
  const useTanStackTable = process.env.NEXT_PUBLIC_USE_TANSTACK_TABLE === "true";

  const [activeTab, setActiveTab] = useState<"members" | "products">("members");
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  // 정렬 상태 관리
  const [sortBy, setSortBy] = useState<string>("created_at"); // 정렬 기준
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // 정렬 순서

  // 검색 디바운싱 (300ms 지연)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // 현재 선택된 필터 정보
  const selectedCompanyId = membersFilter.selectedCompanyId;
  const selectedGymId = membersFilter.selectedGymId;
  const gyms = membersFilter.gyms;
  const userRole = user?.role || "";

  // 편의를 위한 별칭
  const companyId = selectedCompanyId;
  const gymId = selectedGymId;

  // 현재 선택된 지점명
  const gymName = gyms.find(g => g.id === selectedGymId)?.name || "We:form";

  // 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSimpleMemberCreateOpen, setIsSimpleMemberCreateOpen] = useState(false); // 간단한 회원 등록 모달 (매출 없이)
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [isExistingSalesOpen, setIsExistingSalesOpen] = useState(false); // 기존회원 매출등록 모달
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false); // Excel 가져오기 모달
  const [isAddonSalesOpen, setIsAddonSalesOpen] = useState(false); // 부가상품 매출등록 모달
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false); // 회원 상세 모달
  const [isMemberEditOpen, setIsMemberEditOpen] = useState(false); // 회원정보 수정 모달
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<any[]>([]); // 회원 결제 이력
  const [isMembershipEditOpen, setIsMembershipEditOpen] = useState(false); // 회원권 수정 모달
  const [membershipEditForm, setMembershipEditForm] = useState({
    id: "",
    name: "",
    membership_type: "",
    start_date: "",
    end_date: "",
    total_sessions: "",
    used_sessions: ""
  });
  const [memberEditForm, setMemberEditForm] = useState({
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
  });

  // Excel 가져오기 상태

  // 직원 목록 (등록자/담당트레이너 선택용)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>("");

  // 상품 목록 (매출 등록용)
  const [products, setProducts] = useState<MembershipProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // 부가상품 추가 (신규/기존 회원 등록 시)
  interface AddonItem {
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
  const [membershipModalAddons, setMembershipModalAddons] = useState<AddonItem[]>([]); // 회원권 추가 모달용 부가상품

  const [membershipForm, setMembershipForm] = useState({
    // 회원권 정보
    name: "",
    total_sessions: "",
    start_date: "",
    end_date: "",
    amount: "",
    method: "card",
    // 회원 정보
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
  });

  const [isLoading, setIsLoading] = useState(false);

  // Supabase 클라이언트 한 번만 생성 (메모이제이션)
  const supabase = useMemo(() => createSupabaseClient(), []);

  // 페이지네이션 훅 (Feature Flag로 활성화된 경우)
  // 디바운스된 검색어를 사용하여 불필요한 API 호출 방지
  const paginatedData = usePaginatedMembers({
    gymId: selectedGymId,
    companyId: selectedCompanyId,
    trainerId: userRole === "staff" ? myStaffId : null,
    search: debouncedSearch,
    status: statusFilter,
    page: currentPage,
    enabled: usePagination,
  });

  // 필터 변경 시 데이터 재조회
  useEffect(() => {
    if (authLoading || !filterInitialized) return;
    if (!user) return;

    setMyStaffId(user.id);

    if (selectedGymId && selectedCompanyId) {
      fetchMembers(selectedGymId, selectedCompanyId, userRole, user.id);
      fetchStaffList(selectedGymId);
      fetchProducts(selectedGymId);
    }
  }, [authLoading, filterInitialized, selectedGymId, selectedCompanyId, user]);

  // 페이지네이션 미사용 시에만 클라이언트 사이드 필터링
  useEffect(() => {
    if (!usePagination) {
      filterMembers();
    }
  }, [members, searchQuery, statusFilter, usePagination]);

  // 검색어나 필터 변경 시 페이지를 1로 리셋 (페이지네이션 모드)
  useEffect(() => {
    if (usePagination && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, statusFilter]);

  // URL parameter에 따라 모달 자동 열기
  useEffect(() => {
    if (registrationType === 'new' && members.length > 0) {
      setIsCreateOpen(true);
    } else if (registrationType === 'existing' && members.length > 0) {
      setIsExistingSalesOpen(true);
    }
  }, [registrationType, members]);

  const fetchStaffList = async (targetGymId: string | null) => {
    if (!targetGymId) return;

    const { data } = await supabase
      .from("staffs")
      .select("id, name, job_title")
      .eq("gym_id", targetGymId)
      .eq("employment_status", "재직")
      .order("name");

    if (data) {
      setStaffList(data);
    }
  };

  const fetchProducts = async (targetGymId: string | null) => {
    if (!targetGymId) return;

    const { data } = await supabase
      .from("membership_products")
      .select("*")
      .eq("gym_id", targetGymId)
      .eq("is_active", true)
      .order("display_order")
      .order("name");

    if (data) {
      setProducts(data);
    }
  };

  const fetchMembers = async (targetGymId: string | null, targetCompanyId: string | null, role: string, staffId: string) => {
    if (!targetGymId || !targetCompanyId) return;

    let query = supabase
      .from("members")
      .select(`
        *,
        member_memberships!left (
          id,
          name,
          total_sessions,
          used_sessions,
          start_date,
          end_date,
          status
        )
      `)
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId);

    // 직원(staff)은 자기가 담당하는 회원만 조회
    if (role === "staff") {
      query = query.eq("trainer_id", staffId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("회원 조회 에러:", error.message, error.code, error.details);
      return;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 회원권 정보를 집계 및 자동 만료 처리
    const membersWithMemberships = (data || []).map((member: any) => {
      const memberships = member.member_memberships || [];
      const activeMembership = memberships.find((m: any) => m.status === 'active');

      // 자동 만료 처리
      let newStatus = member.status;
      let shouldUpdate = false;

      // 1. 회원권이 없는 경우 → 만료
      if (!activeMembership) {
        if (member.status !== 'expired') {
          newStatus = 'expired';
          shouldUpdate = true;
        }
      }
      // 2. 회원권 종료일이 지난 경우 → 만료
      else if (activeMembership.end_date && activeMembership.end_date < today) {
        if (member.status !== 'expired') {
          newStatus = 'expired';
          shouldUpdate = true;
        }
      }

      // DB 업데이트 (백그라운드)
      if (shouldUpdate) {
        supabase
          .from('members')
          .update({ status: 'expired' })
          .eq('id', member.id)
          .then(({ error }) => {
            if (error) console.error('자동 만료 처리 실패:', member.name, error);
          });
      }

      return {
        ...member,
        status: newStatus,
        activeMembership,
        totalMemberships: memberships.length
      };
    });

    setMembers(membersWithMemberships);
  };

  const filterMembers = () => {
    let filtered = [...members];

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(query) ||
        m.phone?.includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  // 회원 관련 작업 훅
  const memberOperations = useMemberOperations({
    supabase,
    gymId: selectedGymId,
    companyId: selectedCompanyId,
    myStaffId,
    myRole,
    usePagination,
    paginatedData,
    fetchMembers,
    products,
    selectedProductId,
    setIsLoading
  });

  // 부가상품 추가 헬퍼 함수
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

  // 회원권 모달용 부가상품 관리 함수
  const addMembershipModalAddon = () => {
    setMembershipModalAddons([...membershipModalAddons, createEmptyAddon()]);
  };

  const removeMembershipModalAddon = (index: number) => {
    setMembershipModalAddons(membershipModalAddons.filter((_, i) => i !== index));
  };

  const updateMembershipModalAddon = (index: number, field: keyof AddonItem, value: string) => {
    const updated = [...membershipModalAddons];
    updated[index] = { ...updated[index], [field]: value };

    // 기간 변경 시 종료일 자동 계산
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

  const openMembershipModal = (member: any) => {
    setSelectedMember(member);
    setSelectedProductId(""); // 상품 선택 초기화

    // 회원권 등록 전용 - 빈 값으로 초기화 (새 회원권 등록)
    setMembershipForm({
      // 회원권 정보 (빈 값으로 초기화 - 새 회원권)
      name: "",
      total_sessions: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      amount: "",
      method: "card",
      // 회원 정보 (선택된 회원의 기본 정보 - 참고용)
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

  // 회원정보 수정 모달 열기
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

  // 회원권 수정 모달 열기
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

  // 회원 상세 모달 열기 (결제 이력 + 현재 회원권 조회)
  const openMemberDetailModal = async (member: any) => {
    setSelectedMember(member);

    try {
      // 회원의 결제 이력 조회
      const { data: payments, error } = await supabase
        .from("member_payments")
        .select(`
          id,
          amount,
          method,
          memo,
          created_at,
          member_memberships (
            name,
            membership_type
          )
        `)
        .eq("member_id", member.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("결제 이력 조회 오류:", error);
        setMemberPaymentHistory([]);
      } else {
        setMemberPaymentHistory(payments || []);
      }
    } catch (error) {
      console.error("결제 이력 조회 오류:", error);
      setMemberPaymentHistory([]);
    }

    setIsMemberDetailOpen(true);
  };

  // 정렬 토글 함수
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // 같은 필드 클릭 시 순서 반전
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // 다른 필드 클릭 시 해당 필드로 변경, 기본은 내림차순
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // 표시할 회원 데이터 결정 (Feature Flag에 따라)
  let displayMembers = usePagination ? paginatedData.members : filteredMembers;

  // 정렬 적용
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
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    } else {
      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  const isDataLoading = usePagination ? paginatedData.isLoading : isLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">{gymName}의 회원을 관리합니다</p>
        </div>

        {/* 버튼들 */}
        <div className="grid grid-cols-2 sm:flex gap-2 w-full xl:w-auto">
          <Button
            onClick={() => setIsSimpleMemberCreateOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
          >
            <UserPlus className="mr-1 sm:mr-2 h-4 w-4"/> 수기회원등록
          </Button>
          <Button
            onClick={() => setIsExcelImportOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
          >
            <Upload className="mr-1 sm:mr-2 h-4 w-4"/> Excel 대량등록
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
          >
            <UserPlus className="mr-1 sm:mr-2 h-4 w-4"/> 신규 회원&매출
          </Button>
          <Button
            onClick={() => setIsExistingSalesOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
          >
            <CreditCard className="mr-1 sm:mr-2 h-4 w-4"/> 기존 회원&매출
          </Button>
          <Button
            onClick={() => setIsAddonSalesOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
          >
            <CreditCard className="mr-1 sm:mr-2 h-4 w-4"/> 부가상품 매출
          </Button>
        </div>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "members" | "products")}>
        <TabsList className="mb-6">
          <TabsTrigger value="members">회원 목록</TabsTrigger>
          <TabsTrigger value="products">상품 관리</TabsTrigger>
        </TabsList>

        {/* 회원 목록 탭 */}
        <TabsContent value="members" className="space-y-6">
          {/* 검색 및 필터 */}
          <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="이름 또는 연락처로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="paused">휴면</SelectItem>
            <SelectItem value="expired">만료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border rounded-xl p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">전체 회원</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
            {usePagination ? paginatedData.stats.total : members.length}명
          </div>
        </div>
        <div className="bg-white border rounded-xl p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">활성 회원</div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-600 mt-1">
            {usePagination ? paginatedData.stats.active : members.filter(m => m.status === 'active').length}명
          </div>
        </div>
        <div className="bg-white border rounded-xl p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">휴면 회원</div>
          <div className="text-lg sm:text-2xl font-bold text-amber-600 mt-1">
            {usePagination ? paginatedData.stats.paused : members.filter(m => m.status === 'paused').length}명
          </div>
        </div>
      </div>

      {/* 회원 목록 - TanStack Table 또는 기존 테이블 */}
      {useTanStackTable ? (
        <MembersTable
          data={displayMembers}
          isLoading={isDataLoading}
          onViewDetail={openMemberDetailModal}
          onStatusChange={memberOperations.handleStatusChange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onBulkStatusChange={memberOperations.handleBulkStatusChange}
          onBulkTrainerAssign={memberOperations.handleBulkTrainerAssign}
          onBulkDelete={memberOperations.handleBulkDelete}
          trainers={staffList.map(staff => ({ id: staff.id, name: staff.name }))}
        />
      ) : (
        <div className="rounded-md border bg-white overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-blue-600 font-semibold"
                  >
                    이름
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">연락처</th>
                <th className="px-4 py-3 whitespace-nowrap">생년월일</th>
                <th className="px-4 py-3 whitespace-nowrap">성별</th>
                <th className="px-4 py-3 whitespace-nowrap">담당 트레이너</th>
                <th className="px-4 py-3 whitespace-nowrap">활성 회원권</th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort("membership_start_date")}
                    className="flex items-center gap-1 hover:text-blue-600 font-semibold"
                  >
                    회원권 시작일
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort("membership_end_date")}
                    className="flex items-center gap-1 hover:text-blue-600 font-semibold"
                  >
                    회원권 종료일
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">잔여횟수</th>
                <th className="px-4 py-3 whitespace-nowrap">상태</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody>
              {isDataLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-20 text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                <>
                  {displayMembers.map((member) => {
                    const statusBadge = getStatusBadge(member.status);
                    const remaining = member.activeMembership
                      ? (member.activeMembership.total_sessions - member.activeMembership.used_sessions)
                      : null;

                    return (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{member.name}</td>
                        <td className="px-4 py-3 text-gray-600">{member.phone || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{member.birth_date || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{member.gender || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {staffList.find(s => s.id === member.trainer_id)?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {member.activeMembership ? member.activeMembership.name : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {member.activeMembership?.start_date || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {member.activeMembership?.end_date || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {member.activeMembership ? (
                            <span className={remaining === 0 ? "text-red-500 font-semibold" : "text-gray-700"}>
                              {remaining} / {member.activeMembership.total_sessions}회
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`border-0 ${statusBadge.color}`}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMemberDetailModal(member)}
                            title="회원 상세 정보"
                          >
                            <Eye className="h-4 w-4 text-blue-600"/>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {displayMembers.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center py-20 text-gray-400">
                        {searchQuery || statusFilter !== "all"
                          ? "검색 결과가 없습니다."
                          : "등록된 회원이 없습니다."}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

          {/* 페이지네이션 (Feature Flag 활성화 시) */}
          {usePagination && paginatedData.totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={paginatedData.totalPages}
              totalCount={paginatedData.totalCount}
              pageSize={paginatedData.pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </TabsContent>

        {/* 상품 관리 탭 */}
        <TabsContent value="products">
          {gymId && <ProductsTab gymId={gymId} />}
        </TabsContent>
      </Tabs>


      {/* 회원 등록 모달 */}
      <NewMemberCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        products={products}
        staffList={staffList}
        gymId={gymId || ""}
        companyId={companyId || ""}
        myStaffId={myStaffId}
        onSuccess={() => {
          if (usePagination) {
            paginatedData.mutate();
          } else if (gymId && companyId && myRole && myStaffId) {
            fetchMembers(gymId, companyId, myRole, myStaffId);
          }
        }}
      />


      {/* 회원 상세 모달 */}
      <MemberDetailModal
        isOpen={isMemberDetailOpen}
        onClose={() => setIsMemberDetailOpen(false)}
        member={selectedMember}
        paymentHistory={memberPaymentHistory}
        onEditMember={openMemberEditModal}
        onEditMembership={openMembershipEditModal}
        onAddMembership={openMembershipModal}
      />

      {/* 회원정보 수정 모달 */}
      <MemberEditModal
        isOpen={isMemberEditOpen}
        onClose={() => setIsMemberEditOpen(false)}
        memberName={selectedMember?.name || ""}
        formData={memberEditForm}
        setFormData={setMemberEditForm}
        staffList={staffList}
        isLoading={isLoading}
        onSubmit={() => memberOperations.handleUpdateMemberInfo(
          selectedMember,
          memberEditForm,
          () => setIsMemberEditOpen(false)
        )}
      />

      {/* 회원권 수정 모달 */}
      <MembershipEditModal
        isOpen={isMembershipEditOpen}
        onClose={() => setIsMembershipEditOpen(false)}
        memberName={selectedMember?.name || ""}
        formData={membershipEditForm}
        setFormData={setMembershipEditForm}
        isLoading={isLoading}
        onSubmit={() => memberOperations.handleEditMembership(
          membershipEditForm,
          () => setIsMembershipEditOpen(false)
        )}
      />

      {/* 회원권 등록 모달 */}
      <AddMembershipModal
        isOpen={isMembershipOpen}
        onClose={() => {
          setIsMembershipOpen(false);
          setMembershipModalAddons([]);
        }}
        memberName={selectedMember?.name || ""}
        products={products}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        membershipForm={membershipForm}
        setMembershipForm={setMembershipForm}
        addons={membershipModalAddons}
        onAddAddon={addMembershipModalAddon}
        onRemoveAddon={removeMembershipModalAddon}
        onUpdateAddon={updateMembershipModalAddon}
        isLoading={isLoading}
        onSubmit={() => memberOperations.handleUpdateMembership(
          selectedMember,
          membershipForm,
          membershipModalAddons,
          () => {
            setIsMembershipOpen(false);
            setMembershipModalAddons([]);
          }
        )}
      />



      {/* 기존회원 매출등록 모달 */}
      <ExistingSalesModal
        isOpen={isExistingSalesOpen}
        onClose={() => setIsExistingSalesOpen(false)}
        members={members}
        products={products}
        gymId={gymId || ""}
        companyId={companyId || ""}
        myStaffId={myStaffId}
        onSuccess={() => {
          if (gymId && companyId && myRole && myStaffId) {
            fetchMembers(gymId, companyId, myRole, myStaffId);
          }
        }}
      />


      {/* 부가상품 매출등록 모달 */}
      <AddonSalesModal
        isOpen={isAddonSalesOpen}
        onClose={() => setIsAddonSalesOpen(false)}
        members={members}
        gymId={gymId || ""}
        companyId={companyId || ""}
        onSuccess={() => {
          if (gymId && companyId && myRole && myStaffId) {
            fetchMembers(gymId, companyId, myRole, myStaffId);
          }
        }}
      />


      {/* 간단한 회원 등록 모달 (매출 없이) */}
      <SimpleMemberCreateModal
        isOpen={isSimpleMemberCreateOpen}
        onClose={() => setIsSimpleMemberCreateOpen(false)}
        products={products}
        staffList={staffList}
        gymId={gymId || ""}
        companyId={companyId || ""}
        onSuccess={() => {
          if (gymId && companyId && myRole && myStaffId) {
            fetchMembers(gymId, companyId, myRole, myStaffId);
          }
        }}
      />

      {/* Excel 가져오기 모달 */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        gymId={gymId || ""}
        companyId={companyId || ""}
        onSuccess={() => {
          if (gymId && companyId && myRole && myStaffId) {
            fetchMembers(gymId, companyId, myRole, myStaffId);
          }
        }}
      />
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트 (useSearchParams 경고 해결)
export default function AdminMembersPage() {
  return (
    <Suspense fallback={
      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    }>
      <AdminMembersPageContent />
    </Suspense>
  );
}
