import {
  LayoutDashboard,
  Calendar,
  UserCheck,
  FileText,
  Briefcase,
  Building2,
  BarChart3,
  DollarSign,
  ClipboardCheck,
  CalendarDays,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavMenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const DASHBOARD_MENUS: NavMenuItem[] = [
  { name: "대시보드", href: "/admin", icon: LayoutDashboard },
  { name: "스케줄관리", href: "/admin/schedule", icon: Calendar },
  { name: "PT회원관리", href: "/admin/pt-members", icon: UserCheck },
  { name: "회의록", href: "/admin/meetings", icon: FileText },
  { name: "포트폴리오", href: "/admin/portfolio", icon: Briefcase },
];

export const BRANCH_MENUS: NavMenuItem[] = [
  { name: "운영현황", href: "/admin/branch", icon: BarChart3 },
  { name: "매출&지출관리", href: "/admin/sales?tab=sales", icon: Building2 },
  { name: "급여관리", href: "/admin/salary", icon: DollarSign },
  { name: "직원관리", href: "/admin/staff", icon: ClipboardCheck },
  { name: "근태관리", href: "/admin/leave", icon: CalendarDays },
];

export const SYSTEM_MENUS: NavMenuItem[] = [
  { name: "본사 관리", href: "/admin/hq", icon: Building2 },
  { name: "시스템 설정", href: "/admin/system", icon: Settings },
];
