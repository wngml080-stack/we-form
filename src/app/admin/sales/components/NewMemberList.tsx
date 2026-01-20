"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, RefreshCw, AlertCircle, ArrowRight, Filter, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerDetailModal } from "./modals/CustomerDetailModal";

interface CustomerFunnel {
  phone: string;
  name: string;
  inquiry: { id: string; channel: string; channelOther?: string; type: string; typeOther?: string; status: string; content?: string; date: string } | null;
  reservation: { id: string; type: string; status: string; date: string } | null;
  registration: { id: string; membershipName: string; amount: number; visitRoute: string; date: string } | null;
  firstContactDate: string;
  lastActivityDate: string;
  conversionStatus: string;
  funnelStage: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  kakao: "카카오",
  naver: "네이버",
  phone: "전화",
  walk_in: "방문",
  website: "웹사이트",
  instagram: "인스타그램",
  other: "기타",
};

const CHANNEL_COLORS: Record<string, string> = {
  kakao: "bg-yellow-100 text-yellow-800",
  naver: "bg-green-100 text-green-800",
  phone: "bg-blue-100 text-blue-800",
  walk_in: "bg-purple-100 text-purple-800",
  website: "bg-slate-100 text-slate-800",
  instagram: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  price: "가격 문의",
  schedule: "일정 문의",
  location: "위치/교통",
  trial: "체험 신청",
  membership: "회원권",
  pt: "PT 문의",
  cancel: "해지/환불",
  etc: "기타",
  other: "기타",
};

interface FunnelStats {
  total: number;
  converted: number;
  notConverted: number;
  inquiryOnly: number;
  reservationOnly: number;
  inquiryToReservation: number;
}

interface NewMemberListProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  isInitialized: boolean;
}

