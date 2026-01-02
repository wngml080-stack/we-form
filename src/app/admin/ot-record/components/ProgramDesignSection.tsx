"use client";

import { useState } from "react";
import { FileText, Target, Calendar, ListOrdered, AlertTriangle, Map, MessageSquare, ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OTFormData, ProgramDesign, WeeklyPlan } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

type DayKey = keyof WeeklyPlan["dailyPlan"];

const days: { key: DayKey; label: string }[] = [
  { key: "monday", label: "월" },
  { key: "tuesday", label: "화" },
  { key: "wednesday", label: "수" },
  { key: "thursday", label: "목" },
  { key: "friday", label: "금" },
  { key: "saturday", label: "토" },
  { key: "sunday", label: "일" },
];

const splitTypeOptions = [
  { value: "fullBody", label: "전신 운동 (초보자 추천)" },
  { value: "upperLower", label: "상/하체 분할" },
  { value: "bodyPart", label: "부위별 분할 (3분할 이상)" },
  { value: "pushPullLeg", label: "푸쉬/풀/레그" },
  { value: "other", label: "기타" },
];

export function ProgramDesignSection({ formData, updateFormData }: Props) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["smart", "weekly", "priority", "precaution", "roadmap", "feedback", "evaluation", "checklist"]);

  const toggleSection = (section: string) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter((s) => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };

  const updateProgramDesign = <K extends keyof ProgramDesign>(key: K, value: ProgramDesign[K]) => {
    updateFormData("programDesign", {
      ...formData.programDesign,
      [key]: value,
    });
  };

  const updateSmartGoal = (key: string, value: string) => {
    if (key.startsWith("timeBound.")) {
      const timeKey = key.split(".")[1] as "week4" | "week8" | "week12";
      updateProgramDesign("smartGoal", {
        ...formData.programDesign.smartGoal,
        timeBound: {
          ...formData.programDesign.smartGoal.timeBound,
          [timeKey]: value,
        },
      });
    } else {
      updateProgramDesign("smartGoal", {
        ...formData.programDesign.smartGoal,
        [key]: value,
      });
    }
  };

  const updateWeeklyPlan = (key: string, value: number | string | boolean) => {
    if (key.startsWith("dailyPlan.")) {
      const [, day, field] = key.split(".");
      updateProgramDesign("weeklyPlan", {
        ...formData.programDesign.weeklyPlan,
        dailyPlan: {
          ...formData.programDesign.weeklyPlan.dailyPlan,
          [day]: {
            ...formData.programDesign.weeklyPlan.dailyPlan[day as DayKey],
            [field]: value,
          },
        },
      });
    } else {
      updateProgramDesign("weeklyPlan", {
        ...formData.programDesign.weeklyPlan,
        [key]: value,
      });
    }
  };

  const updatePriority = (rank: number, field: "content" | "reason", value: string) => {
    updateProgramDesign(
      "priorities",
      formData.programDesign.priorities.map((p) =>
        p.rank === rank ? { ...p, [field]: value } : p
      )
    );
  };

  const updateRoadmap = (index: number, field: string, value: string) => {
    updateProgramDesign(
      "roadmap",
      formData.programDesign.roadmap.map((phase, i) =>
        i === index ? { ...phase, [field]: value } : phase
      )
    );
  };

  const SectionHeader = ({ icon, title, section, color }: { icon: React.ReactNode; title: string; section: string; color: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-3 ${color} rounded-t-xl hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      {expandedSections.includes(section) ? (
        <ChevronUp className="w-5 h-5 text-gray-600" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">6. 수업 프로그램 설계</h3>
        <label className="flex items-center gap-2 ml-4">
          <Checkbox
            checked={formData.programDesign.isCompleted}
            onCheckedChange={(checked) => updateProgramDesign("isCompleted", !!checked)}
          />
          <span className="text-sm text-gray-600">진행 완료</span>
        </label>
      </div>

      {/* SMART 목표 설정 */}
      <div className="border border-yellow-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<Target className="w-5 h-5 text-yellow-600" />}
          title="🎯 목표 설정 (SMART)"
          section="smart"
          color="bg-yellow-100"
        />
        {expandedSections.includes("smart") && (
          <div className="p-4 bg-yellow-50 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">S (Specific) - 구체적 목표</Label>
              <Textarea
                value={formData.programDesign.smartGoal.specific}
                onChange={(e) => updateSmartGoal("specific", e.target.value)}
                placeholder="구체적인 목표를 작성하세요"
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">M (Measurable) - 측정 가능한 지표</Label>
              <Textarea
                value={formData.programDesign.smartGoal.measurable}
                onChange={(e) => updateSmartGoal("measurable", e.target.value)}
                placeholder="측정 가능한 지표를 작성하세요"
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">A (Achievable) - 달성 가능 여부</Label>
                <div className="flex gap-4">
                  {[
                    { value: "possible", label: "가능" },
                    { value: "needsAdjustment", label: "조정 필요" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={formData.programDesign.smartGoal.achievable === opt.value}
                        onCheckedChange={(checked) => updateSmartGoal("achievable", checked ? opt.value : "")}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">R (Relevant) - 목표와의 연관성</Label>
                <div className="flex gap-4">
                  {[
                    { value: "high", label: "높음" },
                    { value: "medium", label: "보통" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={formData.programDesign.smartGoal.relevant === opt.value}
                        onCheckedChange={(checked) => updateSmartGoal("relevant", checked ? opt.value : "")}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">T (Time-bound) - 기한</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">4주 목표</span>
                  <Input
                    value={formData.programDesign.smartGoal.timeBound.week4}
                    onChange={(e) => updateSmartGoal("timeBound.week4", e.target.value)}
                    placeholder="4주 목표"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">8주 목표</span>
                  <Input
                    value={formData.programDesign.smartGoal.timeBound.week8}
                    onChange={(e) => updateSmartGoal("timeBound.week8", e.target.value)}
                    placeholder="8주 목표"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">12주 목표</span>
                  <Input
                    value={formData.programDesign.smartGoal.timeBound.week12}
                    onChange={(e) => updateSmartGoal("timeBound.week12", e.target.value)}
                    placeholder="12주 목표"
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 주간 운동 계획 */}
      <div className="border border-blue-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          title="📅 주간 운동 계획"
          section="weekly"
          color="bg-blue-100"
        />
        {expandedSections.includes("weekly") && (
          <div className="p-4 bg-blue-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">주당 운동 횟수</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.programDesign.weeklyPlan.weeklyCount || ""}
                    onChange={(e) => updateWeeklyPlan("weeklyCount", parseInt(e.target.value) || 0)}
                    className="h-9 w-20"
                  />
                  <span className="text-sm text-gray-500">회</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">운동 분할</Label>
                <div className="space-y-2">
                  {splitTypeOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={formData.programDesign.weeklyPlan.splitType === opt.value}
                        onCheckedChange={(checked) => updateWeeklyPlan("splitType", checked ? opt.value : "")}
                      />
                      {opt.label}
                    </label>
                  ))}
                  {formData.programDesign.weeklyPlan.splitType === "other" && (
                    <Input
                      value={formData.programDesign.weeklyPlan.splitTypeOther}
                      onChange={(e) => updateWeeklyPlan("splitTypeOther", e.target.value)}
                      placeholder="기타 운동 분할 방식"
                      className="h-8 mt-1"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">요일별 계획</Label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="p-2 text-left border border-blue-200">요일</th>
                      <th className="p-2 text-center border border-blue-200">PT</th>
                      <th className="p-2 text-center border border-blue-200">개인운동</th>
                      <th className="p-2 text-center border border-blue-200">휴식</th>
                      <th className="p-2 text-left border border-blue-200">포커스</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => (
                      <tr key={day.key} className="bg-white">
                        <td className="p-2 border border-blue-200 font-medium">{day.label}</td>
                        <td className="p-2 border border-blue-200 text-center">
                          <Checkbox
                            checked={formData.programDesign.weeklyPlan.dailyPlan[day.key].pt}
                            onCheckedChange={(checked) => updateWeeklyPlan(`dailyPlan.${day.key}.pt`, !!checked)}
                          />
                        </td>
                        <td className="p-2 border border-blue-200 text-center">
                          <Checkbox
                            checked={formData.programDesign.weeklyPlan.dailyPlan[day.key].personal}
                            onCheckedChange={(checked) => updateWeeklyPlan(`dailyPlan.${day.key}.personal`, !!checked)}
                          />
                        </td>
                        <td className="p-2 border border-blue-200 text-center">
                          <Checkbox
                            checked={formData.programDesign.weeklyPlan.dailyPlan[day.key].rest}
                            onCheckedChange={(checked) => updateWeeklyPlan(`dailyPlan.${day.key}.rest`, !!checked)}
                          />
                        </td>
                        <td className="p-2 border border-blue-200">
                          <Input
                            value={formData.programDesign.weeklyPlan.dailyPlan[day.key].focus}
                            onChange={(e) => updateWeeklyPlan(`dailyPlan.${day.key}.focus`, e.target.value)}
                            placeholder="포커스"
                            className="h-7 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 우선순위 */}
      <div className="border border-orange-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<ListOrdered className="w-5 h-5 text-orange-600" />}
          title="🔝 우선순위 (1순위 → 3순위)"
          section="priority"
          color="bg-orange-100"
        />
        {expandedSections.includes("priority") && (
          <div className="p-4 bg-orange-50">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-orange-100">
                  <th className="p-2 text-left border border-orange-200 w-20">순위</th>
                  <th className="p-2 text-left border border-orange-200">내용</th>
                  <th className="p-2 text-left border border-orange-200">이유</th>
                </tr>
              </thead>
              <tbody>
                {formData.programDesign.priorities.map((priority) => (
                  <tr key={priority.rank} className="bg-white">
                    <td className="p-2 border border-orange-200 font-medium text-center">{priority.rank}순위</td>
                    <td className="p-2 border border-orange-200">
                      <Input
                        value={priority.content}
                        onChange={(e) => updatePriority(priority.rank, "content", e.target.value)}
                        placeholder="우선순위 내용"
                        className="h-8"
                      />
                    </td>
                    <td className="p-2 border border-orange-200">
                      <Input
                        value={priority.reason}
                        onChange={(e) => updatePriority(priority.rank, "reason", e.target.value)}
                        placeholder="이유"
                        className="h-8"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 주의사항 & 금기 운동 */}
      <div className="border border-red-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          title="⚠️ 주의사항 & 금기 운동"
          section="precaution"
          color="bg-red-100"
        />
        {expandedSections.includes("precaution") && (
          <div className="p-4 bg-red-50 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">피해야 할 운동</Label>
              <Textarea
                value={formData.programDesign.precautions.avoidExercises}
                onChange={(e) => updateProgramDesign("precautions", { ...formData.programDesign.precautions, avoidExercises: e.target.value })}
                placeholder="피해야 할 운동을 작성하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">주의해서 해야 할 운동</Label>
              <Textarea
                value={formData.programDesign.precautions.cautionExercises}
                onChange={(e) => updateProgramDesign("precautions", { ...formData.programDesign.precautions, cautionExercises: e.target.value })}
                placeholder="주의해서 해야 할 운동을 작성하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">특별 고려사항</Label>
              <Textarea
                value={formData.programDesign.precautions.specialConsiderations}
                onChange={(e) => updateProgramDesign("precautions", { ...formData.programDesign.precautions, specialConsiderations: e.target.value })}
                placeholder="특별 고려사항을 작성하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 로드맵 */}
      <div className="border border-purple-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<Map className="w-5 h-5 text-purple-600" />}
          title="🗺️ 12주 로드맵"
          section="roadmap"
          color="bg-purple-100"
        />
        {expandedSections.includes("roadmap") && (
          <div className="p-4 bg-purple-50 space-y-4">
            {formData.programDesign.roadmap.map((phase, index) => (
              <div key={index} className="bg-white border border-purple-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-500 text-white text-sm font-medium rounded-full">
                    {phase.phaseName}
                  </span>
                  <span className="text-sm text-gray-500">({phase.weekRange})</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">목표</Label>
                  <Input
                    value={phase.goal}
                    onChange={(e) => updateRoadmap(index, "goal", e.target.value)}
                    placeholder="이 단계의 목표"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">주요 운동</Label>
                  <Textarea
                    value={phase.mainExercises}
                    onChange={(e) => updateRoadmap(index, "mainExercises", e.target.value)}
                    placeholder="이 단계의 주요 운동"
                    className="min-h-[60px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">기대 변화</Label>
                  <Input
                    value={phase.expectedChanges}
                    onChange={(e) => updateRoadmap(index, "expectedChanges", e.target.value)}
                    placeholder="이 단계에서 기대되는 변화"
                    className="h-9"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 회원 피드백 */}
      <div className="border border-teal-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<MessageSquare className="w-5 h-5 text-teal-600" />}
          title="6️⃣ 회원 피드백"
          section="feedback"
          color="bg-teal-100"
        />
        {expandedSections.includes("feedback") && (
          <div className="p-4 bg-teal-50 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">OT 수업 후 느낌</Label>
              <Textarea
                value={formData.programDesign.memberFeedback.otFeeling}
                onChange={(e) => updateProgramDesign("memberFeedback", { ...formData.programDesign.memberFeedback, otFeeling: e.target.value })}
                placeholder="OT 수업 후 회원의 느낌을 기록하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">기대와 현실 사이에 간극이 있었나요?</Label>
              <div className="space-y-2">
                {[
                  { value: "asExpected", label: "예상대로였다" },
                  { value: "easierThanExpected", label: "생각보다 쉬웠다" },
                  { value: "harderThanExpected", label: "생각보다 힘들었다" },
                  { value: "other", label: "기타" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={formData.programDesign.memberFeedback.expectationReality === opt.value}
                      onCheckedChange={(checked) => updateProgramDesign("memberFeedback", { ...formData.programDesign.memberFeedback, expectationReality: checked ? opt.value as "asExpected" | "easierThanExpected" | "harderThanExpected" | "other" : "" })}
                    />
                    {opt.label}
                  </label>
                ))}
                {formData.programDesign.memberFeedback.expectationReality === "other" && (
                  <Input
                    value={formData.programDesign.memberFeedback.expectationRealityOther}
                    onChange={(e) => updateProgramDesign("memberFeedback", { ...formData.programDesign.memberFeedback, expectationRealityOther: e.target.value })}
                    placeholder="기타 내용"
                    className="h-8 mt-1"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">추가 요청사항 / 궁금한 점</Label>
              <Textarea
                value={formData.programDesign.memberFeedback.additionalRequests}
                onChange={(e) => updateProgramDesign("memberFeedback", { ...formData.programDesign.memberFeedback, additionalRequests: e.target.value })}
                placeholder="추가 요청사항이나 궁금한 점을 기록하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 트레이너 종합 평가 */}
      <div className="border border-indigo-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          title="7️⃣ 트레이너 종합 평가"
          section="evaluation"
          color="bg-indigo-100"
        />
        {expandedSections.includes("evaluation") && (
          <div className="p-4 bg-indigo-50 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">이 회원의 강점</Label>
              <Textarea
                value={formData.programDesign.trainerEvaluation.memberStrengths}
                onChange={(e) => updateProgramDesign("trainerEvaluation", { ...formData.programDesign.trainerEvaluation, memberStrengths: e.target.value })}
                placeholder="회원의 강점을 기록하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">이 회원의 약점/개선점</Label>
              <Textarea
                value={formData.programDesign.trainerEvaluation.memberWeaknesses}
                onChange={(e) => updateProgramDesign("trainerEvaluation", { ...formData.programDesign.trainerEvaluation, memberWeaknesses: e.target.value })}
                placeholder="회원의 약점이나 개선점을 기록하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">코칭 시 유의할 점</Label>
              <Textarea
                value={formData.programDesign.trainerEvaluation.coachingNotes}
                onChange={(e) => updateProgramDesign("trainerEvaluation", { ...formData.programDesign.trainerEvaluation, coachingNotes: e.target.value })}
                placeholder="코칭 시 유의할 점을 기록하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">예상되는 어려움과 대응 전략</Label>
              <Textarea
                value={formData.programDesign.trainerEvaluation.anticipatedChallenges}
                onChange={(e) => updateProgramDesign("trainerEvaluation", { ...formData.programDesign.trainerEvaluation, anticipatedChallenges: e.target.value })}
                placeholder="예상되는 어려움과 대응 전략을 기록하세요"
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* OT 완료 체크리스트 */}
      <div className="border border-green-200 rounded-xl overflow-hidden">
        <SectionHeader
          icon={<ClipboardCheck className="w-5 h-5 text-green-600" />}
          title="✅ OT 완료 체크리스트"
          section="checklist"
          color="bg-green-100"
        />
        {expandedSections.includes("checklist") && (
          <div className="p-4 bg-green-50 space-y-3">
            {[
              { key: "inBodyComplete", label: "인바디 측정 완료" },
              { key: "circumferenceComplete", label: "둘레 측정 완료" },
              { key: "beforePhotoComplete", label: "비포 사진 촬영 완료 (정면/측면/후면)" },
              { key: "movementScreeningComplete", label: "움직임 스크리닝 완료" },
              { key: "fitnessTestComplete", label: "기초 체력 테스트 완료" },
              { key: "goalAgreed", label: "목표 합의 완료" },
              { key: "roadmapExplained", label: "12주 로드맵 설명 완료" },
              { key: "centerGuideComplete", label: "센터 이용 안내 완료" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={formData.programDesign.checklist[item.key as keyof typeof formData.programDesign.checklist] as boolean}
                  onCheckedChange={(checked) => updateProgramDesign("checklist", { ...formData.programDesign.checklist, [item.key]: !!checked })}
                />
                {item.label}
              </label>
            ))}

            <div className="flex items-center gap-3">
              <Checkbox
                checked={formData.programDesign.checklist.nextSessionBooked}
                onCheckedChange={(checked) => updateProgramDesign("checklist", { ...formData.programDesign.checklist, nextSessionBooked: !!checked })}
              />
              <span className="text-sm">다음 세션 예약 완료 →</span>
              <Input
                type="datetime-local"
                value={formData.programDesign.checklist.nextSessionDateTime}
                onChange={(e) => updateProgramDesign("checklist", { ...formData.programDesign.checklist, nextSessionDateTime: e.target.value })}
                className="h-8 w-auto"
                disabled={!formData.programDesign.checklist.nextSessionBooked}
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                checked={formData.programDesign.checklist.homeworkAssigned}
                onCheckedChange={(checked) => updateProgramDesign("checklist", { ...formData.programDesign.checklist, homeworkAssigned: !!checked })}
              />
              <div className="flex-1 space-y-1">
                <span className="text-sm">숙제/과제 전달 (해당 시)</span>
                {formData.programDesign.checklist.homeworkAssigned && (
                  <Input
                    value={formData.programDesign.checklist.homeworkContent}
                    onChange={(e) => updateProgramDesign("checklist", { ...formData.programDesign.checklist, homeworkContent: e.target.value })}
                    placeholder="숙제/과제 내용"
                    className="h-8"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
