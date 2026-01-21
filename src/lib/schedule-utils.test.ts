import { describe, it, expect } from 'vitest'
import {
  isHoliday,
  isWeekend,
  classifyScheduleType,
  getScheduleTypeLabel,
  calculateMonthlyStats,
} from './schedule-utils'

describe('isHoliday', () => {
  it('2025년 신정은 공휴일', () => {
    expect(isHoliday(new Date('2025-01-01'))).toBe(true)
  })

  it('2025년 설날 연휴는 공휴일', () => {
    expect(isHoliday(new Date('2025-01-28'))).toBe(true)
    expect(isHoliday(new Date('2025-01-29'))).toBe(true)
    expect(isHoliday(new Date('2025-01-30'))).toBe(true)
  })

  it('2025년 크리스마스는 공휴일', () => {
    expect(isHoliday(new Date('2025-12-25'))).toBe(true)
  })

  it('2026년 설날 연휴는 공휴일', () => {
    expect(isHoliday(new Date('2026-02-16'))).toBe(true)
  })

  it('일반 평일은 공휴일 아님', () => {
    expect(isHoliday(new Date('2025-12-17'))).toBe(false)
  })
})

describe('isWeekend', () => {
  it('토요일은 주말', () => {
    expect(isWeekend(new Date('2025-12-20'))).toBe(true) // 토요일
  })

  it('일요일은 주말', () => {
    expect(isWeekend(new Date('2025-12-21'))).toBe(true) // 일요일
  })

  it('평일은 주말 아님', () => {
    expect(isWeekend(new Date('2025-12-17'))).toBe(false) // 수요일
    expect(isWeekend(new Date('2025-12-19'))).toBe(false) // 금요일
  })
})

describe('classifyScheduleType', () => {
  const workStart = '09:00:00'
  const workEnd = '18:00:00'

  describe('공휴일 우선', () => {
    it('공휴일이면 holiday 반환', () => {
      const result = classifyScheduleType('2025-01-01T10:00:00', workStart, workEnd)
      expect(result).toBe('holiday')
    })
  })

  describe('주말', () => {
    it('토요일이면 weekend 반환', () => {
      const result = classifyScheduleType('2025-12-20T10:00:00', workStart, workEnd)
      expect(result).toBe('weekend')
    })

    it('일요일이면 weekend 반환', () => {
      const result = classifyScheduleType('2025-12-21T10:00:00', workStart, workEnd)
      expect(result).toBe('weekend')
    })
  })

  describe('근무시간 내외', () => {
    it('근무시간 내면 inside', () => {
      const result = classifyScheduleType('2025-12-17T10:00:00', workStart, workEnd)
      expect(result).toBe('inside')
    })

    it('근무시간 시작 시각은 inside', () => {
      const result = classifyScheduleType('2025-12-17T09:00:00', workStart, workEnd)
      expect(result).toBe('inside')
    })

    it('근무시간 종료 직전은 inside', () => {
      const result = classifyScheduleType('2025-12-17T17:59:00', workStart, workEnd)
      expect(result).toBe('inside')
    })

    it('근무시간 전은 outside', () => {
      const result = classifyScheduleType('2025-12-17T07:00:00', workStart, workEnd)
      expect(result).toBe('outside')
    })

    it('근무시간 후는 outside', () => {
      const result = classifyScheduleType('2025-12-17T19:00:00', workStart, workEnd)
      expect(result).toBe('outside')
    })

    it('근무시간 종료 시각은 outside', () => {
      const result = classifyScheduleType('2025-12-17T18:00:00', workStart, workEnd)
      expect(result).toBe('outside')
    })
  })

  describe('근무시간 정보 없음', () => {
    it('근무시간 없으면 기본값 inside', () => {
      const result = classifyScheduleType('2025-12-17T10:00:00', null, null)
      expect(result).toBe('inside')
    })

    it('시작시간만 있어도 inside', () => {
      const result = classifyScheduleType('2025-12-17T10:00:00', workStart, null)
      expect(result).toBe('inside')
    })
  })

  describe('Date 객체 입력', () => {
    it('Date 객체도 정상 처리', () => {
      const date = new Date('2025-12-17T10:00:00')
      const result = classifyScheduleType(date, workStart, workEnd)
      expect(result).toBe('inside')
    })
  })
})

describe('getScheduleTypeLabel', () => {
  it('inside는 근무내', () => {
    expect(getScheduleTypeLabel('inside')).toBe('근무내')
  })

  it('outside는 근무외', () => {
    expect(getScheduleTypeLabel('outside')).toBe('근무외')
  })

  it('weekend는 주말', () => {
    expect(getScheduleTypeLabel('weekend')).toBe('주말')
  })

  it('holiday는 공휴일', () => {
    expect(getScheduleTypeLabel('holiday')).toBe('공휴일')
  })

  it('알 수 없는 타입은 그대로 반환', () => {
    expect(getScheduleTypeLabel('unknown')).toBe('unknown')
  })
})

describe('calculateMonthlyStats (schedule-utils)', () => {
  it('빈 배열은 모든 값 0', () => {
    const result = calculateMonthlyStats([])
    expect(result.pt_total_count).toBe(0)
    expect(result.pt_inside_count).toBe(0)
  })

  it('completed 상태만 카운트', () => {
    const schedules = [
      { schedule_type: 'inside', counted_for_salary: true, status: 'completed' },
      { schedule_type: 'inside', counted_for_salary: true, status: 'pending' },
      { schedule_type: 'inside', counted_for_salary: true, status: 'cancelled' },
    ]
    const result = calculateMonthlyStats(schedules)
    expect(result.pt_total_count).toBe(1)
  })

  it('counted_for_salary false면 제외', () => {
    const schedules = [
      { schedule_type: 'inside', counted_for_salary: false, status: 'completed' },
      { schedule_type: 'inside', counted_for_salary: true, status: 'completed' },
    ]
    const result = calculateMonthlyStats(schedules)
    expect(result.pt_total_count).toBe(1)
  })

  it('schedule_type별로 정확하게 집계', () => {
    const schedules = [
      { schedule_type: 'inside', counted_for_salary: true, status: 'completed' },
      { schedule_type: 'inside', counted_for_salary: true, status: 'completed' },
      { schedule_type: 'outside', counted_for_salary: true, status: 'completed' },
      { schedule_type: 'weekend', counted_for_salary: true, status: 'completed' },
      { schedule_type: 'holiday', counted_for_salary: true, status: 'completed' },
      { schedule_type: 'bc', counted_for_salary: true, status: 'completed' },
    ]
    const result = calculateMonthlyStats(schedules)

    expect(result.pt_total_count).toBe(6)
    expect(result.pt_inside_count).toBe(2)
    expect(result.pt_outside_count).toBe(1)
    expect(result.pt_weekend_count).toBe(1)
    expect(result.pt_holiday_count).toBe(1)
    expect(result.bc_count).toBe(1)
  })

  it('body_challenge도 bc_count에 집계', () => {
    const schedules = [
      { schedule_type: 'body_challenge', counted_for_salary: true, status: 'completed' },
    ]
    const result = calculateMonthlyStats(schedules)
    expect(result.bc_count).toBe(1)
  })
})