export function NewMemberList({
  selectedGymId,
  selectedCompanyId,
  isInitialized
}: NewMemberListProps) {
  const [customers, setCustomers] = useState<CustomerFunnel[]>([]);
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFunnel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleCustomerClick = (customer: CustomerFunnel) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  // 날짜 필터 (최근 3개월)
  const now = new Date();
  const [startDate, setStartDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    now.toISOString().split("T")[0]
  );

  const fetchCustomers = useCallback(async () => {
    if (!selectedGymId || !selectedCompanyId || !isInitialized) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        gym_id: selectedGymId,
        company_id: selectedCompanyId,
        start_date: startDate,
        end_date: endDate,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/admin/sales/customer-funnel?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "조회 실패");
      }

      setCustomers(result.customers);
      setStats(result.stats);
      setPagination(result.pagination);
    } catch (err) {
      console.error("[NewMemberList] 조회 오류:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGymId, selectedCompanyId, isInitialized, startDate, endDate, searchQuery, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const getConversionBadge = (customer: CustomerFunnel) => {
    if (customer.registration) {
      return <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px]">등록완료</Badge>;
    } else if (customer.reservation) {
      return <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[10px]">예약대기</Badge>;
    } else {
      return <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[10px]">미전환</Badge>;
    }
  };

  const getFunnelBadges = (customer: CustomerFunnel) => {
    return (
      <div className="flex items-center gap-1">
        {customer.inquiry && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-200 text-blue-600">문의</Badge>
        )}
        {customer.inquiry && (customer.reservation || customer.registration) && (
          <ArrowRight className="w-3 h-3 text-slate-300" />
        )}
        {customer.reservation && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-200 text-purple-600">예약</Badge>
        )}
        {customer.reservation && customer.registration && (
          <ArrowRight className="w-3 h-3 text-slate-300" />
        )}
        {customer.registration && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-200 text-emerald-600">등록</Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전체 고객</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">등록 완료</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.converted}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">미전환</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{stats.notConverted}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">예약 대기</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.inquiryToReservation + stats.reservationOnly}</p>
          </div>
        </div>
      )}

      {/* 필터 영역 */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* 검색 */}
        <div className="relative flex-1 md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="이름, 전화번호 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 pr-4 rounded-2xl bg-white border-slate-200 focus:ring-blue-500 font-bold text-sm shadow-sm"
          />
        </div>

        {/* 전환 상태 필터 */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-44 rounded-2xl bg-white border-slate-200 font-bold text-sm shadow-sm">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="전환 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="not_converted">미전환 (2차 활동 필요)</SelectItem>
            <SelectItem value="converted">등록 완료</SelectItem>
          </SelectContent>
        </Select>

        {/* 날짜 필터 */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-12 rounded-2xl bg-white border-slate-200 font-bold text-sm shadow-sm"
          />
          <span className="text-slate-400 font-bold">~</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-12 rounded-2xl bg-white border-slate-200 font-bold text-sm shadow-sm"
          />
        </div>

        {/* 새로고침 */}
        <Button
          variant="outline"
          className="h-12 w-12 bg-white border-slate-200 text-slate-700 p-0 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
          onClick={fetchCustomers}
        >
          <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* 고객 목록 테이블 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white/60 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">전환상태</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">고객 정보</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">문의&등록날짜</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">퍼널 경로</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">문의채널</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">문의유형</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">등록 정보</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-sm font-bold text-slate-400">불러오는 중...</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        {statusFilter === "not_converted" ? "미전환 고객이 없습니다" : "고객 데이터가 없습니다"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.phone}
                    onClick={() => handleCustomerClick(customer)}
                    className={cn(
                      "group hover:bg-blue-50/40 transition-all duration-300 cursor-pointer",
                      customer.conversionStatus === "not_converted" && "bg-rose-50/20"
                    )}
                  >
                    <td className="py-5 px-6">
                      {getConversionBadge(customer)}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-slate-900 leading-none tracking-tightest">{customer.name || "-"}</span>
                        <span className="text-[10px] font-bold text-slate-400">{formatPhoneNumber(customer.phone)}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-1">
                        {customer.inquiry && (
                          <div className="text-[10px] text-slate-500">
                            <span className="text-blue-500 font-bold">문의</span> {formatDate(customer.inquiry.date)}
                          </div>
                        )}
                        {customer.registration && (
                          <div className="text-[10px] text-slate-500">
                            <span className="text-emerald-500 font-bold">등록</span> {formatDate(customer.registration.date)}
                          </div>
                        )}
                        {!customer.inquiry && !customer.registration && (
                          <span className="text-[10px] font-bold text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      {getFunnelBadges(customer)}
                    </td>
                    <td className="py-5 px-6">
                      {customer.inquiry ? (
                        <Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md border-none", CHANNEL_COLORS[customer.inquiry.channel] || "bg-gray-100 text-gray-800")}>
                          {customer.inquiry.channel === "other" && customer.inquiry.channelOther
                            ? customer.inquiry.channelOther
                            : CHANNEL_LABELS[customer.inquiry.channel] || customer.inquiry.channel}
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {customer.inquiry ? (
                        <span className="text-xs font-bold text-slate-600">
                          {customer.inquiry.type === "etc" && customer.inquiry.typeOther
                            ? customer.inquiry.typeOther
                            : INQUIRY_TYPE_LABELS[customer.inquiry.type] || customer.inquiry.type}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {customer.registration ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-700">{customer.registration.membershipName}</span>
                          <span className="text-[10px] font-bold text-emerald-600">
                            {new Intl.NumberFormat("ko-KR").format(customer.registration.amount)}원
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {customer.inquiry?.content ? (
                        <div className="flex items-center gap-1.5 max-w-[150px]">
                          <MessageSquare className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-slate-500 truncate">
                            {customer.inquiry.content}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400">
              총 {pagination.total}명 중 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}명
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-lg font-bold text-xs"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                이전
              </Button>
              <span className="text-xs font-bold text-slate-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-lg font-bold text-xs"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 고객 상세 모달 */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />
    </div>
  );
}
