/**
 * 리뉴얼 관련 유틸리티 함수
 */

import type { ActivityStatus, RenewalMember, ExpiryType } from '../types/renewal';

// 활동 상태 라벨
export const activityStatusLabels: Record<ActivityStatus, string> = {
  absent: '부재',
  rejected: '거절',
  will_register: '등록예정',
  considering: '고민중',
  contacted: '연락완료',
  other: '기타'
};

// 활동 상태 색상
export const activityStatusColors: Record<ActivityStatus, string> = {
  absent: 'bg-slate-100 text-slate-600',
  rejected: 'bg-rose-100 text-rose-600',
  will_register: 'bg-emerald-100 text-emerald-600',
  considering: 'bg-amber-100 text-amber-600',
  contacted: 'bg-blue-100 text-blue-600',
  other: 'bg-purple-100 text-purple-600'
};

/**
 * 만기 분류 함수
 */
export function getExpiryType(endDate: string): ExpiryType {
  const today = new Date();
  const end = new Date(endDate);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  if (end < thisMonthStart) {
    return 'expired';
  }
  if (end >= thisMonthStart && end <= thisMonthEnd) {
    return 'this_month';
  }
  if (end >= nextMonthStart && end <= nextMonthEnd) {
    return 'next_month';
  }
  return 'after_next_month';
}

/**
 * 만기 분류 라벨
 */
export function getExpiryTypeLabel(type: ExpiryType): string {
  switch (type) {
    case 'this_month':
      return '당월만기';
    case 'next_month':
      return '익월만기';
    case 'after_next_month':
      return '익월이외';
    case 'expired':
      return '만료자';
  }
}

/**
 * D-day 계산 함수
 */
export function getDday(endDate: string): { text: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: 'D-Day', color: 'text-rose-600 font-black' };
  } else if (diffDays > 0) {
    return {
      text: `D-${diffDays}`,
      color: diffDays <= 7 ? 'text-rose-500' : diffDays <= 30 ? 'text-amber-500' : 'text-slate-500'
    };
  } else {
    return { text: `D+${Math.abs(diffDays)}`, color: 'text-slate-400' };
  }
}

/**
 * 현재 활동 상태 계산
 */
export function getCurrentActivityStatus(member: RenewalMember): { label: string; color: string } {
  const activities = [member.activity4, member.activity3, member.activity2, member.activity1];

  for (const activity of activities) {
    if (activity?.status) {
      return {
        label: activityStatusLabels[activity.status],
        color: activityStatusColors[activity.status]
      };
    }
  }

  return { label: '미접촉', color: 'bg-slate-50 text-slate-400' };
}
