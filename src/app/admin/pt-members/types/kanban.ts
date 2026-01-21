/**
 * 칸반 보드 관련 타입 정의
 */

import type { ConsultationFormData } from "@/app/admin/consultation/types";
import type { OTFormData } from "@/app/admin/ot-record/types";
import type { PTFormData } from "@/app/admin/pt-record/types";

export interface BoardCard {
  id: string;
  title: string;
  icon?: string;
  memberName?: string;
  progress?: string;
  isTemplate?: boolean;
  isEditing?: boolean;
  consultationData?: ConsultationFormData;
  otFormData?: OTFormData;
  ptFormData?: PTFormData;
}

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  cards: BoardCard[];
}
