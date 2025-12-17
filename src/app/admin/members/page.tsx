"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, CreditCard, Upload, Eye, ArrowUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError, showConfirm } from "@/lib/utils/error-handler";
import { usePaginatedMembers } from "@/lib/hooks/usePaginatedMembers";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { MembersTable } from "./components/MembersTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductsTab } from "./components/ProductsTab";
import { MembershipProduct } from "@/types/membership";

// 동적 렌더링 강제 (useSearchParams 사용)
export const dynamic = 'force-dynamic';

// 실제 컨텐츠 컴포넌트 (useSearchParams 사용)
function AdminMembersPageContent() {
  const searchParams = useSearchParams();
  const registrationType = searchParams.get('type'); // 'new' or 'existing'

  // Feature flags
  const usePagination = process.env.NEXT_PUBLIC_USE_PAGINATED_MEMBERS === "true";
  const useTanStackTable = process.env.NEXT_PUBLIC_USE_TANSTACK_TABLE === "true";

  const [activeTab, setActiveTab] = useState<"members" | "products">("members");
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("created_at"); // 정렬 기준
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // 정렬 순서

  // 검색 디바운싱 (300ms 지연)
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [gymId, setGymId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");

  // 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSimpleMemberCreateOpen, setIsSimpleMemberCreateOpen] = useState(false); // 간단한 회원 등록 모달 (매출 없이)
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [isExistingSalesOpen, setIsExistingSalesOpen] = useState(false); // 기존회원 매출등록 모달
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false); // Excel 가져오기 모달
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false); // 회원 상세 모달
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<any[]>([]); // 회원 결제 이력

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

  // 폼 상태 (확장)
  const [createForm, setCreateForm] = useState({
    // 필수 정보
    name: "",
    phone: "",
    registered_at: new Date().toISOString().split('T')[0],

    // 회원권 정보
    membership_name: "PT 30회",
    total_sessions: "30",
    membership_amount: "",

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

  const [isLoading, setIsLoading] = useState(false);

  const supabase = createSupabaseClient();

  // 페이지네이션 훅 (Feature Flag로 활성화된 경우)
  // 디바운스된 검색어를 사용하여 불필요한 API 호출 방지
  const paginatedData = usePaginatedMembers({
    gymId,
    companyId,
    trainerId: myRole === "staff" ? myStaffId : null,
    search: debouncedSearch,
    status: statusFilter,
    page: currentPage,
    enabled: usePagination,
  });

  useEffect(() => {
    init();
  }, []);

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

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 내 정보 가져오기
    const { data: me } = await supabase
      .from("staffs")
      .select("id, gym_id, company_id, role, gyms(name)")
      .eq("user_id", user.id)
      .single();

    if (me) {
      setGymId(me.gym_id);
      setCompanyId(me.company_id);
      setMyStaffId(me.id);
      setMyRole(me.role);
      // @ts-ignore
      setGymName(me.gyms?.name ?? "We:form");

      // 등록자를 현재 로그인한 사람으로 자동 설정
      setCreateForm(prev => ({
        ...prev,
        registered_by: me.id,
        trainer_id: me.id // 기본값으로 본인 설정
      }));

      fetchMembers(me.gym_id, me.company_id, me.role, me.id);
      fetchStaffList(me.gym_id);
      fetchProducts(me.gym_id);
    }
  };

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
        member_memberships!inner (
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
      console.error("회원 조회 에러:", error);
      return;
    }

    // 회원권 정보를 집계
    const membersWithMemberships = (data || []).map((member: any) => {
      const memberships = member.member_memberships || [];
      const activeMembership = memberships.find((m: any) => m.status === 'active');

      return {
        ...member,
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
      alert("필수 항목을 모두 입력해주세요.\n(회원명, 연락처)");
      return;
    }

    // 회원권 선택 시 시작일/종료일 필수
    if (simpleMemberForm.membership_product_id) {
      if (!simpleMemberForm.membership_start_date || !simpleMemberForm.membership_end_date) {
        alert("회원권 시작일과 종료일을 입력해주세요.");
        return;
      }
    }

    if (!gymId || !companyId) {
      alert("지점 정보를 찾을 수 없습니다.");
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

      console.log('📊 Excel 원본 데이터 샘플:', jsonData[0]); // 디버깅용

      // 데이터 매핑
      const mapped = jsonData.map((row: any) => {
        const birthDate = excelDateToString(row['생년월일']);
        const startDate = excelDateToString(row['시작일']);
        const endDate = excelDateToString(row['종료일']);

        // 디버깅: 날짜 변환 확인
        console.log('날짜 변환:', {
          원본_생년월일: row['생년월일'],
          변환_생년월일: birthDate,
          원본_시작일: row['시작일'],
          변환_시작일: startDate,
          원본_종료일: row['종료일'],
          변환_종료일: endDate
        });

        return {
          name: row['회원명'] || row['이름'] || '',
          phone: row['연락처'] || row['전화번호'] || '',
          birth_date: birthDate,
          gender: row['성별'] === '남성' || row['성별'] === '남' ? 'male' : row['성별'] === '여성' || row['성별'] === '여' ? 'female' : '',
          membership_name: row['회원권이름'] || row['회원권'] || '',
          membership_start_date: startDate,
          membership_end_date: endDate,
        };
      });

      console.log('✅ 변환된 데이터 샘플:', mapped[0]); // 디버깅용

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
      alert('가져올 데이터가 없습니다.');
      return;
    }

    if (!gymId || !companyId) {
      alert('지점 정보를 찾을 수 없습니다.');
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

          // 2. 회원권이 있으면 회원권 생성
          if (row.membership_name && row.membership_start_date && row.membership_end_date && newMember) {
            const { error: membershipError } = await supabase
              .from('member_memberships')
              .insert({
                company_id: companyId,
                gym_id: gymId,
                member_id: newMember.id,
                name: row.membership_name,
                membership_type: 'PT', // 기본값, 상품명으로 추론 가능하면 개선 가능
                total_sessions: null,
                used_sessions: 0,
                start_date: row.membership_start_date,
                end_date: row.membership_end_date,
                status: 'active'
              });

            if (membershipError) {
              console.error('회원권 등록 실패:', membershipError);
              // 회원권 실패해도 회원은 등록됨
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

  const handleCreateMember = async () => {
    // 필수 항목 검증
    if (!createForm.name || !createForm.phone || !createForm.registered_at ||
        !createForm.membership_amount || !createForm.total_sessions ||
        !createForm.trainer_id) {
      alert("필수 항목을 모두 입력해주세요.\n(회원명, 연락처, 등록날짜, 등록금액, 등록세션, 담당트레이너)");
      return;
    }

    if (!gymId || !companyId) {
      alert("지점 정보를 찾을 수 없습니다.");
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
          trainer_id: createForm.trainer_id,
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

      // 2. 회원권 등록
      const { data: membership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id: gymId,
          member_id: member.id,
          name: createForm.membership_name,
          total_sessions: parseInt(createForm.total_sessions),
          used_sessions: 0,
          start_date: createForm.registered_at,
          end_date: null,
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
          method: "card", // 기본값
          membership_type: "PT",
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
        method: "card",
        memo: `${createForm.name} - ${createForm.membership_name} 신규 등록`,
        occurred_at: createForm.registered_at
      });

      showSuccess("회원이 등록되었습니다!");
      setIsCreateOpen(false);
      setSelectedProductId(""); // 상품 선택 초기화

      // 폼 초기화
      setCreateForm({
        name: "",
        phone: "",
        registered_at: new Date().toISOString().split('T')[0],
        membership_name: "PT 30회",
        total_sessions: "30",
        membership_amount: "",
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
    setMembershipForm({
      // 회원권 정보
      name: "PT 30회",
      total_sessions: "30",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      amount: "",
      method: "card",
      // 회원 정보 (선택된 회원의 정보로 채움)
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

  const handleCreateMembership = async () => {
    if (!selectedMember || !gymId || !companyId) return;
    if (!membershipForm.name || !membershipForm.total_sessions) {
      alert("회원권 이름과 횟수는 필수입니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 회원권 생성
      const { data: membership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id: gymId,
          member_id: selectedMember.id,
          name: membershipForm.name,
          total_sessions: parseInt(membershipForm.total_sessions),
          used_sessions: 0,
          start_date: membershipForm.start_date || null,
          end_date: membershipForm.end_date || null,
          status: "active"
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      // 2. 결제 정보가 있으면 결제 기록 생성
      if (membershipForm.amount && parseFloat(membershipForm.amount) > 0) {
        const { error: paymentError } = await supabase
          .from("member_payments")
          .insert({
            company_id: companyId,
            gym_id: gymId,
            member_id: selectedMember.id,
            membership_id: membership.id,
            amount: parseFloat(membershipForm.amount),
            method: membershipForm.method,
            memo: `${membershipForm.name} 구매`
          });

        if (paymentError) throw paymentError;

        // 3. 매출 로그에도 기록
        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          type: "sale",
          amount: parseFloat(membershipForm.amount),
          method: membershipForm.method,
          memo: `${selectedMember.name} - ${membershipForm.name}`,
          occurred_at: new Date().toISOString()
        });
      }

      // 4. 회원 정보 업데이트
      const memberUpdateData: any = {};
      if (membershipForm.member_name) memberUpdateData.name = membershipForm.member_name;
      if (membershipForm.member_phone) memberUpdateData.phone = membershipForm.member_phone;
      if (membershipForm.birth_date) memberUpdateData.birth_date = membershipForm.birth_date;
      if (membershipForm.gender) memberUpdateData.gender = membershipForm.gender;
      if (membershipForm.exercise_goal) memberUpdateData.exercise_goal = membershipForm.exercise_goal;
      if (membershipForm.weight) memberUpdateData.weight = parseFloat(membershipForm.weight);
      if (membershipForm.body_fat_mass) memberUpdateData.body_fat_mass = parseFloat(membershipForm.body_fat_mass);
      if (membershipForm.skeletal_muscle_mass) memberUpdateData.skeletal_muscle_mass = parseFloat(membershipForm.skeletal_muscle_mass);
      if (membershipForm.trainer_id) memberUpdateData.trainer_id = membershipForm.trainer_id;
      if (membershipForm.memo) memberUpdateData.memo = membershipForm.memo;

      if (Object.keys(memberUpdateData).length > 0) {
        const { error: memberUpdateError } = await supabase
          .from("members")
          .update(memberUpdateData)
          .eq("id", selectedMember.id);

        if (memberUpdateError) throw memberUpdateError;
      }

      showSuccess("회원권이 등록되었습니다!");
      setIsMembershipOpen(false);

      // 데이터 새로고침
      if (usePagination) {
        paginatedData.mutate();
      } else {
        fetchMembers(gymId, companyId, myRole, myStaffId!);
      }
    } catch (error: any) {
      showError(error, "회원권 등록");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingSales = async () => {
    if (!existingSalesForm.member_id || !existingSalesForm.registration_type) {
      alert("회원과 등록 타입을 선택해주세요.");
      return;
    }

    if (!gymId || !companyId) {
      alert("지점 정보를 찾을 수 없습니다.");
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
          alert("활성 회원권이 없습니다. 부가상품으로 등록해주세요.");
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
          alert("활성 회원권이 없습니다.");
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

      showSuccess("매출이 등록되었습니다!");
      setIsExistingSalesOpen(false);
      setSelectedExistingProductId(""); // 상품 선택 초기화

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
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-500 mt-2 font-medium">{gymName}의 회원을 관리합니다</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setIsSimpleMemberCreateOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 shadow-sm"
          >
            <UserPlus className="mr-2 h-4 w-4"/> 회원 등록
          </Button>
          <Button
            onClick={() => setIsExcelImportOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 shadow-sm"
          >
            <Upload className="mr-2 h-4 w-4"/> Excel 가져오기
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 shadow-sm"
          >
            <UserPlus className="mr-2 h-4 w-4"/> 신규회원 매출등록
          </Button>
          <Button
            onClick={() => setIsExistingSalesOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 shadow-sm"
          >
            <CreditCard className="mr-2 h-4 w-4"/> 기존회원 매출등록
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">전체 회원</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{members.length}명</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">활성 회원</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {members.filter(m => m.status === 'active').length}명
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">휴면 회원</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {members.filter(m => m.status === 'paused').length}명
          </div>
        </div>
      </div>

      {/* 회원 목록 - TanStack Table 또는 기존 테이블 */}
      {useTanStackTable ? (
        <MembersTable
          data={displayMembers}
          isLoading={isDataLoading}
          onAddMembership={openMembershipModal}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkTrainerAssign={handleBulkTrainerAssign}
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
                  <td colSpan={10} className="text-center py-20 text-gray-400">
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
                      <td colSpan={10} className="text-center py-20 text-gray-400">
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
        if (!open) setSelectedProductId(""); // 모달 닫을 때 상품 선택 초기화
      }}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신규 회원 등록</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">

            {/* 필수 정보 섹션 */}
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
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록날짜 <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={createForm.registered_at}
                    onChange={(e) => setCreateForm({...createForm, registered_at: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록금액 (원) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={createForm.membership_amount}
                    onChange={(e) => setCreateForm({...createForm, membership_amount: e.target.value})}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록세션 (회) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={createForm.total_sessions}
                    onChange={(e) => setCreateForm({...createForm, total_sessions: e.target.value})}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">회원권명 <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(productId) => {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                      setSelectedProductId(productId);
                      setCreateForm({
                        ...createForm,
                        membership_name: product.name,
                        total_sessions: product.default_sessions?.toString() || "0",
                        membership_amount: product.default_price.toString()
                      });
                    }
                  }}
                >
                  <SelectTrigger>
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

                {/* 선택된 상품 정보 표시 */}
                {selectedProductId && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <div className="text-blue-900 font-medium mb-1">선택한 상품 정보</div>
                    <div className="text-blue-700">
                      기본 횟수: {createForm.total_sessions}회 / 기본 가격: {parseInt(createForm.membership_amount).toLocaleString()}원
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      * 필요시 횟수와 금액을 수정할 수 있습니다.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 담당자 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">담당자 정보</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록자 <span className="text-red-500">*</span></Label>
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
                  <Label className="text-[#0F4C5C]">담당트레이너 <span className="text-red-500">*</span></Label>
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

            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">기본 정보 (선택)</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* 인바디 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">인바디 정보 (선택)</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>

            {/* 메모 섹션 */}
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMemberDetailOpen(false)}
            >
              닫기
            </Button>
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

      {/* 회원권 등록 모달 */}
      <Dialog open={isMembershipOpen} onOpenChange={setIsMembershipOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>회원권 등록 - {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>회원권 이름 <span className="text-red-500">*</span></Label>
              <Input
                value={membershipForm.name}
                onChange={(e) => setMembershipForm({...membershipForm, name: e.target.value})}
                placeholder="예: PT 30회, OT 20회"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>총 횟수 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={membershipForm.total_sessions}
                  onChange={(e) => setMembershipForm({...membershipForm, total_sessions: e.target.value})}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>결제 금액 (원)</Label>
                <Input
                  type="number"
                  value={membershipForm.amount}
                  onChange={(e) => setMembershipForm({...membershipForm, amount: e.target.value})}
                  placeholder="1000000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={membershipForm.start_date}
                  onChange={(e) => setMembershipForm({...membershipForm, start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={membershipForm.end_date}
                  onChange={(e) => setMembershipForm({...membershipForm, end_date: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>결제 방법</Label>
              <Select value={membershipForm.method} onValueChange={(v) => setMembershipForm({...membershipForm, method: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 회원 정보 섹션 */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">회원 정보</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>이름</Label>
                    <Input
                      value={membershipForm.member_name}
                      onChange={(e) => setMembershipForm({...membershipForm, member_name: e.target.value})}
                      placeholder="이름"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>전화번호</Label>
                    <Input
                      value={membershipForm.member_phone}
                      onChange={(e) => setMembershipForm({...membershipForm, member_phone: e.target.value})}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>생년월일</Label>
                    <Input
                      type="date"
                      value={membershipForm.birth_date}
                      onChange={(e) => setMembershipForm({...membershipForm, birth_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>성별</Label>
                    <Select value={membershipForm.gender} onValueChange={(v) => setMembershipForm({...membershipForm, gender: v})}>
                      <SelectTrigger><SelectValue placeholder="성별 선택" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="male">남성</SelectItem>
                        <SelectItem value="female">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>운동 목표</Label>
                  <Input
                    value={membershipForm.exercise_goal}
                    onChange={(e) => setMembershipForm({...membershipForm, exercise_goal: e.target.value})}
                    placeholder="예: 다이어트, 근력 향상"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>체중 (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={membershipForm.weight}
                      onChange={(e) => setMembershipForm({...membershipForm, weight: e.target.value})}
                      placeholder="70.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>체지방량 (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={membershipForm.body_fat_mass}
                      onChange={(e) => setMembershipForm({...membershipForm, body_fat_mass: e.target.value})}
                      placeholder="15.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>골격근량 (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={membershipForm.skeletal_muscle_mass}
                      onChange={(e) => setMembershipForm({...membershipForm, skeletal_muscle_mass: e.target.value})}
                      placeholder="30.0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>담당 트레이너</Label>
                  <Select value={membershipForm.trainer_id} onValueChange={(v) => setMembershipForm({...membershipForm, trainer_id: v})}>
                    <SelectTrigger><SelectValue placeholder="트레이너 선택 (선택사항)" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {staffList.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>메모</Label>
                  <Textarea
                    value={membershipForm.memo}
                    onChange={(e) => setMembershipForm({...membershipForm, memo: e.target.value})}
                    placeholder="메모를 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateMembership} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isLoading}>
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기존회원 매출등록 모달 */}
      <Dialog open={isExistingSalesOpen} onOpenChange={(open) => {
        setIsExistingSalesOpen(open);
        if (!open) setSelectedExistingProductId(""); // 모달 닫을 때 상품 선택 초기화
      }}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>기존회원 매출등록</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">

            {/* 회원 선택 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">회원 선택</h3>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">회원 <span className="text-red-500">*</span></Label>
                <Select
                  value={existingSalesForm.member_id}
                  onValueChange={(v) => {
                    const selectedMember = members.find(m => m.id === v);
                    if (selectedMember) {
                      setSelectedMember(selectedMember);
                      setExistingSalesForm({
                        ...existingSalesForm,
                        member_id: v,
                        member_name: selectedMember.name || "",
                        member_phone: selectedMember.phone || "",
                        birth_date: selectedMember.birth_date || "",
                        gender: selectedMember.gender || "",
                        exercise_goal: selectedMember.exercise_goal || "",
                        weight: selectedMember.weight?.toString() || "",
                        body_fat_mass: selectedMember.body_fat_mass?.toString() || "",
                        skeletal_muscle_mass: selectedMember.skeletal_muscle_mass?.toString() || "",
                        trainer_id: selectedMember.trainer_id || ""
                      });
                    } else {
                      setExistingSalesForm({
                        ...existingSalesForm,
                        member_id: v
                      });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="회원 선택" /></SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px]">
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.phone})
                        {member.activeMembership && ` - ${member.activeMembership.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 등록 타입 선택 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">등록 타입</h3>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">등록 타입 <span className="text-red-500">*</span></Label>
                <Select
                  value={existingSalesForm.registration_type}
                  onValueChange={(v) => setExistingSalesForm({...existingSalesForm, registration_type: v})}
                >
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="리뉴">리뉴 (회원권 갱신)</SelectItem>
                    <SelectItem value="기간변경">기간변경</SelectItem>
                    <SelectItem value="부가상품">부가상품 (새 회원권 추가)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 선택된 회원의 현재 회원권 정보 표시 */}
              {selectedMember && selectedMember.activeMembership && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-semibold text-blue-900 mb-2">현재 활성 회원권</div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• 회원권: {selectedMember.activeMembership.name}</div>
                    <div>• 잔여횟수: {selectedMember.activeMembership.total_sessions - selectedMember.activeMembership.used_sessions} / {selectedMember.activeMembership.total_sessions}회</div>
                    {selectedMember.activeMembership.end_date && (
                      <div>• 만료일: {new Date(selectedMember.activeMembership.end_date).toLocaleDateString('ko-KR')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 리뉴: 추가 횟수 입력 */}
            {existingSalesForm.registration_type === "리뉴" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">리뉴 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#0F4C5C]">추가 횟수 (회) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={existingSalesForm.additional_sessions}
                      onChange={(e) => setExistingSalesForm({...existingSalesForm, additional_sessions: e.target.value})}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F4C5C]">연장 만료일</Label>
                    <Input
                      type="date"
                      value={existingSalesForm.end_date}
                      onChange={(e) => setExistingSalesForm({...existingSalesForm, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 기간변경: 만료일만 입력 */}
            {existingSalesForm.registration_type === "기간변경" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">기간 정보</h3>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">새 만료일 <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={existingSalesForm.end_date}
                    onChange={(e) => setExistingSalesForm({...existingSalesForm, end_date: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* 부가상품: 새 회원권 정보 입력 */}
            {existingSalesForm.registration_type === "부가상품" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">부가상품 정보</h3>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">회원권명 <span className="text-red-500">*</span></Label>
                  <Select
                    value={selectedExistingProductId}
                    onValueChange={(productId) => {
                      const product = products.find(p => p.id === productId);
                      if (product) {
                        setSelectedExistingProductId(productId);
                        setExistingSalesForm({
                          ...existingSalesForm,
                          membership_name: product.name,
                          total_sessions: product.default_sessions?.toString() || "0",
                          amount: product.default_price.toString(),
                          total_amount: product.default_price.toString()
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
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

                  {/* 선택된 상품 정보 표시 */}
                  {selectedExistingProductId && (
                    <div className="bg-blue-50 p-3 rounded text-sm">
                      <div className="text-blue-900 font-medium mb-1">선택한 상품 정보</div>
                      <div className="text-blue-700">
                        기본 횟수: {existingSalesForm.total_sessions}회 / 기본 가격: {parseInt(existingSalesForm.amount).toLocaleString()}원
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        * 필요시 횟수와 금액을 수정할 수 있습니다.
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#0F4C5C]">총 횟수 (회) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={existingSalesForm.total_sessions}
                      onChange={(e) => setExistingSalesForm({...existingSalesForm, total_sessions: e.target.value})}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F4C5C]">시작일</Label>
                    <Input
                      type="date"
                      value={existingSalesForm.start_date}
                      onChange={(e) => setExistingSalesForm({...existingSalesForm, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F4C5C]">만료일</Label>
                    <Input
                      type="date"
                      value={existingSalesForm.end_date}
                      onChange={(e) => setExistingSalesForm({...existingSalesForm, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 결제 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">결제 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">회원권 유형 <span className="text-red-500">*</span></Label>
                  <Select value={existingSalesForm.membership_type} onValueChange={(v) => setExistingSalesForm({...existingSalesForm, membership_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">결제 방법 <span className="text-red-500">*</span></Label>
                  <Select value={existingSalesForm.method} onValueChange={(v) => setExistingSalesForm({...existingSalesForm, method: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="card">카드</SelectItem>
                      <SelectItem value="cash">현금</SelectItem>
                      <SelectItem value="transfer">계좌이체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">이번 결제 금액 (원) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={existingSalesForm.amount}
                    onChange={(e) => setExistingSalesForm({...existingSalesForm, amount: e.target.value})}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">전체 금액 (원)</Label>
                  <Input
                    type="number"
                    value={existingSalesForm.total_amount}
                    onChange={(e) => setExistingSalesForm({...existingSalesForm, total_amount: e.target.value})}
                    placeholder="분할 시 전체 금액"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">분할 횟수</Label>
                  <Input
                    type="number"
                    value={existingSalesForm.installment_count}
                    onChange={(e) => setExistingSalesForm({...existingSalesForm, installment_count: e.target.value})}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">현재 회차</Label>
                  <Input
                    type="number"
                    value={existingSalesForm.installment_current}
                    onChange={(e) => setExistingSalesForm({...existingSalesForm, installment_current: e.target.value})}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">방문루트</Label>
                  <Input
                    value={existingSalesForm.visit_route}
                    onChange={(e) => setExistingSalesForm({...existingSalesForm, visit_route: e.target.value})}
                    placeholder="지인추천, 온라인 등"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">메모</Label>
                <Textarea
                  value={existingSalesForm.memo}
                  onChange={(e) => setExistingSalesForm({...existingSalesForm, memo: e.target.value})}
                  placeholder="특이사항이나 메모를 입력하세요"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleExistingSales} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isLoading}>
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 간단한 회원 등록 모달 (매출 없이) */}
      <Dialog open={isSimpleMemberCreateOpen} onOpenChange={setIsSimpleMemberCreateOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원 등록</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">

            {/* 필수 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">필수 정보</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">회원명 <span className="text-red-500">*</span></Label>
                  <Input
                    value={simpleMemberForm.name}
                    onChange={(e) => setSimpleMemberForm({...simpleMemberForm, name: e.target.value})}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">연락처 <span className="text-red-500">*</span></Label>
                  <Input
                    value={simpleMemberForm.phone}
                    onChange={(e) => setSimpleMemberForm({...simpleMemberForm, phone: e.target.value})}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">담당 트레이너</Label>
                <Select
                  value={simpleMemberForm.trainer_id}
                  onValueChange={(v) => setSimpleMemberForm({...simpleMemberForm, trainer_id: v})}
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

            {/* 기본 정보 (선택) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">기본 정보 (선택)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">생년월일</Label>
                  <Input
                    type="date"
                    value={simpleMemberForm.birth_date}
                    onChange={(e) => setSimpleMemberForm({...simpleMemberForm, birth_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">성별</Label>
                  <Select value={simpleMemberForm.gender} onValueChange={(v) => setSimpleMemberForm({...simpleMemberForm, gender: v})}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">운동 목표</Label>
                <Input
                  value={simpleMemberForm.exercise_goal}
                  onChange={(e) => setSimpleMemberForm({...simpleMemberForm, exercise_goal: e.target.value})}
                  placeholder="체중 감량, 근력 강화 등"
                />
              </div>
            </div>

            {/* 인바디 정보 (선택) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">인바디 정보 (선택)</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">체중 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={simpleMemberForm.weight}
                    onChange={(e) => setSimpleMemberForm({...simpleMemberForm, weight: e.target.value})}
                    placeholder="70.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">체지방량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={simpleMemberForm.body_fat_mass}
                    onChange={(e) => setSimpleMemberForm({...simpleMemberForm, body_fat_mass: e.target.value})}
                    placeholder="15.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">골격근량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={simpleMemberForm.skeletal_muscle_mass}
                    onChange={(e) => setSimpleMemberForm({...simpleMemberForm, skeletal_muscle_mass: e.target.value})}
                    placeholder="30.0"
                  />
                </div>
              </div>
            </div>

            {/* 회원권 정보 (선택) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">회원권 정보 (선택)</h3>

              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">상품 선택</Label>
                <Select
                  value={selectedSimpleProductId}
                  onValueChange={(productId) => {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                      setSelectedSimpleProductId(productId);
                      setSimpleMemberForm({
                        ...simpleMemberForm,
                        membership_product_id: productId
                      });
                    } else {
                      setSelectedSimpleProductId("");
                      setSimpleMemberForm({
                        ...simpleMemberForm,
                        membership_product_id: "",
                        membership_start_date: "",
                        membership_end_date: ""
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="회원권을 선택하세요 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px]">
                    <SelectItem value="">선택 안 함</SelectItem>
                    {products.filter(p => p.is_active).map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.membership_type})
                        {product.default_sessions && ` - ${product.default_sessions}회`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSimpleProductId && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#0F4C5C]">시작일 <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={simpleMemberForm.membership_start_date}
                        onChange={(e) => setSimpleMemberForm({...simpleMemberForm, membership_start_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#0F4C5C]">종료일 <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={simpleMemberForm.membership_end_date}
                        onChange={(e) => setSimpleMemberForm({...simpleMemberForm, membership_end_date: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* 선택된 상품 정보 표시 */}
                  {(() => {
                    const selectedProduct = products.find(p => p.id === selectedSimpleProductId);
                    return selectedProduct ? (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <div className="text-sm text-blue-900 font-medium mb-1">선택한 회원권 정보</div>
                        <div className="text-sm text-blue-700">
                          회원권 유형: {selectedProduct.membership_type}
                          {selectedProduct.default_sessions && ` | 기본 횟수: ${selectedProduct.default_sessions}회`}
                          {selectedProduct.validity_months && ` | 유효기간: ${selectedProduct.validity_months}개월`}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          * 회원권은 등록 후 회원 상세 정보에서 확인할 수 있습니다.
                        </div>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </div>

            {/* 메모 */}
            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">메모</Label>
              <Textarea
                value={simpleMemberForm.memo}
                onChange={(e) => setSimpleMemberForm({...simpleMemberForm, memo: e.target.value})}
                placeholder="추가 메모사항이 있으면 입력하세요"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSimpleMemberCreateOpen(false)} disabled={isLoading}>
              취소
            </Button>
            <Button onClick={handleSimpleMemberCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold" disabled={isLoading}>
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel 가져오기 모달 */}
      <Dialog open={isExcelImportOpen} onOpenChange={setIsExcelImportOpen}>
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Excel 회원 데이터 가져오기</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 안내 메시지 */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-semibold text-blue-900 mb-2">Excel 파일 형식 안내</h4>
              <p className="text-sm text-blue-700 mb-2">다음 컬럼명을 사용하여 Excel 파일을 준비해주세요:</p>
              <div className="text-sm text-blue-800">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>회원명</strong> (필수)</li>
                  <li><strong>연락처</strong> (필수)</li>
                  <li><strong>생년월일</strong> (선택, 예: 1990-01-01)</li>
                  <li><strong>성별</strong> (선택, "남성" 또는 "여성")</li>
                  <li><strong>회원권이름</strong> (선택)</li>
                  <li><strong>시작일</strong> (선택, 예: 2024-01-01)</li>
                  <li><strong>종료일</strong> (선택, 예: 2024-12-31)</li>
                </ul>
              </div>
            </div>

            {/* 파일 업로드 */}
            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">Excel 파일 선택</Label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {excelFile && (
                <p className="text-sm text-gray-600">선택된 파일: {excelFile.name}</p>
              )}
            </div>

            {/* 미리보기 테이블 */}
            {parsedExcelData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">데이터 미리보기 ({parsedExcelData.length}명)</h4>
                <div className="border rounded-md overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">회원명</th>
                        <th className="px-3 py-2 text-left">연락처</th>
                        <th className="px-3 py-2 text-left">생년월일</th>
                        <th className="px-3 py-2 text-left">성별</th>
                        <th className="px-3 py-2 text-left">회원권</th>
                        <th className="px-3 py-2 text-left">시작일</th>
                        <th className="px-3 py-2 text-left">종료일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedExcelData.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">{row.name || '-'}</td>
                          <td className="px-3 py-2">{row.phone || '-'}</td>
                          <td className="px-3 py-2">{row.birth_date || '-'}</td>
                          <td className="px-3 py-2">
                            {row.gender === 'male' ? '남성' : row.gender === 'female' ? '여성' : '-'}
                          </td>
                          <td className="px-3 py-2">{row.membership_name || '-'}</td>
                          <td className="px-3 py-2">{row.membership_start_date || '-'}</td>
                          <td className="px-3 py-2">{row.membership_end_date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500">
                  * 회원명과 연락처가 없는 행은 등록되지 않습니다.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsExcelImportOpen(false);
                setExcelFile(null);
                setParsedExcelData([]);
              }}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleBulkImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={isLoading || parsedExcelData.length === 0}
            >
              {isLoading ? "등록 중..." : `${parsedExcelData.length}명 일괄 등록`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트 (useSearchParams 경고 해결)
export default function AdminMembersPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    }>
      <AdminMembersPageContent />
    </Suspense>
  );
}
