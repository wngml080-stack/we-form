"use client";

import { use } from "react";
import dynamicImport from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { StaffRole } from "@/types/database";

// 클라이언트용 isAdmin 함수
function isAdmin(role: StaffRole | string): boolean {
  return ["system_admin", "company_admin", "admin"].includes(role);
}

// Components 동적 임포트 (초기 로딩 최적화)
const LeaveOverview = dynamicImport(() => import("./components/LeaveOverview"), { ssr: false });
const LeaveRequestList = dynamicImport(() => import("./components/LeaveRequestList"), { ssr: false });
const LeaveCalendarView = dynamicImport(() => import("./components/LeaveCalendarView"), { ssr: false });
const LeaveStatistics = dynamicImport(() => import("./components/LeaveStatistics"), { ssr: false });
const LeaveSettings = dynamicImport(() => import("./components/LeaveSettings"), { ssr: false });

export default function AdminLeavePage(props: {
  params: Promise<Record<string, unknown>>;
  searchParams: Promise<Record<string, unknown>>;
}) {
  use(props.params);
  use(props.searchParams);

  const { branchFilter } = useAdminFilter();
  const { user } = useAuth();
  const gymName = branchFilter.gyms.find(g => g.id === branchFilter.selectedGymId)?.name || "";
  const showAdminTabs = user && isAdmin(user.role);

  return (
    <div className="p-3 xs:p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 xs:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header - Toss Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-[var(--primary-hex)] rounded-full"></div>
            <p className="text-xs xs:text-sm text-[var(--foreground-subtle)] font-bold uppercase tracking-[0.2em]">Leave Management</p>
          </div>
          <h1 className="text-3xl xs:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
            연차 관리
          </h1>
          <p className="text-sm xs:text-base text-[var(--foreground-muted)] font-medium">
            {gymName ? (
              <>
                <span className="text-[var(--primary-hex)] font-bold decoration-2 underline-offset-4">{gymName}</span>의 효율적인 연차 및 휴가 프로세스를 관리합니다.
              </>
            ) : (
              "직원들의 연차 현황 조회, 휴가 신청 및 승인을 체계적으로 관리합니다."
            )}
          </p>
        </div>
      </div>

      {/* Tabs UI - Modern Toss Style */}
      <Tabs defaultValue="overview" className="w-full space-y-8">
        <div className="inline-flex p-1.5 bg-[var(--background-secondary)] rounded-[24px] border border-[var(--border-light)] overflow-x-auto scrollbar-hide">
          <TabsList className="bg-transparent h-12 gap-1 px-1">
            <TabsTrigger
              value="overview"
              className="rounded-[18px] px-6 text-sm font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--primary-hex)] data-[state=active]:shadow-xl data-[state=active]:shadow-blue-100/50 transition-all duration-300 whitespace-nowrap"
            >
              연차 현황
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-[18px] px-6 text-sm font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--primary-hex)] data-[state=active]:shadow-xl data-[state=active]:shadow-blue-100/50 transition-all duration-300 whitespace-nowrap"
            >
              휴가 신청/승인
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-[18px] px-6 text-sm font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--primary-hex)] data-[state=active]:shadow-xl data-[state=active]:shadow-blue-100/50 transition-all duration-300 whitespace-nowrap"
            >
              캘린더
            </TabsTrigger>
            {showAdminTabs && (
              <>
                <TabsTrigger
                  value="statistics"
                  className="rounded-[18px] px-6 text-sm font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--primary-hex)] data-[state=active]:shadow-xl data-[state=active]:shadow-blue-100/50 transition-all duration-300 whitespace-nowrap"
                >
                  통계 리포트
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-[18px] px-6 text-sm font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--primary-hex)] data-[state=active]:shadow-xl data-[state=active]:shadow-blue-100/50 transition-all duration-300 whitespace-nowrap"
                >
                  정책 설정
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <div className="pt-2">
          <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-700 m-0 outline-none">
            <LeaveOverview />
          </TabsContent>

          <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-700 m-0 outline-none">
            <LeaveRequestList />
          </TabsContent>

          <TabsContent value="calendar" className="animate-in fade-in slide-in-from-bottom-4 duration-700 m-0 outline-none">
            <LeaveCalendarView />
          </TabsContent>

          {showAdminTabs && (
            <>
              <TabsContent value="statistics" className="animate-in fade-in slide-in-from-bottom-4 duration-700 m-0 outline-none">
                <LeaveStatistics />
              </TabsContent>

              <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-700 m-0 outline-none">
                <LeaveSettings />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
