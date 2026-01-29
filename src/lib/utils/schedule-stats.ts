/**
 * 스케줄 통계 계산 유틸리티
 *
 * admin/schedule/page.tsx와 staff/page.tsx에서 중복되던 로직을 통합
 */

export interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  counted_for_salary?: boolean;
  [key: string]: string | number | boolean | null | undefined;
}

export interface MonthlyStats {
  PT: number;
  OT: number;
  Consulting: number;
  total: number;
  [key: string]: number;
}

/**
 * 스케줄 타입별로 월별 통계 계산
 *
 * @param schedules - 계산할 스케줄 배열
 * @returns 타입별 횟수 통계
 *
 * @example
 * const stats = calculateMonthlyStats(schedules);
 * // { PT: 10, OT: 5, Consulting: 3, total: 18 }
 */
export function calculateMonthlyStats(schedules: Schedule[]): MonthlyStats {
  const stats: MonthlyStats = {
    PT: 0,
    OT: 0,
    Consulting: 0,
    total: 0,
  };

  schedules.forEach(schedule => {
    const title = schedule.title || '';

    // PT 카운트
    if (title.includes('PT')) {
      stats.PT += 1;
    }
    // OT 카운트
    else if (title.includes('OT')) {
      stats.OT += 1;
    }
    // 상담 카운트
    else if (title.includes('상담')) {
      stats.Consulting += 1;
    }

    // 전체 카운트
    stats.total += 1;
  });

  return stats;
}

/**
 * 급여 계산에 포함되는 스케줄만 필터링하여 통계 계산
 *
 * @param schedules - 전체 스케줄 배열
 * @returns 급여 계산 대상 스케줄의 통계
 */
export function calculateSalaryStats(schedules: Schedule[]): MonthlyStats {
  const salarySchedules = schedules.filter(
    schedule => schedule.counted_for_salary !== false
  );

  return calculateMonthlyStats(salarySchedules);
}

/**
 * 날짜 범위로 스케줄 필터링
 *
 * @param schedules - 전체 스케줄 배열
 * @param startDate - 시작 날짜 (YYYY-MM-DD)
 * @param endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns 날짜 범위 내의 스케줄
 */
export function filterSchedulesByDateRange(
  schedules: Schedule[],
  startDate: string,
  endDate: string
): Schedule[] {
  return schedules.filter(schedule => {
    const scheduleDate = schedule.start_time.split('T')[0];
    return scheduleDate >= startDate && scheduleDate <= endDate;
  });
}

/**
 * 특정 월의 스케줄 필터링
 *
 * @param schedules - 전체 스케줄 배열
 * @param yearMonth - 년월 (YYYY-MM)
 * @returns 해당 월의 스케줄
 */
export function filterSchedulesByMonth(
  schedules: Schedule[],
  yearMonth: string
): Schedule[] {
  return schedules.filter(schedule => {
    const scheduleYearMonth = schedule.start_time.substring(0, 7);
    return scheduleYearMonth === yearMonth;
  });
}

/**
 * 스케줄 타입별 분류
 *
 * @param schedules - 전체 스케줄 배열
 * @returns 타입별로 분류된 스케줄 객체
 */
export function groupSchedulesByType(schedules: Schedule[]): Record<string, Schedule[]> {
  const groups: Record<string, Schedule[]> = {
    PT: [],
    OT: [],
    Consulting: [],
    Other: [],
  };

  schedules.forEach(schedule => {
    const title = schedule.title || '';

    if (title.includes('PT')) {
      groups.PT.push(schedule);
    } else if (title.includes('OT')) {
      groups.OT.push(schedule);
    } else if (title.includes('상담')) {
      groups.Consulting.push(schedule);
    } else {
      groups.Other.push(schedule);
    }
  });

  return groups;
}

/**
 * 일별 스케줄 개수 계산
 *
 * @param schedules - 전체 스케줄 배열
 * @returns 날짜별 스케줄 개수 맵
 *
 * @example
 * const dailyCounts = getScheduleCountByDay(schedules);
 * // { '2025-12-17': 5, '2025-12-18': 3, ... }
 */
export function getScheduleCountByDay(schedules: Schedule[]): Record<string, number> {
  const counts: Record<string, number> = {};

  schedules.forEach(schedule => {
    const date = schedule.start_time.split('T')[0];
    counts[date] = (counts[date] || 0) + 1;
  });

  return counts;
}

/**
 * 통계 데이터를 차트 형식으로 변환
 *
 * @param stats - 월별 통계
 * @returns 차트용 데이터 배열
 */
export function convertStatsToChartData(stats: MonthlyStats) {
  return [
    { label: 'PT', value: stats.PT, color: '#3B82F6' },
    { label: 'OT', value: stats.OT, color: '#8B5CF6' },
    { label: '상담', value: stats.Consulting, color: '#10B981' },
  ];
}
