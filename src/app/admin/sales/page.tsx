"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, CreditCard, Banknote } from "lucide-react";

export default function SalesPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);

  const [gymId, setGymId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");

  // 필터
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // 이번 달 1일
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [methodFilter, setMethodFilter] = useState("all");

  // 통계
  const [stats, setStats] = useState({
    total: 0,
    card: 0,
    cash: 0,
    transfer: 0,
    count: 0
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, startDate, endDate, methodFilter]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
      fetchPayments(me.gym_id, me.company_id);
    }
  };

  const fetchPayments = async (targetGymId: string | null, targetCompanyId: string | null) => {
    if (!targetGymId || !targetCompanyId) return;

    const { data, error } = await supabase
      .from("member_payments")
      .select(`
        *,
        members (name, phone),
        member_memberships (name)
      `)
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId)
      .order("paid_at", { ascending: false });

    if (error) {
      console.error("결제 내역 조회 에러:", error);
      return;
    }

    setPayments(data || []);
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // 날짜 필터
    if (startDate) {
      filtered = filtered.filter(p => p.paid_at >= startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => new Date(p.paid_at) <= endDateTime);
    }

    // 결제 방법 필터
    if (methodFilter !== "all") {
      filtered = filtered.filter(p => p.method === methodFilter);
    }

    setFilteredPayments(filtered);

    // 통계 계산
    const total = filtered.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const card = filtered.filter(p => p.method === 'card').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const cash = filtered.filter(p => p.method === 'cash').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const transfer = filtered.filter(p => p.method === 'transfer').reduce((sum, p) => sum + parseFloat(p.amount), 0);

    setStats({
      total,
      card,
      cash,
      transfer,
      count: filtered.length
    });
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
      </div>

      {/* 필터 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4">
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
      <div className="grid grid-cols-4 gap-4">
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
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">결제일</th>
              <th className="px-4 py-3">회원명</th>
              <th className="px-4 py-3">회원권</th>
              <th className="px-4 py-3">결제 방법</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">메모</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => {
              const methodBadge = getMethodBadge(payment.method);
              const MethodIcon = methodBadge.icon;

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
                  <td className="px-4 py-3 text-gray-600">
                    {/* @ts-ignore */}
                    {payment.member_memberships?.name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 ${methodBadge.color} flex items-center gap-1 w-fit`}>
                      <MethodIcon className="w-3 h-3" />
                      {methodBadge.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatCurrency(parseFloat(payment.amount))}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {payment.memo || "-"}
                  </td>
                </tr>
              );
            })}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-20 text-gray-400">
                  선택한 기간에 결제 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
