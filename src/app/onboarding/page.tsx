"use client";

export const dynamic = 'force-dynamic';

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, LogOut } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4">
      <Card className="w-full max-w-lg shadow-2xl bg-white/95 backdrop-blur-sm border-0">
        <CardHeader className="text-center pb-2 pt-8">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            We:form 가입
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            {user.primaryEmailAddress?.emailAddress}님, 환영합니다!<br />
            가입 유형을 선택해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {/* 회사 가입 */}
          <button
            onClick={() => router.push("/onboarding/company")}
            className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">회사(본사)로 가입</h3>
                <p className="text-sm text-gray-500 mt-1">
                  새로운 회사/법인을 등록하고 서비스를 도입합니다.<br />
                  대표자 또는 본사 관리자용입니다.
                </p>
              </div>
            </div>
          </button>

          {/* 직원 가입 */}
          <button
            onClick={() => router.push("/onboarding/staff")}
            className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">직원으로 가입</h3>
                <p className="text-sm text-gray-500 mt-1">
                  이미 등록된 회사에 직원으로 가입합니다.<br />
                  회사의 사업자번호를 알고 있어야 합니다.
                </p>
              </div>
            </div>
          </button>

          <div className="text-center pt-4 space-y-3">
            <p className="text-xs text-gray-400">
              가입 후 관리자의 승인이 필요합니다.
            </p>
            <Button
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              다른 계정으로 로그인
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
