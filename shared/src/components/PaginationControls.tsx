import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationControls({
  page,
  totalPages,
  onChange,
  disabled = false,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const visiblePages = Math.min(totalPages, 5);
  const start = Math.min(Math.max(page - 2, 0), Math.max(totalPages - visiblePages, 0));

  return (
    <div className="pagination" aria-label="Table pagination">
      <button
        className="page-btn"
        aria-label="Previous page"
        disabled={disabled || page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: visiblePages }).map((_, index) => {
        const nextPage = start + index;
        return (
          <button
            key={nextPage}
            className={`page-btn${nextPage === page ? ' active' : ''}`}
            aria-current={nextPage === page ? 'page' : undefined}
            disabled={disabled}
            onClick={() => onChange(nextPage)}
          >
            {nextPage + 1}
          </button>
        );
      })}
      <button
        className="page-btn"
        aria-label="Next page"
        disabled={disabled || page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
