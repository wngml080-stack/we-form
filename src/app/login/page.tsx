"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error("이메일 또는 비밀번호를 확인해주세요.");
      }

      // 2. 직원 정보 조회 (employment_status 추가!)
      const { data: staffData, error: staffError } = await supabase
        .from("staffs")
        .select("role, employment_status, gyms ( status )")
        .eq("user_id", data.user.id)
        .single();

      if (staffError || !staffData) {
        throw new Error("직원 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      }

      // 🚨 [보안 체크 1] 퇴사자 차단
      if (staffData.employment_status === '퇴사') {
        await supabase.auth.signOut(); // 즉시 로그아웃
        throw new Error("퇴사 처리된 계정입니다. 이용이 제한됩니다.");
      }

      // 🚨 [보안 체크 2] 센터 승인 대기 차단
      // @ts-ignore
      const gymStatus = staffData.gyms?.status;
      if (gymStatus === 'pending') {
        await supabase.auth.signOut();
        throw new Error("센터 가입 승인 대기 중입니다. 승인 후 이용 가능합니다.");
      }

      // 3. 통과 시 페이지 이동
      if (staffData.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/staff");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      // 에러 발생 시 세션 정리
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0F4C5C] p-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C5C]">
            We:form
          </h1>
          <p className="text-sm text-gray-500">
            센터 운영의 바른 자세, 위폼
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@weform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300 focus:ring-[#0F4C5C]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 focus:ring-[#0F4C5C]"
              />
            </div>
            {errorMsg && (
              <p className="text-sm font-medium text-red-500 text-center">
                {errorMsg}
              </p>
            )}
            
            <Button
              type="submit"
              className="w-full bg-[#E0FB4A] text-black hover:bg-[#d4f030] font-bold text-base py-5"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-2">
                아직 계정이 없으신가요? <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => router.push('/signup')}>가입신청</span>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-gray-400">
            © 2024 We:form All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}