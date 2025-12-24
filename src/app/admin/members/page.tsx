"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, CreditCard, Upload, Eye, ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";
import { showSuccess, showError, showConfirm } from "@/lib/utils/error-handler";
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
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedExcelData, setParsedExcelData] = useState<any[]>([]);

  // 직원 목록 (등록자/담당트레이너 선택용)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>("");

  // 상품 목록 (매출 등록용)
  const [products, setProducts] = useState<MembershipProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedExistingProductId, setSelectedExistingProductId] = useState<string>("");

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
  const [newMemberAddons, setNewMemberAddons] = useState<AddonItem[]>([]);
  const [existingMemberAddons, setExistingMemberAddons] = useState<AddonItem[]>([]);
  const [membershipModalAddons, setMembershipModalAddons] = useState<AddonItem[]>([]); // 회원권 추가 모달용 부가상품

  // 회원권 중복 등록 (신규 회원 등록 시)
  interface MembershipItem {
    id: string;
    product_id: string;
    membership_type: string;
    membership_name: string;
    registered_at: string;
    start_date: string;
    end_date: string;
    amount: string;
    total_sessions: string;
    days_per_session: string; // PT/PPT/GPT용: 1회당 유효일수
    duration_months: string; // 기타 회원권용: 개월수
    payment_method: string;
  }
  const [newMemberMemberships, setNewMemberMemberships] = useState<MembershipItem[]>([]);

  // 폼 상태 (확장)
  const [createForm, setCreateForm] = useState({
    // 필수 정보
    name: "",
    phone: "",
    registered_at: new Date().toISOString().split('T')[0],

    // 회원권 정보
    membership_name: "PT 30회",
    membership_type: "PT", // 회원권 유형
    total_sessions: "30",
    membership_amount: "",
    start_date: new Date().toISOString().split('T')[0], // 시작날짜
    end_date: "", // 종료일 (자동 계산)
    days_per_session: "7", // PT/PPT/GPT용: 1회당 유효일수 (기본 7일)
    duration_months: "", // 기타 회원권용: 개월수

    // 결제 정보
    payment_method: "card", // 결제방법: card, cash, transfer

    // 담당자 정보
    registered_by: "", // 등록자 (현재 로그인한 사람으로 자동 설정)
    trainer_id: "", // 담당 트레이너

    // 선택 정보
    birth_date: "",
    gender: "",
    exercise_goal: "",

    // 인바디 정보
    weight: "",
    body_fat_mass: "",
    skeletal_muscle_mass: "",

    memo: ""
  });

  // 간단한 회원 등록 폼 (매출 없이)
  const [simpleMemberForm, setSimpleMemberForm] = useState({
    name: "",
    phone: "",
    birth_date: "",
    gender: "",
    trainer_id: "",
    exercise_goal: "",
    weight: "",
    body_fat_mass: "",
    skeletal_muscle_mass: "",
    memo: "",
    // 회원권 정보 (선택사항)
    membership_product_id: "",
    membership_start_date: "",
    membership_end_date: ""
  });

  // 간단한 회원 등록용 상품 선택 상태
  const [selectedSimpleProductId, setSelectedSimpleProductId] = useState<string>("");

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

  // 기존회원 매출등록 폼
  const [existingSalesForm, setExistingSalesForm] = useState({
    member_id: "",
    registration_type: "", // "리뉴", "기간변경", "부가상품"
    membership_type: "PT", // 회원권 유형
    membership_name: "PT 30회",
    total_sessions: "30",
    additional_sessions: "0", // 리뉴 시 추가 횟수
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    amount: "",
    total_amount: "",
    installment_count: "1",
    installment_current: "1",
    method: "card",
    visit_route: "",
    memo: "",
    // 회원 정보
    member_name: "",
    member_phone: "",
    birth_date: "",
    gender: "",
    exercise_goal: "",
    weight: "",
    body_fat_mass: "",
    skeletal_muscle_mass: "",
    trainer_id: ""
  });

  // 부가상품 매출등록 폼
  const [addonSalesForm, setAddonSalesForm] = useState({
    member_id: "",
    addon_type: "", // 개인락커, 물품락커, 운동복, 양말, 기타
    custom_addon_name: "", // 기타 선택 시 직접 입력
    locker_number: "", // 락커 번호 (개인락커, 물품락커인 경우)
    amount: "",
    duration_type: "months" as "months" | "days", // 개월 또는 일
    duration: "", // 기간 (개월수 또는 일수)
    payment_date: new Date().toISOString().split('T')[0], // 결제일
    start_date: new Date().toISOString().split('T')[0], // 시작일
    end_date: "", // 종료일 (기간 입력 시 자동계산)
    method: "card",
    memo: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [addonMemberSearch, setAddonMemberSearch] = useState(""); // 부가상품 회원 검색
  const [existingMemberSearch, setExistingMemberSearch] = useState(""); // 기존회원 매출등록 회원 검색

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

    // 등록자를 현재 로그인한 사람으로 자동 설정
    setCreateForm(prev => ({
      ...prev,
      registered_by: user.id,
      trainer_id: user.id
    }));
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

  // 간단한 회원 등록 (매출 없이 회원 정보만)
  const handleSimpleMemberCreate = async () => {
    // 필수 항목 검증
    if (!simpleMemberForm.name || !simpleMemberForm.phone) {
      toast.warning("필수 항목을 모두 입력해주세요. (회원명, 연락처)");
      return;
    }

    // 회원권 선택 시 시작일/종료일 필수
    if (simpleMemberForm.membership_product_id) {
      if (!simpleMemberForm.membership_start_date || !simpleMemberForm.membership_end_date) {
        toast.warning("회원권 시작일과 종료일을 입력해주세요.");
        return;
      }
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 회원 등록
      const { data: newMember, error: memberError } = await supabase
        .from("members")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          name: simpleMemberForm.name,
          phone: simpleMemberForm.phone,
          birth_date: simpleMemberForm.birth_date || null,
          gender: simpleMemberForm.gender || null,
          trainer_id: simpleMemberForm.trainer_id || null,
          exercise_goal: simpleMemberForm.exercise_goal || null,
          weight: simpleMemberForm.weight ? parseFloat(simpleMemberForm.weight) : null,
          body_fat_mass: simpleMemberForm.body_fat_mass ? parseFloat(simpleMemberForm.body_fat_mass) : null,
          skeletal_muscle_mass: simpleMemberForm.skeletal_muscle_mass ? parseFloat(simpleMemberForm.skeletal_muscle_mass) : null,
          memo: simpleMemberForm.memo || null,
          status: "active"
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. 회원권이 선택된 경우 회원권 생성
      if (simpleMemberForm.membership_product_id && newMember) {
        const selectedProduct = products.find(p => p.id === simpleMemberForm.membership_product_id);

        if (selectedProduct) {
          const { error: membershipError } = await supabase
            .from("member_memberships")
            .insert({
              company_id: companyId,
              gym_id: gymId,
              member_id: newMember.id,
              name: selectedProduct.name,
              membership_type: selectedProduct.membership_type,
              total_sessions: selectedProduct.default_sessions,
              used_sessions: 0,
              start_date: simpleMemberForm.membership_start_date,
              end_date: simpleMemberForm.membership_end_date,
              status: "active"
            });

          if (membershipError) throw membershipError;
        }
      }

      showSuccess(simpleMemberForm.membership_product_id
        ? "회원과 회원권이 등록되었습니다!"
        : "회원이 등록되었습니다!");
      setIsSimpleMemberCreateOpen(false);

      // 폼 초기화
      setSimpleMemberForm({
        name: "",
        phone: "",
        birth_date: "",
        gender: "",
        trainer_id: "",
        exercise_goal: "",
        weight: "",
        body_fat_mass: "",
        skeletal_muscle_mass: "",
        memo: "",
        membership_product_id: "",
        membership_start_date: "",
        membership_end_date: ""
      });
      setSelectedSimpleProductId("");

      // 회원 목록 새로고침
      if (gymId && companyId && myRole && myStaffId) {
        fetchMembers(gymId, companyId, myRole, myStaffId);
      }
    } catch (error: any) {
      console.error("회원 등록 오류:", error);
      showError(error.message || "회원 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Excel 날짜를 YYYY-MM-DD 문자열로 변환하는 함수
  const excelDateToString = (excelDate: any): string => {
    if (!excelDate) return '';

    // 이미 문자열이고 날짜 형식인 경우
    if (typeof excelDate === 'string') {
      // YYYY-MM-DD 형식인 경우 그대로 반환
      if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
        return excelDate;
      }
      // YYYY.MM.DD 또는 YYYY/MM/DD 형식인 경우 변환
      if (/^\d{4}[.\/]\d{2}[.\/]\d{2}$/.test(excelDate)) {
        return excelDate.replace(/[.\/]/g, '-');
      }
    }

    // Excel 숫자 날짜인 경우 (1900년 1월 1일부터의 일수)
    if (typeof excelDate === 'number') {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  };

  // 상품명에서 membership_type 자동 감지
  const detectMembershipType = (productName: string): string => {
    const name = productName.toLowerCase();

    // 횟수권 (PT/PPT/GPT) - 우선순위 높음
    if (name.includes('ppt')) return 'PPT';
    if (name.includes('gpt')) return 'GPT';
    if (name.includes('pt')) return 'PT';

    // 수강권 (요가/필라테스/GX)
    if (name.includes('요가')) return 'GX';
    if (name.includes('필라테스')) return '필라테스';
    if (name.includes('gx')) return 'GX';

    // 회원권 (헬스/골프/하이록스/크로스핏)
    if (name.includes('골프')) return '골프';
    if (name.includes('하이록스')) return '헬스'; // 하이록스는 헬스로 분류
    if (name.includes('크로스핏')) return '헬스'; // 크로스핏은 헬스로 분류
    if (name.includes('헬스')) return '헬스';

    // 부가상품 (락커/운동복)
    if (name.includes('락커')) return '헬스';
    if (name.includes('운동복')) return '헬스';

    // 기타
    if (name.includes('러닝')) return '헬스'; // 러닝은 헬스로 분류

    // 기본값
    return '헬스';
  };

  // Excel 파일 처리
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Helper 함수: 키워드가 포함된 컬럼 찾기 (부분 문자열 매칭)
      const findColumn = (row: any, keywords: string[]): any => {
        const columns = Object.keys(row);
        for (const keyword of keywords) {
          const matchedColumn = columns.find(col => col.includes(keyword));
          if (matchedColumn) return row[matchedColumn];
        }
        return null;
      };

      // Helper 함수: 키워드가 포함된 모든 컬럼 찾기 (중복 등록용)
      const findAllColumns = (row: any, keywords: string[]): string[] => {
        const columns = Object.keys(row);
        const matchedValues: string[] = [];
        for (const keyword of keywords) {
          const matchedColumns = columns.filter(col => col.includes(keyword));
          for (const col of matchedColumns) {
            const value = row[col];
            if (value && String(value).trim()) {
              matchedValues.push(String(value).trim());
            }
          }
        }
        return matchedValues;
      };

      // 데이터 매핑
      const mapped = jsonData.map((row: any) => {
        // 부분 문자열 매칭으로 컬럼 찾기
        const birthDate = excelDateToString(
          findColumn(row, ['생년월일', '생일'])
        );

        // 시작일: "등록" 또는 "시작" 포함된 컬럼
        const startDate = excelDateToString(
          findColumn(row, ['등록', '시작'])
        );

        // 종료일: "만료" 또는 "종료" 포함된 컬럼
        const endDate = excelDateToString(
          findColumn(row, ['만료', '종료'])
        );

        // 회원권명: "회원권", "대여권", "이용권" 포함된 모든 컬럼 (배열)
        const membershipNames = findAllColumns(row, ['회원권', '대여권', '이용권']);

        // 수강권: "수강권", "횟수권" 포함된 모든 컬럼 (배열)
        const courseNames = findAllColumns(row, ['수강권', '횟수권']);

        // 부가상품: "부가상품" 포함된 모든 컬럼 (배열)
        const additionalProducts = findAllColumns(row, ['부가상품']);

        // 회원명, 연락처, 성별도 부분 매칭
        const name = findColumn(row, ['회원명', '이름', '성명']) || '';
        const phone = findColumn(row, ['연락처', '전화번호', '휴대폰', '폰번호', '전화']) || '';
        const genderValue = findColumn(row, ['성별']);
        const gender = genderValue === '남성' || genderValue === '남' ? 'male' :
                      genderValue === '여성' || genderValue === '여' ? 'female' : '';

        return {
          name,
          phone,
          birth_date: birthDate,
          gender,
          membership_names: membershipNames, // 배열로 변경
          course_names: courseNames, // 배열로 변경
          additional_products: additionalProducts, // 배열로 변경
          membership_start_date: startDate,
          membership_end_date: endDate,
        };
      });

      setParsedExcelData(mapped);
      showSuccess(`${mapped.length}개의 회원 데이터를 불러왔습니다.`);
    } catch (error: any) {
      console.error('Excel 파싱 오류:', error);
      showError('Excel 파일을 읽는데 실패했습니다.');
      setExcelFile(null);
    }
  };

  // Excel 데이터 일괄 등록
  const handleBulkImport = async () => {
    if (!parsedExcelData || parsedExcelData.length === 0) {
      toast.warning('가져올 데이터가 없습니다.');
      return;
    }

    if (!gymId || !companyId) {
      toast.error('지점 정보를 찾을 수 없습니다.');
      return;
    }

    const confirmed = confirm(`${parsedExcelData.length}명의 회원을 등록하시겠습니까?`);
    if (!confirmed) return;

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const row of parsedExcelData) {
        try {
          // 필수 항목 검증
          if (!row.name || !row.phone) {
            failCount++;
            continue;
          }

          // 1. 회원 등록
          const { data: newMember, error: memberError } = await supabase
            .from('members')
            .insert({
              company_id: companyId,
              gym_id: gymId,
              name: row.name,
              phone: row.phone,
              birth_date: row.birth_date || null,
              gender: row.gender || null,
              status: 'active'
            })
            .select()
            .single();

          if (memberError) throw memberError;

          // 2. 회원권/수강권/부가상품 등록 (엑셀에서 가져온 데이터)
          const today = new Date().toISOString().split('T')[0];

          // 2-1. 회원권 등록 (배열 순회)
          if (row.membership_names && row.membership_names.length > 0 && newMember) {
            for (const membershipName of row.membership_names) {
              const { error: membershipError } = await supabase
                .from('member_memberships')
                .insert({
                  company_id: companyId,
                  gym_id: gymId,
                  member_id: newMember.id,
                  name: membershipName,
                  membership_type: detectMembershipType(membershipName), // 자동 감지
                  total_sessions: null,
                  used_sessions: 0,
                  start_date: row.membership_start_date || today,
                  end_date: row.membership_end_date || null,
                  status: 'active',
                  memo: '[엑셀 가져오기 - 회원권] 수정 불가'
                });

              if (membershipError) {
                console.error('회원권 등록 실패:', row.name, membershipName, membershipError);
              }
            }
          }

          // 2-2. 수강권 등록 (배열 순회)
          if (row.course_names && row.course_names.length > 0 && newMember) {
            for (const courseName of row.course_names) {
              const { error: courseError } = await supabase
                .from('member_memberships')
                .insert({
                  company_id: companyId,
                  gym_id: gymId,
                  member_id: newMember.id,
                  name: courseName,
                  membership_type: detectMembershipType(courseName), // 자동 감지
                  total_sessions: null,
                  used_sessions: 0,
                  start_date: row.membership_start_date || today,
                  end_date: row.membership_end_date || null,
                  status: 'active',
                  memo: '[엑셀 가져오기 - 수강권] 수정 불가'
                });

              if (courseError) {
                console.error('수강권 등록 실패:', row.name, courseName, courseError);
              }
            }
          }

          // 2-3. 부가상품 등록 (배열 순회)
          if (row.additional_products && row.additional_products.length > 0 && newMember) {
            for (const additionalProduct of row.additional_products) {
              const { error: productError } = await supabase
                .from('member_memberships')
                .insert({
                  company_id: companyId,
                  gym_id: gymId,
                  member_id: newMember.id,
                  name: additionalProduct,
                  membership_type: detectMembershipType(additionalProduct), // 자동 감지
                  total_sessions: null,
                  used_sessions: 0,
                  start_date: row.membership_start_date || today,
                  end_date: row.membership_end_date || null,
                  status: 'active',
                  memo: '[엑셀 가져오기 - 부가상품] 수정 불가'
                });

              if (productError) {
                console.error('부가상품 등록 실패:', row.name, additionalProduct, productError);
              }
            }
          }

          successCount++;
        } catch (error) {
          console.error('회원 등록 실패:', error);
          failCount++;
        }
      }

      showSuccess(`등록 완료: 성공 ${successCount}명, 실패 ${failCount}명`);
      setIsExcelImportOpen(false);
      setExcelFile(null);
      setParsedExcelData([]);

      // 회원 목록 새로고침
      if (gymId && companyId && myRole && myStaffId) {
        fetchMembers(gymId, companyId, myRole, myStaffId);
      }
    } catch (error: any) {
      console.error('일괄 등록 오류:', error);
      showError(error.message || '일괄 등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // PT/PPT/GPT 타입인지 확인하는 헬퍼 함수
  const isPTType = (type: string) => ["PT", "PPT", "GPT"].includes(type);

  // 종료일 자동 계산 함수
  const calculateEndDate = (startDate: string, membershipType: string, totalSessions: string, daysPerSession: string, durationMonths: string): string => {
    if (!startDate) return "";

    const start = new Date(startDate);

    if (isPTType(membershipType)) {
      // PT/PPT/GPT: 시작일 + (총세션 * 1회당 유효일수)
      const sessions = parseInt(totalSessions) || 0;
      const days = parseInt(daysPerSession) || 7;
      const totalDays = sessions * days;
      const end = new Date(start);
      end.setDate(end.getDate() + totalDays - 1);
      return end.toISOString().split('T')[0];
    } else {
      // 기타 회원권: 시작일 + 개월수
      const months = parseInt(durationMonths) || 0;
      if (months <= 0) return "";
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      end.setDate(end.getDate() - 1);
      return end.toISOString().split('T')[0];
    }
  };

  // 회원권 중복 등록 헬퍼 함수
  const createEmptyMembership = (): MembershipItem => ({
    id: crypto.randomUUID(),
    product_id: "",
    membership_type: "PT",
    membership_name: "",
    registered_at: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    amount: "",
    total_sessions: "",
    days_per_session: "7",
    duration_months: "",
    payment_method: "card"
  });

  const addNewMemberMembership = () => {
    setNewMemberMemberships([...newMemberMemberships, createEmptyMembership()]);
  };

  const removeNewMemberMembership = (index: number) => {
    setNewMemberMemberships(newMemberMemberships.filter((_, i) => i !== index));
  };

  const updateNewMemberMembership = (index: number, field: keyof MembershipItem, value: string) => {
    const updated = [...newMemberMemberships];
    updated[index] = { ...updated[index], [field]: value };

    // 종료일 자동 계산
    const m = updated[index];
    if (field === "start_date" || field === "total_sessions" || field === "days_per_session" || field === "duration_months" || field === "membership_type") {
      updated[index].end_date = calculateEndDate(
        m.start_date,
        m.membership_type,
        m.total_sessions,
        m.days_per_session,
        m.duration_months
      );
    }

    setNewMemberMemberships(updated);
  };

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

  const addNewMemberAddon = () => {
    setNewMemberAddons([...newMemberAddons, createEmptyAddon()]);
  };

  const removeNewMemberAddon = (index: number) => {
    setNewMemberAddons(newMemberAddons.filter((_, i) => i !== index));
  };

  const updateNewMemberAddon = (index: number, field: keyof AddonItem, value: string) => {
    const updated = [...newMemberAddons];
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
    setNewMemberAddons(updated);
  };

  const addExistingMemberAddon = () => {
    setExistingMemberAddons([...existingMemberAddons, createEmptyAddon()]);
  };

  const removeExistingMemberAddon = (index: number) => {
    setExistingMemberAddons(existingMemberAddons.filter((_, i) => i !== index));
  };

  const updateExistingMemberAddon = (index: number, field: keyof AddonItem, value: string) => {
    const updated = [...existingMemberAddons];
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
    setExistingMemberAddons(updated);
  };

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

  // 부가상품 저장 함수
  const saveAddonPayments = async (memberId: string, addons: AddonItem[], registeredAt: string) => {
    for (const addon of addons) {
      if (!addon.addon_type || !addon.amount) continue;

      const addonName = addon.addon_type === "기타" ? addon.custom_addon_name : addon.addon_type;
      const memoText = addon.locker_number ? `${addonName} (락커 ${addon.locker_number})` : addonName;

      // 결제 기록 생성
      await supabase.from("member_payments").insert({
        company_id: companyId,
        gym_id: gymId,
        member_id: memberId,
        amount: parseFloat(addon.amount),
        total_amount: parseFloat(addon.amount),
        method: addon.method,
        membership_type: "부가상품",
        registration_type: "부가상품",
        memo: memoText,
        paid_at: registeredAt
      });

      // 매출 로그 기록
      await supabase.from("sales_logs").insert({
        company_id: companyId,
        gym_id: gymId,
        staff_id: myStaffId,
        type: "sale",
        amount: parseFloat(addon.amount),
        method: addon.method,
        memo: `부가상품: ${memoText}`,
        occurred_at: registeredAt
      });
    }
  };

  const handleCreateMember = async () => {
    // 필수 항목 검증 (회원명, 연락처, 회원권 정보만 필수)
    if (!createForm.name || !createForm.phone) {
      toast.warning("필수 항목을 모두 입력해주세요. (회원명, 연락처)");
      return;
    }

    // 기본 회원권이 있는 경우에만 등록날짜와 금액 검증
    if (selectedProductId || createForm.membership_amount) {
      if (!createForm.registered_at || !createForm.membership_amount) {
        toast.warning("회원권 등록 시 등록날짜와 등록금액을 입력해주세요.");
        return;
      }
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 회원 등록
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          name: createForm.name,
          phone: createForm.phone,
          birth_date: createForm.birth_date || null,
          gender: createForm.gender || null,
          registered_by: createForm.registered_by || myStaffId,
          trainer_id: createForm.trainer_id || null,
          exercise_goal: createForm.exercise_goal || null,
          weight: createForm.weight ? parseFloat(createForm.weight) : null,
          body_fat_mass: createForm.body_fat_mass ? parseFloat(createForm.body_fat_mass) : null,
          skeletal_muscle_mass: createForm.skeletal_muscle_mass ? parseFloat(createForm.skeletal_muscle_mass) : null,
          memo: createForm.memo || null,
          status: "active",
          created_at: createForm.registered_at
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. 기본 회원권 등록 (회원권이 있는 경우에만)
      if (selectedProductId || createForm.membership_amount) {
        const { data: membership, error: membershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: createForm.membership_name,
            membership_type: createForm.membership_type,
            total_sessions: parseInt(createForm.total_sessions) || 0,
            used_sessions: 0,
            start_date: createForm.start_date || createForm.registered_at,
            end_date: createForm.end_date || null,
            status: "active"
          })
          .select()
          .single();

        if (membershipError) throw membershipError;

        // 3. 결제 정보 등록
        const amount = parseFloat(createForm.membership_amount);
        const { error: paymentError } = await supabase
          .from("member_payments")
          .insert({
            company_id: companyId,
            gym_id: gymId,
            member_id: member.id,
            membership_id: membership.id,
            amount: amount,
            total_amount: amount,
            method: createForm.payment_method,
            membership_type: createForm.membership_type,
            registration_type: "신규",
            memo: `${createForm.membership_name} 신규 등록`,
            paid_at: createForm.registered_at
          });

        if (paymentError) throw paymentError;

        // 4. 매출 로그에 기록
        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          staff_id: myStaffId,
          type: "sale",
          amount: amount,
          method: createForm.payment_method,
          memo: `${createForm.name} - ${createForm.membership_name} 신규 등록`,
          occurred_at: createForm.registered_at
        });
      }

      // 5. 추가 회원권 등록 (중복 회원권)
      for (const additionalMembership of newMemberMemberships) {
        if (!additionalMembership.product_id || !additionalMembership.amount) continue;

        const { data: addMembership, error: addMembershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: additionalMembership.membership_name,
            membership_type: additionalMembership.membership_type,
            total_sessions: parseInt(additionalMembership.total_sessions) || 0,
            used_sessions: 0,
            start_date: additionalMembership.start_date || additionalMembership.registered_at,
            end_date: additionalMembership.end_date || null,
            status: "active"
          })
          .select()
          .single();

        if (addMembershipError) {
          console.error("추가 회원권 등록 실패:", addMembershipError);
          continue;
        }

        // 추가 회원권 결제 정보
        const addAmount = parseFloat(additionalMembership.amount);
        await supabase.from("member_payments").insert({
          company_id: companyId,
          gym_id: gymId,
          member_id: member.id,
          membership_id: addMembership.id,
          amount: addAmount,
          total_amount: addAmount,
          method: additionalMembership.payment_method,
          membership_type: additionalMembership.membership_type,
          registration_type: "신규",
          memo: `${additionalMembership.membership_name} 신규 등록 (추가)`,
          paid_at: additionalMembership.registered_at
        });

        // 추가 회원권 매출 로그
        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          staff_id: myStaffId,
          type: "sale",
          amount: addAmount,
          method: additionalMembership.payment_method,
          memo: `${createForm.name} - ${additionalMembership.membership_name} 신규 등록 (추가)`,
          occurred_at: additionalMembership.registered_at
        });
      }

      // 6. 부가상품 저장
      if (newMemberAddons.length > 0) {
        await saveAddonPayments(member.id, newMemberAddons, createForm.registered_at);
      }

      showSuccess("회원이 등록되었습니다!");
      setIsCreateOpen(false);
      setSelectedProductId(""); // 상품 선택 초기화
      setNewMemberAddons([]); // 부가상품 초기화
      setNewMemberMemberships([]); // 추가 회원권 초기화

      // 폼 초기화
      setCreateForm({
        name: "",
        phone: "",
        registered_at: new Date().toISOString().split('T')[0],
        membership_name: "PT 30회",
        membership_type: "PT",
        total_sessions: "30",
        membership_amount: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        days_per_session: "7",
        duration_months: "",
        payment_method: "card",
        registered_by: myStaffId || "",
        trainer_id: myStaffId || "",
        birth_date: "",
        gender: "",
        exercise_goal: "",
        weight: "",
        body_fat_mass: "",
        skeletal_muscle_mass: "",
        memo: ""
      });

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      showError(error, "회원 등록");
    } finally {
      setIsLoading(false);
    }
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

  // 회원권 수정 처리 (시작일/종료일/횟수 편집)
  const handleEditMembership = async () => {
    if (!membershipEditForm.id || !selectedGymId) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        start_date: membershipEditForm.start_date || null,
        end_date: membershipEditForm.end_date || null,
        total_sessions: parseInt(membershipEditForm.total_sessions) || 0,
        used_sessions: parseInt(membershipEditForm.used_sessions) || 0
      };

      const { error } = await supabase
        .from("member_memberships")
        .update(updateData)
        .eq("id", membershipEditForm.id);

      if (error) throw error;

      showSuccess("회원권 정보가 수정되었습니다!");
      setIsMembershipEditOpen(false);
      await fetchMembers(selectedGymId, selectedCompanyId, myRole, myStaffId || "");
    } catch (error: any) {
      showError(`회원권 수정 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원정보 수정 처리
  const handleUpdateMemberInfo = async () => {
    if (!selectedMember || !selectedGymId || !selectedCompanyId) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        name: memberEditForm.name,
        phone: memberEditForm.phone,
        birth_date: memberEditForm.birth_date || null,
        gender: memberEditForm.gender || null,
        exercise_goal: memberEditForm.exercise_goal || null,
        memo: memberEditForm.memo || null
      };

      if (memberEditForm.weight) updateData.weight = parseFloat(memberEditForm.weight);
      if (memberEditForm.body_fat_mass) updateData.body_fat_mass = parseFloat(memberEditForm.body_fat_mass);
      if (memberEditForm.skeletal_muscle_mass) updateData.skeletal_muscle_mass = parseFloat(memberEditForm.skeletal_muscle_mass);
      if (memberEditForm.trainer_id) updateData.trainer_id = memberEditForm.trainer_id;

      const { error } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", selectedMember.id);

      if (error) throw error;

      showSuccess("회원정보가 수정되었습니다!");
      setIsMemberEditOpen(false);

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(selectedGymId, selectedCompanyId, userRole, myStaffId!);
      }
    } catch (error: any) {
      showError(error, "회원정보 수정");
    } finally {
      setIsLoading(false);
    }
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

  // 회원권 등록 처리 (회원정보 수정은 별도 모달로 분리됨)
  const handleUpdateMembership = async () => {
    if (!selectedMember || !selectedGymId || !selectedCompanyId) return;
    if (!membershipForm.name || !membershipForm.total_sessions) {
      toast.warning("회원권 이름과 횟수는 필수입니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 새 회원권 생성
      const { error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id: selectedGymId,
          member_id: selectedMember.id,
          name: membershipForm.name,
          total_sessions: parseInt(membershipForm.total_sessions),
          used_sessions: 0,
          start_date: membershipForm.start_date || null,
          end_date: membershipForm.end_date || null,
          status: "active"
        });

      if (membershipError) throw membershipError;

      // 결제 기록 생성 (회원권)
      if (membershipForm.amount && parseFloat(membershipForm.amount) > 0) {
        await supabase.from("member_payments").insert({
          company_id: selectedCompanyId,
          gym_id: selectedGymId,
          member_id: selectedMember.id,
          amount: parseFloat(membershipForm.amount),
          registration_type: "회원권추가",
          payment_method: membershipForm.method || "card",
          memo: membershipForm.name,
          registered_at: membershipForm.start_date || new Date().toISOString().split('T')[0],
          membership_type: products.find(p => p.id === selectedProductId)?.membership_type || "기타"
        });
      }

      // 부가상품 저장
      if (membershipModalAddons.length > 0) {
        await saveAddonPayments(selectedMember.id, membershipModalAddons, membershipForm.start_date || new Date().toISOString().split('T')[0]);
      }

      showSuccess("회원권이 등록되었습니다!");
      setIsMembershipOpen(false);
      setMembershipModalAddons([]); // 부가상품 초기화

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(selectedGymId, selectedCompanyId, userRole, myStaffId!);
      }
    } catch (error: any) {
      showError(error, "회원권 등록");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingSales = async () => {
    if (!existingSalesForm.member_id || !existingSalesForm.registration_type) {
      toast.warning("회원과 등록 타입을 선택해주세요.");
      return;
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const member = members.find(m => m.id === existingSalesForm.member_id);
      if (!member) throw new Error("회원을 찾을 수 없습니다.");

      const registrationType = existingSalesForm.registration_type;

      if (registrationType === "리뉴") {
        // 리뉴: 기존 회원권 갱신 (횟수 추가, 기간 연장)
        const activeMembership = member.activeMembership;
        if (!activeMembership) {
          toast.warning("활성 회원권이 없습니다. 부가상품으로 등록해주세요.");
          return;
        }

        // 회원권 업데이트: 횟수 추가
        const additionalSessions = parseInt(existingSalesForm.additional_sessions || "0");
        const { error: updateError } = await supabase
          .from("member_memberships")
          .update({
            total_sessions: activeMembership.total_sessions + additionalSessions,
            end_date: existingSalesForm.end_date || activeMembership.end_date,
            status: "active"
          })
          .eq("id", activeMembership.id);

        if (updateError) throw updateError;

        // 회원 상태 활성화
        await supabase
          .from("members")
          .update({ status: "active" })
          .eq("id", member.id);

      } else if (registrationType === "기간변경") {
        // 기간변경: 만료일만 수정
        const activeMembership = member.activeMembership;
        if (!activeMembership) {
          toast.warning("활성 회원권이 없습니다.");
          return;
        }

        const { error: updateError } = await supabase
          .from("member_memberships")
          .update({
            end_date: existingSalesForm.end_date
          })
          .eq("id", activeMembership.id);

        if (updateError) throw updateError;

      } else if (registrationType === "부가상품") {
        // 부가상품: 새로운 회원권 추가
        const { data: newMembership, error: membershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: existingSalesForm.membership_name,
            total_sessions: parseInt(existingSalesForm.total_sessions),
            used_sessions: 0,
            start_date: existingSalesForm.start_date,
            end_date: existingSalesForm.end_date || null,
            status: "active"
          })
          .select()
          .single();

        if (membershipError) throw membershipError;
      }

      // 결제 내역 등록
      const amount = parseFloat(existingSalesForm.amount);
      const totalAmount = existingSalesForm.total_amount ? parseFloat(existingSalesForm.total_amount) : amount;

      const { error: paymentError } = await supabase
        .from("member_payments")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          member_id: member.id,
          amount: amount,
          total_amount: totalAmount,
          installment_count: parseInt(existingSalesForm.installment_count),
          installment_current: parseInt(existingSalesForm.installment_current),
          method: existingSalesForm.method,
          membership_type: existingSalesForm.membership_type,
          registration_type: existingSalesForm.registration_type,
          visit_route: existingSalesForm.visit_route || null,
          memo: existingSalesForm.memo || null,
          paid_at: existingSalesForm.start_date
        });

      if (paymentError) throw paymentError;

      // 회원 정보 업데이트
      const memberUpdateData: any = {};
      if (existingSalesForm.member_name) memberUpdateData.name = existingSalesForm.member_name;
      if (existingSalesForm.member_phone) memberUpdateData.phone = existingSalesForm.member_phone;
      if (existingSalesForm.birth_date) memberUpdateData.birth_date = existingSalesForm.birth_date;
      if (existingSalesForm.gender) memberUpdateData.gender = existingSalesForm.gender;
      if (existingSalesForm.exercise_goal) memberUpdateData.exercise_goal = existingSalesForm.exercise_goal;
      if (existingSalesForm.weight) memberUpdateData.weight = parseFloat(existingSalesForm.weight);
      if (existingSalesForm.body_fat_mass) memberUpdateData.body_fat_mass = parseFloat(existingSalesForm.body_fat_mass);
      if (existingSalesForm.skeletal_muscle_mass) memberUpdateData.skeletal_muscle_mass = parseFloat(existingSalesForm.skeletal_muscle_mass);
      if (existingSalesForm.trainer_id) memberUpdateData.trainer_id = existingSalesForm.trainer_id;

      if (Object.keys(memberUpdateData).length > 0) {
        const { error: memberUpdateError } = await supabase
          .from("members")
          .update(memberUpdateData)
          .eq("id", member.id);

        if (memberUpdateError) throw memberUpdateError;
      }

      // 부가상품 저장
      if (existingMemberAddons.length > 0) {
        await saveAddonPayments(member.id, existingMemberAddons, existingSalesForm.start_date);
      }

      showSuccess("매출이 등록되었습니다!");
      setIsExistingSalesOpen(false);
      setSelectedExistingProductId(""); // 상품 선택 초기화
      setExistingMemberAddons([]); // 부가상품 초기화

      // 폼 초기화
      setExistingSalesForm({
        member_id: "",
        registration_type: "",
        membership_type: "PT",
        membership_name: "PT 30회",
        total_sessions: "30",
        additional_sessions: "0",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        amount: "",
        total_amount: "",
        installment_count: "1",
        installment_current: "1",
        method: "card",
        visit_route: "",
        memo: "",
        // 회원 정보
        member_name: "",
        member_phone: "",
        birth_date: "",
        gender: "",
        exercise_goal: "",
        weight: "",
        body_fat_mass: "",
        skeletal_muscle_mass: "",
        trainer_id: ""
      });

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      showError(error, "매출 등록");
    } finally {
      setIsLoading(false);
    }
  };

  // 부가상품 매출 등록
  const handleAddonSales = async () => {
    if (!addonSalesForm.member_id || !addonSalesForm.addon_type) {
      toast.warning("회원과 부가상품 유형을 선택해주세요.");
      return;
    }

    if (!addonSalesForm.amount) {
      toast.warning("금액을 입력해주세요.");
      return;
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const member = members.find(m => m.id === addonSalesForm.member_id);
      if (!member) throw new Error("회원을 찾을 수 없습니다.");

      // 상품명 구성
      let addonName = addonSalesForm.addon_type === "기타"
        ? addonSalesForm.custom_addon_name
        : addonSalesForm.addon_type;

      // 락커인 경우 번호 추가 (선택사항)
      if ((addonSalesForm.addon_type === "개인락커" || addonSalesForm.addon_type === "물품락커") && addonSalesForm.locker_number) {
        addonName += ` ${addonSalesForm.locker_number}번`;
      }

      // 기간 정보 추가
      let periodInfo = "";
      if (addonSalesForm.duration) {
        const durationLabel = addonSalesForm.duration_type === "months" ? "개월" : "일";
        periodInfo = ` (${addonSalesForm.duration}${durationLabel})`;
      }
      if (addonSalesForm.start_date && addonSalesForm.end_date) {
        periodInfo += ` ${addonSalesForm.start_date} ~ ${addonSalesForm.end_date}`;
      }

      const amount = parseFloat(addonSalesForm.amount);

      // 결제 기록 등록
      const { error: paymentError } = await supabase
        .from("member_payments")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          member_id: member.id,
          amount: amount,
          total_amount: amount,
          method: addonSalesForm.method,
          membership_type: "부가상품",
          registration_type: "부가상품",
          memo: `${addonName}${periodInfo}${addonSalesForm.memo ? ` - ${addonSalesForm.memo}` : ""}`,
          paid_at: addonSalesForm.payment_date || addonSalesForm.start_date
        });

      if (paymentError) throw paymentError;

      showSuccess("부가상품 매출이 등록되었습니다!");
      setIsAddonSalesOpen(false);
      setAddonSalesForm({
        member_id: "",
        addon_type: "",
        custom_addon_name: "",
        locker_number: "",
        amount: "",
        duration_type: "months" as "months" | "days",
        duration: "",
        payment_date: new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        method: "card",
        memo: ""
      });

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      showError(error, "부가상품 매출 등록");
    } finally {
      setIsLoading(false);
    }
  };

  // 대량 상태 변경
  const handleBulkStatusChange = async (memberIds: string[], newStatus: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: newStatus })
        .in("id", memberIds);

      if (error) throw error;

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      console.error("대량 상태 변경 실패:", error);
      throw error;
    }
  };

  // 대량 트레이너 할당
  const handleBulkTrainerAssign = async (memberIds: string[], trainerId: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ trainer_id: trainerId })
        .in("id", memberIds);

      if (error) throw error;

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      console.error("대량 트레이너 할당 실패:", error);
      throw error;
    }
  };

  // 단일 회원 상태 변경
  const handleStatusChange = async (member: any, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: newStatus })
        .eq("id", member.id);

      if (error) throw error;

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      console.error("상태 변경 실패:", error);
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 대량 회원 삭제
  const handleBulkDelete = async (memberIds: string[]) => {
    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .in("id", memberIds);

      if (error) throw error;

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      console.error("대량 삭제 실패:", error);
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      paused: "bg-amber-100 text-amber-700",
      expired: "bg-gray-100 text-gray-500"
    };
    const labels: Record<string, string> = {
      active: "활성",
      paused: "휴면",
      expired: "만료"
    };
    return { color: colors[status] || "bg-gray-100", label: labels[status] || status };
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
          onStatusChange={handleStatusChange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkTrainerAssign={handleBulkTrainerAssign}
          onBulkDelete={handleBulkDelete}
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
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setSelectedProductId(""); // 모달 닫을 때 상품 선택 초기화
          setNewMemberAddons([]); // 부가상품 초기화
          setNewMemberMemberships([]); // 추가 회원권 초기화
        }
      }}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신규 회원 등록</DialogTitle>
            <DialogDescription className="sr-only">신규 회원을 등록합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">

            {/* 1. 필수 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">필수 정보</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">회원명 <span className="text-red-500">*</span></Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">연락처 <span className="text-red-500">*</span></Label>
                  <Input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: formatPhoneNumberOnChange(e.target.value)})}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">생년월일</Label>
                  <Input
                    type="date"
                    value={createForm.birth_date}
                    onChange={(e) => setCreateForm({...createForm, birth_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">성별</Label>
                  <Select value={createForm.gender} onValueChange={(v) => setCreateForm({...createForm, gender: v})}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. 회원권 섹션 (중복 등록 가능) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-sm text-gray-700">회원권</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewMemberMembership}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  회원권 추가
                </Button>
              </div>

              {/* 기본 회원권 (항상 표시) */}
              <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">기본 회원권</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">회원권명 <span className="text-red-500">*</span></Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={(productId) => {
                      const product = products.find(p => p.id === productId);
                      if (product) {
                        setSelectedProductId(productId);
                        setCreateForm({
                          ...createForm,
                          membership_name: product.name,
                          membership_type: product.membership_type || "PT",
                          total_sessions: product.default_sessions?.toString() || "0",
                          membership_amount: product.default_price.toString()
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="상품을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {products.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          등록된 상품이 없습니다.<br />
                          상품 관리 탭에서 먼저 상품을 등록해주세요.
                        </div>
                      ) : (
                        products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">회원권 유형</Label>
                    <Select
                      value={createForm.membership_type}
                      onValueChange={(v) => {
                        const newEndDate = calculateEndDate(
                          createForm.start_date,
                          v,
                          createForm.total_sessions,
                          createForm.days_per_session,
                          createForm.duration_months
                        );
                        setCreateForm({...createForm, membership_type: v, end_date: newEndDate});
                      }}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="헬스">헬스</SelectItem>
                        <SelectItem value="필라테스">필라테스</SelectItem>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="PPT">PPT</SelectItem>
                        <SelectItem value="GPT">GPT</SelectItem>
                        <SelectItem value="골프">골프</SelectItem>
                        <SelectItem value="GX">GX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">등록날짜</Label>
                    <Input
                      type="date"
                      value={createForm.registered_at}
                      onChange={(e) => setCreateForm({...createForm, registered_at: e.target.value})}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">등록금액 (원) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={createForm.membership_amount}
                      onChange={(e) => setCreateForm({...createForm, membership_amount: e.target.value})}
                      placeholder="1000000"
                      className="h-9"
                    />
                  </div>
                </div>

                {/* PT/PPT/GPT 타입: 세션, 1회당 유효일수 */}
                {isPTType(createForm.membership_type) ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">등록세션 (회) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={createForm.total_sessions}
                        onChange={(e) => {
                          const newEndDate = calculateEndDate(
                            createForm.start_date,
                            createForm.membership_type,
                            e.target.value,
                            createForm.days_per_session,
                            createForm.duration_months
                          );
                          setCreateForm({...createForm, total_sessions: e.target.value, end_date: newEndDate});
                        }}
                        placeholder="30"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">1회당 유효일수</Label>
                      <Input
                        type="number"
                        value={createForm.days_per_session}
                        onChange={(e) => {
                          const newEndDate = calculateEndDate(
                            createForm.start_date,
                            createForm.membership_type,
                            createForm.total_sessions,
                            e.target.value,
                            createForm.duration_months
                          );
                          setCreateForm({...createForm, days_per_session: e.target.value, end_date: newEndDate});
                        }}
                        placeholder="7"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={createForm.start_date}
                        onChange={(e) => {
                          const newEndDate = calculateEndDate(
                            e.target.value,
                            createForm.membership_type,
                            createForm.total_sessions,
                            createForm.days_per_session,
                            createForm.duration_months
                          );
                          setCreateForm({...createForm, start_date: e.target.value, end_date: newEndDate});
                        }}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">종료일 (자동계산)</Label>
                      <Input
                        type="date"
                        value={createForm.end_date}
                        readOnly
                        className="h-9 bg-gray-100"
                      />
                    </div>
                  </div>
                ) : (
                  /* 기타 회원권: 개월수 기반 */
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">개월수 <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={createForm.duration_months}
                        onChange={(e) => {
                          const newEndDate = calculateEndDate(
                            createForm.start_date,
                            createForm.membership_type,
                            createForm.total_sessions,
                            createForm.days_per_session,
                            e.target.value
                          );
                          setCreateForm({...createForm, duration_months: e.target.value, end_date: newEndDate});
                        }}
                        placeholder="3"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={createForm.start_date}
                        onChange={(e) => {
                          const newEndDate = calculateEndDate(
                            e.target.value,
                            createForm.membership_type,
                            createForm.total_sessions,
                            createForm.days_per_session,
                            createForm.duration_months
                          );
                          setCreateForm({...createForm, start_date: e.target.value, end_date: newEndDate});
                        }}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">종료일 (자동계산)</Label>
                      <Input
                        type="date"
                        value={createForm.end_date}
                        readOnly
                        className="h-9 bg-gray-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">세션 (선택)</Label>
                      <Input
                        type="number"
                        value={createForm.total_sessions}
                        onChange={(e) => setCreateForm({...createForm, total_sessions: e.target.value})}
                        placeholder="횟수 제한 시 입력"
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">결제방법</Label>
                  <Select value={createForm.payment_method} onValueChange={(v) => setCreateForm({...createForm, payment_method: v})}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="card">카드</SelectItem>
                      <SelectItem value="cash">현금</SelectItem>
                      <SelectItem value="transfer">계좌이체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 추가 회원권 (중복 등록) */}
              {newMemberMemberships.map((membership, index) => (
                <div key={membership.id} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">추가 회원권 #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewMemberMembership(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">회원권명 <span className="text-red-500">*</span></Label>
                    <Select
                      value={membership.product_id}
                      onValueChange={(productId) => {
                        const product = products.find(p => p.id === productId);
                        if (product) {
                          updateNewMemberMembership(index, "product_id", productId);
                          updateNewMemberMembership(index, "membership_name", product.name);
                          updateNewMemberMembership(index, "membership_type", product.membership_type || "PT");
                          updateNewMemberMembership(index, "total_sessions", product.default_sessions?.toString() || "0");
                          updateNewMemberMembership(index, "amount", product.default_price.toString());
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="상품을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-[200px]">
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">회원권 유형</Label>
                      <Select
                        value={membership.membership_type}
                        onValueChange={(v) => updateNewMemberMembership(index, "membership_type", v)}
                      >
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="헬스">헬스</SelectItem>
                          <SelectItem value="필라테스">필라테스</SelectItem>
                          <SelectItem value="PT">PT</SelectItem>
                          <SelectItem value="PPT">PPT</SelectItem>
                          <SelectItem value="GPT">GPT</SelectItem>
                          <SelectItem value="골프">골프</SelectItem>
                          <SelectItem value="GX">GX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">등록날짜</Label>
                      <Input
                        type="date"
                        value={membership.registered_at}
                        onChange={(e) => updateNewMemberMembership(index, "registered_at", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">등록금액 (원) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={membership.amount}
                        onChange={(e) => updateNewMemberMembership(index, "amount", e.target.value)}
                        placeholder="1000000"
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* PT/PPT/GPT 타입: 세션, 1회당 유효일수 */}
                  {isPTType(membership.membership_type) ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">등록세션 (회) <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={membership.total_sessions}
                          onChange={(e) => updateNewMemberMembership(index, "total_sessions", e.target.value)}
                          placeholder="30"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">1회당 유효일수</Label>
                        <Input
                          type="number"
                          value={membership.days_per_session}
                          onChange={(e) => updateNewMemberMembership(index, "days_per_session", e.target.value)}
                          placeholder="7"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
                        <Input
                          type="date"
                          value={membership.start_date}
                          onChange={(e) => updateNewMemberMembership(index, "start_date", e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">종료일 (자동계산)</Label>
                        <Input
                          type="date"
                          value={membership.end_date}
                          readOnly
                          className="h-9 bg-gray-100"
                        />
                      </div>
                    </div>
                  ) : (
                    /* 기타 회원권: 개월수 기반 */
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">개월수 <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={membership.duration_months}
                          onChange={(e) => updateNewMemberMembership(index, "duration_months", e.target.value)}
                          placeholder="3"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
                        <Input
                          type="date"
                          value={membership.start_date}
                          onChange={(e) => updateNewMemberMembership(index, "start_date", e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">종료일 (자동계산)</Label>
                        <Input
                          type="date"
                          value={membership.end_date}
                          readOnly
                          className="h-9 bg-gray-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">세션 (선택)</Label>
                        <Input
                          type="number"
                          value={membership.total_sessions}
                          onChange={(e) => updateNewMemberMembership(index, "total_sessions", e.target.value)}
                          placeholder="횟수 제한 시 입력"
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">결제방법</Label>
                    <Select
                      value={membership.payment_method}
                      onValueChange={(v) => updateNewMemberMembership(index, "payment_method", v)}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="card">카드</SelectItem>
                        <SelectItem value="cash">현금</SelectItem>
                        <SelectItem value="transfer">계좌이체</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. 부가상품 추가 섹션 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-sm text-gray-700">부가상품 추가 (선택)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewMemberAddon}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  부가상품 추가
                </Button>
              </div>

              {newMemberAddons.map((addon, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">부가상품 #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewMemberAddon(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">상품 유형 *</Label>
                      <Select
                        value={addon.addon_type}
                        onValueChange={(v) => updateNewMemberAddon(index, "addon_type", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="개인락커">개인락커</SelectItem>
                          <SelectItem value="물품락커">물품락커</SelectItem>
                          <SelectItem value="운동복">운동복</SelectItem>
                          <SelectItem value="양말">양말</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {addon.addon_type === "기타" && (
                      <div className="space-y-1">
                        <Label className="text-xs">상품명 *</Label>
                        <Input
                          value={addon.custom_addon_name}
                          onChange={(e) => updateNewMemberAddon(index, "custom_addon_name", e.target.value)}
                          placeholder="상품명"
                          className="h-9"
                        />
                      </div>
                    )}

                    {(addon.addon_type === "개인락커" || addon.addon_type === "물품락커") && (
                      <div className="space-y-1">
                        <Label className="text-xs">락커 번호</Label>
                        <Input
                          value={addon.locker_number}
                          onChange={(e) => updateNewMemberAddon(index, "locker_number", e.target.value)}
                          placeholder="예: 15"
                          className="h-9"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">금액 *</Label>
                      <Input
                        type="number"
                        value={addon.amount}
                        onChange={(e) => updateNewMemberAddon(index, "amount", e.target.value)}
                        placeholder="50000"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">결제방법</Label>
                      <Select
                        value={addon.method}
                        onValueChange={(v) => updateNewMemberAddon(index, "method", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="card">카드</SelectItem>
                          <SelectItem value="cash">현금</SelectItem>
                          <SelectItem value="transfer">계좌이체</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">기간</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={addon.duration}
                          onChange={(e) => updateNewMemberAddon(index, "duration", e.target.value)}
                          placeholder="숫자"
                          className="h-9 flex-1"
                        />
                        <Select
                          value={addon.duration_type}
                          onValueChange={(v) => updateNewMemberAddon(index, "duration_type", v)}
                        >
                          <SelectTrigger className="h-9 w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="months">개월</SelectItem>
                            <SelectItem value="days">일</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {newMemberAddons.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  락커, 운동복 등 부가상품을 함께 등록할 수 있습니다.
                </p>
              )}
            </div>

            {/* 4. 담당자 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">담당자 정보</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록자</Label>
                  <Select
                    value={createForm.registered_by}
                    onValueChange={(v) => setCreateForm({...createForm, registered_by: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {staffList.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.job_title})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">담당트레이너</Label>
                  <Select
                    value={createForm.trainer_id}
                    onValueChange={(v) => setCreateForm({...createForm, trainer_id: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {staffList.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.job_title})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 5. 인바디 정보 섹션 (선택) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">인바디 정보 (선택)</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">몸무게 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={createForm.weight}
                    onChange={(e) => setCreateForm({...createForm, weight: e.target.value})}
                    placeholder="70.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">체지방량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={createForm.body_fat_mass}
                    onChange={(e) => setCreateForm({...createForm, body_fat_mass: e.target.value})}
                    placeholder="15.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">골격근량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={createForm.skeletal_muscle_mass}
                    onChange={(e) => setCreateForm({...createForm, skeletal_muscle_mass: e.target.value})}
                    placeholder="32.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">운동목적</Label>
                  <Input
                    value={createForm.exercise_goal}
                    onChange={(e) => setCreateForm({...createForm, exercise_goal: e.target.value})}
                    placeholder="다이어트, 근력강화 등"
                  />
                </div>
              </div>
            </div>

            {/* 6. 메모 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">메모</h3>

              <div className="space-y-2">
                <Textarea
                  value={createForm.memo}
                  onChange={(e) => setCreateForm({...createForm, memo: e.target.value})}
                  placeholder="특이사항이나 메모를 입력하세요"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateMember} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isLoading}>
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원 상세 모달 */}
      <Dialog open={isMemberDetailOpen} onOpenChange={setIsMemberDetailOpen}>
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {selectedMember?.name} 회원 상세 정보
            </DialogTitle>
            <DialogDescription className="sr-only">회원 상세 정보를 확인합니다</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 회원 기본 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-gray-900">기본 정보</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-600">이름:</span> <span className="font-medium">{selectedMember?.name}</span></div>
                <div><span className="text-gray-600">연락처:</span> <span className="font-medium">{selectedMember?.phone || "-"}</span></div>
                <div><span className="text-gray-600">생년월일:</span> <span className="font-medium">{selectedMember?.birth_date || "-"}</span></div>
                <div><span className="text-gray-600">성별:</span> <span className="font-medium">{selectedMember?.gender === "male" ? "남성" : selectedMember?.gender === "female" ? "여성" : "-"}</span></div>
              </div>
            </div>

            {/* 현재 회원권 정보 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-blue-900">현재 회원권</h3>
              {selectedMember?.activeMembership ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-blue-700">회원권명:</span> <span className="font-medium text-blue-900">{selectedMember.activeMembership.name}</span></div>
                  <div><span className="text-blue-700">유형:</span> <span className="font-medium text-blue-900">{selectedMember.activeMembership.membership_type}</span></div>
                  <div><span className="text-blue-700">시작일:</span> <span className="font-medium text-blue-900">{selectedMember.activeMembership.start_date}</span></div>
                  <div><span className="text-blue-700">종료일:</span> <span className="font-medium text-blue-900">{selectedMember.activeMembership.end_date}</span></div>
                  <div><span className="text-blue-700">총 횟수:</span> <span className="font-medium text-blue-900">{selectedMember.activeMembership.total_sessions}회</span></div>
                  <div><span className="text-blue-700">사용 횟수:</span> <span className="font-medium text-blue-900">{selectedMember.activeMembership.used_sessions}회</span></div>
                  <div><span className="text-blue-700">잔여 횟수:</span> <span className="font-medium text-red-600">{selectedMember.activeMembership.total_sessions - selectedMember.activeMembership.used_sessions}회</span></div>
                  <div><span className="text-blue-700">상태:</span> <Badge className="border-0 bg-emerald-100 text-emerald-700">{selectedMember.activeMembership.status}</Badge></div>
                </div>
              ) : (
                <p className="text-blue-700">현재 활성 회원권이 없습니다.</p>
              )}
            </div>

            {/* 결제 이력 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">결제 이력</h3>
              {memberPaymentHistory.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">날짜</th>
                        <th className="px-4 py-3 text-left">회원권</th>
                        <th className="px-4 py-3 text-left">금액</th>
                        <th className="px-4 py-3 text-left">결제수단</th>
                        <th className="px-4 py-3 text-left">메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberPaymentHistory.map((payment: any) => (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {new Date(payment.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3">
                            {payment.member_memberships?.name || "-"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-600">
                            {payment.amount.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3">
                            {payment.method === "card" ? "카드" : payment.method === "cash" ? "현금" : payment.method === "transfer" ? "계좌이체" : payment.method}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {payment.memo || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">결제 이력이 없습니다.</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMemberDetailOpen(false)}
            >
              닫기
            </Button>
            <Button
              onClick={() => {
                setIsMemberDetailOpen(false);
                openMemberEditModal(selectedMember);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Pencil className="mr-2 h-4 w-4" />
              회원정보 수정
            </Button>
            {selectedMember?.activeMembership && (
              <Button
                onClick={() => {
                  setIsMemberDetailOpen(false);
                  openMembershipEditModal(selectedMember);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                <Pencil className="mr-2 h-4 w-4" />
                회원권 수정
              </Button>
            )}
            <Button
              onClick={() => {
                setIsMemberDetailOpen(false);
                openMembershipModal(selectedMember);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              회원권 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원정보 수정 모달 */}
      <Dialog open={isMemberEditOpen} onOpenChange={setIsMemberEditOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>회원정보 수정 - {selectedMember?.name}</DialogTitle>
            <DialogDescription className="sr-only">회원정보를 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이름 <span className="text-red-500">*</span></Label>
                <Input
                  value={memberEditForm.name}
                  onChange={(e) => setMemberEditForm({...memberEditForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>연락처</Label>
                <Input
                  value={memberEditForm.phone}
                  onChange={(e) => setMemberEditForm({...memberEditForm, phone: formatPhoneNumberOnChange(e.target.value)})}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>생년월일</Label>
                <Input
                  type="date"
                  value={memberEditForm.birth_date}
                  onChange={(e) => setMemberEditForm({...memberEditForm, birth_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>성별</Label>
                <Select value={memberEditForm.gender} onValueChange={(v) => setMemberEditForm({...memberEditForm, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">남성</SelectItem>
                    <SelectItem value="female">여성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 담당 트레이너 */}
            <div className="space-y-2">
              <Label>담당 트레이너</Label>
              <Select value={memberEditForm.trainer_id || "none"} onValueChange={(v) => setMemberEditForm({...memberEditForm, trainer_id: v === "none" ? "" : v})}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {staffList.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 운동 목표 */}
            <div className="space-y-2">
              <Label>운동 목표</Label>
              <Input
                value={memberEditForm.exercise_goal}
                onChange={(e) => setMemberEditForm({...memberEditForm, exercise_goal: e.target.value})}
                placeholder="예: 체중 감량, 근력 강화"
              />
            </div>

            {/* 인바디 정보 */}
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">인바디 정보</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">체중 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={memberEditForm.weight}
                    onChange={(e) => setMemberEditForm({...memberEditForm, weight: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">체지방량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={memberEditForm.body_fat_mass}
                    onChange={(e) => setMemberEditForm({...memberEditForm, body_fat_mass: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">골격근량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={memberEditForm.skeletal_muscle_mass}
                    onChange={(e) => setMemberEditForm({...memberEditForm, skeletal_muscle_mass: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div className="space-y-2">
              <Label>메모</Label>
              <Textarea
                value={memberEditForm.memo}
                onChange={(e) => setMemberEditForm({...memberEditForm, memo: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberEditOpen(false)}>취소</Button>
            <Button onClick={handleUpdateMemberInfo} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원권 수정 모달 */}
      <Dialog open={isMembershipEditOpen} onOpenChange={setIsMembershipEditOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>회원권 수정 - {selectedMember?.name}</DialogTitle>
            <DialogDescription className="sr-only">회원권 정보를 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 회원권명 (읽기 전용) */}
            <div className="space-y-2">
              <Label className="text-gray-700">회원권명</Label>
              <Input
                value={membershipEditForm.name}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* 회원권 유형 (읽기 전용) */}
            <div className="space-y-2">
              <Label className="text-gray-700">회원권 유형</Label>
              <Input
                value={membershipEditForm.membership_type}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* 시작일 */}
            <div className="space-y-2">
              <Label className="text-gray-700">시작일</Label>
              <Input
                type="date"
                value={membershipEditForm.start_date}
                onChange={(e) => setMembershipEditForm({...membershipEditForm, start_date: e.target.value})}
              />
            </div>

            {/* 종료일 */}
            <div className="space-y-2">
              <Label className="text-gray-700">종료일</Label>
              <Input
                type="date"
                value={membershipEditForm.end_date}
                onChange={(e) => setMembershipEditForm({...membershipEditForm, end_date: e.target.value})}
              />
            </div>

            {/* 총 횟수 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">총 횟수</Label>
                <Input
                  type="number"
                  value={membershipEditForm.total_sessions}
                  onChange={(e) => setMembershipEditForm({...membershipEditForm, total_sessions: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">사용 횟수</Label>
                <Input
                  type="number"
                  value={membershipEditForm.used_sessions}
                  onChange={(e) => setMembershipEditForm({...membershipEditForm, used_sessions: e.target.value})}
                />
              </div>
            </div>

            {/* 잔여 횟수 표시 */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-blue-700 font-medium">
                잔여 횟수: {(parseInt(membershipEditForm.total_sessions) || 0) - (parseInt(membershipEditForm.used_sessions) || 0)}회
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMembershipEditOpen(false)}>취소</Button>
            <Button
              onClick={handleEditMembership}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원권 등록 모달 */}
      <Dialog open={isMembershipOpen} onOpenChange={(open) => {
        setIsMembershipOpen(open);
        if (!open) {
          setMembershipModalAddons([]); // 모달 닫을 때 초기화
        }
      }}>
        <DialogContent className="bg-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원권 추가 - {selectedMember?.name}</DialogTitle>
            <DialogDescription className="sr-only">회원권을 추가합니다</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 1. 회원권 섹션 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-sm text-gray-700">회원권</h3>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
                {/* 상품 선택 */}
                <div className="space-y-2">
                  <Label className="text-xs">회원권명 <span className="text-red-500">*</span></Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={(productId) => {
                      const product = products.find(p => p.id === productId);
                      if (product) {
                        setSelectedProductId(productId);

                        // PT/PPT/GPT 타입인 경우 총 유효일수 계산
                        const isPTTypeProduct = product.membership_type === 'PT' || product.membership_type === 'PPT' || product.membership_type === 'GPT';
                        let calculatedEndDate = "";

                        if (isPTTypeProduct && product.default_sessions && product.days_per_session) {
                          const totalDays = product.default_sessions * product.days_per_session;
                          const startDate = new Date(membershipForm.start_date);
                          const endDate = new Date(startDate);
                          endDate.setDate(startDate.getDate() + totalDays);
                          calculatedEndDate = endDate.toISOString().split('T')[0];
                        } else if (product.validity_months) {
                          // 기타 타입: 유효기간(개월) 사용
                          const startDate = new Date(membershipForm.start_date);
                          const endDate = new Date(startDate);
                          endDate.setMonth(startDate.getMonth() + product.validity_months);
                          calculatedEndDate = endDate.toISOString().split('T')[0];
                        }

                        setMembershipForm({
                          ...membershipForm,
                          name: product.name,
                          total_sessions: product.default_sessions?.toString() || "",
                          amount: product.default_price.toString(),
                          end_date: calculatedEndDate
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="상품을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {products.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          등록된 상품이 없습니다.<br />
                          상품 관리 탭에서 먼저 상품을 등록해주세요.
                        </div>
                      ) : (
                        products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">총 횟수</Label>
                    <Input
                      type="number"
                      value={membershipForm.total_sessions}
                      onChange={(e) => setMembershipForm({...membershipForm, total_sessions: e.target.value})}
                      placeholder="30"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">판매금액 (원) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={membershipForm.amount}
                      onChange={(e) => setMembershipForm({...membershipForm, amount: e.target.value})}
                      placeholder="1000000"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">결제방법</Label>
                    <Select value={membershipForm.method} onValueChange={(v) => setMembershipForm({...membershipForm, method: v})}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="card">카드</SelectItem>
                        <SelectItem value="cash">현금</SelectItem>
                        <SelectItem value="transfer">계좌이체</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">시작일</Label>
                    <Input
                      type="date"
                      value={membershipForm.start_date}
                      onChange={(e) => setMembershipForm({...membershipForm, start_date: e.target.value})}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">종료일</Label>
                    <Input
                      type="date"
                      value={membershipForm.end_date}
                      onChange={(e) => setMembershipForm({...membershipForm, end_date: e.target.value})}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 부가상품 추가 섹션 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-sm text-gray-700">부가상품 추가 (선택)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMembershipModalAddon}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  부가상품 추가
                </Button>
              </div>

              {membershipModalAddons.map((addon, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">부가상품 #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMembershipModalAddon(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">상품 유형 *</Label>
                      <Select
                        value={addon.addon_type}
                        onValueChange={(v) => updateMembershipModalAddon(index, "addon_type", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="개인락커">개인락커</SelectItem>
                          <SelectItem value="물품락커">물품락커</SelectItem>
                          <SelectItem value="운동복">운동복</SelectItem>
                          <SelectItem value="양말">양말</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {addon.addon_type === "기타" && (
                      <div className="space-y-1">
                        <Label className="text-xs">상품명 *</Label>
                        <Input
                          value={addon.custom_addon_name}
                          onChange={(e) => updateMembershipModalAddon(index, "custom_addon_name", e.target.value)}
                          placeholder="상품명"
                          className="h-9"
                        />
                      </div>
                    )}

                    {(addon.addon_type === "개인락커" || addon.addon_type === "물품락커") && (
                      <div className="space-y-1">
                        <Label className="text-xs">락커 번호</Label>
                        <Input
                          value={addon.locker_number}
                          onChange={(e) => updateMembershipModalAddon(index, "locker_number", e.target.value)}
                          placeholder="예: 15"
                          className="h-9"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">금액 *</Label>
                      <Input
                        type="number"
                        value={addon.amount}
                        onChange={(e) => updateMembershipModalAddon(index, "amount", e.target.value)}
                        placeholder="50000"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">결제방법</Label>
                      <Select
                        value={addon.method}
                        onValueChange={(v) => updateMembershipModalAddon(index, "method", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="card">카드</SelectItem>
                          <SelectItem value="cash">현금</SelectItem>
                          <SelectItem value="transfer">계좌이체</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">시작일</Label>
                      <Input
                        type="date"
                        value={addon.start_date}
                        onChange={(e) => updateMembershipModalAddon(index, "start_date", e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">기간</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={addon.duration}
                          onChange={(e) => updateMembershipModalAddon(index, "duration", e.target.value)}
                          placeholder="숫자"
                          className="h-9 flex-1"
                        />
                        <Select
                          value={addon.duration_type}
                          onValueChange={(v) => updateMembershipModalAddon(index, "duration_type", v)}
                        >
                          <SelectTrigger className="h-9 w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="months">개월</SelectItem>
                            <SelectItem value="days">일</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">종료일 (자동계산)</Label>
                      <Input
                        type="date"
                        value={addon.end_date}
                        readOnly
                        className="h-9 bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {membershipModalAddons.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  락커, 운동복 등 부가상품을 함께 등록할 수 있습니다.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMembershipOpen(false)}>취소</Button>
            <Button onClick={handleUpdateMembership} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isLoading}>
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* 기존회원 매출등록 모달 */}
      <ExistingSalesModal
        isOpen={isExistingSalesOpen}
        onClose={() => {
          setIsExistingSalesOpen(false);
          setSelectedExistingProductId("");
          setExistingMemberSearch("");
          setExistingMemberAddons([]);
        }}
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
