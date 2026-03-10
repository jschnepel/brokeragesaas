"use client"

interface SectionHeaderProps {
  title: string
}

/**
 * Shared section header — uppercase, 9px, letter-spacing 0.14em
 */
export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <h3
      className="text-muted-foreground"
      style={{
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        fontFamily: "var(--brand-font-body)",
        fontWeight: 600,
        marginBottom: 8,
      }}
    >
      {title}
    </h3>
  )
}
