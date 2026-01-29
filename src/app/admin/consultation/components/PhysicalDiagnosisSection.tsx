"use client";

import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConsultationFormData, CurrentTreatment, LifestylePattern, MealPattern, PainArea } from "../types";

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

export function PhysicalDiagnosisSection({ formData, updateFormData }: Props) {
  const updatePainArea = (index: number, key: keyof PainArea, value: boolean | number | string) => {
    const newPainAreas = [...formData.painAreas];
    newPainAreas[index] = { ...newPainAreas[index], [key]: value };
    updateFormData("painAreas", newPainAreas);
  };

  const updateTreatment = (key: keyof CurrentTreatment, value: boolean | string) => {
    updateFormData("currentTreatment", {
      ...formData.currentTreatment,
      [key]: value,
    });
  };

  const updateLifestyle = (key: keyof LifestylePattern, value: number | "non" | "smoker") => {
    updateFormData("lifestylePattern", {
      ...formData.lifestylePattern,
      [key]: value,
    });
  };

  const updateMealPattern = (key: keyof MealPattern, value: boolean) => {
    updateFormData("mealPattern", {
      ...formData.mealPattern,
      [key]: value,
    });
  };

  const mealPatternOptions = [
    { key: "regular" as const, label: "규칙적 (하루 3끼)" },
    { key: "irregular" as const, label: "불규칙 (식사 시간이 들쭉날쭉)" },
    { key: "skipping" as const, label: "결식 잦음 (아침 거르기 등)" },
    { key: "lateNight" as const, label: "야식/음주 잦음" },
    { key: "binge" as const, label: "폭식 경향 있음" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <span className="text-purple-600 font-bold">3</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">신체 기능 &amp; 생활 습관 진단</h2>
      </div>

      {/* 통증/불편 부위 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-purple-500">✓</span> 통증/불편 부위
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600">부위</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-16">해당</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-28">강도 (1-5)</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">진단명/특이사항</th>
              </tr>
            </thead>
            <tbody>
              {formData.painAreas.map((pain, index) => (
                <tr key={pain.area} className="border-b border-gray-100">
                  <td className="py-3 px-3 text-gray-700">{pain.area}</td>
                  <td className="py-3 px-3 text-center">
                    <Checkbox
                      checked={pain.hasIssue}
                      onCheckedChange={(checked) => updatePainArea(index, "hasIssue", !!checked)}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <StarRating
                      value={pain.intensity}
                      onChange={(v) => updatePainArea(index, "intensity", v)}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      type="text"
                      placeholder="진단명/특이사항"
                      value={pain.diagnosis}
                      onChange={(e) => updatePainArea(index, "diagnosis", e.target.value)}
                      className="h-8 text-sm"
                      disabled={!pain.hasIssue}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 병원 진단 이력 */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700">병원 진단 이력</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="noMedicalHistory"
              checked={!formData.medicalHistory.hasHistory}
              onCheckedChange={(checked) =>
                updateFormData("medicalHistory", {
                  ...formData.medicalHistory,
                  hasHistory: !checked,
                })
              }
            />
            <Label htmlFor="noMedicalHistory" className="text-sm text-gray-700 cursor-pointer">
              없음
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasMedicalHistory"
              checked={formData.medicalHistory.hasHistory}
              onCheckedChange={(checked) =>
                updateFormData("medicalHistory", {
                  ...formData.medicalHistory,
                  hasHistory: !!checked,
                })
              }
            />
            <Label htmlFor="hasMedicalHistory" className="text-sm text-gray-700 cursor-pointer">
              있음
            </Label>
            {formData.medicalHistory.hasHistory && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">→ 진단명:</span>
                <Input
                  type="text"
                  placeholder="진단명 입력"
                  value={formData.medicalHistory.diagnosisName}
                  onChange={(e) =>
                    updateFormData("medicalHistory", {
                      ...formData.medicalHistory,
                      diagnosisName: e.target.value,
                    })
                  }
                  className="w-48 h-8 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 현재 치료 중 */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700">현재 치료 중</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="treatmentNone"
              checked={formData.currentTreatment.none}
              onCheckedChange={(checked) => updateTreatment("none", !!checked)}
            />
            <Label htmlFor="treatmentNone" className="text-sm text-gray-700 cursor-pointer">
              아니오
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="physicalTherapy"
              checked={formData.currentTreatment.physicalTherapy}
              onCheckedChange={(checked) => updateTreatment("physicalTherapy", !!checked)}
            />
            <Label htmlFor="physicalTherapy" className="text-sm text-gray-700 cursor-pointer">
              물리치료
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="manualTherapy"
              checked={formData.currentTreatment.manualTherapy}
              onCheckedChange={(checked) => updateTreatment("manualTherapy", !!checked)}
            />
            <Label htmlFor="manualTherapy" className="text-sm text-gray-700 cursor-pointer">
              도수치료
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="medication"
              checked={formData.currentTreatment.medication}
              onCheckedChange={(checked) => updateTreatment("medication", !!checked)}
            />
            <Label htmlFor="medication" className="text-sm text-gray-700 cursor-pointer">
              약물 복용
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="treatmentOther"
              checked={formData.currentTreatment.other}
              onCheckedChange={(checked) => updateTreatment("other", !!checked)}
            />
            <Label htmlFor="treatmentOther" className="text-sm text-gray-700 cursor-pointer">
              기타
            </Label>
            {formData.currentTreatment.other && (
              <Input
                type="text"
                placeholder="기타 치료"
                value={formData.currentTreatment.otherText}
                onChange={(e) => updateTreatment("otherText", e.target.value)}
                className="w-32 h-8 text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* 생활 패턴 */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-purple-500">✓</span> 생활 패턴
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600 w-24">좌식 시간</Label>
            <span className="text-sm text-gray-500">약</span>
            <Input
              type="number"
              min={0}
              value={formData.lifestylePattern.sittingHours ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                updateLifestyle("sittingHours", value === "" ? 0 : parseInt(value) || 0);
              }}
              className="w-16 h-8 text-sm text-center"
            />
            <span className="text-sm text-gray-500">시간/일</span>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600 w-24">수면 시간</Label>
            <span className="text-sm text-gray-500">약</span>
            <Input
              type="number"
              min={0}
              value={formData.lifestylePattern.sleepHours ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                updateLifestyle("sleepHours", value === "" ? 0 : parseInt(value) || 0);
              }}
              className="w-16 h-8 text-sm text-center"
            />
            <span className="text-sm text-gray-500">시간/일</span>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600 w-24">음주 빈도</Label>
            <span className="text-sm text-gray-500">주</span>
            <Input
              type="number"
              min={0}
              value={formData.lifestylePattern.drinkingPerWeek ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                updateLifestyle("drinkingPerWeek", value === "" ? 0 : parseInt(value) || 0);
              }}
              className="w-12 h-8 text-sm text-center"
            />
            <span className="text-sm text-gray-500">회 (1회 약</span>
            <Input
              type="number"
              min={0}
              value={formData.lifestylePattern.drinksPerSession ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                updateLifestyle("drinksPerSession", value === "" ? 0 : parseInt(value) || 0);
              }}
              className="w-12 h-8 text-sm text-center"
            />
            <span className="text-sm text-gray-500">잔)</span>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600 w-24">물 섭취량</Label>
            <span className="text-sm text-gray-500">약</span>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={formData.lifestylePattern.waterIntake ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                updateLifestyle("waterIntake", value === "" ? 0 : parseFloat(value) || 0);
              }}
              className="w-16 h-8 text-sm text-center"
            />
            <span className="text-sm text-gray-500">L/일</span>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <Label className="text-sm text-gray-600 w-24">흡연</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="nonSmoker"
                checked={formData.lifestylePattern.smoking === "non"}
                onCheckedChange={(checked) => checked && updateLifestyle("smoking", "non")}
              />
              <Label htmlFor="nonSmoker" className="text-sm text-gray-700 cursor-pointer">
                비흡연
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="smoker"
                checked={formData.lifestylePattern.smoking === "smoker"}
                onCheckedChange={(checked) => checked && updateLifestyle("smoking", "smoker")}
              />
              <Label htmlFor="smoker" className="text-sm text-gray-700 cursor-pointer">
                흡연
              </Label>
              {formData.lifestylePattern.smoking === "smoker" && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">(</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.lifestylePattern.smokingAmount ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateLifestyle("smokingAmount", value === "" ? 0 : parseFloat(value) || 0);
                    }}
                    className="w-14 h-8 text-sm text-center"
                  />
                  <span className="text-sm text-gray-500">갑/일)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 식사 패턴 */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700">식사 패턴</h4>
        <div className="flex flex-wrap gap-4">
          {mealPatternOptions.map((option) => (
            <div key={option.key} className="flex items-center gap-2">
              <Checkbox
                id={option.key}
                checked={formData.mealPattern[option.key]}
                onCheckedChange={(checked) => updateMealPattern(option.key, !!checked)}
              />
              <Label htmlFor={option.key} className="text-sm text-gray-700 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
