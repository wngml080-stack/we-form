"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, CreditCard, Banknote, Plus } from "lucide-react";

export default function SalesPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [gymId, setGymId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");

  // 회원 목록
  const [members, setMembers] = useState<any[]>([]);

  // 결제 등록 모달
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    member_id: "",
    membership_type: "PT",
    registration_type: "신규",
    visit_route: "",
    amount: "",
    total_amount: "",
    method: "card",
    installment_count: "1",
    installment_current: "1",
    paid_at: new Date().toISOString().split('T')[0],
    memo: ""
  });

  // 필터
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // 이번 달 1일
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [methodFilter, setMethodFilter] = useState("all");
  const [membershipTypeFilter, setMembershipTypeFilter] = useState("all");
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState("all");

  // 통계
  const [stats, setStats] = useState({
    total: 0,
    card: 0,
    cash: 0,
    transfer: 0,
    count: 0
  });

  const supabase = createSupabaseClient();

  useEffect(() => {
    init();
  }, []);

  // 날짜 필터 변경 시 데이터 다시 불러오기
  useEffect(() => {
    if (gymId && companyId) {
      fetchPayments(gymId, companyId);
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

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: me } = await supabase
        .from("staffs")
        .select("gym_id, company_id, role, gyms(name)")
        .eq("user_id", user.id)
        .single();

      if (me) {
        setGymId(me.gym_id);
        setCompanyId(me.company_id);
        // @ts-ignore
        setGymName(me.gyms?.name ?? "We:form");
        await fetchPayments(me.gym_id, me.company_id);
        await fetchMembers(me.gym_id, me.company_id);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('init 에러:', error);
      setIsLoading(false);
    }
  };

  const fetchMembers = async (targetGymId: string | null, targetCompanyId: string | null) => {
    if (!targetGymId || !targetCompanyId) return;

    const { data, error } = await supabase
      .from("members")
      .select("id, name, phone")
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId)
      .order("name", { ascending: true });

    if (error) {
      console.error("회원 목록 조회 에러:", error);
      return;
    }

    setMembers(data || []);
  };

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

    const { data, error } = await query.order("paid_at", { ascending: false });

    if (error) {
      console.error("결제 내역 조회 에러:", error);
      return;
    }

    setPayments(data || []);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gymId || !companyId) {
      alert("지점 정보를 불러올 수 없습니다.");
      return;
    }

    if (!createForm.member_id) {
      alert("회원을 선택해주세요.");
      return;
    }

    if (!createForm.amount) {
      alert("결제 금액을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("member_payments")
        .insert({
          gym_id: gymId,
          company_id: companyId,
          member_id: createForm.member_id,
          membership_type: createForm.membership_type,
          registration_type: createForm.registration_type,
          visit_route: createForm.visit_route || null,
          amount: parseFloat(createForm.amount),
          total_amount: parseFloat(createForm.total_amount || createForm.amount),
          method: createForm.method,
          installment_count: parseInt(createForm.installment_count),
          installment_current: parseInt(createForm.installment_current),
          paid_at: createForm.paid_at,
          memo: createForm.memo || null
        });

      if (error) throw error;

      alert("결제가 등록되었습니다.");
      setIsCreateOpen(false);
      setCreateForm({
        member_id: "",
        membership_type: "PT",
        registration_type: "신규",
        visit_route: "",
        amount: "",
        total_amount: "",
        method: "card",
        installment_count: "1",
        installment_current: "1",
        paid_at: new Date().toISOString().split('T')[0],
        memo: ""
      });
      fetchPayments(gymId, companyId);
    } catch (error: any) {
      console.error("결제 등록 에러:", error);
      alert(`결제 등록 실패: ${error.message}`);
    }
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
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">매출 현황</h1>
          <p className="text-gray-500 mt-2 font-medium">{gymName}의 매출을 관리합니다</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold px-6 py-2 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4"/> 결제 등록
        </Button>
      </div>

      {/* 필터 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                <SelectItem value="card">카드</SelectItem>
                <SelectItem value="cash">현금</SelectItem>
                <SelectItem value="transfer">계좌이체</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">빠른 선택</Label>
            <Select
              onValueChange={(value) => {
                const today = new Date();
                if (value === "today") {
                  setStartDate(today.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                } else if (value === "week") {
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  setStartDate(weekAgo.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                } else if (value === "month") {
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  setStartDate(monthStart.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">최근 7일</SelectItem>
                <SelectItem value="month">이번 달</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#2F80ED] text-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">총 매출</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
          <div className="text-xs mt-1">{stats.count}건</div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">카드 결제</span>
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600">{formatCurrency(stats.card)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.card / stats.total) * 100 || 0).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">현금 결제</span>
            <Banknote className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(stats.cash)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.cash / stats.total) * 100 || 0).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">계좌이체</span>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600">{formatCurrency(stats.transfer)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.transfer / stats.total) * 100 || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="rounded-md border bg-white">
        <div className="p-4 border-b">
          <h3 className="font-semibold">결제 내역</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1200px]">
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

      {/* 결제 등록 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">결제 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePayment} className="space-y-6">
            {/* 회원 선택 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">회원 선택 <span className="text-red-500">*</span></Label>
              <Select
                value={createForm.member_id}
                onValueChange={(v) => setCreateForm({...createForm, member_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="회원 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 회원권 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">회원권 유형 <span className="text-red-500">*</span></Label>
                <Select
                  value={createForm.membership_type}
                  onValueChange={(v) => setCreateForm({...createForm, membership_type: v})}
                >
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
                <Label className="text-sm font-semibold text-gray-700">등록 타입 <span className="text-red-500">*</span></Label>
                <Select
                  value={createForm.registration_type}
                  onValueChange={(v) => setCreateForm({...createForm, registration_type: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="신규">신규</SelectItem>
                    <SelectItem value="리뉴">리뉴</SelectItem>
                    <SelectItem value="기간변경">기간변경</SelectItem>
                    <SelectItem value="부가상품">부가상품</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 방문루트 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">방문루트</Label>
              <Input
                value={createForm.visit_route}
                onChange={(e) => setCreateForm({...createForm, visit_route: e.target.value})}
                placeholder="예: 인터넷 검색, 지인 추천, 전단지..."
              />
            </div>

            {/* 결제 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">결제 금액 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({...createForm, amount: e.target.value})}
                  placeholder="100000"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">결제 방법</Label>
                <Select
                  value={createForm.method}
                  onValueChange={(v) => setCreateForm({...createForm, method: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="card">카드</SelectItem>
                    <SelectItem value="cash">현금</SelectItem>
                    <SelectItem value="transfer">계좌이체</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">결제일</Label>
                <Input
                  type="date"
                  value={createForm.paid_at}
                  onChange={(e) => setCreateForm({...createForm, paid_at: e.target.value})}
                />
              </div>
            </div>

            {/* 분할 결제 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">전체 금액</Label>
                <Input
                  type="number"
                  value={createForm.total_amount}
                  onChange={(e) => setCreateForm({...createForm, total_amount: e.target.value})}
                  placeholder="분할 시 전체 금액"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">분할 횟수</Label>
                <Input
                  type="number"
                  value={createForm.installment_count}
                  onChange={(e) => setCreateForm({...createForm, installment_count: e.target.value})}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">현재 회차</Label>
                <Input
                  type="number"
                  value={createForm.installment_current}
                  onChange={(e) => setCreateForm({...createForm, installment_current: e.target.value})}
                  min="1"
                />
              </div>
            </div>

            {/* 메모 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">메모</Label>
              <Textarea
                value={createForm.memo}
                onChange={(e) => setCreateForm({...createForm, memo: e.target.value})}
                placeholder="추가 정보나 특이사항 입력..."
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="bg-[#2F80ED] hover:bg-[#2570d6] text-white"
              >
                등록하기
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
