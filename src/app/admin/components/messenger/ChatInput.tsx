"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  isSending: boolean;
}

export function ChatInput({ onSend, onTyping, isSending }: ChatInputProps) {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 타이핑 상태 관리
  const handleChange = (value: string) => {
    setContent(value);

    // 타이핑 중 알림
    onTyping(true);

    // 2초 후 타이핑 종료 처리
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  // 텍스트 영역 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    // 타이핑 상태 종료
    onTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setContent("");
    await onSend(trimmedContent);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className={cn(
            "flex-1 min-h-[40px] max-h-[120px] resize-none rounded-2xl border-2 border-slate-200",
            "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none",
            "text-sm py-2.5 px-4 transition-all"
          )}
          disabled={isSending}
        />
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSending}
          className={cn(
            "h-10 w-10 p-0 rounded-xl shrink-0",
            "bg-gradient-to-br from-blue-500 to-blue-600",
            "hover:from-blue-600 hover:to-blue-700",
            "disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400"
          )}
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
