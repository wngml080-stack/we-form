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
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-semibold text-slate-600 group-hover:text-primary transition-colors">{label}</span>
    </Link>
  );
}

export function QuickActions() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
      <QuickAction
        icon={DollarSign}
        label="매출 현황"
        href="/admin/sales"
        color="bg-emerald-100 text-emerald-600"
      />
      <QuickAction
        icon={Calendar}
        label="스케줄 관리"
        href="/admin/schedule"
        color="bg-purple-100 text-purple-600"
      />
      <QuickAction
        icon={Users}
        label="회원 관리"
        href="/admin/pt-members"
        color="bg-blue-100 text-blue-600"
      />
      <QuickAction
        icon={Briefcase}
        label="포트폴리오"
        href="/admin/portfolio"
        color="bg-indigo-100 text-indigo-600"
      />
    </div>
  );
}
