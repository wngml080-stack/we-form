import useSWR, { SWRConfiguration } from 'swr';

/**
 * 기본 JSON fetcher
 */
export const fetcher = <T>(url: string): Promise<T> =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('API 요청 실패');
    return res.json();
  });

/**
 * Supabase 직접 쿼리용 fetcher (POST with body)
 */
export const postFetcher = <T>(url: string, body: unknown): Promise<T> =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (!res.ok) throw new Error('API 요청 실패');
    return res.json();
  });

/**
 * 공통 SWR 설정
 */
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 30000, // 30초 중복 요청 방지
  errorRetryCount: 2,
  keepPreviousData: true,
};

/**
 * 데이터 조회용 SWR 설정 (더 긴 캐시)
 */
export const swrDataConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 60000, // 1분 캐싱
  revalidateOnMount: true,
};

/**
 * URL 생성 헬퍼
 */
export function buildUrl(base: string, params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export { useSWR };
