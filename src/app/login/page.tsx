"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/types/common";
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

  const supabase = createSupabaseClient();

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

      // 2. 직원 정보 조회 (employment_status, gym_id 포함)
      const { data: staffData, error: staffError } = await supabase
        .from("staffs")
        .select("role, employment_status, gym_id")
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

      // 🚨 [보안 체크 2] 승인 대기 센터 소속 직원 차단
      if (staffData.gym_id) {
        const { data: gymData, error: gymError } = await supabase
          .from("gyms")
          .select("status")
          .eq("id", staffData.gym_id)
          .single();

        if (!gymError && gymData && gymData.status === 'pending') {
          await supabase.auth.signOut(); // 즉시 로그아웃
          throw new Error("가입 승인 대기 중인 센터입니다. 승인 후 이용 가능합니다.");
        }
      }

      // 3. 통과 시 페이지 이동
      // system_admin, company_admin, admin -> /admin
      // staff -> /staff
      if (["system_admin", "company_admin", "admin"].includes(staffData.role)) {
        router.push("/admin");
      } else {
        router.push("/staff");
      }
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
      // 에러 발생 시 세션 정리
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#2F80ED] via-[#667eea] to-[#764ba2] p-4">
      <Card className="w-full max-w-md border-none shadow-soft-lg bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center pt-8">
          <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-[#2F80ED] to-[#764ba2] bg-clip-text text-transparent">
            We:form
          </h1>
          <p className="text-sm text-gray-600 font-sans">
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
                className="border-gray-300 focus:ring-[#2F80ED]"
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
                className="border-gray-300 focus:ring-[#2F80ED]"
              />
            </div>
            {errorMsg && (
              <p className="text-sm font-medium text-red-500 text-center">
                {errorMsg}
              </p>
            )}
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#F2994A] to-[#e27f34] text-white hover:from-[#e27f34] hover:to-[#d16a1f] font-heading font-bold text-base py-6 rounded-xl shadow-soft transition-all hover:shadow-soft-lg hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4 font-sans">
                아직 계정이 없으신가요? <span className="text-[#2F80ED] cursor-pointer hover:underline font-medium" onClick={() => router.push('/signup')}>가입신청</span>
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