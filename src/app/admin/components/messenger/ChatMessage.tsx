"use client";

import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/app/admin/hooks/useChatRealtime";

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  showAvatar: boolean;
}

export function ChatMessage({ message, isOwn, showAvatar }: ChatMessageProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 시스템 메시지
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // 본인 메시지
  if (isOwn) {
    return (
      <div className="flex justify-end items-end gap-2 mb-1">
        <span className="text-[10px] text-slate-400">
          {formatTime(message.created_at)}
        </span>
        <div className="max-w-[70%] bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] text-white px-4 py-2.5 rounded-2xl rounded-br-md shadow-sm">
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // 상대방 메시지
  return (
    <div className={cn("flex items-end gap-2 mb-1", showAvatar ? "mt-3" : "")}>
      {/* 아바타 영역 */}
      <div className="w-8 shrink-0">
        {showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold">
            {message.sender?.name?.charAt(0) || "?"}
          </div>
        )}
      </div>

      <div className="flex flex-col max-w-[70%]">
        {/* 이름 */}
        {showAvatar && (
          <span className="text-[10px] text-slate-500 mb-1 ml-1">
            {message.sender?.name || "알 수 없음"}
          </span>
        )}

        {/* 메시지 버블 */}
        <div className="flex items-end gap-2">
          <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm border border-slate-100">
            <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
