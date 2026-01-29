"use client";

import { ArrowLeft, Users, User, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatRoomDetail } from "./hooks/useChatMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  room: ChatRoomDetail | null;
  currentUserId: string;
  onBack: () => void;
  onClose: () => void;
}

export function ChatHeader({
  room,
  currentUserId,
  onBack,
  onClose,
}: ChatHeaderProps) {
  if (!room) {
    return (
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-xl h-9 w-9 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 h-10 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const isDM = room.room_type === "dm";
  const displayName = isDM
    ? room.members.find((m) => m.staff_id !== currentUserId)?.staff.name ||
      "알 수 없음"
    : room.name || "그룹 채팅";

  const memberCount = room.members.length;

  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0">
      <Button
        size="icon"
        variant="ghost"
        className="rounded-xl h-9 w-9 shrink-0"
        onClick={onBack}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* 아바타 */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
          isDM
            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
            : "bg-gradient-to-br from-emerald-500 to-teal-600"
        }`}
      >
        {isDM ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-slate-900 truncate">
          {displayName}
        </h3>
        <p className="text-[10px] text-slate-400">
          {isDM ? "1:1 대화" : `${memberCount}명 참여중`}
        </p>
      </div>

      {/* 더보기 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-xl h-9 w-9 shrink-0"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isDM && (
            <DropdownMenuItem>
              참여자 보기
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onClose}>
            메신저 닫기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
