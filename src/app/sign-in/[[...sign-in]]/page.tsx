"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setError(error.message);
        }
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/30 to-indigo-600/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-secondary/30 to-teal-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-accent/20 to-orange-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* 로고 */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] flex items-center justify-center shadow-[0_4px_12px_rgba(47,128,237,0.35)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-lg font-heading font-bold text-slate-800">We:form</span>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_32px_64px_rgba(0,0,0,0.08)] rounded-3xl border border-white/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-slate-900">로그인</h1>
            <p className="text-slate-500 mt-2">We:form에 오신 것을 환영합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#2F80ED] focus:ring-4 focus:ring-[#2F80ED]/10 transition-all duration-300 outline-none"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#2F80ED] focus:ring-4 focus:ring-[#2F80ED]/10 transition-all duration-300 outline-none"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] hover:from-[#2570d6] hover:to-[#1c60b8] text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(47,128,237,0.35)] transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            계정이 없으신가요?{" "}
            <Link href="/sign-up" className="text-[#2F80ED] hover:text-[#2F80ED]/80 font-semibold">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
