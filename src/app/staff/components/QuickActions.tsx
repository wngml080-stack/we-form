import { toast } from "@/lib/toast";
import { UserPlus, Calendar, DollarSign, CheckCircle, MoreHorizontal } from "lucide-react";

interface QuickActionProps {
  onRegisterMember: () => void;
  onManageSchedule: () => void;
}

export function QuickActions({ onRegisterMember, onManageSchedule }: QuickActionProps) {
  const actions = [
    {
      label: "회원 등록",
      icon: UserPlus,
      color: "bg-blue-100 text-blue-600",
      onClick: onRegisterMember,
    },
    {
      label: "스케줄 관리",
      icon: Calendar,
      color: "bg-purple-100 text-purple-600",
      onClick: onManageSchedule,
    },
    {
      label: "매출 등록",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
      onClick: () => toast.info("준비 중인 기능입니다."),
    },
    {
      label: "추가 메뉴",
      icon: MoreHorizontal,
      color: "bg-gray-100 text-gray-600",
      onClick: () => {},
    },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className="flex flex-col items-center gap-2 min-w-[80px] group"
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:scale-105 group-active:scale-95 ${action.color}`}
          >
            <action.icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-gray-600">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

