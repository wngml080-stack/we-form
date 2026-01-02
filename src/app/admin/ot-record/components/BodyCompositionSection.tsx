"use client";

import { Activity, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OTFormData } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

export function BodyCompositionSection({ formData, updateFormData }: Props) {
  const updateBodyComposition = (key: keyof OTFormData["bodyComposition"], value: number | string) => {
    updateFormData("bodyComposition", {
      ...formData.bodyComposition,
      [key]: value,
    });
  };

  const updateMuscleBalance = (key: keyof OTFormData["muscleBalance"], value: string) => {
    updateFormData("muscleBalance", {
      ...formData.muscleBalance,
      [key]: value,
    });
  };

  const updateCircumference = (key: keyof OTFormData["circumference"], value: number) => {
    updateFormData("circumference", {
      ...formData.circumference,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">1. 체성분 측정</h3>
      </div>

      {/* 인바디 / 체성분 기록 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">📊</span> 인바디 / 체성분 기록
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-gray-600">항목</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">측정값</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">판정</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 px-2 font-medium">체중</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.bodyComposition.weight || ""}
                      onChange={(e) => updateBodyComposition("weight", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                    <span className="text-gray-500">kg</span>
                  </div>
                </td>
                <td className="py-2 px-2">-</td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium">골격근량</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.bodyComposition.skeletalMuscle || ""}
                      onChange={(e) => updateBodyComposition("skeletalMuscle", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                    <span className="text-gray-500">kg</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-2 flex-wrap">
                    {(["insufficient", "normal", "high"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.bodyComposition.skeletalMuscleStatus === status}
                          onCheckedChange={(checked) =>
                            updateBodyComposition("skeletalMuscleStatus", checked ? status : "")
                          }
                        />
                        {status === "insufficient" ? "부족" : status === "normal" ? "표준" : "많음"}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium">체지방량</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.bodyComposition.bodyFat || ""}
                      onChange={(e) => updateBodyComposition("bodyFat", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                    <span className="text-gray-500">kg</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-2 flex-wrap">
                    {(["insufficient", "normal", "high"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.bodyComposition.bodyFatStatus === status}
                          onCheckedChange={(checked) =>
                            updateBodyComposition("bodyFatStatus", checked ? status : "")
                          }
                        />
                        {status === "insufficient" ? "부족" : status === "normal" ? "표준" : "많음"}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium">체지방률</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.bodyComposition.bodyFatPercentage || ""}
                      onChange={(e) => updateBodyComposition("bodyFatPercentage", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-2 flex-wrap">
                    {(["insufficient", "normal", "high"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.bodyComposition.bodyFatPercentageStatus === status}
                          onCheckedChange={(checked) =>
                            updateBodyComposition("bodyFatPercentageStatus", checked ? status : "")
                          }
                        />
                        {status === "insufficient" ? "부족" : status === "normal" ? "표준" : "많음"}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium">BMI</td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.bodyComposition.bmi || ""}
                    onChange={(e) => updateBodyComposition("bmi", parseFloat(e.target.value) || 0)}
                    className="h-8 w-20"
                  />
                </td>
                <td className="py-2 px-2">-</td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium">기초대사량</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={formData.bodyComposition.basalMetabolicRate || ""}
                      onChange={(e) => updateBodyComposition("basalMetabolicRate", parseInt(e.target.value) || 0)}
                      className="h-8 w-24"
                    />
                    <span className="text-gray-500">kcal</span>
                  </div>
                </td>
                <td className="py-2 px-2">-</td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium">내장지방 레벨</td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    value={formData.bodyComposition.visceralFatLevel || ""}
                    onChange={(e) => updateBodyComposition("visceralFatLevel", parseInt(e.target.value) || 0)}
                    className="h-8 w-20"
                  />
                </td>
                <td className="py-2 px-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 부위별 근육량 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800">부위별 근육량 (좌/우 균형)</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">팔</Label>
            <div className="flex gap-2">
              {(["balanced", "imbalanced"] as const).map((status) => (
                <label key={status} className="flex items-center gap-1 text-sm">
                  <Checkbox
                    checked={formData.muscleBalance.armBalance === status}
                    onCheckedChange={(checked) =>
                      updateMuscleBalance("armBalance", checked ? status : "")
                    }
                  />
                  {status === "balanced" ? "균형" : "불균형"}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">다리</Label>
            <div className="flex gap-2">
              {(["balanced", "imbalanced"] as const).map((status) => (
                <label key={status} className="flex items-center gap-1 text-sm">
                  <Checkbox
                    checked={formData.muscleBalance.legBalance === status}
                    onCheckedChange={(checked) =>
                      updateMuscleBalance("legBalance", checked ? status : "")
                    }
                  />
                  {status === "balanced" ? "균형" : "불균형"}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">몸통 메모</Label>
            <Input
              type="text"
              placeholder="메모"
              value={formData.muscleBalance.trunkNote}
              onChange={(e) => updateMuscleBalance("trunkNote", e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* 둘레 측정 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Ruler className="w-4 h-4" /> 둘레 측정 (선택)
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: "chest", label: "가슴" },
            { key: "waist", label: "허리 (배꼽 위치)" },
            { key: "hip", label: "엉덩이" },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <Label className="text-xs text-gray-500">{item.label}</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.circumference[item.key as keyof typeof formData.circumference] || ""}
                  onChange={(e) => updateCircumference(item.key as keyof typeof formData.circumference, parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
                <span className="text-xs text-gray-500">cm</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">허벅지 (왼/오)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.1"
                value={formData.circumference.thighLeft || ""}
                onChange={(e) => updateCircumference("thighLeft", parseFloat(e.target.value) || 0)}
                className="h-8 w-16"
              />
              <span className="text-xs text-gray-500">/</span>
              <Input
                type="number"
                step="0.1"
                value={formData.circumference.thighRight || ""}
                onChange={(e) => updateCircumference("thighRight", parseFloat(e.target.value) || 0)}
                className="h-8 w-16"
              />
              <span className="text-xs text-gray-500">cm</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">팔 (왼/오)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.1"
                value={formData.circumference.armLeft || ""}
                onChange={(e) => updateCircumference("armLeft", parseFloat(e.target.value) || 0)}
                className="h-8 w-16"
              />
              <span className="text-xs text-gray-500">/</span>
              <Input
                type="number"
                step="0.1"
                value={formData.circumference.armRight || ""}
                onChange={(e) => updateCircumference("armRight", parseFloat(e.target.value) || 0)}
                className="h-8 w-16"
              />
              <span className="text-xs text-gray-500">cm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
