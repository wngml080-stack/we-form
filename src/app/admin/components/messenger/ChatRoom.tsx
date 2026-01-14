"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChatMessages } from "./hooks/useChatMessages";
import { useChatRealtime, ChatMessage } from "@/app/admin/hooks/useChatRealtime";

interface ChatRoomProps {
  roomId: string;
  onBack: () => void;
  onClose: () => void;
}

export function ChatRoom({ roomId, onBack, onClose }: ChatRoomProps) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    room,
    messages,
    isLoading,
    isSending,
    hasMore,
    loadMore,
    sendMessage,
    markAsRead,
    addMessage,
    removeMessage,
  } = useChatMessages(roomId);

  // 새 메시지 수신 핸들러
  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      addMessage(message);
      // 본인 메시지가 아니면 읽음 처리
      if (message.sender_id !== user?.id) {
        markAsRead();
      }
      // 스크롤
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    [addMessage, markAsRead, user?.id]
  );

  // 메시지 삭제 핸들러
  const handleMessageDeleted = useCallback(
    (messageId: string) => {
      removeMessage(messageId);
    },
    [removeMessage]
  );

  // 타이핑 상태 핸들러
  const handleTypingUpdate = useCallback((userId: string, isTyping: boolean) => {
    setTypingUsers((prev) =>
      isTyping
        ? [...prev.filter((id) => id !== userId), userId]
        : prev.filter((id) => id !== userId)
    );
  }, []);

  // 실시간 구독
  const { sendTypingStatus } = useChatRealtime({
    roomId,
    userId: user?.id || "",
    onNewMessage: handleNewMessage,
    onMessageDeleted: handleMessageDeleted,
    onTypingUpdate: handleTypingUpdate,
  });

  // 채팅방 입장 시 읽음 처리
  useEffect(() => {
    markAsRead();
  }, [roomId, markAsRead]);

  // 초기 로드 후 스크롤
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [isLoading, messages.length]);

  const handleSend = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        room={room}
        currentUserId={user?.id || ""}
        onBack={onBack}
        onClose={onClose}
      />

      <ChatMessages
        messages={messages}
        currentUserId={user?.id || ""}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        typingUsers={typingUsers}
        room={room}
      />

      <div ref={messagesEndRef} />

      <ChatInput
        onSend={handleSend}
        onTyping={sendTypingStatus}
        isSending={isSending}
      />
    </div>
  );
}
