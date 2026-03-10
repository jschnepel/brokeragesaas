"use client"

import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { REQUEST_STATUS } from "@/lib/constants"

const STEPPER_STEPS = [
  { key: REQUEST_STATUS.SUBMITTED, label: "Submitted" },
  { key: REQUEST_STATUS.ASSIGNED, label: "Assigned" },
  { key: REQUEST_STATUS.IN_PROGRESS, label: "In Progress" },
  { key: "review", label: "Review" },
  { key: REQUEST_STATUS.COMPLETED, label: "Completed" },
] as const

const STATUS_ORDER: Record<string, number> = {
  [REQUEST_STATUS.DRAFT]: 0,
  [REQUEST_STATUS.SUBMITTED]: 1,
  [REQUEST_STATUS.ASSIGNED]: 2,
  [REQUEST_STATUS.IN_PROGRESS]: 3,
  [REQUEST_STATUS.AWAITING_MATERIALS]: 3,
  [REQUEST_STATUS.IN_REVIEW]: 4,
  review: 4,
  revision: 3,
  [REQUEST_STATUS.COMPLETED]: 5,
  [REQUEST_STATUS.CANCELLED]: -1,
}

interface RequestStepperProps {
  status: string
}

export function RequestStepper({ status }: RequestStepperProps) {
  const currentIndex = STATUS_ORDER[status] ?? 0
  const isCancelled = status === REQUEST_STATUS.CANCELLED

  return (
    <div
      data-testid="request-stepper"
      className="mx-auto flex w-full max-w-5xl items-center rounded-md border bg-card px-8 py-4"
    >
      {STEPPER_STEPS.map((step, i) => {
        const stepIndex = i + 1
        const isComplete = !isCancelled && currentIndex > stepIndex
        const isCurrent = !isCancelled && currentIndex === stepIndex
        const isPending = isCancelled || currentIndex < stepIndex

        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isComplete && "border-green-500 bg-green-500 text-white",
                  isCurrent && "border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]",
                  isPending && "border-muted-foreground/25 bg-muted text-muted-foreground/60",
                )}
              >
                {isComplete ? (
                  <CheckCircle className="size-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.08em]",
                  isComplete && "text-green-600",
                  isCurrent && "text-[var(--brand-accent)]",
                  isPending && "text-muted-foreground/60",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPPER_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full",
                  isComplete ? "bg-green-500" : "bg-muted-foreground/15",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
