"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserSelectList } from "./UserSelectList";
import { useChatUsers } from "./hooks/useChatUsers";
import { User, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

type ChatType = "dm" | "group";

export function NewChatModal({ isOpen, onClose, onCreated }: NewChatModalProps) {
  const { user } = useAuth();
  const { users, isLoading: isLoadingUsers } = useChatUsers();
  const [chatType, setChatType] = useState<ChatType>("dm");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 본인 제외
  const availableUsers = users.filter((u) => u.id !== user?.id);

  const handleSelectUser = (userId: string) => {
    if (chatType === "dm") {
      setSelectedUserIds([userId]);
    } else {
      setSelectedUserIds((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const handleCreate = async () => {
    if (selectedUserIds.length === 0) {
      setError("대화 상대를 선택해주세요.");
      return;
    }

    if (chatType === "group" && !groupName.trim()) {
      setError("그룹 이름을 입력해주세요.");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      let response;

      if (chatType === "dm") {
        response = await fetch("/api/admin/chat/rooms/dm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_staff_id: selectedUserIds[0] }),
        });
      } else {
        response = await fetch("/api/admin/chat/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupName.trim(),
            member_ids: selectedUserIds,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "채팅방 생성에 실패했습니다.");
      }

      onCreated(data.room.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setChatType("dm");
    setSelectedUserIds([]);
    setGroupName("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-bold">새 대화</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          {/* 대화 유형 선택 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setChatType("dm");
                setSelectedUserIds([]);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all",
                chatType === "dm"
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">1:1 대화</span>
            </button>
            <button
              onClick={() => {
                setChatType("group");
                setSelectedUserIds([]);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all",
                chatType === "group"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">그룹 대화</span>
            </button>
          </div>

          {/* 그룹 이름 (그룹 선택시) */}
          {chatType === "group" && (
            <div className="mb-4">
              <Input
                placeholder="그룹 이름을 입력하세요"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          {/* 사용자 목록 */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">
              {chatType === "dm"
                ? "대화할 상대를 선택하세요"
                : `참여자를 선택하세요 (${selectedUserIds.length}명 선택됨)`}
            </p>
            <UserSelectList
              users={availableUsers}
              selectedIds={selectedUserIds}
              onSelect={handleSelectUser}
              isLoading={isLoadingUsers}
              multiSelect={chatType === "group"}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleCreate}
              disabled={isCreating || selectedUserIds.length === 0}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "시작하기"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
