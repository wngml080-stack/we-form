"use client";

import { Dumbbell, Heart, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OTFormData } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

export function FitnessTestSection({ formData, updateFormData }: Props) {
  const updateUpperBody = (key: keyof OTFormData["fitnessTest"]["upperBody"], value: number | string) => {
    updateFormData("fitnessTest", {
      ...formData.fitnessTest,
      upperBody: {
        ...formData.fitnessTest.upperBody,
        [key]: value,
      },
    });
  };

  const updateLowerBody = (key: keyof OTFormData["fitnessTest"]["lowerBody"], value: number | string) => {
    updateFormData("fitnessTest", {
      ...formData.fitnessTest,
      lowerBody: {
        ...formData.fitnessTest.lowerBody,
        [key]: value,
      },
    });
  };

  const updateCardio = (key: keyof OTFormData["fitnessTest"]["cardiovascular"], value: number) => {
    updateFormData("fitnessTest", {
      ...formData.fitnessTest,
      cardiovascular: {
        ...formData.fitnessTest.cardiovascular,
        [key]: value,
      },
    });
  };

  const updateFlexibility = (key: keyof OTFormData["fitnessTest"]["flexibility"], value: number | string | boolean) => {
    updateFormData("fitnessTest", {
      ...formData.fitnessTest,
      flexibility: {
        ...formData.fitnessTest.flexibility,
        [key]: value,
      },
    });
  };

  const updateHeartRate = (key: keyof OTFormData["fitnessTest"]["heartRate"], value: number) => {
    updateFormData("fitnessTest", {
      ...formData.fitnessTest,
      heartRate: {
        ...formData.fitnessTest.heartRate,
        [key]: value,
      },
    });
  };

  const statusOptions = [
    { value: "insufficient", label: "부족" },
    { value: "normal", label: "보통" },
    { value: "excellent", label: "우수" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
          <Dumbbell className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">3. 기초 체력 테스트</h3>
      </div>

      {/* 상체 근력 */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-orange-600">💪</span> 상체 근력
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">테스트</th>
                <th className="text-left py-2 px-2">결과</th>
                <th className="text-left py-2 px-2">판정</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 px-2">푸쉬업</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={formData.fitnessTest.upperBody.pushUpCount || ""}
                      onChange={(e) => updateUpperBody("pushUpCount", parseInt(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                    <span className="text-gray-500">회</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1 flex-wrap">
                    {statusOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.fitnessTest.upperBody.pushUpStatus === option.value}
                          onCheckedChange={(checked) => updateUpperBody("pushUpStatus", checked ? option.value : "")}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2 text-gray-500">무릎 푸쉬업 (푸쉬업 불가 시)</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={formData.fitnessTest.upperBody.kneePushUpCount || ""}
                      onChange={(e) => updateUpperBody("kneePushUpCount", parseInt(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                    <span className="text-gray-500">회</span>
                  </div>
                </td>
                <td className="py-2 px-2">-</td>
              </tr>
              <tr>
                <td className="py-2 px-2">플랭크</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={formData.fitnessTest.upperBody.plankTime || ""}
                      onChange={(e) => updateUpperBody("plankTime", parseInt(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                    <span className="text-gray-500">초</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1 flex-wrap">
                    {statusOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.fitnessTest.upperBody.plankStatus === option.value}
                          onCheckedChange={(checked) => updateUpperBody("plankStatus", checked ? option.value : "")}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 하체 근력 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-gray-600">🦵</span> 하체 근력
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">테스트</th>
                <th className="text-left py-2 px-2">결과</th>
                <th className="text-left py-2 px-2">판정</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 px-2">맨몸 스쿼트</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={formData.fitnessTest.lowerBody.squatCount || ""}
                      onChange={(e) => updateLowerBody("squatCount", parseInt(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                    <span className="text-gray-500">회</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1 flex-wrap">
                    {statusOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.fitnessTest.lowerBody.squatStatus === option.value}
                          onCheckedChange={(checked) => updateLowerBody("squatStatus", checked ? option.value : "")}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2">런지 (좌/우)</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={formData.fitnessTest.lowerBody.lungeLeftCount || ""}
                      onChange={(e) => updateLowerBody("lungeLeftCount", parseInt(e.target.value) || 0)}
                      className="h-8 w-14"
                    />
                    <span className="text-gray-500">/</span>
                    <Input
                      type="number"
                      value={formData.fitnessTest.lowerBody.lungeRightCount || ""}
                      onChange={(e) => updateLowerBody("lungeRightCount", parseInt(e.target.value) || 0)}
                      className="h-8 w-14"
                    />
                    <span className="text-gray-500">회</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1">
                    {(["balanced", "imbalanced"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.fitnessTest.lowerBody.lungeBalance === status}
                          onCheckedChange={(checked) => updateLowerBody("lungeBalance", checked ? status : "")}
                        />
                        {status === "balanced" ? "균형" : "불균형"}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2">월 싯</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={formData.fitnessTest.lowerBody.wallSitTime || ""}
                      onChange={(e) => updateLowerBody("wallSitTime", parseInt(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                    <span className="text-gray-500">초</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1 flex-wrap">
                    {statusOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.fitnessTest.lowerBody.wallSitStatus === option.value}
                          onCheckedChange={(checked) => updateLowerBody("wallSitStatus", checked ? option.value : "")}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 심폐 지구력 */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-600" /> 심폐 지구력
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">버피 (1분)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={formData.fitnessTest.cardiovascular.burpeeCount || ""}
                onChange={(e) => updateCardio("burpeeCount", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-gray-500">회</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">계단 오르기</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={formData.fitnessTest.cardiovascular.stairsFloors || ""}
                onChange={(e) => updateCardio("stairsFloors", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-gray-500">층 후 힘듦</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">트레드밀 워킹</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={formData.fitnessTest.cardiovascular.treadmillMinutes || ""}
                onChange={(e) => updateCardio("treadmillMinutes", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-gray-500">분 후 힘듦</span>
            </div>
          </div>
        </div>
      </div>

      {/* 유연성 */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-green-600">🧘</span> 유연성
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">앉아서 앞으로 굽히기 (발끝 기준 +/-)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.fitnessTest.flexibility.sitAndReach || ""}
                onChange={(e) => updateFlexibility("sitAndReach", parseFloat(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-gray-500">cm</span>
              <div className="flex gap-1 flex-wrap">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={formData.fitnessTest.flexibility.sitAndReachStatus === option.value}
                      onCheckedChange={(checked) => updateFlexibility("sitAndReachStatus", checked ? option.value : "")}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">어깨 유연성 (등 뒤 손잡기)</Label>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-sm">
                <Checkbox
                  checked={formData.fitnessTest.flexibility.shoulderFlexibility === true}
                  onCheckedChange={(checked) => updateFlexibility("shoulderFlexibility", !!checked)}
                />
                가능
              </label>
              <label className="flex items-center gap-1 text-sm">
                <Checkbox
                  checked={formData.fitnessTest.flexibility.shoulderFlexibility === false}
                  onCheckedChange={(checked) => updateFlexibility("shoulderFlexibility", !checked)}
                />
                불가능
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 심박수 반응 */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" /> 심박수 반응
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">안정 시</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={formData.fitnessTest.heartRate.restingHR || ""}
                onChange={(e) => updateHeartRate("restingHR", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-gray-500">bpm</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">운동 직후</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={formData.fitnessTest.heartRate.postExerciseHR || ""}
                onChange={(e) => updateHeartRate("postExerciseHR", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-gray-500">bpm</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">1분 후 회복</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={formData.fitnessTest.heartRate.recoveryHR || ""}
                onChange={(e) => updateHeartRate("recoveryHR", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-gray-500">bpm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
