"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminFilterProvider, useAdminFilter } from "@/contexts/AdminFilterContext";
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
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [isBranchOpen, setIsBranchOpen] = useState(true);

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

  if (isLoading || !isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f4f8]">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  const dashboardSubMenus = [
    { name: "스케줄관리", href: "/admin/schedule", icon: Calendar },
    { name: "통합회원관리", href: "/admin/pt-members", icon: UserCheck },
    { name: "포트폴리오", href: "/admin/portfolio", icon: Briefcase },
  ];

  const branchSubMenus = [
    { name: "매출관리", href: "/admin/sales?tab=sales", icon: DollarSign },
    { name: "지출관리", href: "/admin/sales?tab=expenses", icon: DollarSign },
    { name: "문의관리", href: "/admin/sales?tab=inquiries", icon: MessageSquare },
    { name: "급여관리", href: "/admin/salary", icon: DollarSign },
    { name: "직원관리", href: "/admin/staff", icon: ClipboardCheck },
  ];

  const getMenuItems = () => {
    if (userRole === "staff") {
      return {
        main: [{ name: "대시보드", href: "/admin", icon: LayoutDashboard }],
        branch: [{ name: "급여 확인", href: "/admin/salary", icon: DollarSign }],
        admin: []
      };
    } else {
      return {
        main: [{ name: "대시보드", href: "/admin", icon: LayoutDashboard }],
        branch: [], // 하위 메뉴로 이동됨
        admin: []
      };
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-[#f0f4f8]">
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        w-64 bg-white border-r border-slate-200 flex flex-col
        fixed lg:static inset-y-0 left-0 z-50 transition-transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* 로고 */}
        <div className="p-6 border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">We:form</span>
          </Link>
        </div>

        {/* 필터 */}
        {filterInitialized && (
          <div className="p-4 space-y-2">
            {userRole === "system_admin" && (
              <Select value={selectedCompanyId} onValueChange={setCompany}>
                <SelectTrigger className="w-full text-xs bg-slate-50 border-none">
                  <SelectValue placeholder="회사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={selectedGymId} onValueChange={setGym}>
              <SelectTrigger className="w-full text-xs bg-slate-50 border-none">
                <SelectValue placeholder="지점 선택" />
              </SelectTrigger>
              <SelectContent>
                {gyms.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStaffId || "all"} onValueChange={(v) => setStaff(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full text-xs bg-slate-50 border-none">
                <SelectValue placeholder="직원 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 직원</SelectItem>
                {staffs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {/* 대시보드 with 하위메뉴 */}
          <div>
            <div
              className={`flex items-center justify-between w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/admin" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Link href="/admin" className="flex items-center gap-3 flex-1">
                <LayoutDashboard className="w-4 h-4" />
                대시보드
              </Link>
              <button onClick={() => setIsDashboardOpen(!isDashboardOpen)} className="p-1 -mr-1">
                {isDashboardOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {isDashboardOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                {dashboardSubMenus.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Management</p>
          </div>

          {userRole !== "staff" ? (
            <div>
              <div
                className={`flex items-center justify-between w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin/branch") || branchSubMenus.some(m => pathname.startsWith(m.href))
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Link href="/admin/branch" className="flex items-center gap-3 flex-1">
                  <Building2 className="w-4 h-4" />
                  지점관리
                </Link>
                <button onClick={() => setIsBranchOpen(!isBranchOpen)} className="p-1 -mr-1">
                  {isBranchOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {isBranchOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                  {branchSubMenus.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            menuItems.branch.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))
          )}

          {(userRole === "company_admin" || userRole === "system_admin") && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">System</p>
              </div>
              <Link
                href="/admin/hq"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/admin/hq" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                본사 관리
              </Link>
              {userRole === "system_admin" && (
                <Link
                  href="/admin/system"
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/admin/system" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  시스템 설정
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#f8fafc] overflow-x-hidden">
        <div className="p-2 xs:p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
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
