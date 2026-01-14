"use client";

import { ChatRoom } from "./hooks/useChatRooms";
import { ChatRoomListItem } from "./ChatRoomListItem";
import { MessageCircle, Loader2 } from "lucide-react";

interface ChatRoomListProps {
  rooms: ChatRoom[];
  isLoading: boolean;
  currentUserId: string;
  onSelectRoom: (roomId: string) => void;
}

export function ChatRoomList({
  rooms,
  isLoading,
  currentUserId,
  onSelectRoom,
}: ChatRoomListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">채팅방이 없습니다</p>
        <p className="text-xs text-slate-400 text-center">
          + 버튼을 눌러 새 대화를 시작하세요
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {rooms.map((room) => (
        <ChatRoomListItem
          key={room.id}
          room={room}
          currentUserId={currentUserId}
          onClick={() => onSelectRoom(room.id)}
        />
      ))}
    </div>
  );
}
