/**
 * 상담 결과 모달 관련 타입 정의
 */

import type { ConsultationFormData } from "@/app/admin/consultation/types";
import type { OTFormData } from "@/app/admin/ot-record/types";

// 신규 회원 또는 OT 회원 타입
export interface MemberWithData {
  id: string;
  memberName: string;
  type: "consultation" | "ot";
  consultationData?: ConsultationFormData;
  otFormData?: OTFormData;
}

export interface ConsultationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  membersWithData?: MemberWithData[];
  gymName?: string;
}
