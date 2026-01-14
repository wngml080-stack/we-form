"use client";

import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessengerBubbleProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function MessengerBubble({
  isOpen,
  unreadCount,
  onClick,
}: MessengerBubbleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center relative",
        "hover:scale-110 active:scale-95",
        isOpen
          ? "bg-slate-800 rotate-90"
          : "bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] shadow-blue-300/50"
      )}
    >
      {isOpen ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <>
          <MessageCircle className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}
