"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Users, Search, Building2, CheckCircle2, Loader2, Mail, Lock, Eye, EyeOff, Sparkles, User, Phone, Calendar, Briefcase, ArrowRight } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const JOB_TITLES = ["지점장", "팀장", "트레이너", "FC", "필라테스", "골프프로", "기타"];

export default function OnboardingStaffPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: 계정 생성, 2: 회사 검색, 3: 직원 정보
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 회원가입 정보
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 회사 검색
  const [bizNum, setBizNum] = useState("");
  const [foundCompany, setFoundCompany] = useState<{id: string; name: string; representative_name: string} | null>(null);

  // 직원 정보
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    jobTitle: "",
    joinedAt: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setEmail(session.user.email ?? "");
        setStep(2); // 이미 로그인됨 → 회사 검색부터
      } else {
        setIsLoggedIn(false);
        setStep(1); // 로그인 안됨 → 계정 생성부터
      }
    });
  }, [supabase]);

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
      const { data, error } = await supabase.auth.signUp({
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

      // Supabase에서 이메일이 이미 존재하면 user는 반환되지만 identities가 비어있음
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMsg("이미 가입된 이메일입니다. 로그인해주세요.");
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

  // Step 2: 회사 검색
  const handleSearchCompany = async () => {
    if (!bizNum) {
      setErrorMsg("사업자 번호를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/find-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber: bizNum }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "회사 검색에 실패했습니다.");
      }

      const data = await res.json();

      if (data.found) {
        setFoundCompany(data.company);
      } else {
        setErrorMsg("등록된 회사가 없습니다. 사업자 번호를 확인해주세요.");
        setFoundCompany(null);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: 직원 정보 제출
  const handleSubmit = async () => {
    if (!foundCompany) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/onboarding/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId: foundCompany.id,
          email,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/onboarding/pending?type=staff");
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
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">직원 정보를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>

      <Card className="w-full max-w-xl shadow-2xl bg-white/80 backdrop-blur-xl border-white rounded-[48px] relative z-10 overflow-hidden">
        <CardHeader className="text-center pt-12 pb-6 px-8 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-50 overflow-hidden">
            <div 
              className="h-full bg-slate-900 transition-all duration-700 ease-out"
              style={{ width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%' }}
            ></div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
              <Users className="w-8 h-8" />
            </div>
          </div>

          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">
            {step === 1 ? "직원 계정 생성" : step === 2 ? "소속 회사 찾기" : "직원 정보 입력"}
          </CardTitle>
          <CardDescription className="text-slate-500 font-bold text-base mt-2">
            {step === 1
              ? "서비스 이용을 위한 계정을 생성해주세요."
              : step === 2
              ? "근무하시는 회사의 사업자 번호를 입력해주세요."
              : `${foundCompany?.name} 소속으로 가입합니다.`}
          </CardDescription>

          {/* 단계 표시 */}
          <div className="flex items-center justify-center gap-4 pt-8">
            {[
              { id: 1, label: "Account" },
              { id: 2, label: "Company" },
              { id: 3, label: "Profile" }
            ].map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300",
                    step >= s.id ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-slate-100 text-slate-400"
                  )}>
                    {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : `0${s.id}`}
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", step >= s.id ? "text-slate-900" : "text-slate-400")}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={cn("w-10 h-0.5 mx-2 -mt-6 rounded-full transition-colors duration-300", step > s.id ? "bg-slate-900" : "bg-slate-100")}></div>
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-10 pb-12">
          {/* Step 1: 계정 생성 */}
          {step === 1 && (
            <form onSubmit={handleSignUp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" title="6자 이상 입력" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-12 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all"
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
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in shake duration-300">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <XIcon className="w-4 h-4" />
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
                  className="h-14 flex-[2] bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 gap-2 transition-all hover:-translate-y-1"
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

          {/* Step 2: 회사 검색 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Account</span>
                    <span className="text-sm font-black text-slate-700">{email}</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Business License Number</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                      placeholder="숫자 10자리 입력"
                      value={bizNum}
                      onChange={(e) => setBizNum(e.target.value)}
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all"
                    />
                  </div>
                  <Button
                    onClick={handleSearchCompany}
                    className="h-14 w-14 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-100 shrink-0 transition-all hover:-translate-y-1"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 ml-1 mt-2">
                  <Sparkles className="w-3 h-3 text-purple-400" /> 회사가 등록한 사업자 번호(10자리)를 입력해주세요.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
                  <XIcon className="w-4 h-4 text-rose-600" />
                  <p className="text-sm font-black text-rose-600">{errorMsg}</p>
                </div>
              )}

              {foundCompany && (
                <div className="p-6 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300 group">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-1">Company Found</div>
                        <h4 className="text-xl font-black text-white">{foundCompany.name}</h4>
                        <p className="text-xs font-bold text-white/60">대표자: {foundCompany.representative_name}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                        <Building2 className="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
                    <Button
                      className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-black text-xs gap-2 mt-2"
                      onClick={() => setStep(3)}
                    >
                      이 회사로 가입 진행하기 <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => {
                  if (!isLoggedIn) {
                    setStep(1);
                  } else {
                    router.push("/onboarding");
                  }
                }}
                className="h-14 w-full rounded-2xl text-slate-400 hover:text-slate-900 font-black text-xs gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> 이전 단계로
              </Button>
            </div>
          )}

          {/* Step 3: 정보 입력 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Joining Team</span>
                    <span className="text-sm font-black text-white">{foundCompany?.name}</span>
                  </div>
                </div>
                <Button variant="ghost" className="h-8 px-3 rounded-lg text-[10px] font-black text-blue-400 hover:bg-blue-500/10" onClick={() => setStep(2)}>
                  Change
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                      <Input
                        placeholder="본인 성함"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                      <Input
                        placeholder="010-0000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                      type="date"
                      value={formData.joinedAt}
                      onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Job Position</Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors z-10" />
                    <Select onValueChange={(v) => setFormData({ ...formData, jobTitle: v })}>
                      <SelectTrigger className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-100 font-bold transition-all">
                        <SelectValue placeholder="직급을 선택해주세요" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-1">
                        {JOB_TITLES.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm font-bold rounded-xl focus:bg-slate-50">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
                  <XIcon className="w-4 h-4 text-rose-600" />
                  <p className="text-sm font-black text-rose-600">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="h-14 flex-1 rounded-2xl text-slate-400 hover:text-slate-900 font-black text-sm gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> 이전 단계
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="h-14 flex-[2] bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 gap-2 transition-all hover:-translate-y-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>가입 신청 완료 <CheckCircle2 className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
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
