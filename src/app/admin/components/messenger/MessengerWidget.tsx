"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MessengerBubble } from "./MessengerBubble";
import { MessengerPanel } from "./MessengerPanel";

export function MessengerWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // 일단 로그인한 사용자면 모두 표시 (테스트용)
  // TODO: 나중에 HQ staff 조건 복원
  const isHQStaff = !!user;

  // 디버깅용 로그
  console.log("[Messenger] user:", user);
  console.log("[Messenger] isHQStaff:", isHQStaff);

  const handleUnreadChange = useCallback((count: number) => {
    setTotalUnread(count);
  }, []);

  if (!isHQStaff) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 채팅 패널 */}
      {isOpen && (
        <MessengerPanel
          onClose={() => setIsOpen(false)}
          onUnreadChange={handleUnreadChange}
        />
      )}

      {/* 플로팅 버블 버튼 */}
      <MessengerBubble
        isOpen={isOpen}
        unreadCount={totalUnread}
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
}
