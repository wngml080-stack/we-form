"use client";

import Link from "next/link";
import { Building2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { SidebarMenuSection } from "./SidebarMenuSection";
import { DASHBOARD_MENUS, BRANCH_MENUS, SYSTEM_MENUS } from "../../constants/navigation";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const userRole = user?.role || "";

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 shrink-0 border-b border-slate-50">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[var(--primary-hex)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">We:form</span>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
        <SidebarMenuSection label="업무관리" items={DASHBOARD_MENUS} />

        {userRole !== "staff" && (
          <SidebarMenuSection label="지점관리" items={BRANCH_MENUS} />
        )}

        {(userRole === "company_admin" || userRole === "system_admin") && (
          <SidebarMenuSection label="설정" items={SYSTEM_MENUS} />
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-50 shrink-0">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full h-12 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-black justify-start gap-3"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
