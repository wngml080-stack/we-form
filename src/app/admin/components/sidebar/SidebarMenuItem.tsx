"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SidebarMenuItemProps = {
  href: string;
  icon: LucideIcon;
  name: string;
  isActive: boolean;
  onClick?: () => void;
};

export function SidebarMenuItem({ href, icon: Icon, name, isActive, onClick }: SidebarMenuItemProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200",
        isActive
          ? "bg-blue-50 text-[var(--primary-hex)]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{name}</span>
    </Link>
  );
}
