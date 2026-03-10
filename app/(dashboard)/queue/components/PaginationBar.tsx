"use client"

import { useMemo } from "react"

interface PaginationBarProps {
  total: number
  pageSize: number
  page: number
  onPageSize: (n: number) => void
  onPage: (n: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 15, 25, 30] as const

export function PaginationBar({ total, pageSize, page, onPageSize, onPage }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pages = useMemo(() => {
    const result: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i)
    } else {
      result.push(1)
      if (page > 3) result.push("...")
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) result.push(i)
      if (page < totalPages - 2) result.push("...")
      result.push(totalPages)
    }
    return result
  }, [totalPages, page])

  const btnClass =
    "flex min-w-[26px] h-[26px] items-center justify-center border border-border bg-white text-[10px] font-medium cursor-pointer transition-all duration-100 font-[var(--brand-font-body)] hover:border-[var(--brand-primary)]"
  const activeClass =
    "flex min-w-[26px] h-[26px] items-center justify-center border text-[10px] font-bold cursor-pointer transition-all duration-100 font-[var(--brand-font-body)] bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
  const disabledClass =
    "flex min-w-[26px] h-[26px] items-center justify-center border border-border bg-white text-[10px] font-medium opacity-35 cursor-default font-[var(--brand-font-body)]"

  return (
    <div
      className="flex items-center justify-between border-t border-border bg-[#FAFAF9] px-4 py-2.5"
      data-testid="pagination-bar"
    >
      {/* Left: count */}
      <span className="text-[10px] text-muted-foreground">
        {total === 0 ? "No results" : `${start}\u2013${end} of ${total}`}
      </span>

      {/* Center: page buttons */}
      <div className="flex gap-[3px]">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className={page === 1 ? disabledClass : btnClass}
          data-testid="pagination-prev"
        >
          &lsaquo;
        </button>
        {pages.map((p, i) =>
          typeof p === "string" ? (
            <span key={`ellipsis-${i}`} className="flex min-w-[26px] h-[26px] items-center justify-center text-[10px] text-muted-foreground">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={p === page ? activeClass : btnClass}
              data-testid={`pagination-page-${p}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className={page === totalPages ? disabledClass : btnClass}
          data-testid="pagination-next"
        >
          &rsaquo;
        </button>
      </div>

      {/* Right: rows per page */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.06em] text-muted-foreground">Rows</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSize(Number(e.target.value))
            onPage(1)
          }}
          className="cursor-pointer border border-border bg-white px-1.5 py-[3px] text-[10px] font-[var(--brand-font-body)] text-[var(--brand-primary)] outline-none focus:border-[var(--brand-primary)]"
          data-testid="pagination-page-size"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
