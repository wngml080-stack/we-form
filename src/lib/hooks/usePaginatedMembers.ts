import useSWR from 'swr';
import { useState, useEffect } from 'react';

interface UsePaginatedMembersParams {
  gymId: string | null;
  companyId: string | null;
  trainerId?: string | null; // For staff role
  search?: string;
  status?: string;
  page?: number;
  enabled?: boolean;
}

interface MembershipData {
  id: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface MemberData {
  id: string;
  name: string;
  phone: string;
  birth_date: string | null;
  gender: string | null;
  status: string;
  created_at: string;
  trainer_id: string | null;
  member_memberships: MembershipData[];
  activeMembership?: MembershipData;
  totalMemberships?: number;
}

interface PaginatedMembersResponse {
  members: MemberData[];
  count: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  filter: {
    gymId: string | null;
    companyId: string | null;
    trainerId?: string | null;
    status: string;
    search: string;
  };
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * 페이지네이션이 적용된 회원 데이터를 가져오는 커스텀 훅
 *
 * SWR을 사용하여 자동 캐싱 및 재검증 지원
 *
 * @example
 * const { members, isLoading, error, totalPages, currentPage, mutate } =
 *   usePaginatedMembers({
 *     gymId,
 *     companyId,
 *     search: searchQuery,
 *     status: statusFilter,
 *     page: currentPage
 *   });
 */
export function usePaginatedMembers({
  gymId,
  companyId,
  trainerId,
  search = '',
  status = 'all',
  page = 1,
  enabled = true
}: UsePaginatedMembersParams) {
  // URL 생성
  const getUrl = () => {
    if (!gymId || !companyId || !enabled) return null;

    const params = new URLSearchParams({
      gym_id: gymId,
      company_id: companyId,
      page: page.toString(),
      status,
    });

    if (search.trim()) {
      params.append('search', search.trim());
    }

    if (trainerId) {
      params.append('trainer_id', trainerId);
    }

    return `/api/admin/members?${params.toString()}`;
  };

  // SWR로 데이터 페칭
  const { data, error, isLoading, mutate } = useSWR<PaginatedMembersResponse>(
    getUrl(),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 캐싱
      keepPreviousData: true, // 페이지 전환 시 이전 데이터 유지
    }
  );

  // 회원권 정보를 집계 (activeMembership 추가)
  const membersWithMemberships = (data?.members || []).map((member: MemberData) => {
    const memberships = member.member_memberships || [];
    const activeMembership = memberships.find(m => m.status === 'active');

    return {
      ...member,
      activeMembership,
      totalMemberships: memberships.length
    };
  });

  return {
    members: membersWithMemberships,
    isLoading,
    error,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 1,
    pageSize: data?.pageSize || 50,
    totalCount: data?.count || 0,
    mutate, // 데이터 갱신 함수
  };
}
