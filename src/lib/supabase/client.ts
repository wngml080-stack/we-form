"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트 생성
 * Supabase Auth 사용
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

