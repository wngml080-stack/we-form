"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { usePTMembersData } from "./hooks/usePTMembersData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, Dumbbell, DollarSign, Clock, Search, Phone, User, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Target, TrendingUp, Award, BarChart3,
  Layers, UserCheck, AlertTriangle, ArrowRight, Activity, Sparkles, Filter, Info
} from "lucide-react";
import { MemberKanbanBoard } from "./components/MemberKanbanBoard";
import { ReRegistrationTab } from "./re-registration/components";
import { cn } from "@/lib/utils";

export default function PTMembersPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  use(props.params);
  use(props.searchParams);

  const { selectedGymId, gymName, selectedCompanyId, isInitialized } = useAdminFilter();
  const [activeTab, setActiveTab] = useState("members");

  const {
    ptMembers,
    staffList,
    stats,
    extendedStats,
    membersByTrainer,
    isLoading,
    trainerFilter,
    setTrainerFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    updateTrainer,
    // 새 필터
    memberCategory,
    setMemberCategory,
    periodFilter,
    changePeriod,
    navigateMonth,
    dateRange
  } = usePTMembersData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedGymId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">지점을 선택해주세요.</p>
      </div>
    );
  }

  const memberCategoryConfig = [
    { key: "all" as const, label: "전체회원", count: extendedStats.memberCounts.all, icon: Users, color: "blue", gradient: "from-blue-500 to-indigo-600", lightBg: "bg-blue-50", text: "text-blue-600" },
    { key: "pt" as const, label: "PT회원", count: extendedStats.memberCounts.pt, icon: Dumbbell, color: "purple", gradient: "from-purple-500 to-indigo-600", lightBg: "bg-purple-50", text: "text-purple-600" },
    { key: "ot" as const, label: "OT회원", count: extendedStats.memberCounts.ot, icon: UserCheck, color: "emerald", gradient: "from-emerald-500 to-teal-600", lightBg: "bg-emerald-50", text: "text-emerald-600" },
    { key: "reregistration" as const, label: "재등록 대상자", count: extendedStats.memberCounts.reregistration, icon: AlertTriangle, color: "amber", gradient: "from-amber-500 to-orange-600", lightBg: "bg-amber-50", text: "text-amber-600" }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* 헤더 섹션 */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">통합 회원관리</h1>
              </div>
              <p className="text-slate-500 font-bold text-sm ml-12">
                <span className="text-blue-600">{gymName}</span> 지점의 회원 현황 및 퍼포먼스 관리
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/admin/sales">
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 transition-all gap-2 group">
                  <PlusCircle className="w-5 h-5" />
                  신규 매출 등록
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-white rounded-[32px] p-2 shadow-sm border border-gray-100 flex justify-center">
          <TabsList className="bg-transparent h-14 p-1 gap-2">
            {[
              { value: "members", label: "PT회원리스트 & 통계표", icon: Dumbbell },
              { value: "manual", label: "회원 코칭현황", icon: Users },
              { value: "re-registration", label: "재등록 관리", icon: RefreshCw },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "h-12 px-8 rounded-2xl text-sm font-black transition-all gap-2 relative overflow-hidden",
                  "data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg",
                  "data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:bg-slate-50 data-[state=inactive]:hover:text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="members" className="mt-0 space-y-8 animate-in fade-in duration-500">
          {/* 기간 필터 & 회원 분류 통합 카드 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 기간 필터 */}
            <div className="lg:col-span-4 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">조회 기간 설정</h3>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period Filter</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl">
                  <Button
                    variant="ghost"
                    onClick={() => changePeriod("current")}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-xs font-black transition-all",
                      periodFilter.type === "current" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                    )}
                  >
                    당월
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => changePeriod("previous")}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-xs font-black transition-all",
                      periodFilter.type === "previous" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                    )}
                  >
                    전월
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                    className="h-10 w-10 rounded-xl hover:bg-white transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </Button>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Selected Month</p>
                    <span className="text-base font-black text-slate-900">
                      {periodFilter.year}년 {periodFilter.month}월
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                    className="h-10 w-10 rounded-xl hover:bg-white transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[11px] font-bold text-blue-600">
                    {dateRange.start} ~ {dateRange.end}
                  </p>
                </div>
              </div>
            </div>

            {/* 회원 분류 */}
            <div className="lg:col-span-8 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">회원 분류 필터</h3>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Selection</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {memberCategoryConfig.map(({ key, label, count, icon: Icon, color, gradient, lightBg, text }) => {
                  const isSelected = memberCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setMemberCategory(key)}
                      className={cn(
                        "group relative flex flex-col items-start p-5 rounded-[28px] border-2 transition-all overflow-hidden",
                        isSelected 
                          ? cn("bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 -translate-y-1")
                          : cn("bg-white border-slate-50 hover:border-slate-200 hover:shadow-md")
                      )}
                    >
                      {/* 배경 데코레이션 */}
                      <div className={cn(
                        "absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-10 transition-all group-hover:scale-150",
                        isSelected ? "bg-white" : cn("bg-", color, "-500")
                      )}></div>
                      
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all",
                        isSelected ? "bg-white/10" : lightBg
                      )}>
                        <Icon className={cn("w-5 h-5", isSelected ? "text-white" : text)} />
                      </div>
                      
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest mb-1",
                        isSelected ? "text-white/60" : "text-slate-400"
                      )}>
                        {label}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">{count}</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          isSelected ? "text-white/60" : "text-slate-400"
                        )}>Members</span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 메인 통계 카드 - 상단 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                label: "전체 세션", 
                value: extendedStats.sessions.total, 
                unit: "회", 
                icon: Layers, 
                color: "blue",
                badge: "Total Sessions",
                desc: "누적 관리 세션"
              },
              { 
                label: "잔여 세션", 
                value: extendedStats.sessions.remaining, 
                unit: "회", 
                icon: Clock, 
                color: "emerald",
                badge: "Remaining",
                desc: "수업 대기 중"
              },
              { 
                label: "당월 매출", 
                value: formatCurrency(extendedStats.monthlySales.total), 
                unit: "원", 
                icon: DollarSign, 
                color: "indigo",
                badge: "Monthly Sales",
                desc: `신규 ${formatCurrency(extendedStats.monthlySales.newSales)} | 리뉴 ${formatCurrency(extendedStats.monthlySales.renewSales)}`
              },
              { 
                label: "당월 수업", 
                value: extendedStats.monthlyLessons.total, 
                unit: "회", 
                icon: Activity, 
                color: "orange",
                badge: "Lessons",
                desc: `PT ${extendedStats.monthlyLessons.ptInWorkHours + extendedStats.monthlyLessons.ptOutWorkHours} | OT ${extendedStats.monthlyLessons.ot}`
              }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className={cn("h-2 w-full bg-", stat.color, "-500 opacity-20 group-hover:opacity-100 transition-opacity")}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", 
                      `bg-${stat.color}-50 text-${stat.color}-600`)}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className={cn("bg-slate-50 text-slate-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1")}>
                      {stat.badge}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <h4 className="text-3xl font-black text-slate-900">{stat.value}</h4>
                      <span className="text-sm font-bold text-slate-400">{stat.unit}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 truncate max-w-[150px]">{stat.desc}</span>
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-", stat.color, "-50 transition-colors")}>
                        <ArrowRight className={cn("w-3 h-3 text-slate-300 group-hover:text-", stat.color, "-500 transition-colors")} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 퍼포먼스 랭킹 & 평균 - 하단 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 회사 순위 */}
            <div className="bg-slate-900 rounded-[28px] p-5 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl transition-all group-hover:scale-150"></div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Award className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Company Rank</span>
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-black tracking-tight">
                  상위 {extendedStats.rankings.companyPercentile}%
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/10 text-white/80 border-none text-[10px] font-bold px-2 py-0">
                    {extendedStats.rankings.companyRank}위
                  </Badge>
                  <span className="text-[10px] text-white/40 font-bold">전체 {extendedStats.rankings.companyTotal}명</span>
                </div>
              </div>
            </div>

            {/* 지점 순위 */}
            <div className="bg-blue-600 rounded-[28px] p-5 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl transition-all group-hover:scale-150"></div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Target className="w-4 h-4 text-blue-200" />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Branch Rank</span>
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-black tracking-tight">
                  지점 {extendedStats.rankings.branchRank}위
                </p>
                <p className="text-[10px] text-white/50 font-bold mt-1">
                  지점 내 {extendedStats.rankings.branchTotal}명 중
                </p>
              </div>
            </div>

            {[
              { label: "3개월 평균", value: extendedStats.rankings.avg3Months, icon: BarChart3, badge: "3M Avg" },
              { label: "6개월 평균", value: extendedStats.rankings.avg6Months, icon: TrendingUp, badge: "6M Avg" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-4">
                  <stat.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(stat.value)}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{stat.badge}</p>
              </div>
            ))}

            {/* 연간 매출 요약 */}
            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yearly Summary</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1st Half</span>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(extendedStats.rankings.firstHalf)}</span>
                </div>
                <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2nd Half</span>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(extendedStats.rankings.secondHalf)}</span>
                </div>
                <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '55%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* 트레이너별 회원 수 */}
          {Object.keys(membersByTrainer).length > 0 && (
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">트레이너별 담당 현황</h3>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trainer Statistics</div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {Object.entries(membersByTrainer).map(([id, data]) => {
                  const isSelected = trainerFilter === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setTrainerFilter(isSelected ? "all" : id)}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all",
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-xl -translate-y-1"
                          : "bg-white border-slate-50 text-slate-600 hover:border-blue-100 hover:bg-blue-50/30"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        isSelected ? "bg-white/10 shadow-inner" : "bg-slate-50"
                      )}>
                        <User className={cn("w-4 h-4", isSelected ? "text-white" : "text-blue-600")} />
                      </div>
                      <div className="text-left">
                        <p className={cn("text-sm font-black", isSelected ? "text-white" : "text-slate-900")}>{data.name}</p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-white/50" : "text-slate-400")}>
                          {data.count} Members
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 회원 리스트 테이블 */}
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            {/* 리스트 헤더 & 필터 */}
            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">회원 리스트</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    총 <span className="text-blue-600">{ptMembers.length}명</span>의 회원이 조회되었습니다.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 lg:min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="회원명 또는 연락처 검색"
                      className="h-12 pl-12 bg-white border-slate-100 rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                    <SelectTrigger className="w-full sm:w-44 h-12 bg-white border-slate-100 rounded-2xl font-bold shadow-sm">
                      <SelectValue placeholder="담당 트레이너" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl">
                      <SelectItem value="all" className="font-bold">전체 트레이너</SelectItem>
                      {staffList.map(staff => (
                        <SelectItem key={staff.id} value={staff.id} className="font-medium">{staff.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-36 h-12 bg-white border-slate-100 rounded-2xl font-bold shadow-sm">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl">
                      <SelectItem value="all" className="font-bold">전체 상태</SelectItem>
                      <SelectItem value="active" className="text-emerald-600 font-bold">이용중</SelectItem>
                      <SelectItem value="paused" className="text-amber-600 font-bold">일시정지</SelectItem>
                      <SelectItem value="expired" className="text-slate-400 font-bold">만료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 검색 태그들 (선택사항) */}
              <div className="flex flex-wrap gap-2">
                {trainerFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
                    Trainer: {staffList.find(s => s.id === trainerFilter)?.name}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setTrainerFilter('all')} />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
                    Status: {statusFilter === 'active' ? '이용중' : statusFilter === 'paused' ? '일시정지' : '만료'}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
                    Search: {searchQuery}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-50 border-t-blue-500 animate-spin"></div>
                  <Activity className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
                </div>
                <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-widest">Loading Members...</p>
              </div>
            ) : ptMembers.length === 0 ? (
              <div className="text-center py-32 bg-white">
                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-6 relative">
                  <Search className="w-10 h-10 text-slate-200" />
                  <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <Info className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">조회된 회원이 없습니다</h4>
                <p className="text-sm font-bold text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  필터를 조정하거나 검색어를 다르게 입력해보세요.<br />또는 신규 매출을 등록하여 목록을 갱신할 수 있습니다.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTrainerFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-8 rounded-2xl font-black text-xs h-12 px-8"
                >
                  필터 초기화
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Member Info</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Membership</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Assigned Trainer</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Session Status</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {ptMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-blue-50/20 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[20px] bg-slate-50 flex items-center justify-center shadow-inner group-hover:bg-white group-hover:shadow-md transition-all">
                              <span className="text-base font-black text-slate-400 group-hover:text-blue-600">
                                {member.member_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base group-hover:text-blue-700 transition-colors">{member.member_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 rounded-md border-slate-100 text-slate-400 uppercase tracking-tighter">
                                  {member.sale_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {member.phone ? (
                            <a href={`tel:${member.phone}`} className="flex items-center gap-2.5 group/link">
                              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover/link:bg-blue-600 transition-all">
                                <Phone className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-white" />
                              </div>
                              <span className="text-sm font-bold text-slate-600 group-hover/link:text-blue-600 transition-colors">{member.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">No Contact</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900">{member.membership_category}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{member.membership_name}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <Select
                            value={member.trainer_id}
                            onValueChange={(value) => {
                              const trainer = staffList.find(s => s.id === value);
                              if (trainer) {
                                updateTrainer(member.id, trainer.id, trainer.name);
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 w-32 text-xs font-black border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white transition-all shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-2xl border-none shadow-2xl">
                              {staffList.map(staff => (
                                <SelectItem key={staff.id} value={staff.id} className="font-bold text-xs">
                                  {staff.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-8 py-6">
                          {member.remaining_sessions != null ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-sm font-black",
                                  member.remaining_sessions <= 3 ? "text-rose-600" : "text-slate-900"
                                )}>
                                  {member.remaining_sessions}
                                  <span className="text-[10px] text-slate-400 ml-0.5 font-bold">REMAINING</span>
                                </span>
                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">/ {member.total_sessions} Total</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    member.remaining_sessions <= 3 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                  )}
                                  style={{ width: `${Math.min(100, (member.remaining_sessions / (member.total_sessions || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">N/A</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{formatFullCurrency(member.amount)}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Payment</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <Badge className={cn(
                            "px-4 py-1.5 rounded-xl border-none font-black text-[10px] uppercase tracking-widest shadow-sm",
                            member.status === "active" ? "bg-emerald-500 text-white" :
                            member.status === "paused" ? "bg-amber-500 text-white" :
                            "bg-slate-200 text-slate-500"
                          )}>
                            {member.status === "active" ? "Active" :
                             member.status === "paused" ? "Paused" : "Expired"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 안내 카드 */}
          <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48 transition-all group-hover:scale-125"></div>
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-20 h-20 rounded-[32px] bg-white/10 flex items-center justify-center shrink-0 shadow-inner">
                <Info className="w-10 h-10 text-blue-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-2xl font-black tracking-tight mb-2">PT 회원 관리 인텔리전스</h4>
                <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-2xl">
                  PT 회원은 <span className="text-white">매출 관리</span>에서 등록된 PT 관련 데이터 중 담당 트레이너가 지정된 회원들입니다.
                  실시간으로 담당자를 변경하거나 회원별 상세 퍼포먼스(잔여 세션, 매출 기여도)를 트래킹할 수 있습니다.
                  신규 유입을 위해 <Link href="/admin/sales" className="text-blue-400 underline decoration-2 underline-offset-4 hover:text-white transition-colors">매출 관리</Link> 페이지를 활용하세요.
                </p>
              </div>
              <div className="shrink-0">
                <Link href="/admin/sales">
                  <Button className="h-14 px-8 rounded-2xl bg-white text-slate-900 hover:bg-blue-50 font-black shadow-xl transition-all">
                    매출 등록하러 가기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-0 space-y-8 animate-in fade-in duration-500">
          <MemberKanbanBoard />
        </TabsContent>

        <TabsContent value="re-registration" className="mt-0 animate-in fade-in duration-500">
          <ReRegistrationTab selectedGymId={selectedGymId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 아이콘 컴포넌트 추가
function PlusCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
