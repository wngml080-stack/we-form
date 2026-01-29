"use client";

import { use } from "react";
import dynamicImport from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminFilter } from "@/contexts/AdminFilterContext";

// Components 동적 임포트 (초기 로딩 최적화)
const SalaryTemplateManager = dynamicImport(() => import("./components/SalaryTemplateManager"), { ssr: false });
const SalaryCalculator = dynamicImport(() => import("./components/SalaryCalculator"), { ssr: false });

export default function AdminSalaryPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const { branchFilter } = useAdminFilter();
  const gymName = branchFilter.gyms.find(g => g.id === branchFilter.selectedGymId)?.name || "";

  return (
    <div className="p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 xs:space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 xs:gap-6">
        <div className="space-y-1 xs:space-y-2">
          <div className="flex items-center gap-2 text-[10px] xs:text-xs font-black text-blue-600 uppercase tracking-[0.2em]">
            <span className="w-6 xs:w-8 h-[2px] bg-blue-600"></span>
            Salary & Settlement
          </div>
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
            급여 관리
          </h1>
          <p className="text-slate-500 font-bold text-sm xs:text-base sm:text-lg flex items-center gap-2">
            {gymName ? (
              <>
                <span className="text-[#2F80ED] border-b-2 border-blue-100 px-1">{gymName}</span>의 투명한 급여 정산을 관리합니다.
              </>
            ) : (
              "직원별 급여 템플릿을 설정하고 월별 실적을 효율적으로 관리합니다."
            )}
          </p>
        </div>
      </div>

      {/* 탭 UI */}
      <Tabs defaultValue="calculation" className="w-full space-y-4 xs:space-y-6 sm:space-y-8">
        <div className="bg-white/50 backdrop-blur-md p-1 xs:p-1.5 rounded-xl xs:rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-sm inline-flex">
          <TabsList className="bg-transparent h-10 xs:h-11 sm:h-12 gap-1">
            <TabsTrigger
              value="calculation"
              className="rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-6 text-xs xs:text-sm font-black tracking-tight data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all duration-300"
            >
              급여 정산
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-6 text-xs xs:text-sm font-black tracking-tight data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 transition-all duration-300"
            >
              급여 템플릿 설계
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-transparent pt-1 xs:pt-2">
          <TabsContent value="calculation" className="animate-in fade-in slide-in-from-bottom-4 duration-700 m-0 outline-none">
            <SalaryCalculator />
          </TabsContent>

          <TabsContent value="templates" className="animate-in fade-in slide-in-from-bottom-4 duration-700 m-0 outline-none">
            <SalaryTemplateManager />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
