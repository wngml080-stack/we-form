"use client";

import { Lightbulb, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConsultationFormData, DietGoal, GoalMotivation, RehabGoal, StrengthGoal, HabitGoal, OtherGoal } from "../types";

interface Props {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

function StarRating({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="focus:outline-none"
        >
          <Star
            className={`w-4 h-4 ${i < value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function GoalSettingSection({ formData, updateFormData }: Props) {
  const updateDietGoal = (key: keyof DietGoal, value: DietGoal[keyof DietGoal]) => {
    updateFormData("dietGoal", {
      ...formData.dietGoal,
      [key]: value,
    });
  };

  const updateRehabGoal = (key: keyof RehabGoal, value: RehabGoal[keyof RehabGoal]) => {
    updateFormData("rehabGoal", {
      ...formData.rehabGoal,
      [key]: value,
    });
  };

  const updateRehabIssue = (key: keyof RehabGoal["issues"], value: boolean | string) => {
    updateFormData("rehabGoal", {
      ...formData.rehabGoal,
      issues: {
        ...formData.rehabGoal.issues,
        [key]: value,
      },
    });
  };

  const updateStrengthGoal = (key: keyof StrengthGoal, value: StrengthGoal[keyof StrengthGoal]) => {
    updateFormData("strengthGoal", {
      ...formData.strengthGoal,
      [key]: value,
    });
  };

  const updateStrengthSubGoal = (key: keyof StrengthGoal["subGoals"], value: boolean | string) => {
    updateFormData("strengthGoal", {
      ...formData.strengthGoal,
      subGoals: {
        ...formData.strengthGoal.subGoals,
        [key]: value,
      },
    });
  };

  const updateHabitGoal = (key: keyof HabitGoal, value: HabitGoal[keyof HabitGoal]) => {
    updateFormData("habitGoal", {
      ...formData.habitGoal,
      [key]: value,
    });
  };

  const updateHabitSubGoal = (key: keyof HabitGoal["subGoals"], value: boolean | string) => {
    updateFormData("habitGoal", {
      ...formData.habitGoal,
      subGoals: {
        ...formData.habitGoal.subGoals,
        [key]: value,
      },
    });
  };

  const updateOtherGoal = (key: keyof OtherGoal, value: OtherGoal[keyof OtherGoal]) => {
    updateFormData("otherGoal", {
      ...formData.otherGoal,
      [key]: value,
    });
  };

  const clearAllGoals = () => {
    updateDietGoal("selected", false);
    updateRehabGoal("selected", false);
    updateStrengthGoal("selected", false);
    updateHabitGoal("selected", false);
    updateOtherGoal("selected", false);
  };

  const updateMotivation = (key: keyof GoalMotivation, value: GoalMotivation[keyof GoalMotivation]) => {
    updateFormData("goalMotivation", {
      ...formData.goalMotivation,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <span className="text-orange-600 font-bold">4</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">목표 설정</h2>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-orange-500">✓</span> 핵심 목표 (1가지 선택)
        </h3>
      </div>

      {/* 다이어트형 */}
      <div className={`border-2 rounded-xl p-4 space-y-4 transition-colors ${formData.dietGoal.selected ? "border-blue-400 bg-blue-50/30" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <Checkbox
            id="dietGoal"
            checked={formData.dietGoal.selected}
            onCheckedChange={(checked) => {
              if (checked) {
                clearAllGoals();
              }
              updateDietGoal("selected", !!checked);
            }}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs">D</span>
            </span>
            <Label htmlFor="dietGoal" className="text-base font-semibold text-gray-900 cursor-pointer">
              다이어트형
            </Label>
          </div>
        </div>

        {formData.dietGoal.selected && (
          <div className="space-y-4 pl-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">현재 체중</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.dietGoal.currentWeight || ""}
                    onChange={(e) => updateDietGoal("currentWeight", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                  <span className="text-sm text-gray-500">kg</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">목표 체중</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.dietGoal.targetWeight || ""}
                    onChange={(e) => updateDietGoal("targetWeight", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                  <span className="text-sm text-gray-500">kg</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">감량 목표</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.dietGoal.lossTarget || ""}
                    onChange={(e) => updateDietGoal("lossTarget", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                  <span className="text-sm text-gray-500">kg</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">목표 기한</Label>
                <Input
                  type="date"
                  value={formData.dietGoal.targetDate}
                  onChange={(e) => updateDietGoal("targetDate", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">과거 다이어트 시도</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.dietGoal.pastAttempts ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateDietGoal("pastAttempts", value === "" ? 0 : parseInt(value) || 0);
                    }}
                    className="h-9 text-sm"
                  />
                  <span className="text-sm text-gray-500">회</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">가장 가벼웠던 체중</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.dietGoal.lightestWeight ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateDietGoal("lightestWeight", value === "" ? 0 : parseFloat(value) || 0);
                    }}
                    className="h-9 text-sm w-20"
                  />
                  <span className="text-sm text-gray-500">kg (</span>
                  <Input
                    type="number"
                    value={formData.dietGoal.lightestWeightYearsAgo ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateDietGoal("lightestWeightYearsAgo", value === "" ? 0 : parseInt(value) || 0);
                    }}
                    className="h-9 text-sm w-14"
                  />
                  <span className="text-sm text-gray-500">년 전)</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">선호하는 방식</Label>
              <div className="flex gap-4">
                {[
                  { value: "exercise", label: "운동 위주" },
                  { value: "diet", label: "식단 위주" },
                  { value: "both", label: "둘 다" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`dietPref-${opt.value}`}
                      checked={formData.dietGoal.preference === opt.value}
                      onCheckedChange={(checked) => checked && updateDietGoal("preference", opt.value as "exercise" | "diet" | "both")}
                    />
                    <Label htmlFor={`dietPref-${opt.value}`} className="text-sm text-gray-700 cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 재활/체형 교정형 */}
      <div className={`border-2 rounded-xl p-4 space-y-4 transition-colors ${formData.rehabGoal.selected ? "border-green-400 bg-green-50/30" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <Checkbox
            id="rehabGoal"
            checked={formData.rehabGoal.selected}
            onCheckedChange={(checked) => {
              if (checked) {
                clearAllGoals();
              }
              updateRehabGoal("selected", !!checked);
            }}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs">R</span>
            </span>
            <Label htmlFor="rehabGoal" className="text-base font-semibold text-gray-900 cursor-pointer">
              재활/체형 교정형
            </Label>
          </div>
        </div>

        {formData.rehabGoal.selected && (
          <div className="space-y-4 pl-8">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">주요 문제</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: "turtleNeck" as const, label: "거북목" },
                  { key: "roundShoulder" as const, label: "라운드숄더 (굽은 어깨)" },
                  { key: "discHernia" as const, label: "허리디스크" },
                  { key: "pelvicImbalance" as const, label: "골반 비대칭" },
                  { key: "scoliosis" as const, label: "척추측만" },
                  { key: "kneePain" as const, label: "무릎 통증" },
                ].map((issue) => (
                  <div key={issue.key} className="flex items-center gap-2">
                    <Checkbox
                      id={issue.key}
                      checked={formData.rehabGoal.issues[issue.key]}
                      onCheckedChange={(checked) => updateRehabIssue(issue.key, !!checked)}
                    />
                    <Label htmlFor={issue.key} className="text-sm text-gray-700 cursor-pointer">
                      {issue.label}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rehabOther"
                    checked={formData.rehabGoal.issues.other}
                    onCheckedChange={(checked) => updateRehabIssue("other", !!checked)}
                  />
                  <Label htmlFor="rehabOther" className="text-sm text-gray-700 cursor-pointer">
                    기타
                  </Label>
                  {formData.rehabGoal.issues.other && (
                    <Input
                      type="text"
                      placeholder="기타"
                      value={formData.rehabGoal.issues.otherText}
                      onChange={(e) => updateRehabIssue("otherText", e.target.value)}
                      className="h-8 text-sm w-32"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">병원 진단</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.rehabGoal.hasMedicalDiagnosis}
                      onCheckedChange={(checked) => updateRehabGoal("hasMedicalDiagnosis", !!checked)}
                    />
                    <span className="text-sm text-gray-700">있음</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!formData.rehabGoal.hasMedicalDiagnosis}
                      onCheckedChange={(checked) => updateRehabGoal("hasMedicalDiagnosis", !checked)}
                    />
                    <span className="text-sm text-gray-700">없음</span>
                  </div>
                </div>
              </div>
              {formData.rehabGoal.hasMedicalDiagnosis && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">진단명</Label>
                  <Input
                    type="text"
                    value={formData.rehabGoal.diagnosisName}
                    onChange={(e) => updateRehabGoal("diagnosisName", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">일상생활 지장 정도 (1-5)</Label>
              <StarRating
                value={formData.rehabGoal.dailyLifeImpact}
                onChange={(v) => updateRehabGoal("dailyLifeImpact", v)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">운동 후 기대</Label>
              <Input
                type="text"
                placeholder="운동 후 기대하는 효과"
                value={formData.rehabGoal.expectation}
                onChange={(e) => updateRehabGoal("expectation", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* 근력/퍼포먼스형 */}
      <div className={`border-2 rounded-xl p-4 space-y-4 transition-colors ${formData.strengthGoal.selected ? "border-purple-400 bg-purple-50/30" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <Checkbox
            id="strengthGoal"
            checked={formData.strengthGoal.selected}
            onCheckedChange={(checked) => {
              if (checked) {
                clearAllGoals();
              }
              updateStrengthGoal("selected", !!checked);
            }}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-xs">S</span>
            </span>
            <Label htmlFor="strengthGoal" className="text-base font-semibold text-gray-900 cursor-pointer">
              근력/퍼포먼스형
            </Label>
          </div>
        </div>

        {formData.strengthGoal.selected && (
          <div className="space-y-4 pl-8">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">세부 목표</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: "overallFitness" as const, label: "전반적인 체력 증진" },
                  { key: "bodyProfile" as const, label: "바디프로필 촬영" },
                  { key: "bigThree" as const, label: "3대 중량 향상" },
                  { key: "bulkUp" as const, label: "근비대 (벌크업)" },
                  { key: "sportsPerformance" as const, label: "스포츠 퍼포먼스" },
                ].map((goal) => (
                  <div key={goal.key} className="flex items-center gap-2">
                    <Checkbox
                      id={goal.key}
                      checked={formData.strengthGoal.subGoals[goal.key]}
                      onCheckedChange={(checked) => updateStrengthSubGoal(goal.key, !!checked)}
                    />
                    <Label htmlFor={goal.key} className="text-sm text-gray-700 cursor-pointer">
                      {goal.label}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="strengthOther"
                    checked={formData.strengthGoal.subGoals.other}
                    onCheckedChange={(checked) => updateStrengthSubGoal("other", !!checked)}
                  />
                  <Label htmlFor="strengthOther" className="text-sm text-gray-700 cursor-pointer">
                    기타
                  </Label>
                  {formData.strengthGoal.subGoals.other && (
                    <Input
                      type="text"
                      placeholder="기타"
                      value={formData.strengthGoal.subGoals.otherText}
                      onChange={(e) => updateStrengthSubGoal("otherText", e.target.value)}
                      className="h-8 text-sm w-32"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">항목</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 w-28">현재</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 w-28">목표</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-700">스쿼트</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={formData.strengthGoal.currentSquat || ""}
                          onChange={(e) => updateStrengthGoal("currentSquat", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={formData.strengthGoal.targetSquat || ""}
                          onChange={(e) => updateStrengthGoal("targetSquat", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-700">벤치프레스</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={formData.strengthGoal.currentBench || ""}
                          onChange={(e) => updateStrengthGoal("currentBench", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={formData.strengthGoal.targetBench || ""}
                          onChange={(e) => updateStrengthGoal("targetBench", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-700">데드리프트</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={formData.strengthGoal.currentDeadlift || ""}
                          onChange={(e) => updateStrengthGoal("currentDeadlift", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={formData.strengthGoal.targetDeadlift || ""}
                          onChange={(e) => updateStrengthGoal("targetDeadlift", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-gray-700">운동 경력</td>
                    <td className="py-2 px-3" colSpan={2}>
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={formData.strengthGoal.exerciseYears || ""}
                          onChange={(e) => updateStrengthGoal("exerciseYears", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-gray-500">년</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 습관개선형 */}
      <div className={`border-2 rounded-xl p-4 space-y-4 transition-colors ${formData.habitGoal.selected ? "border-orange-400 bg-orange-50/30" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <Checkbox
            id="habitGoal"
            checked={formData.habitGoal.selected}
            onCheckedChange={(checked) => {
              if (checked) {
                clearAllGoals();
              }
              updateHabitGoal("selected", !!checked);
            }}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-xs">H</span>
            </span>
            <Label htmlFor="habitGoal" className="text-base font-semibold text-gray-900 cursor-pointer">
              습관개선형
            </Label>
          </div>
        </div>

        {formData.habitGoal.selected && (
          <div className="space-y-4 pl-8">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">개선하고 싶은 습관</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: "regularExercise" as const, label: "규칙적인 운동" },
                  { key: "betterSleep" as const, label: "수면 개선" },
                  { key: "healthyDiet" as const, label: "건강한 식습관" },
                  { key: "stressManagement" as const, label: "스트레스 관리" },
                  { key: "postureCorrection" as const, label: "자세 교정" },
                ].map((habit) => (
                  <div key={habit.key} className="flex items-center gap-2">
                    <Checkbox
                      id={habit.key}
                      checked={formData.habitGoal.subGoals[habit.key]}
                      onCheckedChange={(checked) => updateHabitSubGoal(habit.key, !!checked)}
                    />
                    <Label htmlFor={habit.key} className="text-sm text-gray-700 cursor-pointer">
                      {habit.label}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="habitOther"
                    checked={formData.habitGoal.subGoals.other}
                    onCheckedChange={(checked) => updateHabitSubGoal("other", !!checked)}
                  />
                  <Label htmlFor="habitOther" className="text-sm text-gray-700 cursor-pointer">
                    기타
                  </Label>
                  {formData.habitGoal.subGoals.other && (
                    <Input
                      type="text"
                      placeholder="기타"
                      value={formData.habitGoal.subGoals.otherText}
                      onChange={(e) => updateHabitSubGoal("otherText", e.target.value)}
                      className="h-8 text-sm w-32"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">현재 습관/상태</Label>
                <Input
                  type="text"
                  placeholder="예: 주 1회 운동, 불규칙한 수면"
                  value={formData.habitGoal.currentHabit}
                  onChange={(e) => updateHabitGoal("currentHabit", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">목표 습관</Label>
                <Input
                  type="text"
                  placeholder="예: 주 3회 운동, 11시 취침"
                  value={formData.habitGoal.targetHabit}
                  onChange={(e) => updateHabitGoal("targetHabit", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 기타 */}
      <div className={`border-2 rounded-xl p-4 space-y-4 transition-colors ${formData.otherGoal.selected ? "border-gray-400 bg-gray-50/30" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <Checkbox
            id="otherGoal"
            checked={formData.otherGoal.selected}
            onCheckedChange={(checked) => {
              if (checked) {
                clearAllGoals();
              }
              updateOtherGoal("selected", !!checked);
            }}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
              <span className="text-white text-xs">E</span>
            </span>
            <Label htmlFor="otherGoal" className="text-base font-semibold text-gray-900 cursor-pointer">
              기타
            </Label>
          </div>
        </div>

        {formData.otherGoal.selected && (
          <div className="space-y-4 pl-8">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">목표 설명</Label>
              <Textarea
                placeholder="목표를 자유롭게 작성해주세요"
                value={formData.otherGoal.description}
                onChange={(e) => updateOtherGoal("description", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 목표를 꼭 달성해야 하는 이유 */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-orange-500">✓</span> 이 목표를 꼭 달성해야 하는 이유 (WHY)
        </h3>

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">핵심 동기를 파악하면 중도 포기를 방지할 수 있습니다</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="hasEvent"
              checked={formData.goalMotivation.hasEvent}
              onCheckedChange={(checked) => updateMotivation("hasEvent", !!checked)}
            />
            <Label htmlFor="hasEvent" className="text-sm text-gray-700 cursor-pointer">
              이벤트가 있다 (웨딩/촬영)
            </Label>
            {formData.goalMotivation.hasEvent && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">→ 날짜:</span>
                <Input
                  type="date"
                  value={formData.goalMotivation.eventDate}
                  onChange={(e) => updateMotivation("eventDate", e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
            )}
          </div>

          {[
            { key: "healthWarning" as const, label: "건강 경고를 받았다 (고혈압/당뇨/고지혈증 등)" },
            { key: "selfEsteem" as const, label: "자존감이 떨어졌다 (옷이 안 맞음/거울 보기 싫음)" },
            { key: "severePain" as const, label: "통증이 너무 심하다 (일상생활 지장)" },
            { key: "lowStamina" as const, label: "체력이 너무 떨어졌다" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <Checkbox
                id={item.key}
                checked={formData.goalMotivation[item.key] as boolean}
                onCheckedChange={(checked) => updateMotivation(item.key, !!checked)}
              />
              <Label htmlFor={item.key} className="text-sm text-gray-700 cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Checkbox
              id="motivationOther"
              checked={formData.goalMotivation.other}
              onCheckedChange={(checked) => updateMotivation("other", !!checked)}
            />
            <Label htmlFor="motivationOther" className="text-sm text-gray-700 cursor-pointer">
              기타
            </Label>
            {formData.goalMotivation.other && (
              <Input
                type="text"
                placeholder="기타 이유"
                value={formData.goalMotivation.otherText}
                onChange={(e) => updateMotivation("otherText", e.target.value)}
                className="w-48 h-8 text-sm"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            구체적인 이유를 말씀해주세요:
          </Label>
          <Textarea
            placeholder="구체적인 이유를 작성해주세요"
            value={formData.goalMotivation.specificReason}
            onChange={(e) => updateMotivation("specificReason", e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
