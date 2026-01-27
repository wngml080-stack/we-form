"use client";

import { useState, useEffect } from "react";
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
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // 이미 로그인된 사용자 체크 후 빠르게 리다이렉트
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace("/admin");
      } else {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden py-12 px-5">
      {isCheckingSession ? (
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      ) : (
        <>
          {/* 배경 장식 요소 */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>

          <div className="relative z-10 w-full max-w-[400px]">
        {/* 로고 섹션 */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl tracking-tight" style={{ color: '#0f172a', fontWeight: 900 }}>
            We<span style={{ color: 'var(--primary-hex)' }}>:</span>form
          </h1>
          <p className="text-xs uppercase tracking-[0.15em] mt-1" style={{ color: '#94a3b8', fontWeight: 600 }}>Smart Management System</p>
        </div>

        <div className="bg-white shadow-xl rounded-[24px] border border-[#e2e8f0] p-6 relative overflow-hidden">
          {/* 상단 장식 바 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#f1f5f9] overflow-hidden">
            <div className="h-full bg-primary w-1/3"></div>
          </div>

          <div className="text-center mb-6 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#eff6ff] rounded-full text-[9px] uppercase tracking-widest mb-2 border border-[#dbeafe]" style={{ color: 'var(--primary-hex)', fontWeight: 700 }}>
              <Sparkles className="w-2.5 h-2.5" /> Welcome Back
            </div>
            <h2 className="text-xl tracking-tight" style={{ color: '#0f172a', fontWeight: 800 }}>서비스 로그인</h2>
            <p className="text-sm mt-1" style={{ color: '#64748b', fontWeight: 500 }}>등록된 계정 정보로 로그인해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest ml-1 block" style={{ color: '#64748b', fontWeight: 600 }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                <input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 text-sm rounded-xl border-2 border-[#e2e8f0] bg-[var(--background)] focus:bg-white focus:border-primary focus:outline-none transition-all"
                  style={{ color: '#0f172a', fontWeight: 500 }}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-[10px] uppercase tracking-widest" style={{ color: '#64748b', fontWeight: 600 }}>Password</label>
                <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest hover:underline" style={{ color: 'var(--primary-hex)', fontWeight: 600 }}>Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 text-sm rounded-xl border-2 border-[#e2e8f0] bg-[var(--background)] focus:bg-white focus:border-primary focus:outline-none transition-all"
                  style={{ color: '#0f172a', fontWeight: 500 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#fef2f2] rounded-xl border border-[#fecaca] flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0" style={{ color: '#dc2626' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p className="text-xs" style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full bg-primary hover:bg-primary/90 text-white rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
            <p className="text-sm" style={{ color: '#64748b', fontWeight: 500 }}>
              아직 계정이 없으신가요?{" "}
              <Link href="/onboarding" className="ml-1 transition-colors hover:underline" style={{ color: 'var(--primary-hex)', fontWeight: 600 }}>
                회원가입 시작하기
              </Link>
            </p>
          </div>
        </div>

          {/* 푸터 정보 */}
          <div className="mt-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#94a3b8', fontWeight: 600 }}>© 2024 We:form. All rights reserved.</p>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
