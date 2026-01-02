"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  User,
  Trash2,
  Edit,
  AlertTriangle,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReRegistrationConsultation } from "../types";
import { StageChecklist } from "./StageChecklist";

interface Props {
  members: ReRegistrationConsultation[];
  allConsultations: ReRegistrationConsultation[];
  onOpenConsultation: (consultation?: ReRegistrationConsultation) => void;
  onUpdateConsultation: (
    id: string,
    updates: Partial<ReRegistrationConsultation>
  ) => void;
  onDeleteConsultation: (id: string) => void;
  hideHeaderCard?: boolean;
}

export function TargetMembersView({
  members,
  allConsultations,
  onOpenConsultation,
  onUpdateConsultation,
  onDeleteConsultation,
  hideHeaderCard,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] =
    useState<ReRegistrationConsultation | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const displayMembers = showAllMembers ? allConsultations : members;

  const filteredMembers = displayMembers.filter(
    (m) =>
      m.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.assignedTrainer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStageColor = (stage: number) => {
    switch (stage) {
      case 1:
        return "bg-green-100 text-green-700";
      case 2:
        return "bg-blue-100 text-blue-700";
      case 3:
        return "bg-yellow-100 text-yellow-700";
      case 4:
        return "bg-orange-100 text-orange-700";
      case 5:
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getReactionBadge = (reaction: string) => {
    switch (reaction) {
      case "positive":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
            긍정적
          </span>
        );
      case "considering":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
            고민중
          </span>
        );
      case "negative":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
            부정적
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
            미확인
          </span>
        );
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case "reRegistered":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
            재등록 완료
          </span>
        );
      case "paused":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
            휴회
          </span>
        );
      case "terminated":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">
            종료
          </span>
        );
      default:
        return null;
    }
  };

  const handleUpdateChecklist = (
    updates: Partial<ReRegistrationConsultation>
  ) => {
    if (selectedMember) {
      onUpdateConsultation(selectedMember.id, updates);
      setSelectedMember((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 상단 액션 바 */}
      {!hideHeaderCard && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 min-w-0 md:min-w-[300px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="회원명 또는 트레이너 검색"
                  className="pl-11 h-11 bg-gray-50/50 border-gray-100 rounded-2xl focus:bg-white transition-all"
                />
              </div>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setShowAllMembers(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    !showAllMembers ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  대상자만
                </button>
                <button
                  onClick={() => setShowAllMembers(true)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    showAllMembers ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  전체보기
                </button>
              </div>
            </div>
            <Button
              onClick={() => onOpenConsultation()}
              className="w-full md:w-auto gap-2 bg-[#2F80ED] hover:bg-[#1c60b8] text-white h-11 px-6 rounded-2xl shadow-lg shadow-blue-100 font-bold"
            >
              <Plus className="w-5 h-5" />
              <span>상담 기록 추가</span>
            </Button>
          </div>
        </div>
      )}

      {hideHeaderCard && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 min-w-0 md:min-w-[300px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회원명 또는 트레이너 검색"
                className="pl-11 h-11 bg-gray-50/50 border-gray-100 rounded-2xl focus:bg-white transition-all font-bold"
              />
            </div>
            <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
              <button
                onClick={() => setShowAllMembers(false)}
                className={cn(
                  "px-5 py-2 text-xs font-black rounded-xl transition-all",
                  !showAllMembers ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Focus
              </button>
              <button
                onClick={() => setShowAllMembers(true)}
                className={cn(
                  "px-5 py-2 text-xs font-black rounded-xl transition-all",
                  showAllMembers ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                All
              </button>
            </div>
          </div>
          <Button
            onClick={() => onOpenConsultation()}
            className="w-full md:w-auto gap-2 bg-slate-900 hover:bg-black text-white h-12 px-8 rounded-2xl shadow-xl shadow-slate-200 font-black transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>상담 기록 추가</span>
          </Button>
        </div>
      )}

      {/* 안내 배너 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-start gap-5 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold mb-1">골든타임: 잔여 30% 시점</p>
            <p className="text-blue-50/80 text-sm leading-relaxed max-w-2xl">
              진행률 70%를 넘어서는 시점이 재등록 확률이 가장 높은 '골든타임'입니다. 
              해당 회원들은 자동으로 관리 리스트에 추가되며, 단계별 체크리스트를 통해 체계적으로 관리할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 메인 레이아웃 */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl py-20 text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchQuery ? "검색 결과가 없습니다" : "상담 기록이 없습니다"}
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">
            {searchQuery 
              ? "검색어를 확인하시거나 필터를 조정해보세요." 
              : "재등록 관리가 필요한 회원을 위해 새로운 상담 기록을 추가해보세요."}
          </p>
          <Button onClick={() => onOpenConsultation()} variant="outline" className="rounded-xl border-gray-200 font-bold px-6">
            첫 기록 시작하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {showAllMembers ? "모든 상담 데이터" : "재등록 집중 관리"} ({filteredMembers.length})
              </h3>
            </div>
            
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`group bg-white rounded-2xl p-5 border transition-all relative cursor-pointer ${
                    selectedMember?.id === member.id
                      ? "border-blue-500 shadow-xl shadow-blue-50 ring-4 ring-blue-50"
                      : "border-gray-100 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm font-bold text-white transition-transform group-hover:scale-110 ${
                        selectedMember?.id === member.id ? "bg-blue-600" : "bg-slate-800"
                      }`}>
                        {member.memberName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base">
                          {member.memberName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500">{member.assignedTrainer || "미지정"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`px-2.5 py-0.5 rounded-lg border-none font-bold text-[10px] uppercase tracking-tighter ${getStageColor(member.currentStage)}`}>
                        Stage {member.currentStage}
                      </Badge>
                      {member.finalOutcome && (
                        <div className="scale-90 origin-right">
                          {getOutcomeBadge(member.finalOutcome)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">잔여 세션</p>
                      <p className="text-sm font-bold text-slate-700">{member.remainingSessions} <span className="text-slate-400 font-medium">/ {member.totalSessions}회</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">진행률</p>
                      <p className="text-sm font-bold text-slate-700">{member.progressPercentage}%</p>
                    </div>
                  </div>

                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
                        member.progressPercentage >= 70 ? "bg-blue-500" : "bg-slate-400"
                      }`}
                      style={{ width: `${member.progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-2">
                      {getReactionBadge(member.memberReaction)}
                      {member.nextContactDate && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold">
                          <Calendar className="w-3 h-3" />
                          {member.nextContactDate}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenConsultation(member);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("상담 기록을 삭제하시겠습니까?")) {
                            onDeleteConsultation(member.id);
                            if (selectedMember?.id === member.id) setSelectedMember(null);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedMember ? (
              <div className="animate-in slide-in-from-right-4 duration-500 sticky top-6">
                <StageChecklist
                  consultation={selectedMember}
                  onUpdate={handleUpdateChecklist}
                />
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-12 text-center h-full flex items-center justify-center min-h-[500px] border border-gray-100 shadow-sm border-dashed">
                <div className="max-w-xs">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                    <User className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">회원을 선택해주세요</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    왼쪽 리스트에서 회원을 선택하면 해당 회원의 단계별 재등록 관리 현황과 체크리스트를 확인하고 업데이트할 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
