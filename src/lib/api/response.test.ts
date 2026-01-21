import { describe, it, expect } from 'vitest'
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  ApiErrors,
  handleApiError,
} from './response'

describe('successResponse', () => {
  it('성공 응답 생성', async () => {
    const data = { id: 1, name: 'test' }
    const response = successResponse(data)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.data).toEqual(data)
    expect(json.error).toBeUndefined()
  })

  it('메타 정보 포함', async () => {
    const data = [1, 2, 3]
    const meta = { count: 100 }
    const response = successResponse(data, meta)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.meta).toEqual(meta)
  })

  it('빈 데이터도 처리', async () => {
    const response = successResponse(null)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.data).toBeNull()
  })
})

describe('paginatedResponse', () => {
  it('페이지네이션 응답 생성', async () => {
    const data = [{ id: 1 }, { id: 2 }]
    const response = paginatedResponse(data, 100, 1, 10)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.data).toEqual(data)
    expect(json.meta).toEqual({
      count: 100,
      page: 1,
      pageSize: 10,
      totalPages: 10,
    })
  })

  it('총 페이지 수 계산 (나머지 있음)', async () => {
    const response = paginatedResponse([], 25, 1, 10)
    const json = await response.json()

    expect(json.meta?.totalPages).toBe(3) // 25 / 10 = 2.5 → 3
  })

  it('빈 결과 처리', async () => {
    const response = paginatedResponse([], 0, 1, 10)
    const json = await response.json()

    expect(json.meta?.totalPages).toBe(0)
  })
})

describe('errorResponse', () => {
  it('에러 응답 생성', async () => {
    const response = errorResponse('테스트 에러', 400)
    const json = await response.json()

    expect(json.success).toBe(false)
    expect(json.error).toBe('테스트 에러')
    expect(response.status).toBe(400)
  })

  it('기본 상태 코드는 500', async () => {
    const response = errorResponse('서버 에러')

    expect(response.status).toBe(500)
  })
})

describe('ApiErrors', () => {
  it('unauthorized - 401', async () => {
    const response = ApiErrors.unauthorized()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('로그인이 필요합니다.')
  })

  it('forbidden - 403', async () => {
    const response = ApiErrors.forbidden()
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe('권한이 없습니다.')
  })

  it('notFound - 404 (기본 메시지)', async () => {
    const response = ApiErrors.notFound()
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('리소스를 찾을 수 없습니다.')
  })

  it('notFound - 404 (커스텀 리소스)', async () => {
    const response = ApiErrors.notFound('회원')
    const json = await response.json()

    expect(json.error).toBe('회원를 찾을 수 없습니다.')
  })

  it('badRequest - 400', async () => {
    const response = ApiErrors.badRequest('필수 필드가 누락되었습니다.')
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('필수 필드가 누락되었습니다.')
  })

  it('internal - 500', async () => {
    const response = ApiErrors.internal()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBe('서버 오류가 발생했습니다.')
  })
})

describe('handleApiError', () => {
  it('Error 객체 처리', async () => {
    const error = new Error('테스트 에러 메시지')
    const response = handleApiError(error)
    const json = await response.json()

    expect(json.success).toBe(false)
    expect(json.error).toBe('테스트 에러 메시지')
  })

  it('문자열 에러 처리', async () => {
    const response = handleApiError('문자열 에러')
    const json = await response.json()

    expect(json.error).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('컨텍스트와 함께 로깅', async () => {
    const error = new Error('DB 에러')
    const response = handleApiError(error, '회원 조회')
    const json = await response.json()

    expect(json.error).toBe('DB 에러')
  })
})
