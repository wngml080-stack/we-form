"use client";

import { Move, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OTFormData, CustomMovementExercise } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

export function MovementAssessmentSection({ formData, updateFormData }: Props) {
  const updateOverheadSquat = (key: keyof OTFormData["movementAssessment"]["overheadSquat"], value: string | boolean) => {
    updateFormData("movementAssessment", {
      ...formData.movementAssessment,
      overheadSquat: {
        ...formData.movementAssessment.overheadSquat,
        [key]: value,
      },
    });
  };

  const updateBalanceTest = (key: keyof OTFormData["movementAssessment"]["balanceTest"], value: number | string) => {
    updateFormData("movementAssessment", {
      ...formData.movementAssessment,
      balanceTest: {
        ...formData.movementAssessment.balanceTest,
        [key]: value,
      },
    });
  };

  const updateLunge = (key: keyof OTFormData["movementAssessment"]["lungeAssessment"], value: boolean | string) => {
    updateFormData("movementAssessment", {
      ...formData.movementAssessment,
      lungeAssessment: {
        ...formData.movementAssessment.lungeAssessment,
        [key]: value,
      },
    });
  };

  const updateShoulderMobility = (key: keyof OTFormData["movementAssessment"]["shoulderMobility"], value: string) => {
    updateFormData("movementAssessment", {
      ...formData.movementAssessment,
      shoulderMobility: {
        ...formData.movementAssessment.shoulderMobility,
        [key]: value,
      },
    });
  };

  const updateJointROM = (key: keyof OTFormData["movementAssessment"]["jointROM"], value: boolean | string) => {
    updateFormData("movementAssessment", {
      ...formData.movementAssessment,
      jointROM: {
        ...formData.movementAssessment.jointROM,
        [key]: value,
      },
    });
  };

  // 커스텀 운동 추가
  const addCustomExercise = () => {
    const newExercise: CustomMovementExercise = {
      id: Date.now().toString(),
      name: "",
      result: "",
      memo: "",
    };
    updateFormData("movementAssessment", {
      ...formData.movementAssessment,
      customExercises: [...formData.movementAssessment.customExercises, newExercise],
    });
  };

  // 커스텀 운동 수정
  const updateCustomExercise = (id: string, key: keyof CustomMovementExercise, value: string) => {
    updateFormData("movementAssessment", {
      ...formData.movementAssessment,
      customExercises: formData.movementAssessment.customExercises.map((ex) =>
        ex.id === id ? { ...ex, [key]: value } : ex
      ),
    });
  };

  // 커스텀 운동 삭제
  const deleteCustomExercise = (id: string) => {
    if (confirm("이 운동 항목을 삭제하시겠습니까?")) {
      updateFormData("movementAssessment", {
        ...formData.movementAssessment,
        customExercises: formData.movementAssessment.customExercises.filter((ex) => ex.id !== id),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
          <Move className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">동적 움직임 스크리닝</h3>
      </div>

      {/* 오버헤드 스쿼트 */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800">오버헤드 스쿼트</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">깊이</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "full", label: "풀 스쿼트 (고관절이 무릎 아래)" },
                  { value: "half", label: "하프 스쿼트 (허벅지 평행)" },
                  { value: "quarter", label: "쿼터 스쿼트 (얕음)" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.movementAssessment.overheadSquat.depth === item.value}
                      onCheckedChange={(checked) => updateOverheadSquat("depth", checked ? item.value as "full" | "half" | "quarter" : "")}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">관찰된 이슈</Label>
            <div className="space-y-2">
              {[
                { key: "kneeValgus", label: "무릎이 안쪽으로 모임 (Valgus)" },
                { key: "buttWink", label: "허리가 둥글게 말림 (Butt Wink)" },
                { key: "heelRise", label: "발뒤꿈치가 들림" },
                { key: "armFallForward", label: "팔이 앞으로 떨어짐" },
                { key: "excessiveForwardLean", label: "상체가 과도하게 앞으로 기울어짐" },
                { key: "asymmetry", label: "좌우 비대칭" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formData.movementAssessment.overheadSquat[item.key as keyof typeof formData.movementAssessment.overheadSquat] as boolean}
                    onCheckedChange={(checked) => updateOverheadSquat(item.key as keyof typeof formData.movementAssessment.overheadSquat, !!checked)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-600">메모</Label>
          <Textarea
            placeholder="스쿼트 평가 메모"
            value={formData.movementAssessment.overheadSquat.memo}
            onChange={(e) => updateOverheadSquat("memo", e.target.value)}
            className="min-h-[60px]"
          />
        </div>
      </div>

      {/* 한발 서기 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800">한발 서기 (밸런스 테스트)</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">왼발</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.movementAssessment.balanceTest.leftFootTime || ""}
                onChange={(e) => updateBalanceTest("leftFootTime", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-sm text-gray-500">초</span>
            </div>
            <div className="flex gap-2">
              {(["good", "unstable"] as const).map((status) => (
                <label key={status} className="flex items-center gap-1 text-xs">
                  <Checkbox
                    checked={formData.movementAssessment.balanceTest.leftFootStatus === status}
                    onCheckedChange={(checked) => updateBalanceTest("leftFootStatus", checked ? status : "")}
                  />
                  {status === "good" ? "양호" : "불안정"}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">오른발</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.movementAssessment.balanceTest.rightFootTime || ""}
                onChange={(e) => updateBalanceTest("rightFootTime", parseInt(e.target.value) || 0)}
                className="h-8 w-20"
              />
              <span className="text-sm text-gray-500">초</span>
            </div>
            <div className="flex gap-2">
              {(["good", "unstable"] as const).map((status) => (
                <label key={status} className="flex items-center gap-1 text-xs">
                  <Checkbox
                    checked={formData.movementAssessment.balanceTest.rightFootStatus === status}
                    onCheckedChange={(checked) => updateBalanceTest("rightFootStatus", checked ? status : "")}
                  />
                  {status === "good" ? "양호" : "불안정"}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 런지 동작 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800">런지 동작</h4>

        <div className="space-y-2">
          {[
            { key: "normal", label: "정상" },
            { key: "kneeValgus", label: "무릎 안쪽 쏠림" },
            { key: "pelvicDrop", label: "골반 드롭" },
            { key: "balanceUnstable", label: "균형 불안정" },
            { key: "asymmetry", label: "좌우 차이 있음" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.movementAssessment.lungeAssessment[item.key as keyof typeof formData.movementAssessment.lungeAssessment] as boolean}
                onCheckedChange={(checked) => updateLunge(item.key as keyof typeof formData.movementAssessment.lungeAssessment, !!checked)}
              />
              {item.label}
            </label>
          ))}
          {formData.movementAssessment.lungeAssessment.asymmetry && (
            <div className="ml-6">
              <Input
                type="text"
                placeholder="약한 쪽 입력"
                value={formData.movementAssessment.lungeAssessment.weakerSide}
                onChange={(e) => updateLunge("weakerSide", e.target.value)}
                className="h-8 w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* 팔 거상 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800">팔 거상 (숄더 모빌리티)</h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">구분</th>
                <th className="text-center py-2 px-2">왼쪽</th>
                <th className="text-center py-2 px-2">오른쪽</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-2">오버헤드</td>
                <td className="py-2 px-2">
                  <div className="flex justify-center gap-2">
                    {(["normal", "limited"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.movementAssessment.shoulderMobility.overheadLeft === status}
                          onCheckedChange={(checked) => updateShoulderMobility("overheadLeft", checked ? status : "")}
                        />
                        {status === "normal" ? "정상" : "제한"}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex justify-center gap-2">
                    {(["normal", "limited"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.movementAssessment.shoulderMobility.overheadRight === status}
                          onCheckedChange={(checked) => updateShoulderMobility("overheadRight", checked ? status : "")}
                        />
                        {status === "normal" ? "정상" : "제한"}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2">뒤로 뻗기</td>
                <td className="py-2 px-2">
                  <div className="flex justify-center gap-2">
                    {(["normal", "limited"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.movementAssessment.shoulderMobility.backReachLeft === status}
                          onCheckedChange={(checked) => updateShoulderMobility("backReachLeft", checked ? status : "")}
                        />
                        {status === "normal" ? "정상" : "제한"}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex justify-center gap-2">
                    {(["normal", "limited"] as const).map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={formData.movementAssessment.shoulderMobility.backReachRight === status}
                          onCheckedChange={(checked) => updateShoulderMobility("backReachRight", checked ? status : "")}
                        />
                        {status === "normal" ? "정상" : "제한"}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 관절 가동범위 제한 부위 */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-orange-600">🔒</span> 관절 가동범위 제한 부위
        </h4>

        <div className="flex flex-wrap gap-4">
          {[
            { key: "shoulder", label: "어깨 (견관절)" },
            { key: "thoracicSpine", label: "흉추 (등 상부)" },
            { key: "hip", label: "고관절" },
            { key: "ankle", label: "발목" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.movementAssessment.jointROM[item.key as keyof typeof formData.movementAssessment.jointROM] as boolean}
                onCheckedChange={(checked) => updateJointROM(item.key as keyof typeof formData.movementAssessment.jointROM, !!checked)}
              />
              {item.label}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={formData.movementAssessment.jointROM.other}
              onCheckedChange={(checked) => updateJointROM("other", !!checked)}
            />
            기타:
          </label>
          {formData.movementAssessment.jointROM.other && (
            <Input
              type="text"
              placeholder="기타 부위"
              value={formData.movementAssessment.jointROM.otherText}
              onChange={(e) => updateJointROM("otherText", e.target.value)}
              className="h-8 w-32"
            />
          )}
        </div>
      </div>

      {/* 추가 운동 항목 */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-indigo-600">➕</span> 추가 운동 항목
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomExercise}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            운동 추가
          </Button>
        </div>

        {formData.movementAssessment.customExercises.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            추가된 운동 항목이 없습니다. &quot;운동 추가&quot; 버튼을 클릭하여 새로운 운동을 추가하세요.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.movementAssessment.customExercises.map((exercise, index) => (
              <div key={exercise.id} className="bg-white border border-indigo-100 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-medium">운동 #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => deleteCustomExercise(exercise.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">운동명</Label>
                    <Input
                      type="text"
                      placeholder="예: 데드리프트, 플랭크, 버피 등"
                      value={exercise.name}
                      onChange={(e) => updateCustomExercise(exercise.id, "name", e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">결과/관찰 내용</Label>
                    <Input
                      type="text"
                      placeholder="예: 정상, 제한됨, 통증 있음 등"
                      value={exercise.result}
                      onChange={(e) => updateCustomExercise(exercise.id, "result", e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">메모</Label>
                  <Textarea
                    placeholder="운동 관련 메모를 입력하세요"
                    value={exercise.memo}
                    onChange={(e) => updateCustomExercise(exercise.id, "memo", e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 움직임 평가 종합 메모 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">움직임 평가 종합 메모</Label>
        <Textarea
          placeholder="움직임 평가에 대한 종합적인 메모를 작성하세요"
          value={formData.movementAssessment.movementMemo}
          onChange={(e) => updateFormData("movementAssessment", {
            ...formData.movementAssessment,
            movementMemo: e.target.value,
          })}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}
