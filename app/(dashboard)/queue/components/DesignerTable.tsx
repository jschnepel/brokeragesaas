"use client"

import { useState, useMemo, useCallback } from "react"
import type { RequestDTO } from "@/lib/types"
import { Request } from "@/lib/models"
import { BRAND_COLORS } from "@/lib/config/brand"
import { ColumnHeader } from "./ColumnHeader"
import { DesignerTableRow } from "./DesignerTableRow"
import { PaginationBar } from "./PaginationBar"

interface DesignerTableProps {
  requests: RequestDTO[]
  currentUserId: string
  onSelectRequest: (r: RequestDTO) => void
  onCancel: (r: RequestDTO) => void
}

type SortDir = "asc" | "desc" | null
type FilterValue = Set<string> | "all"

const COL_DEFS = [
  { label: "#", colKey: "queueNumber" },
  { label: "Requester", colKey: "requesterName" },
  { label: "Designer", colKey: "designerName" },
  { label: "Material", colKey: "materialType" },
  { label: "Due", colKey: "dueDate" },
  { label: "SLA", colKey: "sla" },
  { label: "Status", colKey: "status" },
  { label: "Canva", colKey: "canva" },
  { label: "Comments", colKey: "comments" },
  { label: "", colKey: "cancel" },
] as const

function getColumnValue(r: RequestDTO, colKey: string): string {
  const req = Request.fromDTO(r)
  switch (colKey) {
    case "queueNumber": return `#${r.queueNumber}`
    case "designerName": return r.designerName ?? "Unassigned"
    case "sla": return req.slaDisplay
    case "comments": return r.messages.length > 0 ? "Has comments" : "No comments"
    default: return String((r as unknown as Record<string, unknown>)[colKey] ?? "")
  }
}

export function DesignerTable({ requests, currentUserId, onSelectRequest, onCancel }: DesignerTableProps) {
  const [queueMode, setQueueMode] = useState<"mine" | "all">("all")
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string | null; dir: SortDir }>({ key: null, dir: null })
  const [colFilters, setColFilters] = useState<Record<string, FilterValue>>({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const queueSource = useMemo(
    () => (queueMode === "mine" ? requests.filter((r) => r.assignedTo === currentUserId) : requests),
    [queueMode, requests, currentUserId],
  )

  // Unique values per column
  const columnValues = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const col of COL_DEFS) {
      if (col.colKey === "canva" || col.colKey === "cancel") continue
      const vals = [...new Set(queueSource.map((r) => getColumnValue(r, col.colKey)))].sort()
      map[col.colKey] = vals
    }
    return map
  }, [queueSource])

  const handleSort = useCallback((key: string | null, dir: SortDir) => {
    setSortConfig({ key, dir })
  }, [])

  const handleFilterChange = useCallback((key: string, value: FilterValue) => {
    setColFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  // Apply search + filters + sort
  const filteredRequests = useMemo(() => {
    let filtered = queueSource

    // Text search
    if (search) {
      const term = search.toLowerCase()
      filtered = filtered.filter((r) => {
        const haystack = `#${r.queueNumber} ${r.requesterName} ${r.designerName ?? ""} ${r.materialType} ${r.status}`.toLowerCase()
        return haystack.includes(term)
      })
    }

    // Column filters
    for (const [colKey, filterVal] of Object.entries(colFilters)) {
      if (filterVal === "all" || !(filterVal instanceof Set)) continue
      if (filterVal.size === 0) {
        filtered = []
        break
      }
      filtered = filtered.filter((r) => filterVal.has(getColumnValue(r, colKey)))
    }

    // Sort
    if (sortConfig.key && sortConfig.dir) {
      const { key, dir } = sortConfig
      filtered = [...filtered].sort((a, b) => {
        const va = getColumnValue(a, key)
        const vb = getColumnValue(b, key)
        const cmp = va.localeCompare(vb, undefined, { numeric: true })
        return dir === "asc" ? cmp : -cmp
      })
    }

    return filtered
  }, [queueSource, search, colFilters, sortConfig])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize))
  const pagedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div
      className="mb-8 overflow-visible rounded border border-border bg-white"
      data-testid="designer-table"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: BRAND_COLORS.navy }}
          >
            Requests
          </div>
          {/* My Queue / All toggle */}
          <div className="flex gap-px rounded-[3px] bg-gray-100 p-0.5">
            {([["mine", "My Queue"], ["all", "All"]] as const).map(([m, lbl]) => (
              <button
                key={m}
                onClick={() => { setQueueMode(m); setPage(1) }}
                className={`rounded-sm px-2.5 py-[3px] text-[10px] transition-all duration-150 ${
                  queueMode === m
                    ? "bg-white font-bold text-[var(--brand-primary)] shadow-sm"
                    : "bg-transparent font-medium text-gray-400"
                }`}
                data-testid={`queue-toggle-${m}`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2.5" style={{ maxWidth: 320 }}>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-xs text-gray-400">
              &#x2315;
            </span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name, #id, material, status..."
              className="w-full rounded-[3px] border border-border bg-gray-50 py-1.5 pl-[26px] pr-2.5 text-[11px] text-[var(--brand-primary)] outline-none focus:border-[var(--brand-accent)] focus:bg-white"
              style={{ fontFamily: "var(--brand-font-body)" }}
              data-testid="designer-table-search"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent p-0 text-xs leading-none text-gray-400"
              >
                &times;
              </button>
            )}
          </div>
          <div className="shrink-0 text-[11px] text-gray-400">
            {filteredRequests.length === requests.length
              ? `${requests.length} total`
              : `${filteredRequests.length} of ${requests.length}`}
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50">
            {COL_DEFS.map((c) =>
              c.colKey === "canva" || c.colKey === "cancel" ? (
                <th key={c.colKey} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                  {c.label}
                </th>
              ) : (
                <ColumnHeader
                  key={c.colKey}
                  label={c.label}
                  colKey={c.colKey}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  allValues={columnValues[c.colKey] ?? []}
                  colFilters={colFilters}
                  onFilterChange={handleFilterChange}
                />
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {filteredRequests.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-0">
                <div className="flex flex-col items-center gap-2.5 bg-white px-6 py-10">
                  <div className="flex size-12 items-center justify-center border border-[#E8E2D9] bg-[#FAF7F2]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 text-[13px] text-gray-400" style={{ fontFamily: "var(--brand-font-display)" }}>
                      No results found
                    </div>
                    <div className="text-[10px] text-[#C4B9AA]">
                      Try adjusting your filters or search term
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            pagedRequests.map((r) => (
              <DesignerTableRow
                key={r.id}
                request={r}
                onSelectRequest={onSelectRequest}
                onCancel={onCancel}
              />
            ))
          )}
        </tbody>
      </table>

      <PaginationBar
        total={filteredRequests.length}
        pageSize={pageSize}
        page={page}
        onPageSize={setPageSize}
        onPage={(p) => setPage(Math.max(1, Math.min(p, totalPages)))}
      />
    </div>
  )
}
