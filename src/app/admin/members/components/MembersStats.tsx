"use client";

interface MembersStatsProps {
  total: number;
  active: number;
  paused: number;
}

export function MembersStats({ total, active, paused }: MembersStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <div className="bg-white border rounded-xl p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-gray-500">전체 회원</div>
        <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{total}명</div>
      </div>
      <div className="bg-white border rounded-xl p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-gray-500">활성 회원</div>
        <div className="text-lg sm:text-2xl font-bold text-emerald-600 mt-1">{active}명</div>
      </div>
      <div className="bg-white border rounded-xl p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-gray-500">홀딩 회원</div>
        <div className="text-lg sm:text-2xl font-bold text-amber-600 mt-1">{paused}명</div>
      </div>
    </div>
  );
}
