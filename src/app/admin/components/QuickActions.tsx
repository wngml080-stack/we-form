"use client";

import Link from "next/link";
import { UserPlus, Users, Package, Calendar, CheckCircle2 } from "lucide-react";

interface QuickActionProps {
  icon: any;
  label: string;
  href?: string;
  onClick?: () => void;
  color: string;
  disabled?: boolean;
}

function QuickAction({ icon: Icon, label, href, onClick, color, disabled }: QuickActionProps) {
  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <span className="text-xs font-bold text-gray-400 text-center leading-tight">{label}</span>
      </div>
    );
  }

  // onClick이 있으면 버튼으로, 없으면 링크로
  if (onClick) {
    return (
      <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <span className="text-xs font-bold text-gray-600 group-hover:text-[#2F80ED] transition-colors text-center leading-tight">{label}</span>
      </button>
    );
  }

  return (
    <Link href={href || "#"} className="flex flex-col items-center gap-2 group">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span className="text-xs font-bold text-gray-600 group-hover:text-[#2F80ED] transition-colors text-center leading-tight">{label}</span>
    </Link>
  );
}

interface QuickActionsProps {
  onNewMemberClick?: () => void;
  onExistingMemberClick?: () => void;
  onAddonClick?: () => void;
}

export function QuickActions({ onNewMemberClick, onExistingMemberClick, onAddonClick }: QuickActionsProps) {
  return (
    <div className="flex gap-6 md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
      <QuickAction
        icon={UserPlus}
        label="신규회원 등록"
        onClick={onNewMemberClick}
        href={onNewMemberClick ? undefined : "/admin/members?type=new"}
        color="bg-blue-100 text-blue-600"
      />
      <QuickAction
        icon={Users}
        label="기존회원 등록"
        onClick={onExistingMemberClick}
        href={onExistingMemberClick ? undefined : "/admin/members?type=existing"}
        color="bg-indigo-100 text-indigo-600"
      />
      <QuickAction
        icon={Package}
        label="매출 등록"
        onClick={onAddonClick}
        href={onAddonClick ? undefined : "/admin/sales"}
        color="bg-green-100 text-green-600"
      />
      <QuickAction icon={Calendar} label="스케줄 관리" href="/admin/schedule" color="bg-purple-100 text-purple-600" />
      <QuickAction icon={CheckCircle2} label="출석 체크" href="/admin/attendance" color="bg-orange-100 text-orange-600" />
    </div>
  );
}
