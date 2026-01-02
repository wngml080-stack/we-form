"use client";

import { useState } from "react";
import { RefreshCw, Users, BarChart3, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReRegistrationData } from "../hooks/useReRegistrationData";
import { TargetMembersView } from "./TargetMembersView";
import { MonthlyStatsSection } from "./MonthlyStatsSection";
import { WeeklyRoutineSection } from "./WeeklyRoutineSection";
import { ConsultationRecordModal } from "./ConsultationRecordModal";
import { ReRegistrationConsultation } from "../types";

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 통합 컨트롤 헤더 - 서브 내비게이션을 카드 안으로 통합 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 상단: 탭 메뉴 영역 */}
        <div className="px-6 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl">
            {[
              { id: "targets", label: "집중 관리 대상", icon: Users, count: targetMembers.length },
              { id: "stats", label: "성과 데이터", icon: BarChart3 },
              { id: "routine", label: "매니지먼트 루틴", icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeSubTab === tab.id 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeSubTab === tab.id ? "text-blue-600" : "text-slate-400"}`} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeSubTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
              Standard Management Process
            </p>
          </div>
        </div>

        {/* 하단: 각 탭별 액션 영역 (이 영역은 각 컴포넌트 내부에서 렌더링되도록 유지하거나 통합 가능) */}
        {/* 여기서는 디자인 일관성을 위해 각 컴포넌트의 헤더를 이 카드와 자연스럽게 연결하겠습니다. */}
      </div>

      {/* 컨텐츠 영역 */}
      <div className="min-h-[500px]">
        {activeSubTab === "targets" && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <TargetMembersView
              members={targetMembers}
              allConsultations={allConsultations}
              onOpenConsultation={handleOpenModal}
              onUpdateConsultation={updateConsultation}
              onDeleteConsultation={deleteConsultation}
              hideHeaderCard={true} // 헤더가 통합되었으므로 기존 헤더 카드를 숨기는 옵션 추가 예정
            />
          </div>
        )}

        {activeSubTab === "stats" && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <MonthlyStatsSection
              stats={currentMonthStats}
              getMonthlyStats={getMonthlyStats}
              hideHeaderCard={true}
            />
          </div>
        )}

        {activeSubTab === "routine" && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <WeeklyRoutineSection
              getCurrentWeekStart={getCurrentWeekStart}
              getWeeklyRoutine={getWeeklyRoutine}
              onUpdateRoutine={updateWeeklyRoutine}
              hideHeaderCard={true}
            />
          </div>
        )}
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
