"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, CreditCard, Banknote, Plus, Settings, X } from "lucide-react";

// 기본 회원권 유형 (고정)
const DEFAULT_MEMBERSHIP_TYPES = [
  { name: "헬스", color: "bg-blue-100 text-blue-700" },
  { name: "필라테스", color: "bg-pink-100 text-pink-700" },
  { name: "PT", color: "bg-purple-100 text-purple-700" },
  { name: "PPT", color: "bg-violet-100 text-violet-700" },
  { name: "GPT", color: "bg-indigo-100 text-indigo-700" },
  { name: "골프", color: "bg-green-100 text-green-700" },
  { name: "GX", color: "bg-orange-100 text-orange-700" },
];

// 기본 결제방법 (고정)
const DEFAULT_PAYMENT_METHODS = [
  { name: "카드", code: "card", color: "bg-blue-100 text-blue-700" },
  { name: "현금", code: "cash", color: "bg-emerald-100 text-emerald-700" },
  { name: "계좌이체", code: "transfer", color: "bg-purple-100 text-purple-700" },
];

export default function SalesPage() {
  const { isLoading: authLoading } = useAuth();
  const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();

  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const isLoading = !filterInitialized || authLoading;

  // 지점관리 필터에서 회사/지점 정보 사용
  const selectedGymId = branchFilter.selectedGymId;
  const selectedCompanyId = branchFilter.selectedCompanyId;
  const gymName = branchFilter.gyms.find(g => g.id === selectedGymId)?.name || "We:form";

  // 커스텀 회원권 유형 및 결제방법 (추가 항목만 DB에서)
  const [customMembershipTypes, setCustomMembershipTypes] = useState<any[]>([]);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<any[]>([]);

  // 전체 목록 (기본 + 커스텀)
  const allMembershipTypes = [...DEFAULT_MEMBERSHIP_TYPES, ...customMembershipTypes];
  const allPaymentMethods = [...DEFAULT_PAYMENT_METHODS, ...customPaymentMethods];

  // 설정 모달
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newMembershipType, setNewMembershipType] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: "", code: "" });

  // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 필터
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return formatDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  });
  const [methodFilter, setMethodFilter] = useState("all");
  const [membershipTypeFilter, setMembershipTypeFilter] = useState("all");
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState("all");
  const [quickSelect, setQuickSelect] = useState<string>("month"); // 빠른 선택 상태

  // 통계
  const [stats, setStats] = useState({
    total: 0,
    card: 0,
    cash: 0,
    transfer: 0,
    count: 0
  });

  const supabase = createSupabaseClient();

  // 필터 초기화 시 데이터 로드
  useEffect(() => {
    if (filterInitialized && selectedGymId && selectedCompanyId) {
      fetchPayments(selectedGymId, selectedCompanyId);
      fetchCustomOptions(selectedGymId);
    }
  }, [filterInitialized, selectedGymId, selectedCompanyId]);

  // 커스텀 옵션 (회원권 유형, 결제방법) 불러오기
  const fetchCustomOptions = async (targetGymId: string) => {
    const [typesRes, methodsRes] = await Promise.all([
      supabase.from("membership_types").select("*").eq("gym_id", targetGymId).order("display_order"),
      supabase.from("payment_methods").select("*").eq("gym_id", targetGymId).order("display_order")
    ]);
    if (typesRes.data) setCustomMembershipTypes(typesRes.data);
    if (methodsRes.data) setCustomPaymentMethods(methodsRes.data);
  };

  // 회원권 유형 추가
  const handleAddMembershipType = async () => {
    if (!newMembershipType.trim() || !selectedGymId || !selectedCompanyId) {
      console.log("handleAddMembershipType: 조건 미충족", { newMembershipType, selectedGymId, selectedCompanyId });
      return;
    }
    const { error } = await supabase.from("membership_types").insert({
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      name: newMembershipType.trim(),
      display_order: customMembershipTypes.length + 1
    });
    if (error) {
      console.error("회원권 유형 추가 에러:", error);
      alert(`추가 실패: ${error.message}`);
    } else {
      setNewMembershipType("");
      fetchCustomOptions(selectedGymId);
    }
  };

  // 결제방법 추가
  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.name.trim() || !selectedGymId || !selectedCompanyId) {
      console.log("handleAddPaymentMethod: 조건 미충족", { newPaymentMethod, selectedGymId, selectedCompanyId });
      return;
    }
    const code = newPaymentMethod.code.trim() || newPaymentMethod.name.trim().toLowerCase();
    const { error } = await supabase.from("payment_methods").insert({
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      name: newPaymentMethod.name.trim(),
      code: code,
      display_order: customPaymentMethods.length + 1
    });
    if (error) {
      console.error("결제방법 추가 에러:", error);
      alert(`추가 실패: ${error.message}`);
    } else {
      setNewPaymentMethod({ name: "", code: "" });
      fetchCustomOptions(selectedGymId);
    }
  };

  // 회원권 유형 삭제
  const handleDeleteMembershipType = async (id: string) => {
    if (!confirm("이 회원권 유형을 삭제하시겠습니까?")) return;
    await supabase.from("membership_types").delete().eq("id", id);
    fetchCustomOptions(selectedGymId);
  };

  // 결제방법 삭제
  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("이 결제방법을 삭제하시겠습니까?")) return;
    await supabase.from("payment_methods").delete().eq("id", id);
    fetchCustomOptions(selectedGymId);
  };

  // 날짜 필터 변경 시 데이터 다시 불러오기
  useEffect(() => {
    if (selectedGymId && selectedCompanyId) {
      fetchPayments(selectedGymId, selectedCompanyId);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // ✅ 클라이언트 사이드 필터링: 결제 방법, 회원권 유형, 등록 타입만 필터링
    let filtered = [...payments];

    // 결제 방법 필터
    if (methodFilter !== "all") {
      filtered = filtered.filter(p => p.method === methodFilter);
    }

    // 회원권 유형 필터
    if (membershipTypeFilter !== "all") {
      filtered = filtered.filter(p => p.membership_type === membershipTypeFilter);
    }

    // 등록 타입 필터
    if (registrationTypeFilter !== "all") {
      filtered = filtered.filter(p => p.registration_type === registrationTypeFilter);
    }

    setFilteredPayments(filtered);

    // ✅ 통계 계산 최적화: 단일 패스로 모든 통계 계산
    const stats = filtered.reduce((acc, p) => {
      const amount = parseFloat(p.amount || 0);
      acc.total += amount;
      acc.count += 1;

      if (p.method === 'card') acc.card += amount;
      else if (p.method === 'cash') acc.cash += amount;
      else if (p.method === 'transfer') acc.transfer += amount;

      return acc;
    }, { total: 0, card: 0, cash: 0, transfer: 0, count: 0 });

    setStats(stats);
  }, [payments, methodFilter, membershipTypeFilter, registrationTypeFilter]);

  const fetchPayments = async (targetGymId: string | null, targetCompanyId: string | null) => {
    if (!targetGymId || !targetCompanyId) return;

    let query = supabase
      .from("member_payments")
      .select(`
        *,
        members (name, phone),
        member_memberships (name)
      `)
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId);

    // 날짜 필터 적용
    if (startDate) {
      query = query.gte("paid_at", startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("paid_at", endDateTime.toISOString());
    }

    const { data, error } = await query.order("paid_at", { ascending: true });

    if (error) {
      console.error("결제 내역 조회 에러:", error);
      return;
    }

    setPayments(data || []);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getMethodBadge = (method: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      card: { label: "카드", color: "bg-blue-100 text-blue-700", icon: CreditCard },
      cash: { label: "현금", color: "bg-emerald-100 text-emerald-700", icon: Banknote },
      transfer: { label: "계좌이체", color: "bg-purple-100 text-purple-700", icon: DollarSign }
    };
    return config[method] || { label: method, color: "bg-gray-100 text-gray-700", icon: DollarSign };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">매출 현황</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">{gymName}의 매출을 관리합니다</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsSettingsOpen(true)}
          className="px-3"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* 필터 */}
      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">시작일</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">종료일</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">회원권 유형</Label>
            <Select value={membershipTypeFilter} onValueChange={setMembershipTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체</SelectItem>
                {allMembershipTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">등록 타입</Label>
            <Select value={registrationTypeFilter} onValueChange={setRegistrationTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="신규">신규</SelectItem>
                <SelectItem value="리뉴">리뉴</SelectItem>
                <SelectItem value="기간변경">기간변경</SelectItem>
                <SelectItem value="부가상품">부가상품</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">결제 방법</Label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체</SelectItem>
                {allPaymentMethods.map((method: any) => (
                  <SelectItem key={method.id} value={method.code}>{method.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">빠른 선택</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={quickSelect === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const today = formatDate(new Date());
                  setStartDate(today);
                  setEndDate(today);
                  setQuickSelect("today");
                }}
                className={`text-xs ${quickSelect === "today" ? "bg-[#2F80ED] text-white" : ""}`}
              >
                오늘
              </Button>
              <Button
                type="button"
                variant={quickSelect === "yesterday" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const date = formatDate(yesterday);
                  setStartDate(date);
                  setEndDate(date);
                  setQuickSelect("yesterday");
                }}
                className={`text-xs ${quickSelect === "yesterday" ? "bg-[#2F80ED] text-white" : ""}`}
              >
                어제
              </Button>
              <Button
                type="button"
                variant={quickSelect === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  setStartDate(formatDate(weekAgo));
                  setEndDate(formatDate(today));
                  setQuickSelect("week");
                }}
                className={`text-xs ${quickSelect === "week" ? "bg-[#2F80ED] text-white" : ""}`}
              >
                7일
              </Button>
              <Button
                type="button"
                variant={quickSelect === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  setStartDate(formatDate(monthStart));
                  setEndDate(formatDate(monthEnd));
                  setQuickSelect("month");
                }}
                className={`text-xs ${quickSelect === "month" ? "bg-[#2F80ED] text-white" : ""}`}
              >
                이번달
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#2F80ED] text-white rounded-xl p-4 sm:p-5 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium">총 매출</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.total)}</div>
          <div className="text-xs mt-1 opacity-80">{stats.count}건</div>
        </div>

        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600">카드 결제</span>
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-blue-600">{formatCurrency(stats.card)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.card / stats.total) * 100 || 0).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600">현금 결제</span>
            <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600">{formatCurrency(stats.cash)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.cash / stats.total) * 100 || 0).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600">계좌이체</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-purple-600">{formatCurrency(stats.transfer)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.transfer / stats.total) * 100 || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">결제 내역</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">결제일</th>
              <th className="px-4 py-3">회원명</th>
              <th className="px-4 py-3">회원권 유형</th>
              <th className="px-4 py-3">등록 타입</th>
              <th className="px-4 py-3">방문루트</th>
              <th className="px-4 py-3">결제 방법</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">분할정보</th>
              <th className="px-4 py-3">메모</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED]"></div>
                    <p className="text-gray-500">데이터를 불러오는 중...</p>
                  </div>
                </td>
              </tr>
            ) : filteredPayments.map((payment) => {
              const methodBadge = getMethodBadge(payment.method);
              const MethodIcon = methodBadge.icon;

              // 회원권 유형별 색상
              const membershipTypeColors: Record<string, string> = {
                "헬스": "bg-blue-100 text-blue-700",
                "필라테스": "bg-pink-100 text-pink-700",
                "PT": "bg-purple-100 text-purple-700",
                "PPT": "bg-violet-100 text-violet-700",
                "GPT": "bg-indigo-100 text-indigo-700",
                "골프": "bg-green-100 text-green-700",
                "GX": "bg-orange-100 text-orange-700"
              };

              // 등록 타입별 색상
              const registrationTypeColors: Record<string, string> = {
                "신규": "bg-emerald-100 text-emerald-700",
                "리뉴": "bg-cyan-100 text-cyan-700",
                "기간변경": "bg-amber-100 text-amber-700",
                "부가상품": "bg-rose-100 text-rose-700"
              };

              return (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(payment.paid_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {/* @ts-ignore */}
                      {payment.members?.name || "-"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {/* @ts-ignore */}
                      {payment.members?.phone || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {payment.membership_type ? (
                      <Badge className={`border-0 ${membershipTypeColors[payment.membership_type] || "bg-gray-100 text-gray-700"} w-fit`}>
                        {payment.membership_type}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {payment.registration_type ? (
                      <Badge className={`border-0 ${registrationTypeColors[payment.registration_type] || "bg-gray-100 text-gray-700"} w-fit`}>
                        {payment.registration_type}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {payment.visit_route || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 ${methodBadge.color} flex items-center gap-1 w-fit`}>
                      <MethodIcon className="w-3 h-3" />
                      {methodBadge.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(payment.amount))}
                    </div>
                    {payment.total_amount && parseFloat(payment.total_amount) !== parseFloat(payment.amount) && (
                      <div className="text-xs text-gray-500">
                        전체: {formatCurrency(parseFloat(payment.total_amount))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {payment.installment_count > 1 ? (
                      <div className="text-sm">
                        <span className="font-medium text-[#2F80ED]">
                          {payment.installment_current}/{payment.installment_count}
                        </span>
                        <span className="text-gray-500"> 회차</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">일시불</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">
                    {payment.memo || "-"}
                  </td>
                </tr>
              );
            })}
            {!isLoading && filteredPayments.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-20 text-gray-400">
                  선택한 기간에 결제 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* 설정 모달 */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">매출 설정</DialogTitle>
            <DialogDescription className="text-gray-500">회원권 유형과 결제방법을 관리합니다</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 회원권 유형 관리 */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-800">회원권 유형</Label>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">기본 항목</p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_MEMBERSHIP_TYPES.map((type) => (
                    <Badge key={type.name} className={`${type.color} px-3 py-1.5`}>
                      {type.name}
                    </Badge>
                  ))}
                </div>
                {customMembershipTypes.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mt-3">추가 항목</p>
                    <div className="flex flex-wrap gap-2">
                      {customMembershipTypes.map((type: any) => (
                        <Badge key={type.id} className="bg-gray-100 text-gray-700 px-3 py-1.5 flex items-center gap-2">
                          {type.name}
                          <button onClick={() => handleDeleteMembershipType(type.id)} className="hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="새 회원권 유형 이름"
                  value={newMembershipType}
                  onChange={(e) => setNewMembershipType(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMembershipType()}
                />
                <Button onClick={handleAddMembershipType} size="sm" className="bg-[#2F80ED] text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 결제방법 관리 */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-800">결제방법</Label>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">기본 항목</p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_PAYMENT_METHODS.map((method) => (
                    <Badge key={method.code} className={`${method.color} px-3 py-1.5`}>
                      {method.name}
                    </Badge>
                  ))}
                </div>
                {customPaymentMethods.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mt-3">추가 항목</p>
                    <div className="flex flex-wrap gap-2">
                      {customPaymentMethods.map((method: any) => (
                        <Badge key={method.id} className="bg-gray-100 text-gray-700 px-3 py-1.5 flex items-center gap-2">
                          {method.name}
                          <button onClick={() => handleDeletePaymentMethod(method.id)} className="hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="새 결제방법 이름"
                  value={newPaymentMethod.name}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, name: e.target.value})}
                  className="flex-1"
                />
                <Input
                  placeholder="코드 (영문)"
                  value={newPaymentMethod.code}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, code: e.target.value})}
                  className="w-32"
                />
                <Button onClick={handleAddPaymentMethod} size="sm" className="bg-[#2F80ED] text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">코드는 내부 식별용이며, 비워두면 이름을 기반으로 자동 생성됩니다.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
