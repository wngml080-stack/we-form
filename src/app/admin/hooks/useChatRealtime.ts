"use client";

import { useEffect, useCallback, useRef } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_deleted: boolean;
  sender?: { id: string; name: string; email: string };
}

interface UseChatRealtimeProps {
  roomId: string | null;
  userId: string;
  onNewMessage: (message: ChatMessage) => void;
  onMessageDeleted: (messageId: string) => void;
  onTypingUpdate?: (userId: string, isTyping: boolean) => void;
}

export function useChatRealtime({
  roomId,
  userId,
  onNewMessage,
  onMessageDeleted,
  onTypingUpdate,
}: UseChatRealtimeProps) {
  const supabase = createSupabaseClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // 기존 구독 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // 새 메시지 구독
    const channel = supabase
      .channel(`chat:${roomId}`)
      // 새 메시지 수신
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const message = payload.new as ChatMessage;

          // sender 정보 조회
          const { data: sender } = await supabase
            .from("staffs")
            .select("id, name, email")
            .eq("id", message.sender_id)
            .single();

          onNewMessage({
            ...message,
            sender: sender || undefined,
          });
        }
      )
      // 메시지 삭제 감지
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          if (updated.is_deleted) {
            onMessageDeleted(updated.id);
          }
        }
      )
      // 타이핑 상태 (Presence)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        Object.keys(state).forEach((key) => {
          const presence = state[key][0] as {
            typing?: boolean;
            user_id: string;
          };
          if (presence.user_id !== userId && onTypingUpdate) {
            onTypingUpdate(presence.user_id, presence.typing || false);
          }
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, typing: false });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, userId, supabase, onNewMessage, onMessageDeleted, onTypingUpdate]);

  // 타이핑 상태 전송 함수
  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (channelRef.current) {
        await channelRef.current.track({ user_id: userId, typing: isTyping });
      }
    },
    [userId]
  );

  return { sendTypingStatus };
}
