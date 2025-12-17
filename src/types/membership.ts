/**
 * 회원권 상품 관련 타입 정의
 */

// 회원권 유형
export type MembershipType =
  | '헬스'
  | '필라테스'
  | 'PT'
  | 'PPT'
  | 'GX'
  | '골프'
  | '하이록스'
  | '러닝'
  | '크로스핏'
  | '기타';

// 회원권 상품 (DB 테이블)
export interface MembershipProduct {
  id: string;
  gym_id: string;
  name: string;
  membership_type: MembershipType;
  default_sessions: number | null;  // PT/PPT만 필수
  default_price: number;
  validity_months: number | null;  // 헬스/필라테스 등만 필수
  days_per_session: number | null;  // PT/PPT만 사용 (1회당 며칠)
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 상품 등록/수정 폼 데이터
export interface ProductFormData {
  name: string;
  membership_type: MembershipType | '';
  default_sessions: string;  // PT/PPT만 사용
  default_price: string;
  validity_months: string;  // 헬스/필라테스 등만 사용
  days_per_session: string;  // PT/PPT만 사용 (1회당 며칠)
  description: string;
  is_active: boolean;
  display_order: string;
}

// 상품 등록/수정 요청 데이터 (API 전송용)
export interface ProductInsertData {
  gym_id: string;
  name: string;
  membership_type: MembershipType;
  default_sessions: number | null;  // PT/PPT만 필수
  default_price: number;
  validity_months: number | null;  // 헬스/필라테스 등만 필수
  days_per_session: number | null;  // PT/PPT만 사용
  description: string | null;
  is_active: boolean;
  display_order: number;
}

// 상품 수정 요청 데이터
export interface ProductUpdateData {
  name?: string;
  membership_type?: MembershipType;
  default_sessions?: number | null;
  default_price?: number;
  validity_months?: number | null;
  days_per_session?: number | null;
  description?: string | null;
  is_active?: boolean;
  display_order?: number;
}

// 회원권 유형 옵션 (드롭다운용)
export const MEMBERSHIP_TYPE_OPTIONS: { value: MembershipType; label: string }[] = [
  { value: '헬스', label: '헬스' },
  { value: '필라테스', label: '필라테스' },
  { value: 'PT', label: 'PT (Personal Training)' },
  { value: 'PPT', label: 'PPT (Pilates Personal Training)' },
  { value: 'GX', label: 'GX (Group Exercise)' },
  { value: '골프', label: '골프' },
  { value: '하이록스', label: '하이록스' },
  { value: '러닝', label: '러닝' },
  { value: '크로스핏', label: '크로스핏' },
  { value: '기타', label: '기타' },
];

// 폼 초기값
export const INITIAL_PRODUCT_FORM: ProductFormData = {
  name: '',
  membership_type: '',
  default_sessions: '',
  default_price: '',
  validity_months: '',
  days_per_session: '',
  description: '',
  is_active: true,
  display_order: '0',
};
