"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MessengerBubble } from "./MessengerBubble";
import { MessengerPanel } from "./MessengerPanel";

export function MessengerWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // 메신저 접근 가능 조건:
  // 1. system_admin은 무조건 접근 가능
  // 2. company_admin이면서 gym_id가 없는 본사 직원
  const canAccessMessenger =
    user &&
    (user.role === "system_admin" ||
      (user.role === "company_admin" && (user.gym_id === "" || user.gym_id === null)));

  const handleUnreadChange = useCallback((count: number) => {
    setTotalUnread(count);
  }, []);

  if (!canAccessMessenger) return null;

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
