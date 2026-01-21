import { describe, it, expect } from 'vitest'
import { formatPhoneNumber, formatPhoneNumberOnChange } from './phone-format'

describe('formatPhoneNumber', () => {
  describe('11자리 휴대폰 번호', () => {
    it('숫자만 있는 경우 포맷팅', () => {
      expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678')
    })

    it('이미 하이픈이 있는 경우', () => {
      expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678')
    })

    it('공백이 포함된 경우', () => {
      expect(formatPhoneNumber('010 1234 5678')).toBe('010-1234-5678')
    })

    it('다양한 구분자가 섞인 경우', () => {
      expect(formatPhoneNumber('010.1234.5678')).toBe('010-1234-5678')
    })
  })

  describe('10자리 전화번호', () => {
    it('서울 지역번호 (02)', () => {
      expect(formatPhoneNumber('0212345678')).toBe('02-1234-5678')
    })

    it('지방 지역번호 (031)', () => {
      expect(formatPhoneNumber('0311234567')).toBe('031-123-4567')
    })

    it('지방 지역번호 (051)', () => {
      expect(formatPhoneNumber('0511234567')).toBe('051-123-4567')
    })
  })

  describe('9자리 전화번호', () => {
    it('서울 지역번호 짧은 형식', () => {
      expect(formatPhoneNumber('021234567')).toBe('02-123-4567')
    })
  })

  describe('엣지 케이스', () => {
    it('빈 문자열', () => {
      expect(formatPhoneNumber('')).toBe('')
    })

    it('null/undefined 처리', () => {
      expect(formatPhoneNumber(null as unknown as string)).toBe('')
      expect(formatPhoneNumber(undefined as unknown as string)).toBe('')
    })

    it('잘못된 길이의 번호는 원본 반환', () => {
      expect(formatPhoneNumber('1234')).toBe('1234')
      expect(formatPhoneNumber('123456789012')).toBe('123456789012')
    })
  })
})

describe('formatPhoneNumberOnChange', () => {
  describe('입력 중 자동 포맷팅', () => {
    it('3자리 이하', () => {
      expect(formatPhoneNumberOnChange('0')).toBe('0')
      expect(formatPhoneNumberOnChange('01')).toBe('01')
      expect(formatPhoneNumberOnChange('010')).toBe('010')
    })

    it('4~7자리 (첫 하이픈 추가)', () => {
      expect(formatPhoneNumberOnChange('0101')).toBe('010-1')
      expect(formatPhoneNumberOnChange('0101234')).toBe('010-1234')
    })

    it('8~11자리 (두 번째 하이픈 추가)', () => {
      expect(formatPhoneNumberOnChange('01012345')).toBe('010-1234-5')
      expect(formatPhoneNumberOnChange('01012345678')).toBe('010-1234-5678')
    })

    it('11자리 초과 입력 시 잘림', () => {
      expect(formatPhoneNumberOnChange('010123456789999')).toBe('010-1234-5678')
    })
  })

  describe('특수문자 자동 제거', () => {
    it('하이픈 제거 후 재포맷', () => {
      expect(formatPhoneNumberOnChange('010-1234')).toBe('010-1234')
    })

    it('공백 제거', () => {
      expect(formatPhoneNumberOnChange('010 1234 5678')).toBe('010-1234-5678')
    })
  })
})
