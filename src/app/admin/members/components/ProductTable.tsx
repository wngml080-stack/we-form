"use client";

import React from "react";
import { MembershipProduct } from "@/types/membership";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface ProductTableProps {
  products: MembershipProduct[];
  onEdit: (product: MembershipProduct) => void;
  onDelete: (product: MembershipProduct) => void;
  onToggleActive: (product: MembershipProduct) => void;
  onMoveUp?: (product: MembershipProduct, index: number) => void;
  onMoveDown?: (product: MembershipProduct, index: number) => void;
  isLoading?: boolean;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isLoading = false,
}: ProductTableProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 whitespace-nowrap w-16 text-center">순서</th>
              <th className="px-4 py-3 whitespace-nowrap">상품명</th>
              <th className="px-4 py-3 whitespace-nowrap">회원권 유형</th>
              <th className="px-4 py-3 whitespace-nowrap">기본 횟수</th>
              <th className="px-4 py-3 whitespace-nowrap">유효기간</th>
              <th className="px-4 py-3 whitespace-nowrap">기본 가격</th>
              <th className="px-4 py-3 whitespace-nowrap">상태</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="text-center py-20 text-gray-400">
                로딩 중...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // 빈 상태
  if (products.length === 0) {
    return (
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 whitespace-nowrap w-16 text-center">순서</th>
              <th className="px-4 py-3 whitespace-nowrap">상품명</th>
              <th className="px-4 py-3 whitespace-nowrap">회원권 유형</th>
              <th className="px-4 py-3 whitespace-nowrap">기본 횟수</th>
              <th className="px-4 py-3 whitespace-nowrap">유효기간</th>
              <th className="px-4 py-3 whitespace-nowrap">기본 가격</th>
              <th className="px-4 py-3 whitespace-nowrap">상태</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="text-center py-20 text-gray-400">
                등록된 상품이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // 테이블 렌더링
  return (
    <div className="rounded-md border bg-white overflow-x-auto">
      <table className="w-full text-sm text-left min-w-[800px]">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-3 whitespace-nowrap w-16 text-center">순서</th>
            <th className="px-4 py-3 whitespace-nowrap">상품명</th>
            <th className="px-4 py-3 whitespace-nowrap">회원권 유형</th>
            <th className="px-4 py-3 whitespace-nowrap">기본 횟수</th>
            <th className="px-4 py-3 whitespace-nowrap">유효기간</th>
            <th className="px-4 py-3 whitespace-nowrap">기본 가격</th>
            <th className="px-4 py-3 whitespace-nowrap">상태</th>
            <th className="px-4 py-3 whitespace-nowrap text-right">관리</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product.id} className="border-b hover:bg-gray-50">
              {/* 순서 변경 버튼 */}
              <td className="px-3 py-3">
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => onMoveUp?.(product, index)}
                    disabled={index === 0}
                    className={`p-0.5 rounded transition-colors ${
                      index === 0
                        ? "text-gray-200 cursor-not-allowed"
                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="위로 이동"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onMoveDown?.(product, index)}
                    disabled={index === products.length - 1}
                    className={`p-0.5 rounded transition-colors ${
                      index === products.length - 1
                        ? "text-gray-200 cursor-not-allowed"
                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="아래로 이동"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </td>

              {/* 상품명 */}
              <td className="px-4 py-3">
                <div>
                  <span className="font-medium">{product.name}</span>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {product.description}
                    </p>
                  )}
                </div>
              </td>

              {/* 회원권 유형 */}
              <td className="px-4 py-3">
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {product.membership_type}
                </Badge>
              </td>

              {/* 기본 횟수 */}
              <td className="px-4 py-3 text-gray-700">
                {product.default_sessions ? (
                  <>
                    <div>{product.default_sessions}회</div>
                    {/* PT/PPT/GPT의 경우 1회당 며칠 정보 표시 */}
                    {(product.membership_type === 'PT' || product.membership_type === 'PPT' || product.membership_type === 'GPT') && product.days_per_session && (
                      <div className="text-xs text-gray-500">
                        ({product.days_per_session}일/회)
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </td>

              {/* 유효기간 */}
              <td className="px-4 py-3 text-gray-700">
                {(product.membership_type === 'PT' || product.membership_type === 'PPT' || product.membership_type === 'GPT') ? (
                  // PT/PPT/GPT: 총 유효일수 표시
                  product.default_sessions && product.days_per_session ? (
                    <div>
                      {product.default_sessions * product.days_per_session}일
                    </div>
                  ) : (
                    <div className="text-gray-400">-</div>
                  )
                ) : (
                  // 기타 타입: 개월 표시
                  product.validity_months ? (
                    <div>{product.validity_months}개월</div>
                  ) : (
                    <div className="text-gray-400">-</div>
                  )
                )}
              </td>

              {/* 기본 가격 */}
              <td className="px-4 py-3 text-gray-700 font-medium">
                {product.default_price.toLocaleString()}원
              </td>

              {/* 상태 */}
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(product)}
                  className="focus:outline-none"
                >
                  <Badge
                    className={
                      product.is_active
                        ? "bg-emerald-100 text-emerald-700 border-0 cursor-pointer hover:bg-emerald-200"
                        : "bg-gray-100 text-gray-500 border-0 cursor-pointer hover:bg-gray-200"
                    }
                  >
                    {product.is_active ? "활성" : "비활성"}
                  </Badge>
                </button>
              </td>

              {/* 관리 버튼 */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    title="상품 수정"
                  >
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product)}
                    title="상품 삭제"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
