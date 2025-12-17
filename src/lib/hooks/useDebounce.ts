import { useState, useEffect } from 'react';

/**
 * 값 변경을 지연시키는 디바운스 훅
 *
 * 검색 입력 등에서 사용하여 불필요한 API 호출을 방지합니다.
 *
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (밀리초, 기본값: 300ms)
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebounce(searchQuery, 300);
 *
 * // debouncedSearch는 사용자가 타이핑을 멈춘 후 300ms 뒤에 업데이트됨
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 타이머 설정: delay 후에 값 업데이트
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 클린업: 값이 변경되면 이전 타이머 취소
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
