// ============================================
// 회의록 관리 시스템 타입 정의
// ============================================

// 회의 유형
export type MeetingType =
  | 'regular'    // 정기 회의
  | 'weekly'     // 주간 회의
  | 'monthly'    // 월간 회의
  | 'emergency'  // 긴급 회의
  | 'workshop'   // 워크샵
  | 'training'   // 교육
  | 'other';     // 기타

// 회의 상태
export type MeetingStatus =
  | 'scheduled'    // 예정
  | 'in_progress'  // 진행중
  | 'completed'    // 완료
  | 'cancelled'    // 취소
  | 'postponed';   // 연기

// 참석자 역할
export type ParticipantRole =
  | 'organizer'    // 주최자
  | 'facilitator'  // 진행자
  | 'note_taker'   // 서기
  | 'attendee';    // 참석자

// 참석 상태
export type AttendanceStatus =
  | 'pending'    // 대기
  | 'confirmed'  // 확인
  | 'declined'   // 거절
  | 'attended'   // 참석
  | 'absent';    // 불참

// 안건 상태
export type AgendaStatus =
  | 'pending'      // 대기
  | 'in_progress'  // 진행중
  | 'completed'    // 완료
  | 'skipped';     // 건너뜀

// 액션 아이템 우선순위
export type ActionItemPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

// 액션 아이템 상태
export type ActionItemStatus =
  | 'pending'      // 대기
  | 'in_progress'  // 진행중
  | 'completed'    // 완료
  | 'cancelled';   // 취소

// ============================================
// 회의 (Meeting)
// ============================================
export type Meeting = {
  id: string;
  company_id: string;
  gym_id: string | null;
  title: string;
  description: string | null;
  meeting_type: MeetingType;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  location: string | null;
  is_online: boolean;
  online_link: string | null;
  status: MeetingStatus;
  created_by: string;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  created_at: string;
  updated_at: string;
};

// 회의 생성 입력
export type MeetingCreateInput = {
  company_id: string;
  gym_id?: string | null;
  title: string;
  description?: string | null;
  meeting_type?: MeetingType;
  scheduled_at: string;
  location?: string | null;
  is_online?: boolean;
  online_link?: string | null;
  participant_ids?: string[];  // 참석자 직원 ID 목록
  agendas?: AgendaCreateInput[];  // 초기 안건 목록
};

// 회의 수정 입력
export type MeetingUpdateInput = Partial<Omit<Meeting, 'id' | 'created_at' | 'updated_at' | 'created_by'>>;

// ============================================
// 참석자 (Participant)
// ============================================
export type MeetingParticipant = {
  id: string;
  meeting_id: string;
  staff_id: string;
  role: ParticipantRole;
  attendance_status: AttendanceStatus;
  confirmed_at: string | null;
  attended_at: string | null;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  staff?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    position: string | null;
  };
};

export type ParticipantCreateInput = {
  meeting_id: string;
  staff_id: string;
  role?: ParticipantRole;
};

export type ParticipantUpdateInput = {
  role?: ParticipantRole;
  attendance_status?: AttendanceStatus;
  personal_notes?: string;
  confirmed_at?: string | null;
  attended_at?: string | null;
};

// ============================================
// 회의록 (Meeting Notes)
// ============================================
export type MeetingNote = {
  id: string;
  meeting_id: string;
  author_id: string;
  content: string;
  version: number;
  is_final: boolean;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  author?: {
    id: string;
    name: string;
  };
};

export type MeetingNoteCreateInput = {
  meeting_id: string;
  content: string;
};

export type MeetingNoteUpdateInput = {
  content?: string;
  is_final?: boolean;
};

// ============================================
// 안건 (Agenda)
// ============================================
export type MeetingAgenda = {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  order_index: number;
  estimated_minutes: number | null;
  status: AgendaStatus;
  presenter_id: string | null;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  presenter?: {
    id: string;
    name: string;
  };
};

export type AgendaCreateInput = {
  title: string;
  description?: string | null;
  order_index?: number;
  estimated_minutes?: number | null;
  presenter_id?: string | null;
};

export type AgendaUpdateInput = Partial<Omit<MeetingAgenda, 'id' | 'meeting_id' | 'created_at' | 'updated_at'>>;

