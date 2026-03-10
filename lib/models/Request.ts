import { REQUEST_STATUS, SLA_HOURS } from "@/lib/constants";
import type { RequestDTO, FileDTO } from "@/lib/types";

type StatusKey = keyof typeof REQUEST_STATUS;
type StatusValue = (typeof REQUEST_STATUS)[StatusKey];

interface StatusTransition {
  label: string;
  next: StatusValue;
  icon: string; // lucide icon name for reference
}

const TRANSITION_MAP: Partial<Record<StatusValue, StatusTransition[]>> = {
  [REQUEST_STATUS.ASSIGNED]: [
    { label: "Start", next: REQUEST_STATUS.IN_PROGRESS, icon: "Play" },
  ],
  [REQUEST_STATUS.IN_PROGRESS]: [
    { label: "Need Materials", next: REQUEST_STATUS.AWAITING_MATERIALS, icon: "Package" },
    { label: "Complete", next: REQUEST_STATUS.COMPLETED, icon: "CheckCircle" },
  ],
  [REQUEST_STATUS.AWAITING_MATERIALS]: [
    { label: "Resume", next: REQUEST_STATUS.IN_PROGRESS, icon: "Play" },
    { label: "Complete", next: REQUEST_STATUS.COMPLETED, icon: "CheckCircle" },
  ],
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  review: "In Review",
  revision: "Revision Requested",
  assigned: "Assigned",
  in_progress: "In Progress",
  awaiting_materials: "Awaiting Materials",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  submitted: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  review: "bg-amber-100 text-amber-700",
  revision: "bg-orange-100 text-orange-700",
  assigned: "bg-purple-100 text-purple-700",
  in_progress: "bg-blue-100 text-blue-700",
  awaiting_materials: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  draft: "border-l-gray-400",
  submitted: "border-l-blue-500",
  in_review: "border-l-amber-500",
  assigned: "border-l-purple-500",
  in_progress: "border-l-indigo-500",
  awaiting_materials: "border-l-orange-500",
  completed: "border-l-emerald-500",
  cancelled: "border-l-red-500",
};

export class Request {
  constructor(public readonly dto: RequestDTO) {}

  // ── Identity ───────────────────────────────────────────────

  get id() { return this.dto.id; }
  get queueNumber() { return this.dto.queueNumber; }
  get title() { return this.dto.title; }
  get status() { return this.dto.status; }
  get materialType() { return this.dto.materialType; }
  get isRush() { return this.dto.isRush; }
  get brief() { return this.dto.brief; }
  get requesterName() { return this.dto.requesterName; }
  get designerName() { return this.dto.designerName; }
  get assignedTo() { return this.dto.assignedTo; }
  get requesterId() { return this.dto.requesterId; }
  get dueDate() { return this.dto.dueDate; }
  get slaDeadline() { return this.dto.slaDeadline; }
  get slaBreached() { return this.dto.slaBreached; }
  get submittedAt() { return this.dto.submittedAt; }
  get messages() { return this.dto.messages; }
  get files() { return this.dto.files; }
  get heroImageUrl() { return this.dto.heroImageUrl ?? null; }

  // ── Formatted Labels ───────────────────────────────────────

  get queueLabel(): string {
    return `#${String(this.queueNumber).padStart(3, "0")}`;
  }

  get statusLabel(): string {
    return STATUS_LABELS[this.status] ?? this.status;
  }

  get statusColor(): string {
    return STATUS_COLORS[this.status] ?? STATUS_COLORS.draft;
  }

  get statusBorderColor(): string {
    if (this.slaBreached) return "border-l-red-500";
    return STATUS_BORDER_COLORS[this.status] ?? STATUS_BORDER_COLORS.draft;
  }

  get dueDateFormatted(): string {
    if (!this.dueDate) return "No date";
    return new Date(this.dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  get dueDateLong(): string {
    if (!this.dueDate) return "---";
    return new Date(this.dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  get submittedAtFormatted(): string {
    return new Date(this.submittedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // ── State Queries ──────────────────────────────────────────

  get isActive(): boolean {
    return (
      this.status !== REQUEST_STATUS.COMPLETED &&
      this.status !== REQUEST_STATUS.CANCELLED
    );
  }

  get isCompleted(): boolean {
    return this.status === REQUEST_STATUS.COMPLETED;
  }

  get isCancelled(): boolean {
    return this.status === REQUEST_STATUS.CANCELLED;
  }

  get canBeAssigned(): boolean {
    return (
      this.status === REQUEST_STATUS.SUBMITTED ||
      this.status === REQUEST_STATUS.IN_REVIEW
    );
  }

  get isAssigned(): boolean {
    return this.assignedTo !== null;
  }

  // ── SLA ────────────────────────────────────────────────────

  get slaHoursAllowed(): number {
    return this.isRush ? SLA_HOURS.rush : SLA_HOURS.standard;
  }

  get slaStatus(): "ok" | "warning" | "breached" {
    if (this.slaBreached) return "breached";
    if (!this.slaDeadline) return "ok";
    const remaining = new Date(this.slaDeadline).getTime() - Date.now();
    const hoursRemaining = remaining / (1000 * 60 * 60);
    if (hoursRemaining < 0) return "breached";
    if (hoursRemaining < 12) return "warning";
    return "ok";
  }

  get slaRemainingHours(): number | null {
    if (!this.slaDeadline) return null;
    const remaining = new Date(this.slaDeadline).getTime() - Date.now();
    return Math.round(remaining / (1000 * 60 * 60));
  }

  get slaDisplay(): string {
    if (this.slaBreached) return "SLA Breached";
    const hours = this.slaRemainingHours;
    if (hours === null) return `${this.slaHoursAllowed}h SLA`;
    if (hours < 0) return "SLA Breached";
    if (hours >= 24) return `${(hours / 24).toFixed(1)}d remaining`;
    return `${hours}h remaining`;
  }

  get slaDisplayColor(): string {
    const status = this.slaStatus;
    if (status === "breached") return "text-red-600";
    if (status === "warning") return "text-amber-600";
    return "text-muted-foreground";
  }

  // ── Transitions ────────────────────────────────────────────

  get availableTransitions(): StatusTransition[] {
    return TRANSITION_MAP[this.status as StatusValue] ?? [];
  }

  get hasTransitions(): boolean {
    return this.availableTransitions.length > 0;
  }

  // ── Factory ────────────────────────────────────────────────

  withStatus(newStatus: string): Request {
    return new Request({ ...this.dto, status: newStatus });
  }

  withFile(file: FileDTO): Request {
    return new Request({ ...this.dto, files: [...this.dto.files, file] });
  }

  withAssignment(designerId: string, designerName: string | null): Request {
    return new Request({
      ...this.dto,
      status: REQUEST_STATUS.ASSIGNED,
      assignedTo: designerId,
      designerName,
    });
  }

  static fromDTO(dto: RequestDTO): Request {
    return new Request(dto);
  }

  static fromDTOs(dtos: RequestDTO[]): Request[] {
    return dtos.map((d) => new Request(d));
  }

  static filterActive(requests: Request[]): Request[] {
    return requests.filter((r) => r.isActive);
  }

  static filterCompleted(requests: Request[]): Request[] {
    return requests.filter((r) => r.isCompleted);
  }

  static filterCancelled(requests: Request[]): Request[] {
    return requests.filter((r) => r.isCancelled);
  }

  static filterTriageable(requests: Request[]): Request[] {
    return requests.filter((r) => r.canBeAssigned);
  }

  /** Generic date formatter — "Mar 10, 2026" or "—" for null */
  static formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}
