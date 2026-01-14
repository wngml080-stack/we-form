"use client";

import { cn } from "@/lib/utils";
import { Users, User } from "lucide-react";
import { ChatRoom } from "./hooks/useChatRooms";

interface ChatRoomListItemProps {
  room: ChatRoom;
  currentUserId: string;
  onClick: () => void;
}

export function ChatRoomListItem({
  room,
  currentUserId,
  onClick,
}: ChatRoomListItemProps) {
  const isDM = room.room_type === "dm";

  // DM인 경우 상대방 이름 표시
  const displayName = isDM
    ? room.members.find((m) => m.staff_id !== currentUserId)?.staff.name ||
      "알 수 없음"
    : room.name || "그룹 채팅";

  // 그룹인 경우 참여자 수
  const memberCount = room.members.length;

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "방금";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000)
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors",
        "hover:bg-slate-50 active:bg-slate-100",
        room.unread_count > 0 && "bg-blue-50/50"
      )}
    >
      {/* 아바타 */}
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shrink-0",
          isDM
            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
            : "bg-gradient-to-br from-emerald-500 to-teal-600"
        )}
      >
        {isDM ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "font-bold text-sm truncate",
                room.unread_count > 0 ? "text-slate-900" : "text-slate-700"
              )}
            >
              {displayName}
            </span>
            {!isDM && (
              <span className="text-[10px] text-slate-400 shrink-0">
                {memberCount}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
            {formatTime(room.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-xs truncate",
              room.unread_count > 0
                ? "text-slate-600 font-medium"
                : "text-slate-400"
            )}
          >
            {room.last_message_preview || "메시지가 없습니다"}
          </p>
          {room.unread_count > 0 && (
            <span className="min-w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shrink-0 ml-2">
              {room.unread_count > 99 ? "99+" : room.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
