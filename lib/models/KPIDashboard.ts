import type { KPIs } from "@/lib/types";

export class KPIDashboard {
  constructor(public readonly kpis: KPIs) {}

  get totalRequests() { return this.kpis.totalRequests; }
  get openRequests() { return this.kpis.openRequests; }
  get completedRequests() { return this.kpis.completedRequests; }

  get avgTurnaroundDisplay(): string {
    const h = this.kpis.avgTurnaroundHours;
    if (h >= 24) return `${(h / 24).toFixed(1)}d`;
    return `${Math.round(h)}h`;
  }

  get slaBreachDisplay(): string {
    return `${(this.kpis.slaBreachRate * 100).toFixed(1)}%`;
  }

  get rushDisplay(): string {
    return `${(this.kpis.rushPercentage * 100).toFixed(1)}%`;
  }

  get slaBreachSeverity(): "ok" | "warning" | "critical" {
    if (this.kpis.slaBreachRate >= 0.2) return "critical";
    if (this.kpis.slaBreachRate >= 0.1) return "warning";
    return "ok";
  }

  get rushSeverity(): "ok" | "warning" | "critical" {
    if (this.kpis.rushPercentage >= 0.4) return "critical";
    if (this.kpis.rushPercentage >= 0.2) return "warning";
    return "ok";
  }

  static from(kpis: KPIs): KPIDashboard {
    return new KPIDashboard(kpis);
  }
}
