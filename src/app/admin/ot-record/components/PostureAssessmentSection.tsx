"use client";

import { Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OTFormData } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

export function PostureAssessmentSection({ formData, updateFormData }: Props) {
  const updatePosture = (key: keyof OTFormData["postureAssessment"], value: boolean | string) => {
    updateFormData("postureAssessment", {
      ...formData.postureAssessment,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
          <Eye className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">2. 자세 & 움직임 평가</h3>
      </div>

      {/* 정적 자세 관찰 */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-green-600">🔍</span> 정적 자세 관찰
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 정면 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-700 border-b pb-1">정면</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.frontNormal}
                  onCheckedChange={(checked) => updatePosture("frontNormal", !!checked)}
                />
                정상
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.shoulderHeightDiff}
                  onCheckedChange={(checked) => updatePosture("shoulderHeightDiff", !!checked)}
                />
                어깨 높이 차이
              </label>
              {formData.postureAssessment.shoulderHeightDiff && (
                <div className="ml-6 flex gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={formData.postureAssessment.shoulderHigherSide === "left"}
                      onCheckedChange={(checked) => updatePosture("shoulderHigherSide", checked ? "left" : "")}
                    />
                    왼쪽 높음
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={formData.postureAssessment.shoulderHigherSide === "right"}
                      onCheckedChange={(checked) => updatePosture("shoulderHigherSide", checked ? "right" : "")}
                    />
                    오른쪽 높음
                  </label>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.pelvisHeightDiff}
                  onCheckedChange={(checked) => updatePosture("pelvisHeightDiff", !!checked)}
                />
                골반 높이 차이
              </label>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">무릎 정렬</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "normal", label: "정상" },
                    { value: "x-leg", label: "X자" },
                    { value: "o-leg", label: "O자" },
                  ].map((item) => (
                    <label key={item.value} className="flex items-center gap-1 text-xs">
                      <Checkbox
                        checked={formData.postureAssessment.kneeAlignment === item.value}
                        onCheckedChange={(checked) => updatePosture("kneeAlignment", checked ? item.value as "normal" | "x-leg" | "o-leg" : "")}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 후면 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-700 border-b pb-1">후면</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.backNormal}
                  onCheckedChange={(checked) => updatePosture("backNormal", !!checked)}
                />
                정상
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.scapulaProtrusion}
                  onCheckedChange={(checked) => updatePosture("scapulaProtrusion", !!checked)}
                />
                견갑골 돌출 (날개뼈)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.scoliosisSuspect}
                  onCheckedChange={(checked) => updatePosture("scoliosisSuspect", !!checked)}
                />
                척추 측만 의심
              </label>
            </div>
          </div>

          {/* 측면 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-700 border-b pb-1">측면</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.sideNormal}
                  onCheckedChange={(checked) => updatePosture("sideNormal", !!checked)}
                />
                정상
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.turtleNeck}
                  onCheckedChange={(checked) => updatePosture("turtleNeck", !!checked)}
                />
                거북목 (머리 전방 이동)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.roundShoulder}
                  onCheckedChange={(checked) => updatePosture("roundShoulder", !!checked)}
                />
                라운드숄더 (굽은 어깨)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.excessiveLumbarLordosis}
                  onCheckedChange={(checked) => updatePosture("excessiveLumbarLordosis", !!checked)}
                />
                과도한 요추 전만 (배 나옴)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.anteriorPelvicTilt}
                  onCheckedChange={(checked) => updatePosture("anteriorPelvicTilt", !!checked)}
                />
                골반 전방 경사
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.postureAssessment.kneeHyperextension}
                  onCheckedChange={(checked) => updatePosture("kneeHyperextension", !!checked)}
                />
                무릎 과신전
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
