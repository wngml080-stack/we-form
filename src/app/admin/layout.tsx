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
  CalendarDays,
  FileText,
  User,
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const dashboardSubMenus = [
    { name: "대시보드", href: "/admin", icon: LayoutDashboard },
    { name: "스케줄관리", href: "/admin/schedule", icon: Calendar },
    { name: "PT회원관리", href: "/admin/pt-members", icon: UserCheck },
    { name: "회의록", href: "/admin/meetings", icon: FileText },
    { name: "포트폴리오", href: "/admin/portfolio", icon: Briefcase },
  ];

  const branchSubMenus = [
    { name: "센터관리", href: "/admin/sales?tab=sales", icon: Building2 },
    { name: "급여관리", href: "/admin/salary", icon: DollarSign },
    { name: "직원관리", href: "/admin/staff", icon: ClipboardCheck },
    { name: "근태관리", href: "/admin/leave", icon: CalendarDays },
  ];

  const systemSubMenus = [
    { name: "본사 관리", href: "/admin/hq", icon: Building2 },
    { name: "시스템 설정", href: "/admin/system", icon: Settings },
  ];

  if (!isMounted) return null;

  if (isLoading || !isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--primary-hex)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading We:form</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header - Toss Modern Style */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Nav */}
          <div className="flex items-center gap-12">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-[var(--primary-hex)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">We:form</span>
            </Link>

            <nav className="hidden xl:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn(
                    "h-12 px-5 rounded-xl font-black text-sm gap-2 transition-all",
                    pathname.startsWith("/admin") && !branchSubMenus.some(m => pathname.startsWith(m.href)) && !systemSubMenus.some(m => pathname.startsWith(m.href))
                      ? "text-[var(--primary-hex)] bg-blue-50" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}>
                    업무관리 <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2 rounded-2xl border-none shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  {dashboardSubMenus.map((item) => (
                    <DropdownMenuItem key={item.href} asChild className="rounded-xl py-3 cursor-pointer">
                      <Link href={item.href} className="flex items-center gap-3 w-full">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", pathname === item.href ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-400")}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className={cn("font-bold text-sm", pathname === item.href ? "text-blue-600" : "text-slate-600")}>{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {userRole !== "staff" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={cn(
                      "h-12 px-5 rounded-xl font-black text-sm gap-2 transition-all",
                      branchSubMenus.some(m => pathname.startsWith(m.href))
                        ? "text-[var(--primary-hex)] bg-blue-50" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    )}>
                      지점관리 <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                    {branchSubMenus.map((item) => (
                      <DropdownMenuItem key={item.href} asChild className="rounded-xl py-3 cursor-pointer">
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", pathname.startsWith(item.href) ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-400")}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className={cn("font-bold text-sm", pathname.startsWith(item.href) ? "text-blue-600" : "text-slate-600")}>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {(userRole === "company_admin" || userRole === "system_admin") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={cn(
                      "h-12 px-5 rounded-xl font-black text-sm gap-2 transition-all",
                      systemSubMenus.some(m => pathname.startsWith(m.href))
                        ? "text-[var(--primary-hex)] bg-blue-50" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    )}>
                      설정 <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                    {systemSubMenus.map((item) => (
                      <DropdownMenuItem key={item.href} asChild className="rounded-xl py-3 cursor-pointer">
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", pathname.startsWith(item.href) ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-400")}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className={cn("font-bold text-sm", pathname.startsWith(item.href) ? "text-blue-600" : "text-slate-600")}>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>

          {/* Right Side: Filters & User */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-3">
              {filterInitialized && userRole !== "staff" && (
                <>
                  {userRole === "system_admin" && (
                    <Select value={selectedCompanyId} onValueChange={setCompany}>
                      <SelectTrigger className="h-11 w-[140px] bg-slate-50 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-100">
                        <SelectValue placeholder="회사 선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="rounded-lg font-bold">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={selectedGymId} onValueChange={setGym}>
                    <SelectTrigger className="h-11 w-[140px] bg-slate-50 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="지점 선택" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {gyms.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="rounded-lg font-bold">{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStaffId || "all"} onValueChange={(v) => setStaff(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-11 w-[120px] bg-slate-50 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="직원 선택" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="all" className="rounded-lg font-bold text-blue-600">전체 직원</SelectItem>
                      {staffs.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="rounded-lg font-bold">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* User Profile / Logout */}
            <div className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-6 border-l border-slate-100">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{companyName || "We:form"}</p>
                <p className="text-sm font-black text-slate-900 tracking-tight">{user?.name}님</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-11 h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 shadow-inner">
                    <User className="w-5 h-5 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-none shadow-2xl">
                  <DropdownMenuLabel className="px-4 py-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{userRole.replace('_', ' ')}</p>
                    <p className="text-base font-black text-slate-900">{user?.name}님</p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{authUser?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl py-3 text-rose-600 font-black cursor-pointer focus:bg-rose-50 focus:text-rose-600">
                    <LogOut className="w-4 h-4 mr-3" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="icon" 
                className="xl:hidden w-11 h-11 rounded-2xl bg-slate-50"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] xl:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-[300px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 flex items-center justify-between border-b border-slate-50">
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl">
                <X className="w-6 h-6 text-slate-400" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Communication</p>
                  <div className="grid grid-cols-1 gap-1">
                    {dashboardSubMenus.map(item => (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all",
                          pathname === item.href ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {userRole !== "staff" && (
                  <div className="space-y-3">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management</p>
                    <div className="grid grid-cols-1 gap-1">
                      {branchSubMenus.map(item => (
                        <Link 
                          key={item.href} 
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all",
                            pathname.startsWith(item.href) ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {(userRole === "company_admin" || userRole === "system_admin") && (
                  <div className="space-y-3">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System</p>
                    <div className="grid grid-cols-1 gap-1">
                      {systemSubMenus.map(item => (
                        <Link 
                          key={item.href} 
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all",
                            pathname.startsWith(item.href) ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-50">
              <Button onClick={handleLogout} className="w-full h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black shadow-none border-none">
                <LogOut className="w-5 h-5 mr-3" />
                로그아웃
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto transition-all duration-500">
        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>

      {/* Messenger Widget */}
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
