/**
 * 칸반 보드 유틸리티 함수
 */

import type { ConsultationFormData } from "@/app/admin/consultation/types";
import type { BoardColumn } from "../types/kanban";

const BASE_STORAGE_KEY = "pt-members-kanban-data";

/**
 * staff별 storage key 생성
 */
export function getStorageKey(userRole: string, userId?: string): string {
  if (userRole === "staff" && userId) {
    return `${BASE_STORAGE_KEY}-${userId}`;
  }
  return BASE_STORAGE_KEY;
}

/**
 * 선택된 목표 유형 가져오기
 */
export function getSelectedGoalType(data?: ConsultationFormData): string {
  if (!data) return "";
  if (data.dietGoal.selected) return "다이어트형";
  if (data.rehabGoal.selected) return "재활/체형교정형";
  if (data.strengthGoal.selected) return "근력/퍼포먼스형";
  if (data.habitGoal.selected) return "습관개선형";
  if (data.otherGoal.selected) return "기타";
  return "";
}

/**
 * 상담 폼 완료율 계산
 */
export function calculateFormCompletion(data?: ConsultationFormData): number {
  if (!data) return 0;

  let filled = 0;
  let total = 0;

  // 기본 정보 (5개 필드)
  total += 5;
  if (data.memberName) filled++;
  if (data.phoneNumber) filled++;
  if (data.assignedTrainer) filled++;
  if (data.consultationType) filled++;
  if (data.firstMeetingDate) filled++;

  // 방문 경로 (최소 1개 선택 여부)
  total += 1;
  const hasVisitSource =
    data.visitSource.naverPlace ||
    data.visitSource.instagram ||
    data.visitSource.blog ||
    data.visitSource.referral ||
    data.visitSource.walkIn ||
    data.visitSource.other;
  if (hasVisitSource) filled++;

  // 운동 경험 (최소 1개 선택 여부)
  total += 1;
  const hasExperience = data.exerciseExperiences.some((exp) => exp.hasExperience);
  if (hasExperience) filled++;

  // 목표 설정 (1개 선택 필수)
  total += 1;
  const hasGoal =
    data.dietGoal.selected ||
    data.rehabGoal.selected ||
    data.strengthGoal.selected ||
    data.habitGoal.selected ||
    data.otherGoal.selected;
  if (hasGoal) filled++;

  // 운동 가능 시간 (주 몇 회 선택)
  total += 1;
  if (data.availableTime.preferredWeeklyCount > 0) filled++;

  return Math.round((filled / total) * 100);
}

/**
 * LocalStorage에서 칸반 데이터 로드
 */
export function loadFromStorage(storageKey: string): BoardColumn[] | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load kanban data:", error);
  }
  return null;
}

/**
 * LocalStorage에 칸반 데이터 저장
 */
export function saveToStorage(storageKey: string, columns: BoardColumn[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  } catch (error) {
    console.error("Failed to save kanban data:", error);
  }
}

/**
 * 초기 컬럼 데이터
 */
export function getInitialColumns(): BoardColumn[] {
  return [
    {
      id: "new",
      title: "신규",
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      cards: [{ id: "1", title: "신규 상담기록지 양식", icon: "file", isTemplate: true }],
    },
    {
      id: "ot",
      title: "OT 진행중",
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      cards: [{ id: "2", title: "OT 기록지 양식", icon: "clipboard", isTemplate: true }],
    },
    {
      id: "pt",
      title: "PT 진행중",
      color: "bg-violet-500",
      bgColor: "bg-violet-50",
      cards: [{ id: "3", title: "PT 기록지 양식", icon: "dumbbell", isTemplate: true }],
    },
    {
      id: "complete",
      title: "완료",
      color: "bg-slate-400",
      bgColor: "bg-slate-50",
      cards: [],
    },
  ];
}
