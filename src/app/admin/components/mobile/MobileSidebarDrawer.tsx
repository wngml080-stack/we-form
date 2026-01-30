"use client";

import { X, Building2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SidebarMenuSection } from "../sidebar/SidebarMenuSection";
import { DASHBOARD_MENUS, BRANCH_MENUS, SYSTEM_MENUS } from "../../constants/navigation";
import { Button } from "@/components/ui/button";

type MobileSidebarDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebarDrawer({ isOpen, onClose }: MobileSidebarDrawerProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const userRole = user?.role || "";

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      {/* Sidebar - slides from left */}
      <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-500">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-50 shrink-0">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--primary-hex)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">We:form</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl w-9 h-9">
            <X className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5 custom-scrollbar">
          <SidebarMenuSection label="업무관리" items={DASHBOARD_MENUS} onItemClick={onClose} />
          {userRole !== "staff" && (
            <SidebarMenuSection label="지점관리" items={BRANCH_MENUS} onItemClick={onClose} />
          )}
          {(userRole === "company_admin" || userRole === "system_admin") && (
            <SidebarMenuSection label="설정" items={SYSTEM_MENUS} onItemClick={onClose} />
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-50 shrink-0">
          <Button
            onClick={handleLogout}
            className="w-full h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black shadow-none border-none"
          >
            <LogOut className="w-5 h-5 mr-3" />
            로그아웃
          </Button>
        </div>
      </aside>
    </div>
  );
}
