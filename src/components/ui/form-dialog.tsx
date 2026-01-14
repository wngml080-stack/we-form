"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 닫기 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 다이얼로그 제목 */
  title: string;
  /** 다이얼로그 설명 (선택사항) */
  description?: string;
  /** 폼 내용 */
  children: React.ReactNode;
  /** 제출 핸들러 */
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  /** 제출 중 상태 */
  isSubmitting?: boolean;
  /** 제출 버튼 텍스트 (기본값: "저장") */
  submitText?: string;
  /** 제출 중 버튼 텍스트 (기본값: "저장 중...") */
  submittingText?: string;
  /** 취소 버튼 텍스트 (기본값: "취소") */
  cancelText?: string;
  /** 다이얼로그 최대 너비 (기본값: "max-w-lg") */
  maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-3xl" | "max-w-4xl";
  /** 제출 버튼 비활성화 조건 */
  submitDisabled?: boolean;
  /** 추가 footer 버튼 (취소/제출 버튼 앞에 표시) */
  extraFooterContent?: React.ReactNode;
}

/**
 * 공통 폼 다이얼로그 컴포넌트
 *
 * @example
 * ```tsx
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="회원 등록"
 *   description="새 회원 정보를 입력하세요"
 *   onSubmit={handleSubmit}
 *   isSubmitting={isSubmitting}
 *   submitText="등록"
 *   submittingText="등록 중..."
 * >
 *   <div className="space-y-4">
 *     <Input ... />
 *     <Input ... />
 *   </div>
 * </FormDialog>
 * ```
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitText = "저장",
  submittingText = "저장 중...",
  cancelText = "취소",
  maxWidth = "max-w-lg",
  submitDisabled = false,
  extraFooterContent,
}: FormDialogProps) {
  // 제출 중일 때 닫기 방지
  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  // 320px에 맞는 반응형 maxWidth 클래스 매핑
  const responsiveMaxWidth = {
    "max-w-sm": "max-w-[calc(100%-1rem)] xs:max-w-sm",
    "max-w-md": "max-w-[calc(100%-1rem)] xs:max-w-md",
    "max-w-lg": "max-w-[calc(100%-1rem)] xs:max-w-lg",
    "max-w-xl": "max-w-[calc(100%-1rem)] xs:max-w-xl",
    "max-w-2xl": "max-w-[calc(100%-1rem)] xs:max-w-2xl",
    "max-w-3xl": "max-w-[calc(100%-1rem)] xs:max-w-3xl",
    "max-w-4xl": "max-w-[calc(100%-1rem)] xs:max-w-4xl",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`bg-white ${responsiveMaxWidth[maxWidth]} max-h-[85vh] xs:max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-base xs:text-lg">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-xs xs:text-sm">{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-6">
          {children}

          <DialogFooter className="gap-2 flex-col xs:flex-col sm:flex-row">
            {extraFooterContent}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full xs:w-full sm:w-auto text-sm xs:text-base"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || submitDisabled}
              className="w-full xs:w-full sm:w-auto text-sm xs:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {submittingText}
                </>
              ) : (
                submitText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
