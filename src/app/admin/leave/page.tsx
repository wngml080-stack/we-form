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
    <div className="p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 xs:gap-6">
        <div className="space-y-1 xs:space-y-2">
          <div className="flex items-center gap-2 text-[10px] xs:text-xs font-black text-[#3182F6] uppercase tracking-[0.2em]">
            <span className="w-6 xs:w-8 h-[2px] bg-[#3182F6]"></span>
            Leave Management
          </div>
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-black text-[#191F28] tracking-tighter">
            연차 관리
          </h1>
          <p className="text-[#8B95A1] font-bold text-sm xs:text-base sm:text-lg flex items-center gap-2">
            {gymName ? (
              <>
                <span className="text-[#2F80ED] border-b-2 border-blue-100 px-1">{gymName}</span>의 연차 현황을 관리합니다.
              </>
            ) : (
              "직원들의 연차 현황 조회, 휴가 신청 및 승인을 관리합니다."
            )}
          </p>
        </div>
      </div>

      {/* 탭 UI */}
      <Tabs defaultValue="overview" className="w-full space-y-4 xs:space-y-6 sm:space-y-8">
        <div className="bg-white/50 backdrop-blur-md p-1 xs:p-1.5 rounded-xl xs:rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-sm inline-flex overflow-x-auto">
          <TabsList className="bg-transparent h-10 xs:h-11 sm:h-12 gap-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-6 text-xs xs:text-sm font-black tracking-tight data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all duration-300 whitespace-nowrap"
            >
              연차 현황
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-6 text-xs xs:text-sm font-black tracking-tight data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all duration-300 whitespace-nowrap"
            >
              휴가 신청/승인
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-6 text-xs xs:text-sm font-black tracking-tight data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all duration-300 whitespace-nowrap"
            >
              캘린더
            </TabsTrigger>
            {showAdminTabs && (
              <>
                <TabsTrigger
                  value="statistics"
                  className="rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-6 text-xs xs:text-sm font-black tracking-tight data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all duration-300 whitespace-nowrap"
                >
                  통계
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-6 text-xs xs:text-sm font-black tracking-tight data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all duration-300 whitespace-nowrap"
                >
                  설정
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <div className="bg-transparent pt-1 xs:pt-2">
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
