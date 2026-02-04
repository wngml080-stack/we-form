"use client";

import Link from "next/link";
import { Calendar, UserCheck, FileText, Briefcase, PenSquare, BarChart3, Building2, DollarSign, ClipboardCheck, type LucideIcon } from "lucide-react";

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
    <div className="space-y-8">
      {/* 업무관리 바로가기 */}
      <div>
        <h3 className="text-sm font-bold text-[var(--foreground-muted)] mb-4 tracking-tight">업무관리</h3>
        <div className="flex gap-8 overflow-x-auto py-2 scrollbar-hide">
          <QuickAction
            icon={Calendar}
            label="스케줄관리"
            href="/admin/schedule"
            color="bg-purple-50 text-purple-500"
          />
          <QuickAction
            icon={UserCheck}
            label="PT회원관리"
            href="/admin/pt-members"
            color="bg-blue-50 text-blue-500"
          />
          <QuickAction
            icon={FileText}
            label="회의록"
            href="/admin/meetings"
            color="bg-amber-50 text-amber-500"
          />
          <QuickAction
            icon={Briefcase}
            label="포트폴리오"
            href="/admin/portfolio"
            color="bg-indigo-50 text-indigo-500"
          />
          <QuickAction
            icon={PenSquare}
            label="매출작성"
            href="/admin/sales?tab=sales"
            color="bg-emerald-50 text-emerald-500"
          />
        </div>
      </div>

      {/* 지점관리 바로가기 */}
      <div>
        <h3 className="text-sm font-bold text-[var(--foreground-muted)] mb-4 tracking-tight">지점관리</h3>
        <div className="flex gap-8 overflow-x-auto py-2 scrollbar-hide">
          <QuickAction
            icon={BarChart3}
            label="운영현황"
            href="/admin/branch"
            color="bg-gray-100 text-gray-600"
          />
          <QuickAction
            icon={Building2}
            label="매출&지출"
            href="/admin/sales?tab=sales"
            color="bg-gray-100 text-gray-600"
          />
          <QuickAction
            icon={DollarSign}
            label="급여관리"
            href="/admin/salary"
            color="bg-gray-100 text-gray-600"
          />
          <QuickAction
            icon={ClipboardCheck}
            label="직원관리"
            href="/admin/staff"
            color="bg-gray-100 text-gray-600"
          />
        </div>
      </div>
    </div>
  );
}
