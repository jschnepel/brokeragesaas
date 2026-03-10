import type { AnnouncementDTO, AnnouncementCategory } from "@/lib/data/lyonsden"

const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  "Company News": "bg-blue-100 text-blue-700",
  Training: "bg-emerald-100 text-emerald-700",
  "Market Update": "bg-amber-100 text-amber-700",
  Social: "bg-purple-100 text-purple-700",
  Recognition: "bg-rose-100 text-rose-700",
}

export class Announcement {
  constructor(public readonly dto: AnnouncementDTO) {}

  // ── Identity ───────────────────────────────────────────────

  get id() { return this.dto.id }
  get title() { return this.dto.title }
  get excerpt() { return this.dto.excerpt }
  get category() { return this.dto.category }
  get author() { return this.dto.author }
  get authorRole() { return this.dto.authorRole }
  get date() { return this.dto.date }
  get featured() { return this.dto.featured }
  get imageUrl() { return this.dto.imageUrl }

  // ── Computed ────────────────────────────────────────────────

  get isNew(): boolean {
    const diff = Date.now() - new Date(this.date).getTime()
    return diff < 48 * 60 * 60 * 1000
  }

  get categoryColor(): string {
    return CATEGORY_COLORS[this.category] ?? "bg-secondary text-secondary-foreground"
  }

  get timeAgo(): string {
    const diff = Date.now() - new Date(this.date).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks === 1) return "1 week ago"
    return `${weeks} weeks ago`
  }

  get authorInitials(): string {
    return this.author
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  get dateFormatted(): string {
    return new Date(this.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // ── Factory ────────────────────────────────────────────────

  static fromDTO(dto: AnnouncementDTO): Announcement {
    return new Announcement(dto)
  }

  static fromDTOs(dtos: AnnouncementDTO[]): Announcement[] {
    return dtos.map((d) => new Announcement(d))
  }
}
