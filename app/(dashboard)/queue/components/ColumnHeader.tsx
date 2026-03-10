"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"

type FilterValue = Set<string> | "all"

interface ColumnHeaderProps {
  label: string
  colKey: string
  sortConfig: { key: string | null; dir: "asc" | "desc" | null }
  onSort: (key: string | null, dir: "asc" | "desc" | null) => void
  allValues: string[]
  colFilters: Record<string, FilterValue>
  onFilterChange: (colKey: string, value: FilterValue) => void
}

export function ColumnHeader({
  label,
  colKey,
  sortConfig,
  onSort,
  allValues,
  colFilters,
  onFilterChange,
}: ColumnHeaderProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const isActive = sortConfig.key === colKey
  const dir = isActive ? sortConfig.dir : null
  const filterVal = colFilters[colKey]
  const hasFilter = filterVal !== undefined && filterVal !== "all"

  const selected: Set<string> = filterVal instanceof Set ? filterVal : new Set(allValues)
  const filteredVals = search
    ? allValues.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : allValues
  const allSelected = allValues.every((v) => selected.has(v))

  const toggle = useCallback(
    (val: string) => {
      const next = new Set(selected)
      if (next.has(val)) next.delete(val)
      else next.add(val)
      onFilterChange(colKey, next.size === allValues.length ? "all" : next)
    },
    [selected, allValues, colKey, onFilterChange],
  )

  const toggleAll = useCallback(() => {
    onFilterChange(colKey, allSelected ? new Set<string>() : "all")
  }, [allSelected, colKey, onFilterChange])

  const sortIcon = isActive && dir === "asc" ? "\u25B2" : isActive && dir === "desc" ? "\u25BC" : "\u2304"

  return (
    <th className="relative select-none px-4 py-2.5 text-left">
      <div
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex cursor-pointer items-center gap-[5px] text-[10px] font-bold uppercase tracking-[0.08em] ${
          isActive || hasFilter ? "text-[var(--brand-primary)]" : "text-gray-400"
        }`}
        data-testid={`col-header-${colKey}`}
      >
        {label}
        <span className="text-[9px] opacity-70">{sortIcon}</span>
        {hasFilter && (
          <span className="inline-block size-1.5 rounded-full bg-[var(--brand-accent)]" />
        )}
      </div>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+2px)] z-[200] w-[200px] overflow-hidden rounded border border-border bg-white shadow-lg">
            {/* Sort buttons */}
            <div className="flex gap-1.5 border-b border-border px-3 py-2">
              {([["asc", "\u25B2 A \u2192 Z"], ["desc", "\u25BC Z \u2192 A"]] as const).map(
                ([d, lbl]) => (
                  <button
                    key={d}
                    onClick={() => onSort(colKey, d)}
                    className={`flex-1 rounded-[3px] border px-1.5 py-[5px] text-[10px] font-semibold tracking-[0.04em] ${
                      isActive && dir === d
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                        : "border-border bg-white text-[var(--brand-primary)]"
                    }`}
                    data-testid={`sort-${colKey}-${d}`}
                  >
                    {lbl}
                  </button>
                ),
              )}
            </div>

            {/* Value search */}
            <div className="border-b border-border px-3 pb-1 pt-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search values..."
                onClick={(e) => e.stopPropagation()}
                className="h-7 text-[11px]"
                data-testid={`filter-search-${colKey}`}
              />
            </div>

            {/* Select All */}
            <div
              onClick={(e) => {
                e.stopPropagation()
                toggleAll()
              }}
              className="flex cursor-pointer items-center gap-2 border-b border-border bg-gray-50 px-3 py-[7px]"
              data-testid={`filter-select-all-${colKey}`}
            >
              <div
                className="flex size-[13px] shrink-0 items-center justify-center rounded-sm border"
                style={{
                  borderColor: allSelected ? "var(--brand-primary)" : "var(--border)",
                  background: allSelected ? "var(--brand-primary)" : "white",
                }}
              >
                {allSelected && <span className="text-[9px] leading-none text-white">&check;</span>}
                {!allSelected && selected.size > 0 && (
                  <span className="text-[9px] leading-none text-[var(--brand-primary)]">&mdash;</span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-[var(--brand-primary)]">Select All</span>
            </div>

            {/* Value list */}
            <div className="max-h-[180px] overflow-y-auto">
              {filteredVals.map((val) => {
                const checked = selected.has(val)
                return (
                  <div
                    key={val}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(val)
                    }}
                    className="flex cursor-pointer items-center gap-2 px-3 py-[7px] transition-colors duration-100 hover:bg-gray-50"
                  >
                    <div
                      className="flex size-[13px] shrink-0 items-center justify-center rounded-sm border"
                      style={{
                        borderColor: checked ? "var(--brand-primary)" : "var(--border)",
                        background: checked ? "var(--brand-primary)" : "white",
                      }}
                    >
                      {checked && <span className="text-[9px] leading-none text-white">&check;</span>}
                    </div>
                    <span className="truncate text-[11px] text-gray-700">{val}</span>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-1.5 border-t border-border px-3 py-[7px]">
              <button
                onClick={() => {
                  onFilterChange(colKey, "all")
                  onSort(null, null)
                }}
                className="cursor-pointer border-none bg-transparent text-[10px] font-semibold text-gray-400"
                data-testid={`filter-clear-${colKey}`}
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-sm border-none bg-[var(--brand-primary)] px-2.5 py-1 text-[10px] font-bold text-white"
                data-testid={`filter-done-${colKey}`}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </th>
  )
}
