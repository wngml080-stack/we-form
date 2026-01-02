"use client";

import { Star, Activity, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PTFormData } from "../types";

interface Props {
  formData: PTFormData;
  updateFormData: <K extends keyof PTFormData>(key: K, value: PTFormData[K]) => void;
}

export function PTInitialMeasurementSection({ formData, updateFormData }: Props) {
  const updateInBody = (key: keyof PTFormData["initialInBody"], value: number) => {
    updateFormData("initialInBody", {
      ...formData.initialInBody,
      [key]: value,
    });
  };

  const updateCircumference = (key: keyof PTFormData["initialCircumference"], value: number) => {
    updateFormData("initialCircumference", {
      ...formData.initialCircumference,
      [key]: value,
    });
  };

  const updateFitness = (key: keyof PTFormData["initialFitness"], value: number | string) => {
    updateFormData("initialFitness", {
      ...formData.initialFitness,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
          <Star className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">우리가 처음 만난날은 어땠을까요?</h3>
      </div>

      <div className="space-y-6">
        {/* 인바디 측정 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            인바디 측정
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">체중</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialInBody.weight || ""}
                  onChange={(e) => updateInBody("weight", parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0.0"
                />
                <span className="text-sm text-gray-500">kg</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">골격근량</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialInBody.skeletalMuscle || ""}
                  onChange={(e) => updateInBody("skeletalMuscle", parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0.0"
                />
                <span className="text-sm text-gray-500">kg</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">체지방량</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialInBody.bodyFat || ""}
                  onChange={(e) => updateInBody("bodyFat", parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0.0"
                />
                <span className="text-sm text-gray-500">kg</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">체지방률</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialInBody.bodyFatPercentage || ""}
                  onChange={(e) => updateInBody("bodyFatPercentage", parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0.0"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">BMI</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.initialInBody.bmi || ""}
                onChange={(e) => updateInBody("bmi", parseFloat(e.target.value) || 0)}
                className="h-9"
                placeholder="0.0"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">기초대사량</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.initialInBody.basalMetabolicRate || ""}
                  onChange={(e) => updateInBody("basalMetabolicRate", parseInt(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* 둘레 측정 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            둘레 측정
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">가슴</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialCircumference.chest || ""}
                  onChange={(e) => updateCircumference("chest", parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0.0"
                />
                <span className="text-sm text-gray-500">cm</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">허리</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialCircumference.waist || ""}
                  onChange={(e) => updateCircumference("waist", parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0.0"
                />
                <span className="text-sm text-gray-500">cm</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">엉덩이</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialCircumference.hip || ""}
                  onChange={(e) => updateCircumference("hip", parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0.0"
                />
                <span className="text-sm text-gray-500">cm</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">허벅지 (좌/우)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialCircumference.thighLeft || ""}
                  onChange={(e) => updateCircumference("thighLeft", parseFloat(e.target.value) || 0)}
                  className="h-9 w-20"
                  placeholder="좌"
                />
                <span className="text-gray-400">/</span>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.initialCircumference.thighRight || ""}
                  onChange={(e) => updateCircumference("thighRight", parseFloat(e.target.value) || 0)}
                  className="h-9 w-20"
                  placeholder="우"
                />
                <span className="text-sm text-gray-500">cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 기초 체력 */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-800">기초 체력</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">푸쉬업</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.initialFitness.pushUpCount || ""}
                  onChange={(e) => updateFitness("pushUpCount", parseInt(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">회</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">플랭크</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.initialFitness.plankTime || ""}
                  onChange={(e) => updateFitness("plankTime", parseInt(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">초</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-600">스쿼트</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formData.initialFitness.squatNote}
                  onChange={(e) => updateFitness("squatNote", e.target.value)}
                  className="h-9 w-20"
                  placeholder="맨몸"
                />
                <Input
                  type="number"
                  value={formData.initialFitness.squatCount || ""}
                  onChange={(e) => updateFitness("squatCount", parseInt(e.target.value) || 0)}
                  className="h-9 w-20"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">회</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
