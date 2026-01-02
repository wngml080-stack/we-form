"use client";

import { Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OTFormData } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

export function IntensityAdaptationSection({ formData, updateFormData }: Props) {
  const updateIntensity = (key: keyof OTFormData["intensityAdaptation"], value: number | string) => {
    updateFormData("intensityAdaptation", {
      ...formData.intensityAdaptation,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Gauge className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">4. 운동 강도 적응도</h3>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-6">
        <h4 className="font-semibold text-gray-800">오늘 OT 수업 중 관찰</h4>

        {/* RPE 설명 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-gray-700 mb-2">RPE (자각적 운동 강도)</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
            <div className="bg-green-50 p-2 rounded">1-2: 매우 가벼움 (대화 가능)</div>
            <div className="bg-green-100 p-2 rounded">3-4: 가벼움</div>
            <div className="bg-yellow-50 p-2 rounded">5-6: 적당함 (약간 숨참)</div>
            <div className="bg-orange-50 p-2 rounded">7-8: 힘듦 (대화 어려움)</div>
            <div className="bg-red-50 p-2 rounded">9-10: 매우 힘듦 (최대 노력)</div>
          </div>
        </div>

        {/* 평균 RPE */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">오늘 OT 중 평균 RPE</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.intensityAdaptation.averageRPE || ""}
              onChange={(e) => updateIntensity("averageRPE", parseInt(e.target.value) || 0)}
              className="h-10 w-24"
            />
            <span className="text-gray-500">/ 10</span>
          </div>
          {formData.intensityAdaptation.averageRPE > 0 && (
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i < formData.intensityAdaptation.averageRPE
                      ? i < 3 ? "bg-green-400" : i < 5 ? "bg-green-500" : i < 7 ? "bg-yellow-500" : i < 9 ? "bg-orange-500" : "bg-red-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 회복 속도 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">회복 속도</Label>
          <div className="space-y-2">
            {[
              { value: "fast", label: "빠름 (세트 간 1분 이내 회복)" },
              { value: "normal", label: "보통 (1-2분 회복 필요)" },
              { value: "slow", label: "느림 (2분 이상 필요)" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.intensityAdaptation.recoverySpeed === option.value}
                  onCheckedChange={(checked) => updateIntensity("recoverySpeed", checked ? option.value as "fast" | "normal" | "slow" : "")}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* 땀/호흡 반응 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">땀 반응</Label>
            <div className="space-y-2">
              {[
                { value: "minimal", label: "거의 땀 안 남" },
                { value: "moderate", label: "적당히 땀" },
                { value: "heavy", label: "땀을 많이 흘림" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formData.intensityAdaptation.sweatResponse === option.value}
                    onCheckedChange={(checked) => updateIntensity("sweatResponse", checked ? option.value as "minimal" | "moderate" | "heavy" : "")}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">호흡 조절</Label>
            <div className="space-y-2">
              {[
                { value: "good", label: "호흡 조절 잘 됨" },
                { value: "easily_winded", label: "호흡이 쉽게 가빠짐" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formData.intensityAdaptation.breathingControl === option.value}
                    onCheckedChange={(checked) => updateIntensity("breathingControl", checked ? option.value as "good" | "easily_winded" : "")}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
