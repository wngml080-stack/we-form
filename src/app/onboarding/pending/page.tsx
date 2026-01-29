"use client";

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Building2, Users, LogOut, RefreshCw, CheckCircle2, Sparkles, Mail, Search, ShieldCheck } from "lucide-react";
import { Suspense, useMemo, useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function PendingContent() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  // 승인 상태 체크 함수
  const checkApprovalStatus = async (userEmail: string) => {
    setIsChecking(true);
    try {
      const { data: staff, error } = await supabase
        .from("staffs")
        .select("employment_status")
        .eq("email", userEmail)
        .single();

      if (!error && staff && staff.employment_status === "재직") {
        // 승인됨! 대시보드로 이동
        router.push("/admin");
        return true;
      }
    } catch (e) {
      console.error("승인 상태 체크 오류:", e);
    }
    setIsChecking(false);
    return false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/sign-in");
      } else {
        setEmail(session.user.email ?? null);
        // 초기 로드 시 승인 상태 체크
        if (session.user.email) {
          checkApprovalStatus(session.user.email);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const isCompany = type === "company";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-[120px] opacity-60"></div>

      <Card className="w-full max-w-2xl shadow-2xl bg-white/80 backdrop-blur-xl border-white rounded-[48px] relative z-10 overflow-hidden text-center">
        <CardHeader className="pt-16 pb-8 px-10 relative">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-[36px] bg-amber-500 flex items-center justify-center text-white shadow-2xl shadow-amber-200 animate-pulse">
                <Clock className="w-12 h-12" />
              </div>
              <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-50">
                <Search className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <CardTitle className="text-4xl font-black text-slate-900 tracking-tight mb-3">가입 승인 대기 중</CardTitle>
          <CardDescription className="text-slate-500 font-bold text-lg">
            접수된 정보를 관리자가 꼼꼼히 확인하고 있습니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-12 pb-16 space-y-10">
          {/* 단계 표시 프로세스 */}
          <div className="flex items-center justify-between px-4">
            {[
              { id: 1, label: "신청 완료", icon: CheckCircle2, status: "complete" },
              { id: 2, label: "정보 검토", icon: Search, status: "current" },
              { id: 3, label: "최종 승인", icon: ShieldCheck, status: "pending" }
            ].map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    step.status === "complete" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" :
                    step.status === "current" ? "bg-amber-500 text-white shadow-xl shadow-amber-200 animate-bounce" :
                    "bg-slate-100 text-slate-300"
                  )}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-widest",
                    step.status === "pending" ? "text-slate-300" : "text-slate-900"
                  )}>{step.label}</span>
                </div>
                {idx < 2 && (
                  <div className="flex-1 mx-4 -mt-8">
                    <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn(
                        "h-full transition-all duration-1000",
                        idx === 0 ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/2 animate-pulse"
                      )}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 상세 정보 섹션 */}
          <div className="bg-slate-900 rounded-[40px] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white/90 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Account Verification
              </div>
              
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                  {isCompany ? <Building2 className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <h4 className="text-2xl font-black text-white tracking-tight">
                  {isCompany ? "회사 본사 계정" : "소속 직원 계정"}
                </h4>
              </div>
              
              <div className="flex items-center gap-2 text-white/40 font-bold text-sm">
                <Mail className="w-4 h-4" />
                {email}
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="space-y-4">
            <p className="text-xl text-slate-700 font-bold tracking-tight leading-relaxed">
              {isCompany ? (
                <>
                  <span className="text-blue-600 underline decoration-blue-200 underline-offset-4">시스템 총괄 관리자</span>가 영업일 기준<br />
                  24시간 이내에 가입 정보를 확인합니다.
                </>
              ) : (
                <>
                  <span className="text-blue-600 underline decoration-blue-200 underline-offset-4">소속 회사의 본사 관리자</span>가<br />
                  귀하의 신원과 직급 정보를 검토 중입니다.
                </>
              )}
            </p>
            <p className="text-slate-400 text-sm font-medium">
              승인이 완료되면 가입하신 이메일로 알림을 보내드립니다.
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="pt-6 flex flex-col gap-4">
            <Button
              className="h-16 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-base shadow-2xl shadow-blue-200 gap-3 transition-all hover:-translate-y-1 active:scale-95"
              onClick={() => email && checkApprovalStatus(email)}
              disabled={isChecking || !email}
            >
              <RefreshCw className={cn("w-6 h-6", isChecking && "animate-spin")} />
              {isChecking ? "확인 중..." : "승인 상태 확인하기"}
            </Button>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                className="h-12 px-8 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black text-xs gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                다른 계정으로 로그인하기
              </Button>
            </div>
          </div>
        </CardContent>

        {/* 하단 푸터 바 */}
        <div className="bg-slate-50/50 py-6 px-10 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Online</span>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">We:form Security Infrastructure</p>
        </div>
      </Card>
    </div>
  );
}

export default function OnboardingPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-[24px] animate-spin"></div>
          <p className="text-slate-400 font-black animate-pulse tracking-widest uppercase text-xs">Checking authorization status...</p>
        </div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
