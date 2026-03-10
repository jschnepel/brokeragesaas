"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Mail,
  Phone,
  Building2,
  Users,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { BRAND_FONTS } from "@/lib/config"
import { OrgNode } from "@/lib/models/OrgNode"
import { ORG_TREE } from "@/lib/data/orgchart"

const ZOOM_MIN = 0.4
const ZOOM_MAX = 1.5
const ZOOM_STEP = 0.1

export function OrgChartClient() {
  const tree = useMemo(() => OrgNode.fromData(ORG_TREE), [])
  const [search, setSearch] = useState("")
  const [zoom, setZoom] = useState(0.85)
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null)

  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)),
    [],
  )
  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)),
    [],
  )
  const handleZoomReset = useCallback(() => setZoom(0.85), [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: BRAND_FONTS.display }}
        >
          Org Chart
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border bg-card p-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleZoomOut}
              disabled={zoom <= ZOOM_MIN}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleZoomIn}
              disabled={zoom >= ZOOM_MAX}
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleZoomReset}
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tree */}
      <ScrollArea className="h-[calc(100vh-10rem)] rounded-lg border bg-card">
        <div className="flex min-w-max justify-center p-8">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            <TreeNode
              node={tree}
              search={search}
              onSelect={setSelectedNode}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Detail Sheet */}
      <Sheet
        open={selectedNode !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNode(null)
        }}
      >
        <SheetContent>
          {selectedNode && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback
                      className={cn(
                        "text-sm font-semibold text-white",
                        selectedNode.avatarColor,
                      )}
                    >
                      {selectedNode.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle
                      style={{ fontFamily: BRAND_FONTS.display }}
                    >
                      {selectedNode.name}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedNode.title}
                    </p>
                  </div>
                </div>
              </SheetHeader>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span>{selectedNode.department}</span>
                  <Badge variant="secondary" className={selectedNode.roleColor}>
                    {selectedNode.person.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <a
                    href={`mailto:${selectedNode.email}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {selectedNode.email}
                  </a>
                </div>
                {selectedNode.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <a
                      href={`tel:${selectedNode.phone}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {selectedNode.phone}
                    </a>
                  </div>
                )}
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span>
                    {selectedNode.isLeaf
                      ? "Individual contributor"
                      : `${selectedNode.childCount} direct & indirect reports`}
                  </span>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ── Tree Node Component ───────────────────────────────────── */

function TreeNode({
  node,
  search,
  onSelect,
}: {
  node: OrgNode
  search: string
  onSelect: (node: OrgNode) => void
}) {
  const isMatch = search.length > 0 && node.matches(search)
  const isDimmed = search.length > 0 && !isMatch && !hasMatchingDescendant(node, search)

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={cn(
          "cursor-pointer rounded-lg transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDimmed && "opacity-30",
          isMatch && "ring-2 ring-primary shadow-lg",
        )}
      >
        <Card className="w-48 overflow-hidden">
          <CardContent className="flex flex-col items-center gap-2 p-4">
            <Avatar className="size-10">
              <AvatarFallback
                className={cn(
                  "text-xs font-semibold text-white",
                  node.avatarColor,
                )}
              >
                {node.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p
                className="text-sm font-semibold leading-tight"
                style={{ fontFamily: BRAND_FONTS.display }}
              >
                {node.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-tight">
                {node.title}
              </p>
            </div>
            <Badge variant="secondary" className={cn("text-[10px]", node.roleColor)}>
              {node.department}
            </Badge>
          </CardContent>
        </Card>
      </button>

      {/* Children with connector lines */}
      {node.children.length > 0 && (
        <>
          {/* Vertical line down from parent */}
          <div className="h-6 w-px bg-border" />

          {/* Horizontal connector bar */}
          {node.children.length > 1 && (
            <div className="relative flex w-full justify-center">
              <div
                className="h-px bg-border"
                style={{
                  width: `calc(${((node.children.length - 1) / node.children.length) * 100}%)`,
                }}
              />
            </div>
          )}

          {/* Children row */}
          <div className="flex items-start gap-2">
            {node.children.map((child) => (
              <div key={child.name} className="flex flex-col items-center">
                {/* Vertical line down to child */}
                <div className="h-6 w-px bg-border" />
                <TreeNode node={child} search={search} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Recursively check if any descendant matches the search query */
function hasMatchingDescendant(node: OrgNode, query: string): boolean {
  for (const child of node.children) {
    if (child.matches(query) || hasMatchingDescendant(child, query)) {
      return true
    }
  }
  return false
}
