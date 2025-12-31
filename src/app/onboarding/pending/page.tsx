"use client";

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Building2, Users, LogOut } from "lucide-react";
import { Suspense, useMemo, useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

function PendingContent() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/sign-in");
      } else {
        setEmail(session.user.email ?? null);
      }
    });
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const isCompany = type === "company";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white border-0 text-center">
        <CardHeader className="pt-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">승인 대기 중</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
              {isCompany ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              <span className="font-medium">
                {isCompany ? "회사(본사) 가입 신청" : "직원 가입 신청"}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {email}
            </p>
          </div>

          <div className="text-gray-600 text-sm leading-relaxed">
            {isCompany ? (
              <>
                가입 신청이 완료되었습니다.<br />
                <strong>시스템 관리자</strong>가 검토 후 승인하면<br />
                서비스를 이용하실 수 있습니다.
              </>
            ) : (
              <>
                가입 신청이 완료되었습니다.<br />
                <strong>소속 회사 관리자</strong>가 승인하면<br />
                서비스를 이용하실 수 있습니다.
              </>
            )}
          </div>

          <div className="pt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              승인 상태 새로고침
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" /> 로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="text-white">로딩 중...</div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
