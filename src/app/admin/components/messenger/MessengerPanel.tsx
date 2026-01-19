"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatRoomList } from "./ChatRoomList";
import { ChatRoom } from "./ChatRoom";
import { StaffList } from "./StaffList";
import { NewChatModal } from "./NewChatModal";
import { useChatRooms } from "./hooks/useChatRooms";
import { useChatRoomsRealtime } from "@/app/admin/hooks/useChatRoomsRealtime";
import { Plus, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabType = "chats" | "staff";

interface MessengerPanelProps {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
}

export function MessengerPanel({ onClose, onUnreadChange }: MessengerPanelProps) {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chats");

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
      setActiveTab("chats");
      refetch();
    },
    [refetch]
  );

  const handleBack = useCallback(() => {
    setSelectedRoomId(null);
    refetch();
  }, [refetch]);

  const handleStartChatFromStaff = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId);
      setActiveTab("chats");
      refetch();
    },
    [refetch]
  );

  return (
    <div className="absolute bottom-20 right-0 w-[380px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
      {selectedRoomId ? (
        // 채팅방 화면
        <ChatRoom roomId={selectedRoomId} onBack={handleBack} onClose={onClose} />
      ) : (
        // 메인 화면 (탭)
        <>
          {/* 헤더 */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-white !text-white tracking-tight">WE:FORM 메신저</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                  Internal Communication
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

            {/* 탭 */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("chats")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === "chats"
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                채팅
                {totalUnread > 0 && (
                  <span className="min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === "staff"
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <Users className="w-4 h-4" />
                직원
              </button>
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          {activeTab === "chats" ? (
            <ChatRoomList
              rooms={rooms}
              isLoading={isLoading}
              currentUserId={user?.id || ""}
              onSelectRoom={setSelectedRoomId}
            />
          ) : (
            <StaffList
              currentUserId={user?.id || ""}
              onStartChat={handleStartChatFromStaff}
            />
          )}
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
