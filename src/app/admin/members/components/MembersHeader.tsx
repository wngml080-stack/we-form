"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface MembersHeaderProps {
  gymName: string;
}

export function MembersHeader({ gymName }: MembersHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">
            {gymName}의 회원 목록을 조회합니다
          </p>
        </div>
      </div>

      {/* 매출관리 페이지 안내 배너 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-800">
              💡 신규회원 등록, 기존회원 매출, 부가상품 매출은 <strong>매출관리</strong> 페이지에서 등록할 수 있습니다.
            </span>
          </div>
          <Link
            href="/admin/sales"
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            매출관리 이동 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
