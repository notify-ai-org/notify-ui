import React from 'react';

interface PaginatedTableProps {
  children: React.ReactNode;
  pageSize?: number;
}

export const PaginatedTable = ({ children, pageSize = 5 }: PaginatedTableProps ) => {
  const [page, setPage] = React.useState(1);

  const prevPage = () => setPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setPage((prev) => Math.min(prev + 1, pageSize));

  return (
    <div>
      {children}
      <div>
        <button type="button" onClick={prevPage} disabled={page <= 1}>
          Previous
        </button>
        <span>
          {page} to {page + pageSize}
        </span>
        <button type="button" onClick={nextPage} disabled={page >= pageSize}>
          Next
        </button>
      </div>
    </div>
  );
};