"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalaryTemplateManager from "@/app/admin/salary/components/SalaryTemplateManager";
import SalaryAssignmentManager from "@/app/admin/salary/components/SalaryAssignmentManager";

export default function AdminSalaryPage() {
  return (
    <div className="p-6 min-h-screen space-y-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-4xl font-heading font-bold text-[#2F80ED] mb-2">💰 급여 관리 (Flexible)</h2>
        <p className="text-base text-gray-600 font-sans">
          직원별 급여 템플릿을 설정하고 관리합니다.
        </p>
      </div>

      {/* 탭 UI */}
      <Tabs defaultValue="templates" className="w-full space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-white border shadow-sm h-12 p-1 rounded-xl">
          <TabsTrigger 
            value="templates"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white transition-all"
          >
            📋 급여 템플릿 설계
          </TabsTrigger>
          <TabsTrigger 
            value="assignments"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-[#2F80ED] data-[state=active]:text-white transition-all"
          >
            👥 직원 급여 설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="animate-fade-in">
            <SalaryTemplateManager />
        </TabsContent>
        
        <TabsContent value="assignments" className="animate-fade-in">
            <SalaryAssignmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
