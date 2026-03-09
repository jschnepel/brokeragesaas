import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-8 w-full bg-white border border-[var(--color-border)] px-3 text-[var(--text-sm)] text-[var(--brand-primary)] placeholder:text-[#9CA3AF] rounded-[var(--brand-radius)] outline-none transition-colors',
        'focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}

export { Input }
