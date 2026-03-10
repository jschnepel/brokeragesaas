"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Zap } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Request } from "@/lib/models"
import type { RequestDTO, ViewerRole } from "@/lib/types"
import { ActionStrip } from "@/app/(dashboard)/requests/[id]/components/ActionStrip"

interface QuickActionSheetProps {
  request: RequestDTO | null
  open: boolean
  onClose: () => void
  viewerRole: ViewerRole
  loadingAction: boolean
  onStatusUpdate: (requestId: string, newStatus: string) => void
}

export function QuickActionSheet({
  request: dto,
  open,
  onClose,
  viewerRole,
  loadingAction,
  onStatusUpdate,
}: QuickActionSheetProps) {
  const router = useRouter()

  if (!dto) return null

  const request = Request.fromDTO(dto)

  const detailRoute = `${ROUTES.REQUEST_DETAIL}/${request.id}`

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--brand-accent)" }}
            >
              {request.queueLabel}
            </span>
            <SheetTitle className="flex-1 truncate text-base">
              {request.title}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("pointer-events-none", request.statusColor)}>
              {request.statusLabel}
            </Badge>
            {request.isRush && (
              <Badge variant="destructive" className="text-[10px]">
                <Zap className="mr-0.5 size-3" />
                Rush
              </Badge>
            )}
            <span
              className={cn("ml-auto text-xs font-medium font-mono", request.slaDisplayColor)}
            >
              {request.slaDisplay}
            </span>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <Separator />

          {/* Quick summary — compact */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">Material</span>
              <p className="font-medium">{request.materialType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Due</span>
              <p className="font-medium">{request.dueDateFormatted}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Designer</span>
              <p className="font-medium">{request.designerName ?? "Unassigned"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Requester</span>
              <p className="font-medium">{request.requesterName}</p>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <ActionStrip
            status={request.status}
            viewerRole={viewerRole}
            loading={loadingAction}
            onStatusUpdate={(newStatus) => onStatusUpdate(request.id, newStatus)}
          />
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose()
              router.push(detailRoute)
            }}
            data-testid="view-full-request"
          >
            Open Full Details
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
