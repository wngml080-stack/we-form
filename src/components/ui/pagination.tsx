import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
}

/**
 * 페이지네이션 UI 컴포넌트
 *
 * @example
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 *   totalCount={500}
 *   pageSize={50}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // 표시할 페이지 번호 계산 (최대 7개: 1 ... 4 5 6 ... 10)
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    // 항상 첫 페이지
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // 현재 페이지 주변
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // 항상 마지막 페이지
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-2">
      {/* 왼쪽: 전체 개수 정보 */}
      <div className="text-sm text-muted-foreground">
        {totalCount !== undefined && pageSize !== undefined && (
          <span>
            총 <strong>{totalCount.toLocaleString()}</strong>건
            {totalPages > 1 && (
              <>
                {' '}· 페이지 {currentPage} / {totalPages}
              </>
            )}
          </span>
        )}
      </div>

      {/* 오른쪽: 페이지 버튼 */}
      <div className="flex items-center gap-1">
        {/* 이전 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 페이지 번호 */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="min-w-[36px]"
            >
              {pageNum}
            </Button>
          );
        })}

        {/* 다음 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
