"use client";

import Link from "next/link";
import { DollarSign, Calendar, Users, Briefcase, type LucideIcon } from "lucide-react";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-3 group min-w-[80px]">
      <div className={`w-16 h-16 rounded-[24px] ${color} flex items-center justify-center shadow-sm group-hover:shadow-toss group-hover:-translate-y-1.5 transition-all duration-300 active:scale-95`}>
        <Icon className="w-7 h-7" />
      </div>
      <span className="text-sm font-bold text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors tracking-tight">{label}</span>
    </Link>
  );
}

export function QuickActions() {
  return (
    <div className="flex gap-8 overflow-x-auto py-2 scrollbar-hide">
      <QuickAction
        icon={DollarSign}
        label="매출 현황"
        href="/admin/sales"
        color="bg-emerald-50 text-emerald-500"
      />
      <QuickAction
        icon={Calendar}
        label="스케줄 관리"
        href="/admin/schedule"
        color="bg-purple-50 text-purple-500"
      />
      <QuickAction
        icon={Users}
        label="회원 관리"
        href="/admin/pt-members"
        color="bg-blue-50 text-blue-500"
      />
      <QuickAction
        icon={Briefcase}
        label="포트폴리오"
        href="/admin/portfolio"
        color="bg-indigo-50 text-indigo-500"
      />
    </div>
  );
}
