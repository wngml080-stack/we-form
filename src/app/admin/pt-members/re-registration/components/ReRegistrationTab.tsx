"use client";

import { useState } from "react";
import { RefreshCw, Users, BarChart3, Calendar, Layers, Sparkles, Target, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReRegistrationData } from "../hooks/useReRegistrationData";
import { TargetMembersView } from "./TargetMembersView";
import { MonthlyStatsSection } from "./MonthlyStatsSection";
import { WeeklyRoutineSection } from "./WeeklyRoutineSection";
import { ConsultationRecordModal } from "./ConsultationRecordModal";
import { ReRegistrationConsultation } from "../types";
import { cn } from "@/lib/utils";

interface Props {
  selectedGymId: string | null;
}

export function ReRegistrationTab({ selectedGymId }: Props) {
  const [activeSubTab, setActiveSubTab] = useState("targets");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] =
    useState<ReRegistrationConsultation | null>(null);

  const {
    isLoading,
    targetMembers,
    allConsultations,
    addConsultation,
    updateConsultation,
    deleteConsultation,
    getMonthlyStats,
    currentMonthStats,
    getCurrentWeekStart,
    getWeeklyRoutine,
    updateWeeklyRoutine,
  } = useReRegistrationData({ selectedGymId });

  const handleOpenModal = (consultation?: ReRegistrationConsultation) => {
    setSelectedConsultation(consultation || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConsultation(null);
  };

  const handleSaveConsultation = (
    formData: Omit<ReRegistrationConsultation, "id" | "createdAt" | "updatedAt">
  ) => {
    if (selectedConsultation) {
      updateConsultation(selectedConsultation.id, formData);
    } else {
      addConsultation(formData);
    }
    handleCloseModal();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin"></div>
        <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Loading Process...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 서브 내비게이션 통합 카드 */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">재등록 관리 매니저</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 ml-10">데이터 기반의 체계적인 재등록 프로세스를 실행하세요</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-[24px] w-full lg:w-auto">
              {[
                { id: "targets", label: "집중 관리 대상", icon: Users, count: targetMembers.length },
                { id: "stats", label: "성과 데이터", icon: BarChart3 },
                { id: "routine", label: "매니지먼트 루틴", icon: Calendar },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    "flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-black rounded-[18px] transition-all",
                    activeSubTab === tab.id 
                      ? "bg-white text-blue-600 shadow-xl shadow-blue-100/50" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <tab.icon className={cn("w-3.5 h-3.5", activeSubTab === tab.id ? "text-blue-600" : "text-slate-300")} />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black",
                      activeSubTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-200 text-slate-500"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 하단 장식선 */}
        <div className="h-1 w-full bg-slate-50 flex">
          {['targets', 'stats', 'routine'].map((id) => (
            <div 
              key={id} 
              className={cn(
                "h-full transition-all duration-500",
                activeSubTab === id ? "flex-[2] bg-blue-500" : "flex-1 bg-transparent"
              )}
            />
          ))}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="min-h-[600px]">
        {activeSubTab === "targets" && (
          <div className="animate-in slide-in-from-bottom-4 duration-700">
            <TargetMembersView
              members={targetMembers}
              allConsultations={allConsultations}
              onOpenConsultation={handleOpenModal}
              onUpdateConsultation={updateConsultation}
              onDeleteConsultation={deleteConsultation}
              hideHeaderCard={true}
            />
          </div>
        )}

        {activeSubTab === "stats" && (
          <div className="animate-in slide-in-from-bottom-4 duration-700">
            <MonthlyStatsSection
              stats={currentMonthStats}
              getMonthlyStats={getMonthlyStats}
              hideHeaderCard={true}
            />
          </div>
        )}

        {activeSubTab === "routine" && (
          <div className="animate-in slide-in-from-bottom-4 duration-700">
            <WeeklyRoutineSection
              getCurrentWeekStart={getCurrentWeekStart}
              getWeeklyRoutine={getWeeklyRoutine}
              onUpdateRoutine={updateWeeklyRoutine}
              hideHeaderCard={true}
            />
          </div>
        )}
      </div>

      {/* 통합 안내 푸터 */}
      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">재등록 관리 팁</h4>
            <p className="text-xs font-medium text-slate-500 mt-0.5">성공적인 재등록을 위한 표준 매뉴얼을 확인해보세요.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-slate-200 group">
          표준 관리 매뉴얼 열기
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 상담 기록 모달 */}
      <ConsultationRecordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveConsultation}
        existingData={selectedConsultation}
      />
    </div>
  );
}
