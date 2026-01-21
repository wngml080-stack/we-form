import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyStats,
  calculateSalaryStats,
  filterSchedulesByDateRange,
  filterSchedulesByMonth,
  groupSchedulesByType,
  getScheduleCountByDay,
  convertStatsToChartData,
  type Schedule,
} from './schedule-stats'

// 테스트용 스케줄 데이터
const createSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: Math.random().toString(),
  title: 'PT 수업',
  start_time: '2025-12-17T10:00:00',
  end_time: '2025-12-17T11:00:00',
  counted_for_salary: true,
  ...overrides,
})

describe('calculateMonthlyStats', () => {
  it('빈 배열은 모든 값이 0', () => {
    const result = calculateMonthlyStats([])
    expect(result).toEqual({ PT: 0, OT: 0, Consulting: 0, total: 0 })
  })

  it('PT 스케줄 카운트', () => {
    const schedules = [
      createSchedule({ title: 'PT 수업' }),
      createSchedule({ title: 'PT 세션' }),
      createSchedule({ title: '개인 PT' }),
    ]
    const result = calculateMonthlyStats(schedules)
    expect(result.PT).toBe(3)
    expect(result.total).toBe(3)
  })

  it('OT 스케줄 카운트', () => {
    const schedules = [
      createSchedule({ title: 'OT 세션' }),
      createSchedule({ title: '신규회원 OT' }),
    ]
    const result = calculateMonthlyStats(schedules)
    expect(result.OT).toBe(2)
  })

  it('상담 스케줄 카운트', () => {
    const schedules = [
      createSchedule({ title: '신규 상담' }),
      createSchedule({ title: '상담 예약' }),
    ]
    const result = calculateMonthlyStats(schedules)
    expect(result.Consulting).toBe(2)
  })

  it('혼합 스케줄 카운트', () => {
    const schedules = [
      createSchedule({ title: 'PT 수업' }),
      createSchedule({ title: 'PT 수업' }),
      createSchedule({ title: 'OT 세션' }),
      createSchedule({ title: '신규 상담' }),
      createSchedule({ title: '기타 일정' }),
    ]
    const result = calculateMonthlyStats(schedules)
    expect(result.PT).toBe(2)
    expect(result.OT).toBe(1)
    expect(result.Consulting).toBe(1)
    expect(result.total).toBe(5)
  })
})

describe('calculateSalaryStats', () => {
  it('급여 계산 대상만 필터링', () => {
    const schedules = [
      createSchedule({ title: 'PT 수업', counted_for_salary: true }),
      createSchedule({ title: 'PT 수업', counted_for_salary: false }),
      createSchedule({ title: 'PT 수업', counted_for_salary: true }),
    ]
    const result = calculateSalaryStats(schedules)
    expect(result.PT).toBe(2)
    expect(result.total).toBe(2)
  })

  it('counted_for_salary가 undefined면 포함', () => {
    const schedules = [
      createSchedule({ title: 'PT 수업', counted_for_salary: undefined }),
    ]
    const result = calculateSalaryStats(schedules)
    expect(result.PT).toBe(1)
  })
})

describe('filterSchedulesByDateRange', () => {
  const schedules = [
    createSchedule({ start_time: '2025-12-15T10:00:00' }),
    createSchedule({ start_time: '2025-12-17T10:00:00' }),
    createSchedule({ start_time: '2025-12-20T10:00:00' }),
    createSchedule({ start_time: '2025-12-25T10:00:00' }),
  ]

  it('날짜 범위 내 스케줄 필터링', () => {
    const result = filterSchedulesByDateRange(schedules, '2025-12-16', '2025-12-21')
    expect(result).toHaveLength(2)
  })

  it('경계값 포함', () => {
    const result = filterSchedulesByDateRange(schedules, '2025-12-15', '2025-12-25')
    expect(result).toHaveLength(4)
  })

  it('범위 밖이면 빈 배열', () => {
    const result = filterSchedulesByDateRange(schedules, '2026-01-01', '2026-01-31')
    expect(result).toHaveLength(0)
  })
})

describe('filterSchedulesByMonth', () => {
  const schedules = [
    createSchedule({ start_time: '2025-11-30T10:00:00' }),
    createSchedule({ start_time: '2025-12-01T10:00:00' }),
    createSchedule({ start_time: '2025-12-15T10:00:00' }),
    createSchedule({ start_time: '2025-12-31T10:00:00' }),
    createSchedule({ start_time: '2026-01-01T10:00:00' }),
  ]

  it('특정 월 스케줄만 필터링', () => {
    const result = filterSchedulesByMonth(schedules, '2025-12')
    expect(result).toHaveLength(3)
  })

  it('해당 월 없으면 빈 배열', () => {
    const result = filterSchedulesByMonth(schedules, '2025-10')
    expect(result).toHaveLength(0)
  })
})

describe('groupSchedulesByType', () => {
  it('타입별 그룹화', () => {
    const schedules = [
      createSchedule({ title: 'PT 수업' }),
      createSchedule({ title: 'PT 개인' }),
      createSchedule({ title: 'OT 세션' }),
      createSchedule({ title: '상담 예약' }),
      createSchedule({ title: '미팅' }),
    ]
    const result = groupSchedulesByType(schedules)

    expect(result.PT).toHaveLength(2)
    expect(result.OT).toHaveLength(1)
    expect(result.Consulting).toHaveLength(1)
    expect(result.Other).toHaveLength(1)
  })

  it('빈 배열이면 모든 그룹 빈 배열', () => {
    const result = groupSchedulesByType([])
    expect(result.PT).toHaveLength(0)
    expect(result.OT).toHaveLength(0)
    expect(result.Consulting).toHaveLength(0)
    expect(result.Other).toHaveLength(0)
  })
})

describe('getScheduleCountByDay', () => {
  it('일별 스케줄 개수 계산', () => {
    const schedules = [
      createSchedule({ start_time: '2025-12-17T09:00:00' }),
      createSchedule({ start_time: '2025-12-17T10:00:00' }),
      createSchedule({ start_time: '2025-12-17T11:00:00' }),
      createSchedule({ start_time: '2025-12-18T10:00:00' }),
    ]
    const result = getScheduleCountByDay(schedules)

    expect(result['2025-12-17']).toBe(3)
    expect(result['2025-12-18']).toBe(1)
  })

  it('빈 배열은 빈 객체', () => {
    const result = getScheduleCountByDay([])
    expect(result).toEqual({})
  })
})

describe('convertStatsToChartData', () => {
  it('차트 데이터 형식으로 변환', () => {
    const stats = { PT: 10, OT: 5, Consulting: 3, total: 18 }
    const result = convertStatsToChartData(stats)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ label: 'PT', value: 10, color: '#3B82F6' })
    expect(result[1]).toEqual({ label: 'OT', value: 5, color: '#8B5CF6' })
    expect(result[2]).toEqual({ label: '상담', value: 3, color: '#10B981' })
  })
})
