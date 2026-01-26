"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminFilterProvider, useAdminFilter } from "@/contexts/AdminFilterContext";
import { MessengerWidget } from "./components/messenger";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  LogOut,
  ClipboardCheck,
  DollarSign,
  Menu,
  X,
  Calendar,
  CheckSquare,
  UserCheck,
  Briefcase,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authUser, isLoading, isApproved, companyName: authCompanyName, signOut } = useAuth();
  const {
    selectedCompanyId,
    selectedGymId,
    selectedStaffId,
    gyms,
    staffs,
    companies,
    setCompany,
    setGym,
    setStaff,
    companyName: filterCompanyName,
    isInitialized: filterInitialized,
  } = useAdminFilter();
  const userRole = user?.role || "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const companyName = filterCompanyName || authCompanyName || "";

  // 인증 체크 및 리다이렉트
  useEffect(() => {
    if (isLoading) return;

    if (!authUser) {
      router.push("/sign-in");
      return;
    }

    if (!isApproved) {
      if (!user) {
        router.push("/onboarding");
      } else {
        const pendingType = user.role === "company_admin" ? "company" : "staff";
        router.push(`/onboarding/pending?type=${pendingType}`);
      }
    }
  }, [authUser, isLoading, isApproved, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  if (!isMounted) {
    return null;
  }

  // 로딩 중이거나 인증되지 않은 경우 (리다이렉트 대기)
  // middleware가 기본 인증을 처리하므로 여기서는 로딩 상태만 표시
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--primary-hex)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--foreground-muted)] font-bold">인증 정보 확인 중...</p>
        </div>
      </div>
    );
  }

  // 승인되지 않은 사용자는 useEffect에서 리다이렉트 처리
  // 리다이렉트 중에도 같은 로딩 화면 표시
  if (!isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--primary-hex)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--foreground-muted)] font-bold">페이지 이동 중...</p>
        </div>
      </div>
    );
  }

  const dashboardSubMenus = [
    { name: "스케줄관리", href: "/admin/schedule", icon: Calendar },
    { name: "통합회원관리", href: "/admin/pt-members", icon: UserCheck },
    { name: "포트폴리오", href: "/admin/portfolio", icon: Briefcase },
  ];

  const branchSubMenus = [
    { name: "센터관리", href: "/admin/sales?tab=sales", icon: Building2 },
    { name: "급여관리", href: "/admin/salary", icon: DollarSign },
    { name: "직원관리", href: "/admin/staff", icon: ClipboardCheck },
  ];

  const NavItem = ({ href, name, icon: Icon, subMenus }: { href?: string; name: string; icon: any; subMenus?: typeof dashboardSubMenus }) => {
    const isActive = href ? (pathname === href || (href !== "/admin" && pathname.startsWith(href))) : subMenus?.some(m => pathname.startsWith(m.href));

    if (subMenus) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? "text-[var(--primary-hex)] bg-[var(--primary-light-hex)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]"}`}>
              <Icon className="w-4.5 h-4.5" />
              {name}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-2 rounded-2xl border-[var(--border)] shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {subMenus.map((sub) => (
              <DropdownMenuItem key={sub.href} asChild className="rounded-xl cursor-pointer">
                <Link href={sub.href} className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all ${pathname.startsWith(sub.href) ? "text-[var(--primary-hex)] bg-[var(--primary-light-hex)]" : "text-[var(--foreground-muted)]"}`}>
                  <sub.icon className="w-4 h-4" />
                  {sub.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Link href={href!} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? "text-[var(--primary-hex)] bg-[var(--primary-light-hex)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]"}`}>
        <Icon className="w-4.5 h-4.5" />
        {name}
      </Link>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* 왼쪽: 로고 & 메인 메뉴 */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-[var(--primary-hex)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-hex)]/20 transition-transform hover:scale-105">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-[var(--foreground)] tracking-tight hidden sm:block">We:form</span>
            </Link>

            {/* 데스크탑 메뉴 */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavItem href="/admin" name="대시보드" icon={LayoutDashboard} subMenus={dashboardSubMenus} />
              {userRole !== "staff" && (
                <NavItem name="지점관리" icon={Building2} subMenus={branchSubMenus} />
              )}
              {(userRole === "company_admin" || userRole === "system_admin") && (
                <NavItem href="/admin/hq" name="본사관리" icon={Building2} />
              )}
              {userRole === "system_admin" && (
                <NavItem href="/admin/system" name="시스템설정" icon={Settings} />
              )}
            </nav>
          </div>

          {/* 오른쪽: 필터 & 사용자 액션 */}
          <div className="flex items-center gap-2 xs:gap-3">
            {/* 필터 섹션 - 데스크탑에서만 크게 표시 */}
            {filterInitialized && (
              <div className="hidden md:flex items-center gap-2">
                {userRole === "system_admin" && (
                  <Select value={selectedCompanyId} onValueChange={setCompany}>
                    <SelectTrigger className="h-10 px-3 text-xs bg-[var(--background-secondary)] border-none rounded-xl font-bold min-w-[120px]">
                      <SelectValue placeholder="회사" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[var(--border)] shadow-xl">
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={selectedGymId} onValueChange={setGym}>
                  <SelectTrigger className="h-10 px-3 text-xs bg-[var(--background-secondary)] border-none rounded-xl font-bold min-w-[120px]">
                    <SelectValue placeholder="지점" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[var(--border)] shadow-xl">
                    {gyms.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="rounded-lg">{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {userRole !== "staff" && (
                  <Select value={selectedStaffId || "all"} onValueChange={(v) => setStaff(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-10 px-3 text-xs bg-[var(--background-secondary)] border-none rounded-xl font-bold min-w-[120px]">
                      <SelectValue placeholder="직원" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[var(--border)] shadow-xl">
                      <SelectItem value="all" className="rounded-lg font-bold">전체 직원</SelectItem>
                      {staffs.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* 로그아웃 & 모바일 메뉴 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl text-rose-500 hover:bg-rose-50 transition-all active:scale-95 border border-rose-100"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* 모바일 햄버거 버튼 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center transition-all active:scale-95"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 확장 메뉴 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* 모바일 필터 */}
            <div className="grid grid-cols-2 gap-2 px-2">
              {userRole === "system_admin" && (
                <Select value={selectedCompanyId} onValueChange={setCompany}>
                  <SelectTrigger className="h-10 px-3 text-xs bg-[var(--background-secondary)] border-none rounded-xl font-bold">
                    <SelectValue placeholder="회사" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={selectedGymId} onValueChange={setGym}>
                <SelectTrigger className="h-10 px-3 text-xs bg-[var(--background-secondary)] border-none rounded-xl font-bold">
                  <SelectValue placeholder="지점" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {gyms.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 모바일 네비게이션 */}
            <nav className="flex flex-col gap-1 px-2">
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]">
                <LayoutDashboard className="w-5 h-5 opacity-50" /> 대시보드
              </Link>
              <div className="pl-4 space-y-1">
                {dashboardSubMenus.map(m => (
                  <Link key={m.href} href={m.href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]">
                    <m.icon className="w-4 h-4 opacity-50" /> {m.name}
                  </Link>
                ))}
              </div>

              {userRole !== "staff" && (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[var(--foreground-secondary)] mt-2">
                    <Building2 className="w-5 h-5 opacity-50" /> 지점관리
                  </div>
                  <div className="pl-4 space-y-1">
                    {branchSubMenus.map(m => (
                      <Link key={m.href} href={m.href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]">
                        <m.icon className="w-4 h-4 opacity-50" /> {m.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 mt-4"
              >
                <LogOut className="w-5 h-5" /> 로그아웃
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 max-w-[1600px] mx-auto min-h-full">
          {children}
        </div>
      </main>

      {/* 사내 메신저 플로팅 위젯 */}
      <MessengerWidget />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminFilterProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminFilterProvider>
    </AuthProvider>
  );
}
