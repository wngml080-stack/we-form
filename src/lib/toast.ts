import { toast as sonnerToast } from "sonner";

/**
 * 통일된 Toast 알림 시스템
 * 모든 페이지에서 일관된 알림을 표시합니다.
 */
export const toast = {
  /**
   * 성공 메시지
   * @example toast.success("저장되었습니다.")
   */
  success: (message: string) => {
    sonnerToast.success(message);
  },

  /**
   * 에러 메시지
   * @example toast.error("저장에 실패했습니다.")
   */
  error: (message: string) => {
    sonnerToast.error(message);
  },

  /**
   * 경고 메시지
   * @example toast.warning("입력값을 확인해주세요.")
   */
  warning: (message: string) => {
    sonnerToast.warning(message);
  },

  /**
   * 정보 메시지
   * @example toast.info("새로운 알림이 있습니다.")
   */
  info: (message: string) => {
    sonnerToast.info(message);
  },

  /**
   * 로딩 중 → 완료 패턴
   * @example
   * const toastId = toast.loading("저장 중...");
   * await saveData();
   * toast.dismiss(toastId);
   * toast.success("저장되었습니다.");
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * 특정 토스트 닫기
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Promise 기반 토스트 (로딩 → 성공/실패 자동 처리)
   * @example
   * toast.promise(saveData(), {
   *   loading: "저장 중...",
   *   success: "저장되었습니다.",
   *   error: "저장에 실패했습니다."
   * });
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },
};

/**
 * 확인 다이얼로그 (삭제 등 위험한 작업용)
 * @example
 * const confirmed = await confirm("정말 삭제하시겠습니까?");
 * if (confirmed) { ... }
 */
export const confirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    sonnerToast(message, {
      action: {
        label: "확인",
        onClick: () => resolve(true),
      },
      cancel: {
        label: "취소",
        onClick: () => resolve(false),
      },
      duration: Infinity,
      onDismiss: () => resolve(false),
    });
  });
};
