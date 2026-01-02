"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  useEffect(() => {
    // 이미 로그인된 사용자인지 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // 이미 로그인됨 → onboarding으로 이동
        router.push("/onboarding");
      } else {
        // 로그인 안됨 → onboarding에서 유형 선택 후 회원가입
        router.push("/onboarding");
      }
    });
  }, [supabase, router]);

  // 로딩 중 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}
