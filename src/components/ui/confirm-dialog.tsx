"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmVariant = "default" | "danger" | "warning";

interface ConfirmDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 닫기 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 다이얼로그 제목 */
  title: string;
  /** 다이얼로그 설명 */
  description: string;
  /** 확인 버튼 클릭 핸들러 */
  onConfirm: () => void | Promise<void>;
  /** 처리 중 상태 */
  isLoading?: boolean;
  /** 확인 버튼 텍스트 (기본값: "확인") */
  confirmText?: string;
  /** 처리 중 버튼 텍스트 (기본값: "처리 중...") */
  loadingText?: string;
  /** 취소 버튼 텍스트 (기본값: "취소") */
  cancelText?: string;
  /** 스타일 변형 (default, danger, warning) */
  variant?: ConfirmVariant;
}

const variantStyles: Record<ConfirmVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
  warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500",
};

/**
 * 공통 확인 다이얼로그 컴포넌트
 *
 * 삭제, 상태 변경 등 사용자 확인이 필요한 작업에 사용
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="회원 삭제"
 *   description="정말로 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
 *   onConfirm={handleDelete}
 *   variant="danger"
 *   confirmText="삭제"
 * />
 *
 * // 비동기 작업
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="상태 변경"
 *   description="선택된 항목의 상태를 변경하시겠습니까?"
 *   onConfirm={async () => {
 *     await updateStatus();
 *     setIsOpen(false);
 *   }}
 *   isLoading={isUpdating}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  confirmText = "확인",
  loadingText = "처리 중...",
  cancelText = "취소",
  variant = "default",
}: ConfirmDialogProps) {
  // 처리 중일 때 닫기 방지
  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(variantStyles[variant])}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 편의를 위한 타입 export
export type { ConfirmDialogProps, ConfirmVariant };
