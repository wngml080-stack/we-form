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
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(""); 

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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* 사이드바: 3D 그라데이션 배경 */}
      <aside className="w-64 bg-gradient-to-b from-[#2F80ED] via-[#667eea] to-[#764ba2] text-white flex flex-col relative overflow-hidden" style={{
        boxShadow: '0 20px 60px -10px rgba(47, 128, 237, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}>
        {/* 3D 광택 효과 */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

        <div className="p-6 relative z-10">
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2 drop-shadow-lg">
            <CalendarDays className="text-[#F2994A] float-animation" />
            We:form
          </h1>
          <p className="text-xs text-white/90 mt-2 ml-8 font-sans drop-shadow">센터 운영 관리자</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
            {/* 👑 1. 개발자(시스템 관리자) 전용 메뉴 */}
            {userRole === "system_admin" && (
                <>
                    <div className="text-xs font-heading font-semibold text-white/60 px-4 mt-4 mb-2 uppercase tracking-wider drop-shadow">System</div>
                    <Link
                    href="/admin/system"
                    className={`flex items-center px-4 py-3 text-sm font-sans font-medium rounded-xl transition-all ${
                        pathname === "/admin/system"
                        ? "bg-white text-[#2F80ED] shadow-lg transform scale-105"
                        : "text-white/90 hover:bg-white/20 hover:scale-[1.02] hover:shadow-lg"
                    }`}
                    style={{
                      boxShadow: pathname === "/admin/system"
                        ? '0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                        : 'none'
                    }}
                    >
                    <Settings className="mr-3 h-5 w-5" />
                    고객사(Company) 관리
                    </Link>
                    <div className="my-2 border-t border-white/20"></div>
                </>
            )}

            {/* 🏢 2. 회사 대표(Company Admin) 전용 메뉴 */}
            {(userRole === "company_admin" || userRole === "system_admin") && (
                 <Link
                 href="/admin/hq"
                 className={`flex items-center px-4 py-3 text-sm font-sans font-medium rounded-xl transition-all ${
                     pathname === "/admin/hq"
                     ? "bg-white text-[#2F80ED] shadow-lg transform scale-105"
                     : "text-white/90 hover:bg-white/20 hover:scale-[1.02] hover:shadow-lg"
                 }`}
                 style={{
                   boxShadow: pathname === "/admin/hq"
                     ? '0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                     : 'none'
                 }}
                 >
                 <Building2 className="mr-3 h-5 w-5" />
                 본사(HQ) 관리
                 </Link>
            )}

            {/* 3. 일반 메뉴 */}
            <div className="text-xs font-heading font-semibold text-white/60 px-4 mt-4 mb-2 uppercase tracking-wider drop-shadow">Menu</div>
            {menuItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-sans font-medium rounded-xl transition-all ${
                    pathname === item.href
                    ? "bg-white text-[#2F80ED] shadow-lg transform scale-105"
                    : "text-white/90 hover:bg-white/20 hover:scale-[1.02] hover:shadow-lg"
                }`}
                style={{
                  boxShadow: pathname === item.href
                    ? '0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                    : 'none'
                }}
                >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
                </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-white/20 relative z-10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-sans font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02]"
          >
            <LogOut className="mr-3 h-5 w-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}