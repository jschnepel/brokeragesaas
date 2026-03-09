import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-semibold tracking-[0.08em] uppercase transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-[var(--brand-primary)] text-white',
        secondary:   'bg-[var(--brand-surface-alt)] text-[var(--brand-primary)]',
        destructive: 'bg-red-50 text-red-700 border border-red-200',
        outline:     'border border-[var(--color-border)] text-[var(--brand-primary)] bg-transparent',
        success:     'bg-green-50 text-green-700 border border-green-200',
        warning:     'bg-amber-50 text-amber-700 border border-amber-200',
        accent:      'bg-[var(--brand-accent-muted)] text-[var(--brand-primary)] border border-[rgba(201,169,110,0.3)]',
        rush:        'bg-red-600 text-white',
      },
      size: {
        default: 'text-[9px] px-2 py-0.5 rounded-[var(--brand-radius)]',
        sm:      'text-[8px] px-1.5 py-px rounded-[var(--brand-radius)]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
