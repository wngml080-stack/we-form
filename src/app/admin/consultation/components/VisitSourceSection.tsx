"use client";

import { Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConsultationFormData, VisitSource } from "../types";

interface Props {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

export function VisitSourceSection({ formData, updateFormData }: Props) {
  const updateVisitSource = (key: keyof VisitSource, value: boolean | string) => {
    updateFormData("visitSource", {
      ...formData.visitSource,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-bold">1</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">방문 경로</h2>
      </div>

      {/* 안내 메시지 */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700">마케팅 분석에 활용됩니다</p>
      </div>

      {/* 체크박스 목록 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Checkbox
            id="naverPlace"
            checked={formData.visitSource.naverPlace}
            onCheckedChange={(checked) => updateVisitSource("naverPlace", !!checked)}
          />
          <Label htmlFor="naverPlace" className="text-sm text-gray-700 cursor-pointer">
            네이버 플레이스 / 리뷰
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="instagram"
            checked={formData.visitSource.instagram}
            onCheckedChange={(checked) => updateVisitSource("instagram", !!checked)}
          />
          <Label htmlFor="instagram" className="text-sm text-gray-700 cursor-pointer">
            인스타그램
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="blog"
            checked={formData.visitSource.blog}
            onCheckedChange={(checked) => updateVisitSource("blog", !!checked)}
          />
          <Label htmlFor="blog" className="text-sm text-gray-700 cursor-pointer">
            블로그
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="referral"
            checked={formData.visitSource.referral}
            onCheckedChange={(checked) => updateVisitSource("referral", !!checked)}
          />
          <Label htmlFor="referral" className="text-sm text-gray-700 cursor-pointer">
            지인 소개
          </Label>
          {formData.visitSource.referral && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">→ 소개자:</span>
              <Input
                type="text"
                placeholder="소개자 이름"
                value={formData.visitSource.referralName}
                onChange={(e) => updateVisitSource("referralName", e.target.value)}
                className="w-40 h-8 text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="walkIn"
            checked={formData.visitSource.walkIn}
            onCheckedChange={(checked) => updateVisitSource("walkIn", !!checked)}
          />
          <Label htmlFor="walkIn" className="text-sm text-gray-700 cursor-pointer">
            워크인 (간판/전단지)
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="visitOther"
            checked={formData.visitSource.other}
            onCheckedChange={(checked) => updateVisitSource("other", !!checked)}
          />
          <Label htmlFor="visitOther" className="text-sm text-gray-700 cursor-pointer">
            기타
          </Label>
          {formData.visitSource.other && (
            <Input
              type="text"
              placeholder="기타 경로 입력"
              value={formData.visitSource.otherText}
              onChange={(e) => updateVisitSource("otherText", e.target.value)}
              className="w-48 h-8 text-sm"
            />
          )}
        </div>
      </div>

      {/* 끌린 점 */}
      <div className="space-y-2 pt-4 border-t">
        <Label className="text-sm font-medium text-gray-700">
          어떤 점이 끌려서 방문하셨나요?
        </Label>
        <Textarea
          placeholder="자유롭게 작성해주세요"
          value={formData.visitSource.attractionReason}
          onChange={(e) => updateVisitSource("attractionReason", e.target.value)}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}
