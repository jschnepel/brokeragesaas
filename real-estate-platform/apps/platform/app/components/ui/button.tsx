import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
  {
    variants: {
      variant: {
        default:     'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] active:scale-[0.98]',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:     'border border-[var(--color-border)] bg-white text-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-surface)]',
        secondary:   'bg-[var(--brand-surface-alt)] text-[var(--brand-primary)] hover:bg-[var(--color-border)]',
        ghost:       'text-[var(--brand-primary)] hover:bg-[var(--brand-surface-alt)]',
        link:        'text-[var(--brand-accent)] underline-offset-4 hover:underline p-0 h-auto',
        accent:      'bg-[var(--brand-accent)] text-white hover:opacity-90 active:scale-[0.98]',
      },
      size: {
        default: 'h-8 px-4 text-[var(--text-sm)] tracking-wide rounded-[var(--brand-radius)]',
        sm:      'h-7 px-3 text-[var(--text-xs)] tracking-wide rounded-[var(--brand-radius)]',
        lg:      'h-10 px-6 text-[var(--text-base)] rounded-[var(--brand-radius)]',
        icon:    'h-8 w-8 rounded-[var(--brand-radius)]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
