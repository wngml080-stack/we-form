"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LayoutDashboard, LogOut, User2, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";

const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export default function AdminPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* 왼쪽 사이드바 - Deep Teal */}
      <aside className="flex w-64 flex-col gap-6 bg-[#0F4C5C] px-6 py-8 text-slate-50">
        <div className="flex items-center gap-2 text-xl font-bold">
          <CalendarDays className="h-6 w-6 text-[#E0FB4A]" />
          <span>We:form</span>
        </div>
        <nav className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 font-medium">
            <LayoutDashboard className="h-4 w-4 text-[#E0FB4A]" />
            <span>대시보드</span>
          </div>
          <div className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-200/80">
            <User2 className="h-4 w-4" />
            <span>직원 관리</span>
          </div>
        </nav>
      </aside>

      {/* 오른쪽 콘텐츠 영역 */}
      <main className="flex flex-1 flex-col bg-white px-8 py-6">
        {/* 상단 바 */}
        <header className="flex items-center justify-end gap-4">
          <span className="hidden text-sm text-slate-500 md:inline">
            We:form 관리자 모드
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </header>

        {/* 메인 콘텐츠 */}
        <section className="mt-10 space-y-3">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
            <LayoutDashboard className="h-8 w-8 text-[#0F4C5C]" />
            <span>관리자 대시보드</span>
          </h1>
          <p className="flex items-center gap-2 text-lg text-slate-600">
            <User2 className="h-5 w-5 text-[#0F4C5C]" />
            <span>환영합니다, 대표님!</span>
          </p>
          <p className="mt-4 text-sm text-slate-500">
            센터 운영 현황과 스케줄, 매출/정산 데이터를 한 눈에 확인할 수 있는
            공간입니다.
          </p>
        </section>
      </main>
    </div>
  );
}


