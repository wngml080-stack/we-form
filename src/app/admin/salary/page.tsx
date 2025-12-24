"use client";

import dynamicImport from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminFilter } from "@/contexts/AdminFilterContext";

// Dynamic imports for heavy tab components (코드 스플리팅으로 초기 로드 성능 개선)
const SalaryTemplateManager = dynamicImport(
  () => import("@/app/admin/salary/components/SalaryTemplateManager"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-50 rounded-lg animate-pulse" /> }
);
const SalaryAssignmentManager = dynamicImport(
  () => import("@/app/admin/salary/components/SalaryAssignmentManager"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-50 rounded-lg animate-pulse" /> }
);
const MonthlyStatsViewer = dynamicImport(
  () => import("@/app/admin/salary/components/MonthlyStatsViewer"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-50 rounded-lg animate-pulse" /> }
);
const SalaryCalculator = dynamicImport(
  () => import("@/app/admin/salary/components/SalaryCalculator"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-50 rounded-lg animate-pulse" /> }
);

export default function AdminSalaryPage() {
  const { branchFilter } = useAdminFilter();
  const gymName = branchFilter.gyms.find(g => g.id === branchFilter.selectedGymId)?.name || "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">급여 관리</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">
            {gymName ? `${gymName}의 급여를 관리합니다.` : "직원별 급여 템플릿을 설정하고 월별 실적을 관리합니다."}
          </p>
        </div>
      </div>

      {/* 탭 UI */}
      <Tabs defaultValue="stats" className="w-full space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-4 bg-white border border-gray-100 shadow-sm h-12 p-1 rounded-xl">
          <TabsTrigger
            value="stats"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white transition-all"
          >
            월별 실적 집계
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white transition-all"
          >
            급여 템플릿 설계
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white transition-all"
          >
            직원 급여 설정
          </TabsTrigger>
          <TabsTrigger
            value="calculation"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white transition-all"
          >
            급여 정산
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="animate-fade-in">
            <MonthlyStatsViewer />
        </TabsContent>

        <TabsContent value="templates" className="animate-fade-in">
            <SalaryTemplateManager />
        </TabsContent>

        <TabsContent value="assignments" className="animate-fade-in">
            <SalaryAssignmentManager />
        </TabsContent>

        <TabsContent value="calculation" className="animate-fade-in">
            <SalaryCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
