"use client";

export function StaffSelectionPrompt() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
      <div className="text-gray-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">직원을 선택해주세요</h3>
      <p className="text-sm text-gray-500">
        타임테이블을 보려면 상단에서 직원을 선택하세요.<br />
        전체 강사 보기는 월별 집계표만 확인할 수 있습니다.
      </p>
    </div>
  );
}
