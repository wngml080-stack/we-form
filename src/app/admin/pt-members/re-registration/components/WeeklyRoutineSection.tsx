"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WeeklyRoutine } from "../types";

interface Props {
  getCurrentWeekStart: () => string;
  getWeeklyRoutine: (weekStart: string) => WeeklyRoutine | null;
  onUpdateRoutine: (weekStart: string, updates: Partial<WeeklyRoutine>) => void;
  hideHeaderCard?: boolean;
}

export function WeeklyRoutineSection({
  getCurrentWeekStart,
  getWeeklyRoutine,
  onUpdateRoutine,
  hideHeaderCard,
}: Props) {
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStart);

  const getWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    setSelectedWeek(current.toISOString().split("T")[0]);
  };

  const isCurrentWeek = selectedWeek === getCurrentWeekStart();

  const routine = getWeeklyRoutine(selectedWeek) || {
    weekStart: selectedWeek,
    mondayTasks: {
      checkTargetView: false,
      reviewExpiringList: false,
      scheduleConsultation: false,
      prepareData: false,
      memo: "",
    },
    fridayTasks: {
      summarizeResults: false,
      checkMissed: false,
      planNextWeek: false,
      memo: "",
    },
  };

  const updateMondayTask = (
    key: keyof typeof routine.mondayTasks,
    value: boolean | string
  ) => {
    onUpdateRoutine(selectedWeek, {
      mondayTasks: { ...routine.mondayTasks, [key]: value },
    });
  };

  const updateFridayTask = (
    key: keyof typeof routine.fridayTasks,
    value: boolean | string
  ) => {
    onUpdateRoutine(selectedWeek, {
      fridayTasks: { ...routine.fridayTasks, [key]: value },
    });
  };

  const getMondayCompletionRate = () => {
    const tasks = [
      routine.mondayTasks.checkTargetView,
      routine.mondayTasks.reviewExpiringList,
      routine.mondayTasks.scheduleConsultation,
      routine.mondayTasks.prepareData,
    ];
    return Math.round((tasks.filter(Boolean).length / tasks.length) * 100);
  };

  const getFridayCompletionRate = () => {
    const tasks = [
      routine.fridayTasks.summarizeResults,
      routine.fridayTasks.checkMissed,
      routine.fridayTasks.planNextWeek,
    ];
    return Math.round((tasks.filter(Boolean).length / tasks.length) * 100);
  };

  const mondayComplete = getMondayCompletionRate() === 100;
  const fridayComplete = getFridayCompletionRate() === 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 주간 네비게이션 */}
      <div className="flex items-center justify-between bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek("prev")}
          className="h-12 w-12 hover:bg-slate-50 rounded-2xl transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </Button>
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
            <Calendar className="w-7 h-7 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Management Routine</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {getWeekRange(selectedWeek)}
              </span>
              {isCurrentWeek && (
                <Badge className="bg-blue-600 text-white border-none text-[10px] font-black px-3 py-1 rounded-lg shadow-lg shadow-blue-100">THIS WEEK</Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek("next")}
          className="h-12 w-12 hover:bg-slate-50 rounded-2xl transition-all"
        >
          <ChevronRight className="w-6 h-6 text-slate-400" />
        </Button>
      </div>

      {/* 전략 가이드 배너 */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="flex items-start gap-5 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
            <ListTodo className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold mb-1 tracking-tight">재등록 하이패스: 주간 루틴</p>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
              월요일은 <span className="text-blue-400 font-bold">타겟팅</span>, 금요일은 <span className="text-blue-400 font-bold">피드백</span>입니다. 
              체계적인 루틴은 관리의 사각지대를 없애고 재등록 확률을 20% 이상 향상시킵니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 월요일 루틴 - 블루 테마 */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                <span className="text-lg font-black">월</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 tracking-tight">아침 체크리스트</h4>
                <p className="text-[11px] font-bold text-blue-600/70 uppercase tracking-wider">Monday Targeting</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1 justify-end">
                <span className={`text-sm font-black ${mondayComplete ? "text-emerald-600" : "text-blue-600"}`}>
                  {getMondayCompletionRate()}%
                </span>
                {mondayComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-blue-200" />
                )}
              </div>
              <div className="w-20 h-1 bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-700" 
                  style={{ width: `${getMondayCompletionRate()}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 flex-1">
            <div className="space-y-4">
              {[
                { id: "checkTargetView", label: "\"재등록 상담 필요\" 뷰 확인", desc: "진행률 70% 이상 회원 집중 분석" },
                { id: "reviewExpiringList", label: "이번 주 만료 예정자 리스트업", desc: "우선순위에 따른 전략적 배치" },
                { id: "scheduleConsultation", label: "각 회원별 상담 일정 확정", desc: "수업 전후 5분의 골든타임 활용" },
                { id: "prepareData", label: "회원별 변화 데이터 자료 준비", desc: "인바디, 운동 일지 시각화" },
              ].map((task) => (
                <div key={task.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <Checkbox
                    id={task.id}
                    checked={routine.mondayTasks[task.id as keyof typeof routine.mondayTasks] as boolean}
                    onCheckedChange={(checked) => updateMondayTask(task.id as any, !!checked)}
                    className="mt-1 w-5 h-5 rounded-lg border-slate-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor={task.id} className="cursor-pointer space-y-1">
                    <span className={`text-sm font-bold block transition-all ${
                      routine.mondayTasks[task.id as keyof typeof routine.mondayTasks] ? "text-slate-400 line-through" : "text-slate-800"
                    }`}>{task.label}</span>
                    <span className="text-xs text-slate-400 font-medium leading-relaxed">{task.desc}</span>
                  </Label>
                </div>
              ))}
            </div>

            <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Targeting Notes</Label>
              </div>
              <Textarea
                value={routine.mondayTasks.memo}
                onChange={(e) => updateMondayTask("memo", e.target.value)}
                placeholder="오늘의 전략이나 특이사항을 기록하세요..."
                className="bg-transparent border-none shadow-none focus-visible:ring-0 p-0 text-sm font-medium min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* 금요일 루틴 - 에메랄드 테마 */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <span className="text-lg font-black">금</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 tracking-tight">마무리 체크리스트</h4>
                <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-wider">Friday Feedback</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1 justify-end">
                <span className={`text-sm font-black ${fridayComplete ? "text-emerald-600" : "text-emerald-600"}`}>
                  {getFridayCompletionRate()}%
                </span>
                {fridayComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-emerald-200" />
                )}
              </div>
              <div className="w-20 h-1 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-700" 
                  style={{ width: `${getFridayCompletionRate()}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 flex-1">
            <div className="space-y-4">
              {[
                { id: "summarizeResults", label: "이번 주 상담 결과 최종 정리", desc: "성공 요인과 이탈 요인 데이터화" },
                { id: "checkMissed", label: "미상담 및 보류 회원 체크", desc: "놓친 대상자는 다음 주 월요일로 즉시 이월" },
                { id: "planNextWeek", label: "차주 재등록 관리 계획 수립", desc: "다음 주 골든타임 대상자 선점" },
              ].map((task) => (
                <div key={task.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <Checkbox
                    id={task.id}
                    checked={routine.fridayTasks[task.id as keyof typeof routine.fridayTasks] as boolean}
                    onCheckedChange={(checked) => updateFridayTask(task.id as any, !!checked)}
                    className="mt-1 w-5 h-5 rounded-lg border-slate-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor={task.id} className="cursor-pointer space-y-1">
                    <span className={`text-sm font-bold block transition-all ${
                      routine.fridayTasks[task.id as keyof typeof routine.fridayTasks] ? "text-slate-400 line-through" : "text-slate-800"
                    }`}>{task.label}</span>
                    <span className="text-xs text-slate-400 font-medium leading-relaxed">{task.desc}</span>
                  </Label>
                </div>
              ))}
            </div>

            <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback Notes</Label>
              </div>
              <Textarea
                value={routine.fridayTasks.memo}
                onChange={(e) => updateFridayTask("memo", e.target.value)}
                placeholder="이번 주 성과나 차주 주의사항을 기록하세요..."
                className="bg-transparent border-none shadow-none focus-visible:ring-0 p-0 text-sm font-medium min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 하단 주간 진행 프로그레스 요약 */}
      {isCurrentWeek && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                <CheckCircle className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">주간 관리 완성도</h4>
                <p className="text-sm text-slate-500 font-medium">이번 주 재등록 관리의 전체적인 진행 상황입니다.</p>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-xl">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${mondayComplete ? "bg-blue-500" : "bg-slate-200"}`} />
                    <span className="text-xs font-bold text-slate-600">월요일 타겟팅</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${fridayComplete ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <span className="text-xs font-bold text-slate-600">금요일 피드백</span>
                  </div>
                </div>
                <span className="text-xl font-black text-blue-600">
                  {Math.round((getMondayCompletionRate() + getFridayCompletionRate()) / 2)}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${(getMondayCompletionRate() + getFridayCompletionRate()) / 2}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
