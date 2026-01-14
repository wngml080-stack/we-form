"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChatRoomMember {
  staff_id: string;
  role: string;
  staff: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ChatRoom {
  id: string;
  company_id: string;
  room_type: "dm" | "group";
  name: string | null;
  description: string | null;
  created_by: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
  members: ChatRoomMember[];
  unread_count: number;
}

interface UseChatRoomsReturn {
  rooms: ChatRoom[];
  isLoading: boolean;
  error: string | null;
  totalUnread: number;
  refetch: () => void;
}

export function useChatRooms(): UseChatRoomsReturn {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/chat/rooms");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "채팅방 목록을 불러올 수 없습니다.");
      }

      setRooms(data.rooms || []);
      setTotalUnread(data.totalUnread || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    isLoading,
    error,
    totalUnread,
    refetch: fetchRooms,
  };
}
