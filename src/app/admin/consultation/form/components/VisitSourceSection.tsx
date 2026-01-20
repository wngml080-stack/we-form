"use client";

import { ConsultationFormData } from "../types";

interface VisitSourceSectionProps {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

const visitSources = [
  "지인 소개",
  "인스타그램",
  "네이버 검색",
  "카카오맵",
  "네이버 지도",
  "블로그",
  "전단지/현수막",
  "기타",
];

export function VisitSourceSection({ formData, updateFormData }: VisitSourceSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">1. 방문 경로</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            어떻게 저희 센터를 알게 되셨나요?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {visitSources.map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => updateFormData("visitSource", source)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.visitSource === source
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
        {formData.visitSource === "기타" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
            <input
              type="text"
              value={formData.visitSourceDetail}
              onChange={(e) => updateFormData("visitSourceDetail", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="방문 경로를 입력하세요"
            />
          </div>
        )}
      </div>
    </div>
  );
}
