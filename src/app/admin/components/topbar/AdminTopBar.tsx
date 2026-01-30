"use client";

import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useRouter } from "next/navigation";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type AdminTopBarProps = {
  onMobileMenuOpen: () => void;
  companyName: string;
};

export function AdminTopBar({ onMobileMenuOpen, companyName }: AdminTopBarProps) {
  const { user, authUser, signOut } = useAuth();
  const router = useRouter();
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
    isInitialized: filterInitialized,
  } = useAdminFilter();

  const userRole = user?.role || "";

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 h-14">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden w-10 h-10 rounded-xl"
          onClick={onMobileMenuOpen}
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </Button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right side: filters + user */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Filters */}
          {filterInitialized && userRole !== "staff" && (
            <div className="hidden lg:flex items-center gap-3">
              {userRole === "system_admin" && (
                <Select value={selectedCompanyId} onValueChange={setCompany}>
                  <SelectTrigger className="h-9 w-[130px] bg-slate-50 border-none rounded-xl font-bold text-xs">
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
                <SelectTrigger className="h-9 w-[130px] bg-slate-50 border-none rounded-xl font-bold text-xs">
                  <SelectValue placeholder="지점 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {gyms.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="rounded-lg font-bold">{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStaffId || "all"} onValueChange={(v) => setStaff(v === "all" ? "" : v)}>
                <SelectTrigger className="h-9 w-[110px] bg-slate-50 border-none rounded-xl font-bold text-xs">
                  <SelectValue placeholder="직원 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all" className="rounded-lg font-bold text-blue-600">전체 직원</SelectItem>
                  {staffs.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-lg font-bold">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User profile */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                {companyName || "We:form"}
              </p>
              <p className="text-sm font-black text-slate-900 tracking-tight">{user?.name}님</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100">
                  <User className="w-4 h-4 text-slate-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-none shadow-2xl">
                <DropdownMenuLabel className="px-4 py-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{userRole.replace("_", " ")}</p>
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
          </div>
        </div>
      </div>
    </header>
  );
}
