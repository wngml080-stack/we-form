"use client";

import { useRef, useEffect } from "react";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { ChatMessage } from "@/app/admin/hooks/useChatRealtime";
import { ChatRoomDetail } from "./hooks/useChatMessages";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  typingUsers: string[];
  room: ChatRoomDetail | null;
}

export function ChatMessages({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  typingUsers,
  room,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 스크롤 감지하여 더 불러오기
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 50 && hasMore && !isLoading) {
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, onLoadMore]);

  // 타이핑 중인 사용자 이름 찾기
  const getTypingUserNames = () => {
    if (!room || typingUsers.length === 0) return null;

    const names = typingUsers
      .map((userId) => {
        const member = room.members.find((m) => m.staff_id === userId);
        return member?.staff.name;
      })
      .filter(Boolean);

    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]}님이 입력 중...`;
    return `${names.length}명이 입력 중...`;
  };

  const typingText = getTypingUserNames();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  // 날짜 구분선 표시를 위한 그룹핑
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toLocaleDateString(
        "ko-KR",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-slate-50"
    >
      {/* 더 불러오기 인디케이터 */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <button
            onClick={onLoadMore}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            이전 메시지 불러오기
          </button>
        </div>
      )}

      {messageGroups.map((group) => (
        <div key={group.date}>
          {/* 날짜 구분선 */}
          <div className="flex items-center justify-center py-3">
            <div className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {group.date}
            </div>
          </div>

          {/* 메시지들 */}
          {group.messages.map((message, index) => {
            const prevMessage = index > 0 ? group.messages[index - 1] : null;
            const showAvatar =
              !prevMessage || prevMessage.sender_id !== message.sender_id;

            return (
              <ChatMessageComponent
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
                showAvatar={showAvatar}
              />
            );
          })}
        </div>
      ))}

      {/* 타이핑 인디케이터 */}
      {typingText && (
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex space-x-1">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            <span
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <span
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
          <span className="text-xs text-slate-400">{typingText}</span>
        </div>
      )}
    </div>
  );
}
