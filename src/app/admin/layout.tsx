"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { CalendarRange, LayoutDashboard, LogOut, Users2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function NavItem({
  label,
  icon,
  href,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  href: string;
  active: boolean;
  onClick: () => void;
}) {
  const base =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors";
  const activeClass = "bg-white/10 font-semibold text-slate-50";
  const inactiveClass = "text-slate-200/80 hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? activeClass : inactiveClass}`}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isDashboard = pathname === "/admin" || pathname === "/admin/";
  const isSchedule = pathname.startsWith("/admin/schedule");
  const isStaff = pathname.startsWith("/admin/staff");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* 공통 사이드바 */}
      <aside className="flex w-64 flex-col gap-6 bg-[#0F4C5C] px-6 py-8 text-slate-50">
        <div className="flex items-center gap-2 text-xl font-bold">
          <CalendarRange className="h-6 w-6 text-[#E0FB4A]" />
          <span>We:form Admin</span>
        </div>

        <nav className="mt-4 space-y-2">
          <NavItem
            label="대시보드"
            href="/admin"
            active={isDashboard}
            onClick={() => router.push("/admin")}
            icon={<LayoutDashboard className="h-4 w-4" />}
          />
          <NavItem
            label="통합 스케줄"
            href="/admin/schedule"
            active={isSchedule}
            onClick={() => router.push("/admin/schedule")}
            icon={<CalendarRange className="h-4 w-4" />}
          />
          <NavItem
            label="직원 관리"
            href="/admin/staff"
            active={isStaff}
            onClick={() => router.push("/admin/staff")}
            icon={<Users2 className="h-4 w-4" />}
          />
        </nav>

        <div className="mt-auto flex items-center justify-between text-xs text-slate-200/80">
          <span>관리자</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 border-slate-200/40 bg-transparent px-2 py-1 text-[11px] text-slate-50 hover:bg-white/10"
          >
            <LogOut className="h-3 w-3" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* 우측 콘텐츠 영역 */}
      <main className="flex flex-1 flex-col bg-white">{children}</main>
    </div>
  );
}


