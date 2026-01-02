"use client";

import Link from "next/link";
import { DollarSign, Calendar, CheckCircle2, Users, Briefcase } from "lucide-react";

interface QuickActionProps {
  icon: any;
  label: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-3 group min-w-[100px]">
      <div className={`w-16 h-16 rounded-[24px] ${color} flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Icon className="w-7 h-7 relative z-10" />
      </div>
      <span className="text-[13px] font-black text-slate-600 group-hover:text-blue-600 transition-colors text-center leading-tight tracking-tighter">{label}</span>
    </Link>
  );
}

export function QuickActions() {
  return (
    <div className="flex gap-8 md:gap-12 overflow-x-auto pb-4 scrollbar-hide px-2">
      <QuickAction
        icon={DollarSign}
        label="매출 현황"
        href="/admin/sales"
        color="bg-emerald-50 text-emerald-600 border border-emerald-100"
      />
      <QuickAction
        icon={Calendar}
        label="스케줄 관리"
        href="/admin/schedule"
        color="bg-purple-50 text-purple-600 border border-purple-100"
      />
      <QuickAction
        icon={CheckCircle2}
        label="출석 체크"
        href="/admin/attendance"
        color="bg-amber-50 text-amber-600 border border-amber-100"
      />
      <QuickAction
        icon={Users}
        label="회원 관리"
        href="/admin/pt-members"
        color="bg-blue-50 text-blue-600 border border-blue-100"
      />
      <QuickAction
        icon={Briefcase}
        label="포트폴리오"
        href="/admin/portfolio"
        color="bg-indigo-50 text-indigo-600 border border-indigo-100"
      />
    </div>
  );
}
