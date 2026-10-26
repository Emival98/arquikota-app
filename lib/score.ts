import type { HealthStatus, Severity } from "./types";

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 12,
  high: 7,
  medium: 3,
  low: 1,
};

export function scoreAlerts(alerts: Array<{ severity: Severity }>): number {
  const penalty = alerts.reduce((sum, alert) => sum + SEVERITY_WEIGHT[alert.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function statusFromScore(score: number): HealthStatus {
  if (score >= 75) return "good";
  if (score >= 55) return "warning";
  return "critical";
}

export function verdictFromStatus(status: HealthStatus): "Saudável" | "Atenção" | "Crítico" {
  if (status === "good") return "Saudável";
  if (status === "warning") return "Atenção";
  return "Crítico";
}
