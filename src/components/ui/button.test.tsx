import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  describe('렌더링', () => {
    it('텍스트 렌더링', () => {
      render(<Button>클릭하세요</Button>)
      expect(screen.getByText('클릭하세요')).toBeInTheDocument()
    })

    it('button 엘리먼트로 렌더링', () => {
      render(<Button>버튼</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('children이 없어도 렌더링', () => {
      render(<Button data-testid="empty-btn" />)
      expect(screen.getByTestId('empty-btn')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('default variant 클래스 적용', () => {
      render(<Button variant="default">기본</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('bg-gradient-to-br')
      expect(btn.className).toContain('from-[#2F80ED]')
    })

    it('secondary variant 클래스 적용', () => {
      render(<Button variant="secondary">보조</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('from-[#14b8a6]')
    })

    it('destructive variant 클래스 적용', () => {
      render(<Button variant="destructive">삭제</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('from-[#ef4444]')
    })

    it('outline variant 클래스 적용', () => {
      render(<Button variant="outline">외곽선</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('border-2')
      expect(btn.className).toContain('bg-white')
    })

    it('ghost variant 클래스 적용', () => {
      render(<Button variant="ghost">고스트</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('hover:bg-slate-100')
    })
  })

  describe('sizes', () => {
    it('default size 클래스 적용', () => {
      render(<Button size="default">기본 크기</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('h-11')
    })

    it('sm size 클래스 적용', () => {
      render(<Button size="sm">작은 버튼</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('h-9')
    })

    it('lg size 클래스 적용', () => {
      render(<Button size="lg">큰 버튼</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('h-13')
    })

    it('icon size 클래스 적용', () => {
      render(<Button size="icon">🔍</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('w-11')
    })
  })

  describe('상호작용', () => {
    it('클릭 이벤트 호출', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>클릭</Button>)

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('disabled 상태에서 클릭 불가', () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>비활성</Button>)

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('disabled 클래스 적용', () => {
      render(<Button disabled>비활성</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toBeDisabled()
      expect(btn.className).toContain('disabled:opacity-50')
    })
  })

  describe('커스텀 className', () => {
    it('추가 클래스 병합', () => {
      render(<Button className="custom-class">커스텀</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('custom-class')
    })
  })

  describe('asChild', () => {
    it('asChild로 다른 컴포넌트 렌더링', () => {
      render(
        <Button asChild>
          <a href="/link">링크 버튼</a>
        </Button>
      )
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/link')
    })
  })

  describe('접근성', () => {
    it('type 속성 전달', () => {
      render(<Button type="submit">제출</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('aria-label 전달', () => {
      render(<Button aria-label="닫기">X</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', '닫기')
    })
  })
})
