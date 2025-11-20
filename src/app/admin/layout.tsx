"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2, // 👈 본사 아이콘 추가
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(""); // 내 권한 상태

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
    { name: "직원 관리", href: "/admin/staff", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-64 bg-[#0F4C5C] text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="text-[#E0FB4A]" />
            We:form Admin
          </h1>
          <p className="text-xs text-white/70 mt-2 ml-8">센터 운영 관리자</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            {/* 👑 슈퍼 관리자 전용 메뉴 */}
            {userRole === "super_admin" && (
                <Link
                href="/admin/hq"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    pathname === "/admin/hq"
                    ? "bg-white/10 text-[#E0FB4A]"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
                >
                <Building2 className="mr-3 h-5 w-5" />
                본사(HQ) 관리
                </Link>
            )}

            <div className="my-2 border-t border-white/10"></div>

            {/* 일반 메뉴 */}
            {menuItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.href
                    ? "bg-white/10 text-[#E0FB4A]"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
                >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
                </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}