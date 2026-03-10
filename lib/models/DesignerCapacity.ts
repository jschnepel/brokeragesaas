import type { DesignerLoad, AgentRow } from "@/lib/types";
import { Request } from "./Request";
import { REQUEST_STATUS } from "@/lib/constants";

export class DesignerCapacity {
  constructor(public readonly load: DesignerLoad) {}

  get id() { return this.load.designerId; }
  get name() { return this.load.designerName; }
  get activeCount() { return this.load.activeCount; }
  get completedCount() { return this.load.completedCount; }
  get totalCount() { return this.activeCount + this.completedCount; }

  percentage(maxActive: number): number {
    if (maxActive === 0) return 0;
    return Math.round((this.activeCount / maxActive) * 100);
  }

  get utilizationLabel(): string {
    return `${this.activeCount} active / ${this.completedCount} done`;
  }

  get initials(): string {
    return this.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // ── Factory ────────────────────────────────────────────────

  static from(load: DesignerLoad): DesignerCapacity {
    return new DesignerCapacity(load);
  }

  static fromLoads(loads: DesignerLoad[]): DesignerCapacity[] {
    return loads.map((l) => new DesignerCapacity(l));
  }

  static maxActive(capacities: DesignerCapacity[]): number {
    return Math.max(...capacities.map((c) => c.activeCount), 1);
  }

  /**
   * Compute designer loads from a list of designers and requests.
   * Useful when you have raw data and need to derive load client-side.
   */
  static computeFromRequests(
    designers: AgentRow[],
    requests: Request[],
  ): DesignerCapacity[] {
    const map = new Map<string, DesignerLoad>();

    for (const d of designers) {
      map.set(d.id, {
        designerId: d.id,
        designerName: d.name,
        activeCount: 0,
        completedCount: 0,
      });
    }

    for (const r of requests) {
      if (!r.assignedTo) continue;
      const entry = map.get(r.assignedTo);
      if (!entry) continue;
      if (r.status === REQUEST_STATUS.COMPLETED) entry.completedCount++;
      else entry.activeCount++;
    }

    return Array.from(map.values()).map((l) => new DesignerCapacity(l));
  }
}
