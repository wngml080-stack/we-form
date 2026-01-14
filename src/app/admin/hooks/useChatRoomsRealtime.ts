"use client";

import { useEffect, useRef } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseChatRoomsRealtimeProps {
  companyId: string | null;
  userId: string;
  onRoomUpdated: () => void;
}

export function useChatRoomsRealtime({
  companyId,
  userId,
  onRoomUpdated,
}: UseChatRoomsRealtimeProps) {
  const supabase = createSupabaseClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!companyId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat_rooms:${companyId}`)
      // 채팅방 업데이트 감지 (새 메시지로 인한 last_message_at 변경)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_rooms",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          onRoomUpdated();
        }
      )
      // 새 채팅방 생성 감지
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_rooms",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          onRoomUpdated();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [companyId, userId, supabase, onRoomUpdated]);
}