// ============================================
// 액션 아이템 (Action Item)
// ============================================
export type MeetingActionItem = {
  id: string;
  meeting_id: string;
  agenda_id: string | null;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  assignee?: {
    id: string;
    name: string;
  };
  meeting?: {
    id: string;
    title: string;
  };
};

export type ActionItemCreateInput = {
  meeting_id: string;
  agenda_id?: string | null;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  due_date?: string | null;
  priority?: ActionItemPriority;
};

export type ActionItemUpdateInput = Partial<Omit<MeetingActionItem, 'id' | 'meeting_id' | 'created_at' | 'updated_at'>>;

// ============================================
// 첨부파일 (Attachment)
// ============================================
export type MeetingAttachment = {
  id: string;
  meeting_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
  // 조인된 데이터
  uploader?: {
    id: string;
    name: string;
  };
};

export type AttachmentCreateInput = {
  meeting_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
};

// ============================================
// 복합 타입 (View Models)
// ============================================

// 회의 상세 정보 (모든 관련 데이터 포함)
export type MeetingDetail = Meeting & {
  participants: MeetingParticipant[];
  agendas: MeetingAgenda[];
  notes: MeetingNote[];
  action_items: MeetingActionItem[];
  attachments: MeetingAttachment[];
  creator?: {
    id: string;
    name: string;
  };
};

// 회의 목록 아이템 (간략 정보)
export type MeetingListItem = Pick<Meeting,
  'id' | 'title' | 'meeting_type' | 'scheduled_at' | 'status' | 'is_online' | 'location'
> & {
  participant_count: number;
  action_item_count: number;
  creator_name: string;
};

// 캘린더 뷰용 회의 이벤트
export type MeetingCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  meeting_type: MeetingType;
  status: MeetingStatus;
  is_online: boolean;
  location: string | null;
};

// 대시보드용 통계
export type MeetingStatistics = {
  total_meetings: number;
  completed_meetings: number;
  cancelled_meetings: number;
  total_duration_minutes: number;
  total_action_items: number;
  completed_action_items: number;
};

// 예정된 회의 목록
export type UpcomingMeeting = {
  meeting_id: string;
  title: string;
  scheduled_at: string;
  meeting_type: MeetingType;
  participant_role: ParticipantRole;
};

// 미완료 액션 아이템
export type PendingActionItem = {
  action_item_id: string;
  title: string;
  due_date: string | null;
  priority: ActionItemPriority;
  meeting_title: string;
  meeting_id: string;
};

// ============================================
// 필터 및 정렬 옵션
// ============================================

export type MeetingFilters = {
  status?: MeetingStatus | MeetingStatus[];
  meeting_type?: MeetingType | MeetingType[];
  gym_id?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
};

export type MeetingSortOption =
  | 'scheduled_at_asc'
  | 'scheduled_at_desc'
  | 'created_at_asc'
  | 'created_at_desc'
  | 'title_asc'
  | 'title_desc';

// ============================================
// API 응답 타입
// ============================================

export type MeetingListResponse = {
  meetings: MeetingListItem[];
  total: number;
  page: number;
  limit: number;
};

export type MeetingDetailResponse = {
  meeting: MeetingDetail;
};

export type ActionItemListResponse = {
  action_items: MeetingActionItem[];
  total: number;
};

// ============================================
// UI 관련 타입
// ============================================

// 회의 유형 라벨
export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  regular: '정기 회의',
  weekly: '주간 회의',
  monthly: '월간 회의',
  emergency: '긴급 회의',
  workshop: '워크샵',
  training: '교육',
  other: '기타',
};

// 회의 상태 라벨
export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
  postponed: '연기',
};

// 참석자 역할 라벨
export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  organizer: '주최자',
  facilitator: '진행자',
  note_taker: '서기',
  attendee: '참석자',
};

// 참석 상태 라벨
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  pending: '대기',
  confirmed: '확인',
  declined: '거절',
  attended: '참석',
  absent: '불참',
};

// 우선순위 라벨
export const PRIORITY_LABELS: Record<ActionItemPriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
};

// 액션 아이템 상태 라벨
export const ACTION_ITEM_STATUS_LABELS: Record<ActionItemStatus, string> = {
  pending: '대기',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
};

// 회의 상태 색상
export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  postponed: 'bg-gray-100 text-gray-700',
};

// 우선순위 색상
export const PRIORITY_COLORS: Record<ActionItemPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};
