"use client";

import { usePathname } from "next/navigation";
import { SidebarMenuItem } from "./SidebarMenuItem";
import type { NavMenuItem } from "../../constants/navigation";

type SidebarMenuSectionProps = {
  label: string;
  items: NavMenuItem[];
  onItemClick?: () => void;
};

export function SidebarMenuSection({ label, items, onItemClick }: SidebarMenuSectionProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    // query string 제거 후 비교
    const basePath = href.split("?")[0];
    return pathname.startsWith(basePath);
  };

  return (
    <div className="space-y-1">
      <p className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <SidebarMenuItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            name={item.name}
            isActive={isItemActive(item.href)}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}
