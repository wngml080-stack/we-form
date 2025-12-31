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
  ShoppingCart,
  Menu,
  X,
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

  const companyName = filterCompanyName || authCompanyName || "";

  // 인증 체크 및 리다이렉트
  useEffect(() => {
    if (isLoading) return;

    // 로그인 안됨
    if (!authUser) {
      router.push("/sign-in");
      return;
    }

    // staffs에 없거나 승인 안됨
    if (!isApproved) {
      // staffs에 등록 안됨 → 온보딩
      if (!user) {
        router.push("/onboarding");
      } else {
        // 등록됐지만 승인 대기 - 회사 대표(company_admin)인지 직원인지 구분
        const pendingType = user.role === "company_admin" ? "company" : "staff";
        router.push(`/onboarding/pending?type=${pendingType}`);
      }
    }
  }, [authUser, isLoading, isApproved, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  // 로딩 중이거나 미승인이면 로딩 표시
  if (isLoading || !isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f4f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-[0_8px_24px_rgba(79,70,229,0.35)] animate-pulse">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-slate-500 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 역할별 메뉴 정의
  const getMenuItems = () => {
    if (userRole === "staff") {
      // 직원 메뉴
      return {
        main: [
          { name: "대시보드", href: "/admin", icon: LayoutDashboard },
        ],
        branch: [
          { name: "급여 확인", href: "/admin/salary", icon: DollarSign, isChild: false },
        ],
        admin: []
      };
    } else {
      // 관리자 메뉴 (admin, company_admin, system_admin)
      return {
        main: [
          { name: "대시보드", href: "/admin", icon: LayoutDashboard },
        ],
        branch: [
          { name: "지점 관리", href: "/admin/branch", icon: Building2, isParent: true },
          { name: "매출 관리", href: "/admin/sales", icon: ShoppingCart, isChild: true },
          { name: "급여 관리", href: "/admin/salary", icon: DollarSign, isChild: true },
          { name: "직원 관리", href: "/admin/staff", icon: ClipboardCheck, isChild: true },
        ],
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
        className="fixed top-4 left-4 z-50 lg:hidden w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 왼쪽 사이드바 */}
      <aside className={`
        w-72 bg-white flex flex-col
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-bounce-in
        shadow-[4px_0_24px_rgba(0,0,0,0.06),8px_0_48px_rgba(0,0,0,0.04)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* 로고 */}
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-slate-900 tracking-tight">We:form</h1>
              <p className="text-xs text-slate-500 font-medium">피트니스 운영관리</p>
            </div>
          </Link>
        </div>

        {/* 전역 회사/지점/직원 선택 */}
        {filterInitialized && (
          <div className="px-4 pb-4 space-y-2">
            {/* 회사 선택 (system_admin만 선택 가능, 다른 역할은 표시만) */}
            {userRole === "system_admin" && companies.length > 0 ? (
              <Select value={selectedCompanyId} onValueChange={setCompany}>
                <SelectTrigger aria-label="회사 선택" className="w-full h-10 text-xs font-semibold bg-gradient-to-br from-primary to-indigo-600 text-white border-0 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.35)]">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="회사 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id} className="text-xs rounded-lg">
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="px-4 py-2.5 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-xl text-xs font-semibold text-center shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
                {companyName || "회사"}
              </div>
            )}

            {/* 지점 선택 */}
            <Select value={selectedGymId} onValueChange={setGym}>
              <SelectTrigger aria-label="지점 선택" className="w-full h-10 text-xs font-medium bg-white border-2 border-slate-200 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-primary/50 transition-colors">
                <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="지점 선택" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                {gyms.map((gym) => (
                  <SelectItem key={gym.id} value={gym.id} className="text-xs rounded-lg">
                    {gym.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 직원 선택 */}
            <Select value={selectedStaffId || "all"} onValueChange={(val) => setStaff(val === "all" ? "" : val)}>
              <SelectTrigger aria-label="직원 선택" className="w-full h-10 text-xs font-medium bg-white border-2 border-slate-200 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-primary/50 transition-colors">
                <Users className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="전체 직원" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <SelectItem value="all" className="text-xs rounded-lg">전체 직원</SelectItem>
                {staffs.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id} className="text-xs rounded-lg">
                    {staff.name} {staff.job_title ? `(${staff.job_title})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 구분선 */}
        <div className="mx-4 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {/* 메인 메뉴 (대시보드 & 하위 메뉴) */}
            {menuItems.main.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center rounded-xl transition-all duration-300 ${
                    index === 0
                      ? `px-4 py-3 text-sm font-semibold ${
                          isActive
                            ? "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                            : "text-slate-700 hover:bg-slate-100"
                        }`
                      : `pl-12 pr-4 py-2.5 text-sm ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                  }`}
                >
                  <item.icon className={`mr-3 ${index === 0 ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  {item.name}
                </Link>
              );
            })}

            {/* 지점 관리 섹션 */}
            {menuItems.branch.length > 0 && userRole !== "staff" && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">지점 운영</p>
                </div>
                {menuItems.branch.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center rounded-xl transition-all duration-300 ${
                        item.isChild
                          ? `pl-12 pr-4 py-2.5 text-sm ${
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-slate-600 hover:bg-slate-50"
                            }`
                          : `px-4 py-3 text-sm font-semibold ${
                              isActive
                                ? "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                                : "text-slate-700 hover:bg-slate-100"
                            }`
                      }`}
                    >
                      <item.icon className={`mr-3 ${item.isChild ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}

            {/* 직원용 메뉴 */}
            {userRole === "staff" && menuItems.branch.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* 관리자 설정 섹션 */}
            {(userRole === "company_admin" || userRole === "system_admin") && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">관리자 설정</p>
                </div>

                {/* 본사 관리 */}
                <Link
                  href="/admin/hq"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    pathname === "/admin/hq"
                      ? "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="mr-3 h-5 w-5" />
                  본사 관리
                </Link>

                {/* 고객사 관리 (System Admin만) */}
                {userRole === "system_admin" && (
                  <Link
                    href="/admin/system"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      pathname === "/admin/system"
                        ? "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    고객사 관리
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>

        {/* 로그아웃 */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-danger rounded-xl bg-danger/5 hover:bg-danger/10 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          >
            <LogOut className="mr-3 h-5 w-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden h-16"></div>
        <div className="min-h-full p-4 lg:p-6">
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
