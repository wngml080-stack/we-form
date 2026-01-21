import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  describe('렌더링', () => {
    it('텍스트 렌더링', () => {
      render(<Badge>새로운</Badge>)
      expect(screen.getByText('새로운')).toBeInTheDocument()
    })

    it('div 엘리먼트로 렌더링', () => {
      render(<Badge data-testid="badge">테스트</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.tagName).toBe('DIV')
    })
  })

  describe('variants', () => {
    it('default variant', () => {
      render(<Badge variant="default">기본</Badge>)
      const badge = screen.getByText('기본')
      expect(badge.className).toContain('from-[#2F80ED]')
    })

    it('secondary variant', () => {
      render(<Badge variant="secondary">보조</Badge>)
      const badge = screen.getByText('보조')
      expect(badge.className).toContain('from-secondary')
    })

    it('success variant', () => {
      render(<Badge variant="success">성공</Badge>)
      const badge = screen.getByText('성공')
      expect(badge.className).toContain('from-success')
    })

    it('warning variant', () => {
      render(<Badge variant="warning">경고</Badge>)
      const badge = screen.getByText('경고')
      expect(badge.className).toContain('from-warning')
    })

    it('destructive variant', () => {
      render(<Badge variant="destructive">위험</Badge>)
      const badge = screen.getByText('위험')
      expect(badge.className).toContain('from-danger')
    })

    it('outline variant', () => {
      render(<Badge variant="outline">외곽선</Badge>)
      const badge = screen.getByText('외곽선')
      expect(badge.className).toContain('border-2')
      expect(badge.className).toContain('bg-white')
    })

    it('soft variant', () => {
      render(<Badge variant="soft">소프트</Badge>)
      const badge = screen.getByText('소프트')
      expect(badge.className).toContain('bg-primary/10')
    })

    it('glass variant', () => {
      render(<Badge variant="glass">글래스</Badge>)
      const badge = screen.getByText('글래스')
      expect(badge.className).toContain('backdrop-blur-xl')
    })
  })

  describe('sizes', () => {
    it('default size', () => {
      render(<Badge size="default">기본</Badge>)
      const badge = screen.getByText('기본')
      expect(badge.className).toContain('px-3')
      expect(badge.className).toContain('text-xs')
    })

    it('sm size', () => {
      render(<Badge size="sm">작은</Badge>)
      const badge = screen.getByText('작은')
      expect(badge.className).toContain('px-2')
      expect(badge.className).toContain('text-[10px]')
    })

    it('lg size', () => {
      render(<Badge size="lg">큰</Badge>)
      const badge = screen.getByText('큰')
      expect(badge.className).toContain('px-4')
      expect(badge.className).toContain('text-sm')
    })
  })

  describe('커스텀 className', () => {
    it('추가 클래스 병합', () => {
      render(<Badge className="custom-badge">커스텀</Badge>)
      const badge = screen.getByText('커스텀')
      expect(badge.className).toContain('custom-badge')
    })
  })

  describe('상태 뱃지 사용 사례', () => {
    it('진행중 상태', () => {
      render(<Badge variant="soft">진행중</Badge>)
      expect(screen.getByText('진행중')).toBeInTheDocument()
    })

    it('완료 상태', () => {
      render(<Badge variant="success">완료</Badge>)
      expect(screen.getByText('완료')).toBeInTheDocument()
    })

    it('대기 상태', () => {
      render(<Badge variant="warning">대기중</Badge>)
      expect(screen.getByText('대기중')).toBeInTheDocument()
    })

    it('만료 상태', () => {
      render(<Badge variant="destructive">만료</Badge>)
      expect(screen.getByText('만료')).toBeInTheDocument()
    })
  })
})
