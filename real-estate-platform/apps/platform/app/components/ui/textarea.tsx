import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[80px] w-full bg-white border border-[var(--color-border)] px-3 py-2 text-[var(--text-sm)] text-[var(--brand-primary)] placeholder:text-[#9CA3AF] rounded-[var(--brand-radius)] outline-none transition-colors resize-none',
        'focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
