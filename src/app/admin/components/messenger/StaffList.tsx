"use client";

import { useState } from "react";
import { useChatUsers, ChatUser } from "./hooks/useChatUsers";
import { Loader2, MessageCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffListProps {
  currentUserId: string;
  onStartChat: (staffId: string) => void;
}

export function StaffList({ currentUserId, onStartChat }: StaffListProps) {
  const { users, isLoading } = useChatUsers();
  const [startingChat, setStartingChat] = useState<string | null>(null);

  // 본인 제외
  const availableUsers = users.filter((u) => u.id !== currentUserId);

  const handleStartChat = async (staffId: string) => {
    setStartingChat(staffId);
    try {
      const response = await fetch("/api/admin/chat/rooms/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_staff_id: staffId }),
      });

      const data = await response.json();

      if (response.ok) {
        onStartChat(data.room.id);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setStartingChat(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (availableUsers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6">
        <p className="text-sm font-medium text-slate-500 mb-1">
          대화 가능한 직원이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {availableUsers.map((staff) => (
        <StaffListItem
          key={staff.id}
          staff={staff}
          isStarting={startingChat === staff.id}
          onStartChat={() => handleStartChat(staff.id)}
        />
      ))}
    </div>
  );
}

interface StaffListItemProps {
  staff: ChatUser;
  isStarting: boolean;
  onStartChat: () => void;
}

function StaffListItem({ staff, isStarting, onStartChat }: StaffListItemProps) {
  // 역할 표시
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "system_admin":
        return "시스템 관리자";
      case "company_admin":
        return "회사 관리자";
      case "admin":
        return "관리자";
      case "staff":
        return "직원";
      default:
        return role;
    }
  };

  // 소속 정보 (지점명 또는 본사)
  const getAffiliation = () => {
    if (staff.gym_name) {
      return staff.gym_name;
    }
    if (staff.gym_id === null) {
      return "본사";
    }
    return null;
  };

  const affiliation = getAffiliation();

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors",
        "hover:bg-slate-50 active:bg-slate-100",
        isStarting && "opacity-50 pointer-events-none"
      )}
      onClick={onStartChat}
    >
      {/* 아바타 */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          {staff.name.charAt(0)}
        </div>
        {/* 온라인 표시 (추후 실제 상태 연동) */}
        <Circle className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-green-500 fill-green-500 stroke-white stroke-2" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-slate-900 truncate">{staff.name}</p>
          {affiliation && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md shrink-0">
              {affiliation}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 truncate">
          {staff.job_title || getRoleLabel(staff.role)}
        </p>
      </div>

      {/* 메시지 버튼 */}
      <div className="shrink-0">
        {isStarting ? (
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        ) : (
          <MessageCircle className="w-5 h-5 text-slate-400" />
        )}
      </div>
    </div>
  );
}
