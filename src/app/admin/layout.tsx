"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  Settings,
  LogOut,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(""); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("staffs")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (data) setUserRole(data.role);
      }
    };
    getUserRole();
  }, []);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { name: "대시보드", href: "/admin", icon: LayoutDashboard },
    { name: "통합 스케줄", href: "/admin/schedule", icon: CalendarDays },
    { name: "출석 관리", href: "/admin/attendance", icon: ClipboardCheck },
    { name: "직원 리스트", href: "/admin/staff", icon: Users },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* 상단 네비게이션 바 */}
      <header className="bg-white border-b border-gray-200 relative z-50" style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        {/* 3D 광택 효과 */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#667eea] flex items-center justify-center shadow-lg">
                <CalendarDays className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-gray-800">We:form</h1>
                <p className="text-xs text-gray-500">센터 운영 관리</p>
              </div>
            </Link>

            {/* [Desktop] 메인 메뉴 & 로그아웃 */}
            <div className="hidden md:flex items-center gap-4">
              <nav className="flex items-center gap-2">
                {/* System Admin 메뉴 */}
                {userRole === "system_admin" && (
                  <Link
                    href="/admin/system"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      pathname === "/admin/system"
                        ? "bg-gradient-to-r from-[#2F80ED] to-[#667eea] text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    고객사 관리
                  </Link>
                )}

                {/* Company Admin 메뉴 */}
                {(userRole === "company_admin" || userRole === "system_admin") && (
                  <Link
                    href="/admin/hq"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      pathname === "/admin/hq"
                        ? "bg-gradient-to-r from-[#2F80ED] to-[#667eea] text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    본사 관리
                  </Link>
                )}

                {/* 일반 메뉴 */}
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      pathname === item.href
                        ? "bg-gradient-to-r from-[#2F80ED] to-[#667eea] text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="h-4 w-px bg-gray-300" />

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </button>
            </div>

            {/* [Mobile] 햄버거 버튼 */}
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="메뉴 열기"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* [Mobile] 모바일 메뉴 드롭다운 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg p-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
            {userRole === "system_admin" && (
              <Link
                href="/admin/system"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  pathname === "/admin/system"
                    ? "bg-blue-50 text-[#2F80ED]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                고객사 관리
              </Link>
            )}

            {(userRole === "company_admin" || userRole === "system_admin") && (
              <Link
                href="/admin/hq"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  pathname === "/admin/hq"
                    ? "bg-blue-50 text-[#2F80ED]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Building2 className="mr-3 h-5 w-5" />
                본사 관리
              </Link>
            )}

            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  pathname === item.href
                    ? "bg-blue-50 text-[#2F80ED]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}

            <div className="h-px bg-gray-200 my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all w-full text-left"
            >
              <LogOut className="mr-3 h-5 w-5" />
              로그아웃
            </button>
          </div>
        )}
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}