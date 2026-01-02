"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Building2, Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2, Building, Sparkles, User, Phone, FileText, Layout, Users } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1); // 1: 계정 생성, 2: 회사 정보

  // 회원가입 정보
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 회사 정보
  const [formData, setFormData] = useState({
    companyName: "",
    repName: "",
    phone: "",
    businessNum: "",
    branchCount: "",
    staffCount: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setEmail(session.user.email ?? "");
        setStep(2); // 이미 로그인됨 → 회사 정보 입력으로
      } else {
        setIsLoggedIn(false);
        setStep(1); // 로그인 안됨 → 계정 생성부터
      }
    });
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Step 1: 계정 생성
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setErrorMsg("이미 가입된 이메일입니다. 로그인해주세요.");
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      setIsLoggedIn(true);
      setStep(2);
    } catch {
      setErrorMsg("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: 회사 정보 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/onboarding/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/onboarding/pending?type=company");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "오류가 발생했습니다.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">본사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>

      <Card className="w-full max-w-xl shadow-2xl bg-white/80 backdrop-blur-xl border-white rounded-[48px] relative z-10 overflow-hidden">
        <CardHeader className="text-center pt-12 pb-6 px-8 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-50 overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-700 ease-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <Building2 className="w-8 h-8" />
            </div>
          </div>

          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">회사(본사) 가입</CardTitle>
          <CardDescription className="text-slate-500 font-bold text-base mt-2">
            {step === 1 ? "먼저 계정을 생성해주세요." : "서비스를 도입할 회사 정보를 입력해주세요."}
          </CardDescription>

          {/* 단계 표시 UI 개선 */}
          <div className="flex items-center justify-center gap-6 pt-8">
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300",
                step >= 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-100 text-slate-400"
              )}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "01"}
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest", step >= 1 ? "text-blue-600" : "text-slate-400")}>Account</span>
            </div>
            
            <div className={cn("w-12 h-0.5 rounded-full transition-colors duration-300", step > 1 ? "bg-blue-600" : "bg-slate-100")}></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300",
                step >= 2 ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-100 text-slate-400"
              )}>
                02
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest", step >= 2 ? "text-blue-600" : "text-slate-400")}>Company</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-10 pb-12">
          {/* Step 1: 계정 생성 */}
          {step === 1 && (
            <form onSubmit={handleSignUp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" title="6자 이상 입력" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-12 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm</Label>
                  <div className="relative group">
                    <CheckCircle2 className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                      password && confirmPassword && password === confirmPassword ? "text-emerald-500" : "text-slate-300"
                    )} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in shake duration-300">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <X className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-black text-rose-600">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/onboarding")}
                  className="h-14 flex-1 rounded-2xl text-slate-400 hover:text-slate-900 font-black text-sm gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> 이전으로
                </Button>
                <Button
                  type="submit"
                  className="h-14 flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 gap-2 transition-all hover:-translate-y-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>다음 단계로 <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: 회사 정보 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signed in as</span>
                    <span className="text-sm font-black text-slate-700">{email}</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</Label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="companyName"
                    placeholder="위폼짐 (법인명)"
                    onChange={handleChange}
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repName" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Representative</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <Input 
                      id="repName" 
                      placeholder="성함 입력" 
                      onChange={handleChange} 
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <Input 
                      id="phone" 
                      placeholder="010-0000-0000" 
                      onChange={handleChange} 
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="businessNum" className="text-xs font-black text-slate-400 uppercase tracking-widest">Business License</Label>
                  <span className="text-[10px] font-bold text-slate-300 tracking-tight">Optional but recommended</span>
                </div>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    id="businessNum" 
                    placeholder="000-00-00000" 
                    onChange={handleChange} 
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 ml-1">
                  <Sparkles className="w-3 h-3 text-blue-400" /> 등록 시 소속 직원이 사업자 번호로 회사를 쉽게 찾을 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branchCount" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Branches</Label>
                  <div className="relative group">
                    <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="branchCount"
                      type="number"
                      placeholder="예: 3"
                      onChange={handleChange}
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffCount" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Staff Size</Label>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="staffCount"
                      type="number"
                      placeholder="예: 15"
                      onChange={handleChange}
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 font-bold transition-all"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
                  <X className="w-4 h-4 text-rose-600" />
                  <p className="text-sm font-black text-rose-600">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setStep(1);
                    } else {
                      router.push("/onboarding");
                    }
                  }}
                  className="h-14 flex-1 rounded-2xl text-slate-400 hover:text-slate-900 font-black text-sm gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> 이전으로
                </Button>
                <Button
                  type="submit"
                  className="h-14 flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 gap-2 transition-all hover:-translate-y-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>가입 신청하기 <CheckCircle2 className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function X({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
