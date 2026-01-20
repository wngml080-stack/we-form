"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ReRegistrationData,
  ReRegistrationConsultation,
  MonthlyStats,
  WeeklyRoutine,
  initialReRegistrationData,
  calculateMonthlyStats,
  calculateCurrentStage,
  createInitialConsultation,
} from "../types";

const BASE_STORAGE_KEY = "re-registration-data";

// staff별 storage key 생성 (staff는 본인 ID 포함, 관리자는 기본 키 사용)
const getStorageKey = (userRole: string, userId?: string, gymId?: string | null): string => {
  let key = BASE_STORAGE_KEY;
  if (gymId) {
    key = `${key}-${gymId}`;
  }
  if (userRole === "staff" && userId) {
    key = `${key}-${userId}`;
  }
  return key;
};

interface UseReRegistrationDataProps {
  selectedGymId: string | null;
}

export function useReRegistrationData({
  selectedGymId,
}: UseReRegistrationDataProps) {
  const { user } = useAuth();
  const userRole = user?.role || "";
  const userId = user?.id;

  // staff별 storage key 계산
  const storageKey = useMemo(
    () => getStorageKey(userRole, userId, selectedGymId),
    [userRole, userId, selectedGymId]
  );

  const [data, setData] = useState<ReRegistrationData>(
    initialReRegistrationData
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // LocalStorage에서 데이터 로드
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;

    setIsLoading(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setData(JSON.parse(saved));
      } else {
        setData(initialReRegistrationData);
      }
    } catch (e) {
      console.error("Failed to load re-registration data:", e);
      setData(initialReRegistrationData);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [storageKey]);

  // 데이터 변경 시 LocalStorage에 저장
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined" || !storageKey) return;

    try {
      const updatedData = {
        ...data,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
    } catch (e) {
      console.error("Failed to save re-registration data:", e);
    }
  }, [data, isLoaded, storageKey]);

  // 재등록 대상자 필터링 (상태=진행중, 진행률>=70%, 재등록상담=미완료)
  const targetMembers = useMemo(() => {
    return data.consultations
      .filter((c) => c.progressPercentage >= 70 && !c.finalOutcome)
      .sort((a, b) => {
        // 만료일 오름차순 (진행률이 낮을수록 만료가 가까움)
        return a.progressPercentage - b.progressPercentage;
      });
  }, [data.consultations]);

  // 전체 상담 목록
  const allConsultations = useMemo(() => {
    return data.consultations.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [data.consultations]);

  // 상담 추가
  const addConsultation = useCallback(
    (
      consultation: Omit<
        ReRegistrationConsultation,
        "id" | "createdAt" | "updatedAt"
      >
    ) => {
      const now = new Date().toISOString();
      const newConsultation: ReRegistrationConsultation = {
        ...consultation,
        id: `consultation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        currentStage: calculateCurrentStage(consultation.progressPercentage),
        createdAt: now,
        updatedAt: now,
      };

      setData((prev) => ({
        ...prev,
        consultations: [...prev.consultations, newConsultation],
      }));

      return newConsultation;
    },
    []
  );

  // 상담 업데이트
  const updateConsultation = useCallback(
    (id: string, updates: Partial<ReRegistrationConsultation>) => {
      setData((prev) => ({
        ...prev,
        consultations: prev.consultations.map((c) =>
          c.id === id
            ? {
                ...c,
                ...updates,
                currentStage: updates.progressPercentage
                  ? calculateCurrentStage(updates.progressPercentage)
                  : c.currentStage,
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }));
    },
    []
  );

  // 상담 삭제
  const deleteConsultation = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      consultations: prev.consultations.filter((c) => c.id !== id),
    }));
  }, []);

  // 특정 상담 가져오기
  const getConsultation = useCallback(
    (id: string): ReRegistrationConsultation | undefined => {
      return data.consultations.find((c) => c.id === id);
    },
    [data.consultations]
  );

  // 월간 통계 계산
  const getMonthlyStats = useCallback(
    (month: string): MonthlyStats => {
      return calculateMonthlyStats(data.consultations, month);
    },
    [data.consultations]
  );

  // 현재 월 통계
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return getMonthlyStats(month);
  }, [getMonthlyStats]);

  // 이번 주 월요일 날짜 계산
  const getCurrentWeekStart = useCallback((): string => {
    const now = new Date();
    const monday = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().split("T")[0];
  }, []);

  // 주간 루틴 가져오기
  const getWeeklyRoutine = useCallback(
    (weekStart: string): WeeklyRoutine | null => {
      return data.weeklyRoutines.find((r) => r.weekStart === weekStart) || null;
    },
    [data.weeklyRoutines]
  );

  // 이번 주 루틴 가져오기
  const getCurrentWeekRoutine = useCallback((): WeeklyRoutine | null => {
    const weekStart = getCurrentWeekStart();
    return getWeeklyRoutine(weekStart);
  }, [getCurrentWeekStart, getWeeklyRoutine]);

  // 주간 루틴 업데이트
  const updateWeeklyRoutine = useCallback(
    (weekStart: string, updates: Partial<WeeklyRoutine>) => {
      setData((prev) => {
        const existingIndex = prev.weeklyRoutines.findIndex(
          (r) => r.weekStart === weekStart
        );

        if (existingIndex >= 0) {
          const newRoutines = [...prev.weeklyRoutines];
          newRoutines[existingIndex] = {
            ...newRoutines[existingIndex],
            ...updates,
          };
          return { ...prev, weeklyRoutines: newRoutines };
        }

        const newRoutine: WeeklyRoutine = {
          weekStart,
          mondayTasks: {
            checkTargetView: false,
            reviewExpiringList: false,
            scheduleConsultation: false,
            prepareData: false,
            memo: "",
          },
          fridayTasks: {
            summarizeResults: false,
            checkMissed: false,
            planNextWeek: false,
            memo: "",
          },
          ...updates,
        };

        return { ...prev, weeklyRoutines: [...prev.weeklyRoutines, newRoutine] };
      });
    },
    []
  );

  // 전체 데이터 초기화
  const resetData = useCallback(() => {
    setData(initialReRegistrationData);
  }, []);

  return {
    data,
    isLoading,

    // 재등록 대상자
    targetMembers,
    allConsultations,

    // 상담 CRUD
    addConsultation,
    updateConsultation,
    deleteConsultation,
    getConsultation,
    createInitialConsultation,

    // 통계
    getMonthlyStats,
    currentMonthStats,

    // 주간 루틴
    getCurrentWeekStart,
    getWeeklyRoutine,
    getCurrentWeekRoutine,
    updateWeeklyRoutine,

    // 전체 데이터 관리
    resetData,
    refreshData: () => setData({ ...data }),
  };
}
