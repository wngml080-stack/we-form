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
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1분 중복 요청 방지
  errorRetryCount: 2,
  keepPreviousData: true,
};

/**
 * 데이터 조회용 SWR 설정 (페이지 이동 시 캐시 활용)
 * - revalidateIfStale: false → 캐시가 있으면 재요청하지 않음 (첫 방문은 정상 fetch)
 * - dedupingInterval: 5분 → 같은 키 요청 중복 방지
 */
export const swrDataConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 300000, // 5분 캐싱
  revalidateIfStale: false,
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
