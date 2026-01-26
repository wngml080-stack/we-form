"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Supabase 클라이언트 한 번만 생성 (useMemo 사용)
  const supabase = useMemo(() => createSupabaseClient(), []);

  // 미들웨어에서 이미 인증된 사용자는 /admin으로 리다이렉트하므로
  // 여기서는 추가 세션 체크 불필요

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] relative overflow-hidden py-12 px-5">
      {/* 배경 장식 요소 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E8F3FF] rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* 로고 섹션 */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl tracking-tight text-[#191F28]" style={{ fontWeight: 900 }}>
            We<span className="text-[#3182F6]">:</span>form
          </h1>
          <p className="text-xs uppercase tracking-[0.15em] mt-1 text-[#8B95A1]" style={{ fontWeight: 600 }}>Smart Management System</p>
        </div>

        <div className="bg-white shadow-xl rounded-[24px] border border-[#E5E8EB] p-6 relative overflow-hidden">
          {/* 상단 장식 바 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#F4F5F7] overflow-hidden">
            <div className="h-full bg-[#3182F6] w-1/3"></div>
          </div>

          <div className="text-center mb-6 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3FF] rounded-full text-[9px] uppercase tracking-widest mb-2 border border-[#3182F6]/20 text-[#3182F6]" style={{ fontWeight: 700 }}>
              <Sparkles className="w-2.5 h-2.5" /> Welcome Back
            </div>
            <h2 className="text-xl tracking-tight text-[#191F28]" style={{ fontWeight: 800 }}>서비스 로그인</h2>
            <p className="text-sm mt-1 text-[#4E5968]" style={{ fontWeight: 500 }}>등록된 계정 정보로 로그인해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest ml-1 block text-[#4E5968]" style={{ fontWeight: 600 }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B95A1]" />
                <input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 text-sm rounded-xl border-2 border-[#E5E8EB] bg-[#FAFBFC] focus:bg-white focus:border-[#3182F6] focus:outline-none transition-all text-[#191F28]"
                  style={{ fontWeight: 500 }}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-[10px] uppercase tracking-widest text-[#4E5968]" style={{ fontWeight: 600 }}>Password</label>
                <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest hover:underline text-[#3182F6]" style={{ fontWeight: 600 }}>Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B95A1]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 text-sm rounded-xl border-2 border-[#E5E8EB] bg-[#FAFBFC] focus:bg-white focus:border-[#3182F6] focus:outline-none transition-all text-[#191F28]"
                  style={{ fontWeight: 500 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors text-[#8B95A1]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#FFF0F0] rounded-xl border border-[#F04452]/20 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#F04452]/10 flex items-center justify-center shrink-0 text-[#F04452]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p className="text-xs text-[#F04452]" style={{ fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ fontWeight: 700 }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>로그인하기 <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-[#4E5968]" style={{ fontWeight: 500 }}>
              아직 계정이 없으신가요?{" "}
              <Link href="/onboarding" className="ml-1 transition-colors hover:underline text-[#3182F6]" style={{ fontWeight: 600 }}>
                회원가입 시작하기
              </Link>
            </p>
          </div>
        </div>

        {/* 푸터 정보 */}
        <div className="mt-6 text-center">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#8B95A1]" style={{ fontWeight: 600 }}>© 2024 We:form. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
