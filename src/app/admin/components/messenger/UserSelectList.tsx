"use client";

import { ChatUser } from "./hooks/useChatUsers";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSelectListProps {
  users: ChatUser[];
  selectedIds: string[];
  onSelect: (userId: string) => void;
  isLoading: boolean;
  multiSelect?: boolean;
}

export function UserSelectList({
  users,
  selectedIds,
  onSelect,
  isLoading,
  multiSelect = false,
}: UserSelectListProps) {
  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-slate-400">대화 가능한 직원이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
      {users.map((user) => {
        const isSelected = selectedIds.includes(user.id);

        return (
          <div
            key={user.id}
            onClick={() => onSelect(user.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
              "hover:bg-slate-50 border-b border-slate-100 last:border-b-0",
              isSelected && "bg-blue-50"
            )}
          >
            {/* 아바타 */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.name.charAt(0)}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.job_title || user.role}
              </p>
            </div>

            {/* 선택 표시 */}
            {multiSelect ? (
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
                  isSelected
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-slate-300"
                )}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            ) : (
              isSelected && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
