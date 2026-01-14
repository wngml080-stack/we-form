"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatRoomList } from "./ChatRoomList";
import { ChatRoom } from "./ChatRoom";
import { NewChatModal } from "./NewChatModal";
import { useChatRooms } from "./hooks/useChatRooms";
import { useChatRoomsRealtime } from "@/app/admin/hooks/useChatRoomsRealtime";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessengerPanelProps {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
}

export function MessengerPanel({ onClose, onUnreadChange }: MessengerPanelProps) {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const { rooms, isLoading, refetch, totalUnread } = useChatRooms();

  // 채팅방 목록 실시간 구독
  useChatRoomsRealtime({
    companyId: user?.company_id || null,
    userId: user?.id || "",
    onRoomUpdated: refetch,
  });

  // 안읽은 메시지 수 전달
  useEffect(() => {
    onUnreadChange(totalUnread);
  }, [totalUnread, onUnreadChange]);

  const handleRoomCreated = useCallback(
    (roomId: string) => {
      setIsNewChatOpen(false);
      setSelectedRoomId(roomId);
      refetch();
    },
    [refetch]
  );

  const handleBack = useCallback(() => {
    setSelectedRoomId(null);
    refetch();
  }, [refetch]);

  return (
    <div className="absolute bottom-20 right-0 w-[380px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
      {selectedRoomId ? (
        // 채팅방 화면
        <ChatRoom roomId={selectedRoomId} onBack={handleBack} onClose={onClose} />
      ) : (
        // 채팅방 목록 화면
        <>
          {/* 헤더 */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">메신저</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Internal Messenger
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-xl h-9 w-9"
              onClick={() => setIsNewChatOpen(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* 채팅방 목록 */}
          <ChatRoomList
            rooms={rooms}
            isLoading={isLoading}
            currentUserId={user?.id || ""}
            onSelectRoom={setSelectedRoomId}
          />
        </>
      )}

      {/* 새 채팅 모달 */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreated={handleRoomCreated}
      />
    </div>
  );
}
