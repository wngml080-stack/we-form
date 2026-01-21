import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './common'

describe('getErrorMessage', () => {
  it('Error 객체에서 메시지 추출', () => {
    const error = new Error('에러 발생')
    expect(getErrorMessage(error)).toBe('에러 발생')
  })

  it('문자열 에러 처리', () => {
    expect(getErrorMessage('문자열 에러')).toBe('문자열 에러')
  })

  it('message 속성이 있는 객체 처리', () => {
    const error = { message: '객체 에러', code: 'ERR_001' }
    expect(getErrorMessage(error)).toBe('객체 에러')
  })

  it('null 처리', () => {
    expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('undefined 처리', () => {
    expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('숫자 처리', () => {
    expect(getErrorMessage(404)).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('빈 객체 처리', () => {
    expect(getErrorMessage({})).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('Supabase 스타일 에러 처리', () => {
    const supabaseError = {
      message: 'JWT expired',
      code: 'PGRST301',
      details: null,
      hint: null,
    }
    expect(getErrorMessage(supabaseError)).toBe('JWT expired')
  })
})
