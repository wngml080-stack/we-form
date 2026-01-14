/**
 * 스케줄 자동 분류 유틸리티
 * - 근무내(inside): 평일 근무시간 내
 * - 근무외(outside): 평일 근무시간 외
 * - 주말(weekend): 토요일, 일요일
 * - 공휴일(holiday): 법정 공휴일
 */

// 2025년 한국 공휴일 목록
const HOLIDAYS_2025 = [
  '2025-01-01', // 신정
  '2025-01-28', '2025-01-29', '2025-01-30', // 설날 연휴
  '2025-03-01', // 삼일절
  '2025-03-03', // 부처님오신날 (음력이라 변동 가능)
  '2025-05-05', // 어린이날
  '2025-06-06', // 현충일
  '2025-08-15', // 광복절
  '2025-09-06', '2025-09-07', '2025-09-08', // 추석 연휴 (음력이라 변동 가능)
  '2025-10-03', // 개천절
  '2025-10-09', // 한글날
  '2025-12-25', // 크리스마스
];

// 2026년 한국 공휴일 목록 (예상)
const HOLIDAYS_2026 = [
  '2026-01-01', // 신정
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-03-01', // 삼일절
  '2026-05-05', // 어린이날
  '2026-05-24', // 부처님오신날
  '2026-06-06', // 현충일
  '2026-08-15', // 광복절
  '2026-09-24', '2026-09-25', '2026-09-26', // 추석 연휴
  '2026-10-03', // 개천절
  '2026-10-09', // 한글날
  '2026-12-25', // 크리스마스
];

const ALL_HOLIDAYS = [...HOLIDAYS_2025, ...HOLIDAYS_2026];

/**
 * 주어진 날짜가 공휴일인지 확인
 */
export function isHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return ALL_HOLIDAYS.includes(dateString);
}

/**
 * 주어진 날짜가 주말인지 확인
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
}

/**
 * 시간 문자열을 분으로 변환 (HH:MM:SS 또는 HH:MM 형식)
 */
function timeToMinutes(timeString: string): number {
  const parts = timeString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * 스케줄 타입 자동 분류
 * @param scheduleStart - 스케줄 시작 시간 (ISO string 또는 Date)
 * @param workStartTime - 근무 시작 시간 (HH:MM:SS 또는 HH:MM)
 * @param workEndTime - 근무 종료 시간 (HH:MM:SS 또는 HH:MM)
 * @returns 'inside' | 'outside' | 'weekend' | 'holiday'
 */
export function classifyScheduleType(
  scheduleStart: string | Date,
  workStartTime?: string | null,
  workEndTime?: string | null
): 'inside' | 'outside' | 'weekend' | 'holiday' {
  const date = typeof scheduleStart === 'string' ? new Date(scheduleStart) : scheduleStart;

  // 1. 공휴일 체크 (최우선)
  if (isHoliday(date)) {
    return 'holiday';
  }

  // 2. 주말 체크
  if (isWeekend(date)) {
    return 'weekend';
  }

  // 3. 근무시간 기준으로 inside/outside 판단
  if (!workStartTime || !workEndTime) {
    // 근무시간 정보가 없으면 기본값 inside
    return 'inside';
  }

  // 스케줄 시작 시간을 분으로 변환
  const scheduleHours = date.getHours();
  const scheduleMinutes = date.getMinutes();
  const scheduleTimeInMinutes = scheduleHours * 60 + scheduleMinutes;

  // 근무시간을 분으로 변환
  const workStart = timeToMinutes(workStartTime);
  const workEnd = timeToMinutes(workEndTime);

  // 근무시간 내면 inside, 밖이면 outside
  if (scheduleTimeInMinutes >= workStart && scheduleTimeInMinutes < workEnd) {
    return 'inside';
  } else {
    return 'outside';
  }
}

/**
 * 스케줄 타입 한글 레이블
 */
export function getScheduleTypeLabel(type: string): string {
  switch (type) {
    case 'inside':
      return '근무내';
    case 'outside':
      return '근무외';
    case 'weekend':
      return '주말';
    case 'holiday':
      return '공휴일';
    default:
      return type;
  }
}

/**
 * 월별 스케줄 집계 (급여 계산용)
 */
export interface MonthlyScheduleStats {
  pt_total_count: number;       // PT 전체 횟수
  pt_inside_count: number;       // PT 근무내 횟수
  pt_outside_count: number;      // PT 근무외 횟수
  pt_weekend_count: number;      // PT 주말 횟수
  pt_holiday_count: number;      // PT 공휴일 횟수
  bc_count: number;             // BC (바디챌린지) 횟수
}

/**
 * 스케줄 목록에서 월별 통계 계산
 */
export function calculateMonthlyStats(
  schedules: Array<{
    schedule_type?: string;
    counted_for_salary?: boolean;
    status?: string;
  }>
): MonthlyScheduleStats {
  const stats: MonthlyScheduleStats = {
    pt_total_count: 0,
    pt_inside_count: 0,
    pt_outside_count: 0,
    pt_weekend_count: 0,
    pt_holiday_count: 0,
    bc_count: 0,
  };

  schedules.forEach((schedule) => {
    // counted_for_salary가 false면 집계 제외
    if (schedule.counted_for_salary === false) {
      return;
    }

    // status가 completed가 아니면 집계 제외 (출석 완료만 카운트)
    if (schedule.status !== 'completed') {
      return;
    }

    stats.pt_total_count++;

    switch (schedule.schedule_type) {
      case 'inside':
        stats.pt_inside_count++;
        break;
      case 'outside':
        stats.pt_outside_count++;
        break;
      case 'weekend':
        stats.pt_weekend_count++;
        break;
      case 'holiday':
        stats.pt_holiday_count++;
        break;
      case 'bc':
      case 'body_challenge':
        stats.bc_count++;
        break;
    }
  });

  return stats;
}
