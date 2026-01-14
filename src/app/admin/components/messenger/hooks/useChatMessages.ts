"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessage } from "@/app/admin/hooks/useChatRealtime";

export interface ChatRoomDetail {
  id: string;
  company_id: string;
  room_type: "dm" | "group";
  name: string | null;
  description: string | null;
  created_by: string;
  members: {
    staff_id: string;
    role: string;
    joined_at: string;
    staff: {
      id: string;
      name: string;
      email: string;
      job_title: string | null;
    };
  }[];
}

interface UseChatMessagesReturn {
  room: ChatRoomDetail | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => void;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (messageId: string) => void;
}

export function useChatMessages(roomId: string): UseChatMessagesReturn {
  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const isLoadingMoreRef = useRef(false);

  // 채팅방 정보 및 초기 메시지 로드
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 채팅방 정보
      const roomResponse = await fetch(`/api/admin/chat/rooms/${roomId}`);
      const roomData = await roomResponse.json();

      if (!roomResponse.ok) {
        throw new Error(roomData.error || "채팅방을 불러올 수 없습니다.");
      }

      setRoom(roomData.room);

      // 메시지 목록
      const messagesResponse = await fetch(
        `/api/admin/chat/rooms/${roomId}/messages?limit=50`
      );
      const messagesData = await messagesResponse.json();

      if (!messagesResponse.ok) {
        throw new Error(messagesData.error || "메시지를 불러올 수 없습니다.");
      }

      setMessages(messagesData.messages || []);
      setHasMore(messagesData.hasMore || false);
      cursorRef.current = messagesData.nextCursor;
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 이전 메시지 더 불러오기
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMoreRef.current || !cursorRef.current) return;

    try {
      isLoadingMoreRef.current = true;

      const response = await fetch(
        `/api/admin/chat/rooms/${roomId}/messages?limit=50&cursor=${cursorRef.current}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "메시지를 불러올 수 없습니다.");
      }

      setMessages((prev) => [...(data.messages || []), ...prev]);
      setHasMore(data.hasMore || false);
      cursorRef.current = data.nextCursor;
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [roomId, hasMore]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsSending(true);

        const response = await fetch(`/api/admin/chat/rooms/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "메시지 전송에 실패했습니다.");
        }

        // 낙관적 업데이트 대신 실시간으로 받으므로 여기서는 추가하지 않음
      } catch (err) {
        console.error("Send message error:", err);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [roomId]
  );

  // 읽음 처리
  const markAsRead = useCallback(async () => {
    try {
      await fetch(`/api/admin/chat/rooms/${roomId}/read`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  }, [roomId]);

  // 실시간 메시지 추가 (외부에서 호출)
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      // 중복 방지
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  // 메시지 삭제 (외부에서 호출)
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  return {
    room,
    messages,
    isLoading,
    isSending,
    hasMore,
    error,
    loadMore,
    sendMessage,
    markAsRead,
    addMessage,
    removeMessage,
  };
}
