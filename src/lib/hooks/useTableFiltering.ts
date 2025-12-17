import { useMemo } from 'react';

/**
 * 테이블 데이터 필터링 훅 (메모이제이션 적용)
 *
 * @example
 * const filteredData = useTableFiltering(
 *   members,
 *   searchQuery,
 *   (member, query) => member.name.includes(query)
 * );
 */
export function useTableFiltering<T>(
  data: T[],
  searchQuery: string,
  filterFn: (item: T, query: string) => boolean
): T[] {
  return useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return data.filter(item => filterFn(item, query));
  }, [data, searchQuery, filterFn]);
}

/**
 * 다중 필터 적용 훅
 *
 * @example
 * const filtered = useMultipleFilters(members, {
 *   status: (m) => statusFilter === 'all' || m.status === statusFilter,
 *   search: (m) => !searchQuery || m.name.includes(searchQuery),
 * });
 */
export function useMultipleFilters<T>(
  data: T[],
  filters: Record<string, (item: T) => boolean>
): T[] {
  return useMemo(() => {
    return data.filter(item => {
      return Object.values(filters).every(filterFn => filterFn(item));
    });
  }, [data, filters]);
}

/**
 * 검색 + 상태 필터 (회원/직원 관리에서 자주 사용하는 패턴)
 *
 * @example
 * const filtered = useSearchAndStatusFilter(
 *   members,
 *   searchQuery,
 *   statusFilter,
 *   {
 *     searchFields: ['name', 'phone'],
 *     statusField: 'status',
 *     allStatusValue: 'all',
 *   }
 * );
 */
export interface SearchAndStatusOptions<T> {
  searchFields: (keyof T)[];
  statusField: keyof T;
  allStatusValue?: string;
}

export function useSearchAndStatusFilter<T extends Record<string, any>>(
  data: T[],
  searchQuery: string,
  statusFilter: string,
  options: SearchAndStatusOptions<T>
): T[] {
  return useMemo(() => {
    let filtered = [...data];

    // 상태 필터 적용
    if (statusFilter !== (options.allStatusValue || 'all')) {
      filtered = filtered.filter(
        item => item[options.statusField] === statusFilter
      );
    }

    // 검색 필터 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return options.searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        });
      });
    }

    return filtered;
  }, [data, searchQuery, statusFilter, options]);
}

/**
 * 정렬 + 필터링 조합
 *
 * @example
 * const sorted = useSortedData(
 *   filteredMembers,
 *   'created_at',
 *   'desc'
 * );
 */
export type SortOrder = 'asc' | 'desc';

export function useSortedData<T extends Record<string, any>>(
  data: T[],
  sortBy: keyof T,
  sortOrder: SortOrder = 'asc'
): T[] {
  return useMemo(() => {
    const sorted = [...data];

    sorted.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      // null/undefined 처리
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // 날짜 비교
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // 문자열 비교
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // 숫자 비교
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [data, sortBy, sortOrder]);
}

/**
 * 페이지네이션 적용 훅
 *
 * @example
 * const paginatedData = usePagination(filteredMembers, page, 50);
 */
export function usePagination<T>(
  data: T[],
  page: number,
  pageSize: number
): {
  paginatedData: T[];
  totalPages: number;
  totalCount: number;
} {
  return useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      paginatedData: data.slice(start, end),
      totalPages: Math.ceil(data.length / pageSize),
      totalCount: data.length,
    };
  }, [data, page, pageSize]);
}
