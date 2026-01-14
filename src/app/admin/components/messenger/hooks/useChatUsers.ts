"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  job_title: string | null;
}

interface UseChatUsersReturn {
  users: ChatUser[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChatUsers(): UseChatUsersReturn {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/chat/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "사용자 목록을 불러올 수 없습니다.");
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}
