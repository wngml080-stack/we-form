"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminFilterProvider, useAdminFilter } from "@/contexts/AdminFilterContext";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  Settings,
  LogOut,
  ClipboardCheck,
  FileCheck,
  DollarSign,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
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
  const { user, isLoading, companyName: authCompanyName } = useAuth();
  const {
    selectedCompanyId,
    selectedGymId,
    gyms,
    companies,
    setCompany,
    setGym,
    gymName,
    companyName: filterCompanyName,
    isInitialized: filterInitialized,
  } = useAdminFilter();
  const userRole = user?.role || "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const supabase = createSupabaseClient();
  const companyName = filterCompanyName || authCompanyName || "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 역할별 메뉴 정의
  const getMenuItems = () => {
    if (userRole === "staff") {
      // 직원 메뉴
      return {
        main: [],
        branch: [
          { name: "내 스케줄", href: "/admin/schedule", icon: CalendarDays },
          { name: "급여 확인", href: "/admin/salary", icon: DollarSign },
        ],
        admin: []
      };
    } else {
      // 관리자 메뉴 (admin, company_admin, system_admin)
      return {
        main: [
          { name: "대시보드", href: "/admin", icon: LayoutDashboard },
          { name: "스케줄 관리", href: "/admin/schedule", icon: CalendarDays },
        ],
        branch: [
          { name: "지점 관리", href: "/admin/branch", icon: Building2, isParent: true },
          { name: "매출 관리", href: "/admin/sales", icon: ShoppingCart, isChild: true },
          { name: "급여 관리", href: "/admin/salary", icon: DollarSign, isChild: true },
          { name: "스케줄 승인", href: "/admin/reports", icon: FileCheck, isChild: true },
          { name: "회원 관리", href: "/admin/members", icon: Users },
          { name: "직원 관리", href: "/admin/staff", icon: ClipboardCheck },
        ],
        admin: []
      };
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 왼쪽 사이드바 */}
      <aside className={`
        w-64 bg-white border-r border-gray-200 flex flex-col
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* 로고 */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2F80ED] flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">We:form</h1>
              <p className="text-[10px] text-gray-500">피트니스 운영관리</p>
            </div>
          </Link>
        </div>

        {/* 전역 회사/지점 선택 */}
        {filterInitialized && (
          <div className="px-4 py-3 border-b border-gray-200 space-y-2">
            {/* 회사 선택 (system_admin만) */}
            {userRole === "system_admin" && companies.length > 0 ? (
              <Select value={selectedCompanyId} onValueChange={setCompany}>
                <SelectTrigger className="w-full h-9 text-xs bg-gray-50 border-gray-200">
                  <SelectValue placeholder="회사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id} className="text-xs">
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="px-3 py-2 bg-[#2F80ED] text-white rounded-lg text-xs font-medium text-center">
                {companyName || "회사"}
              </div>
            )}

            {/* 지점 선택 */}
            <Select value={selectedGymId} onValueChange={setGym}>
              <SelectTrigger className="w-full h-9 text-xs bg-white border-gray-200">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                <SelectValue placeholder="지점 선택" />
              </SelectTrigger>
              <SelectContent>
                {gyms.map((gym) => (
                  <SelectItem key={gym.id} value={gym.id} className="text-xs">
                    {gym.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 메뉴 */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {/* 메인 메뉴 (대시보드 & 하위 메뉴) */}
            {menuItems.main.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center rounded-lg transition-all ${
                  index === 0
                    ? `px-4 py-3 text-sm font-medium ${
                        pathname === item.href
                          ? "bg-[#2F80ED] text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    : `pl-12 pr-4 py-2.5 text-sm ${
                        pathname === item.href
                          ? "bg-blue-50 text-[#2F80ED] font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`
                }`}
              >
                <item.icon className={`mr-3 ${index === 0 ? 'h-5 w-5' : 'h-4 w-4'}`} />
                {item.name}
              </Link>
            ))}

            {/* 지점 관리 섹션 */}
            {menuItems.branch.length > 0 && userRole !== "staff" && (
              <>
                <div className="pt-4 pb-2">
                  <div className="border-t border-gray-200"></div>
                </div>
                {menuItems.branch.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center rounded-lg transition-all ${
                      item.isChild
                        ? `pl-12 pr-4 py-2.5 text-sm ${
                            pathname === item.href
                              ? "bg-blue-50 text-[#2F80ED] font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`
                        : `px-4 py-3 text-sm font-medium ${
                            pathname === item.href
                              ? "bg-[#2F80ED] text-white shadow-sm"
                              : "text-gray-700 hover:bg-gray-100"
                          }`
                    }`}
                  >
                    <item.icon className={`mr-3 ${item.isChild ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    {item.name}
                  </Link>
                ))}
              </>
            )}

            {/* 직원용 메뉴 */}
            {userRole === "staff" && menuItems.branch.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  pathname === item.href
                    ? "bg-[#2F80ED] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}

            {/* 관리자 설정 섹션 */}
            {(userRole === "company_admin" || userRole === "system_admin") && (
              <>
                <div className="pt-4 pb-2">
                  <div className="border-t border-gray-200"></div>
                </div>
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    관리자 설정
                  </p>
                </div>

                {/* 본사 관리 */}
                <Link
                  href="/admin/hq"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    pathname === "/admin/hq"
                      ? "bg-[#2F80ED] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
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
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                      pathname === "/admin/system"
                        ? "bg-[#2F80ED] text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
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
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="mr-3 h-5 w-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto bg-gray-50/50">
        <div className="lg:hidden h-14"></div>
        <div className="min-h-full">
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
