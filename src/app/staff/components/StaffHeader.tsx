"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface StaffHeaderProps {
  myStaffName: string | null;
  myGymName: string | null;
  myCompanyName: string | null;
}

export function StaffHeader({ myStaffName, myGymName, myCompanyName }: StaffHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-[60px] flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <h1 className="text-xl font-black text-[#2F80ED] tracking-tighter">We:form</h1>
        {myStaffName && (
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="font-medium text-gray-600">{myCompanyName}</span>
            <span className="w-px h-3 bg-gray-300"></span>
            <span className="font-bold text-[#2F80ED]">{myGymName}</span>
            <span className="w-px h-3 bg-gray-300"></span>
            <span className="font-medium text-gray-700">{myStaffName}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* 모바일에서만 보이는 간략 정보 */}
        <div className="md:hidden text-xs text-gray-500 flex items-center gap-1">
          <span className="font-bold text-[#2F80ED]">{myGymName}</span>
          <span>·</span>
          <span className="font-medium text-gray-700">{myStaffName}</span>
        </div>
        <Button
          onClick={() => router.push('/sign-in')}
          variant="ghost"
          className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 h-8 px-2 rounded-lg"
        >
          <LogOut className="w-4 h-4 md:mr-1" />
          <span className="hidden md:inline">로그아웃</span>
        </Button>
      </div>
    </header>
  );
}
