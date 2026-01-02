"use client";

export const dynamic = 'force-dynamic';

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, LogOut, ArrowLeft, ArrowRight, CheckCircle2, Building, Sparkles } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setEmail(session.user.email ?? null);
      } else {
        setIsLoggedIn(false);
      }
    });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  // 로딩 중
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">준비 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>

      <div className="w-full max-w-2xl relative z-10">
        {/* 헤더 섹션 */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Onboarding Experience</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            We<span className="text-blue-600">:</span>form 가입
          </h1>
          <p className="text-slate-500 font-bold text-lg">
            {isLoggedIn && email ? (
              <span className="text-blue-600">{email}</span>
            ) : "환영합니다!"}님, 어떤 목적으로 시작하시나요?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 회사 가입 카드 */}
          <button
            onClick={() => router.push("/onboarding/company")}
            className="group relative flex flex-col bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/30 hover:-translate-y-2 transition-all duration-500 text-left"
          >
            <div className="mb-8 relative">
              <div className="w-16 h-16 rounded-[24px] bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:rotate-12 transition-transform">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">본사/법인 가입</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8">
              새로운 법인을 등록하고 서비스를 도입하는 대표자 및 관리자님을 위한 가입입니다.
            </p>
            
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Get Started</span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </button>

          {/* 직원 가입 카드 */}
          <button
            onClick={() => router.push("/onboarding/staff")}
            className="group relative flex flex-col bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-200/30 hover:-translate-y-2 transition-all duration-500 text-left"
          >
            <div className="mb-8 relative">
              <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
                <Users className="w-8 h-8" />
              </div>
              <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:-rotate-12 transition-transform">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">직원 가입</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8">
              이미 서비스가 도입된 회사의 소속 직원 또는 강사님을 위한 가입입니다. (사업자번호 필요)
            </p>
            
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Join Team</span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </button>
        </div>

        {/* 하단 푸터 액션 */}
        <div className="mt-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-amber-700 border border-amber-100/50">
            <Info className="w-3.5 h-3.5" />
            <p className="text-[11px] font-black uppercase tracking-tighter">직원 가입 시 관리자의 승인 후 정식 이용이 가능합니다</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button
                variant="ghost"
                className="h-12 px-6 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-white font-black text-xs gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                다른 계정으로 로그인하기
              </Button>
            ) : (
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  className="h-12 px-6 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-white font-black text-xs gap-2"
                  onClick={handleSignOut}
                >
                  <ArrowLeft className="w-4 h-4" />
                  로그인 페이지로 돌아가기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
