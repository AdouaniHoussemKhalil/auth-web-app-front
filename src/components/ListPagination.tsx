import {
  getPaginationRange,
  PAGINATION_ELLIPSIS,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@quickadui/data";

export interface ListPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/** Pagination d'une liste ; rien n'est affiché s'il n'y a qu'une page. */
export function ListPagination({ page, total, pageSize, onPageChange }: ListPaginationProps) {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;

  return (
    <Pagination aria-label="Pagination" className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-label="Page précédente"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          />
        </PaginationItem>
        {getPaginationRange(page, pageCount).map((item, index) =>
          item === PAGINATION_ELLIPSIS ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={item === page}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            aria-label="Page suivante"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
