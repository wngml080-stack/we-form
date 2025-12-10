"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트 생성
 * 
 * 사용법:
 * ```tsx
 * const supabase = createSupabaseClient();
 * ```
 * 
 * @returns Supabase 클라이언트 인스턴스
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

