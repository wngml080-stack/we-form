"use client";

import { ConsultationFormData } from "../types";

interface BasicInfoSectionProps {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

export function BasicInfoSection({ formData, updateFormData }: BasicInfoSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="이름을 입력하세요"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="010-0000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
          <select
            value={formData.gender}
            onChange={(e) => updateFormData("gender", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">선택하세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => updateFormData("birthDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
