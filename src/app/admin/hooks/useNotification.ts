"use client";

import { useCallback, useEffect, useState } from "react";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // 알림 권한 요청
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }, []);

  // 알림 표시
  const showNotification = useCallback(
    ({ title, body, icon, tag, onClick }: NotificationOptions) => {
      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return null;
      }

      // 현재 탭이 포커스되어 있으면 알림 표시 안함
      if (document.hasFocus()) {
        return null;
      }

      try {
        const notification = new Notification(title, {
          body,
          icon: icon || "/icon-192.png",
          tag,
          badge: "/icon-192.png",
        });

        if (onClick) {
          notification.onclick = () => {
            window.focus();
            onClick();
            notification.close();
          };
        }

        // 5초 후 자동 닫기
        setTimeout(() => notification.close(), 5000);

        return notification;
      } catch (error) {
        console.error("Failed to show notification:", error);
        return null;
      }
    },
    [permission]
  );

  // 채팅 알림
  const showChatNotification = useCallback(
    (senderName: string, message: string, roomId: string) => {
      return showNotification({
        title: `${senderName}님의 메시지`,
        body: message.length > 50 ? message.slice(0, 50) + "..." : message,
        tag: `chat-${roomId}`,
        onClick: () => {
          // 채팅방으로 이동하는 로직은 상위에서 처리
        },
      });
    },
    [showNotification]
  );

  // 알림음 재생
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // 사용자 상호작용 없이는 재생이 차단될 수 있음
      });
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  }, []);

  return {
    permission,
    requestPermission,
    showNotification,
    showChatNotification,
    playNotificationSound,
  };
}
