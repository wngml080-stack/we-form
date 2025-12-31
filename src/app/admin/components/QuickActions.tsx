"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, Building2 } from "lucide-react";

interface QuickActionProps {
  icon: any;
  label: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span className="text-xs font-bold text-gray-600 group-hover:text-[#2F80ED] transition-colors text-center leading-tight">{label}</span>
    </Link>
  );
}

export function QuickActions() {
  return (
    <div className="flex gap-6 md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
      <QuickAction icon={Building2} label="지점 관리" href="/admin/branch" color="bg-blue-100 text-blue-600" />
      <QuickAction icon={Calendar} label="스케줄 관리" href="/admin/schedule" color="bg-purple-100 text-purple-600" />
      <QuickAction icon={CheckCircle2} label="출석 체크" href="/admin/attendance" color="bg-orange-100 text-orange-600" />
    </div>
  );
}
