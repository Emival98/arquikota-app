export type Severity = "critical" | "high" | "medium" | "low";
export type HealthStatus = "good" | "warning" | "critical";
export type AlertKind = "runtime" | "dependency" | "platform" | "practice" | "automation";
export type Cadence = "daily" | "weekly";
export type ScanSource = "demo" | "github";

export interface DependencyInfo {
  name: string;
  installed: string;
  kind: "runtime" | "dev";
}

export interface ProjectSignals {
  enginesNode?: string;
  nvmrc?: string;
  nextConfig?: string;
  vercelJson?: string;
  scripts: Record<string, string>;
  hasWorkflow: boolean;
  hasLockfile: boolean;
  usesSupabase: boolean;
}

export interface ProjectProfile {
  id: string;
  name: string;
  repoUrl: string;
  description: string;
  branch: string;
  lastCommitAt: string | null;
  runtime: string;
  stack: string[];
  dependencies: DependencyInfo[];
  signals: ProjectSignals;
  source: ScanSource;
}

export interface AlertFix {
  kind: "command" | "snippet";
  label: string;
  content: string;
  language?: "bash" | "json" | "yaml" | "ts";
}

export interface MaintenanceAlert {
  id: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  subject: string;
  current?: string;
  recommended?: string;
  summary: string;
  risk: string;
  fix: AlertFix;
  effort: "Baixo" | "Médio" | "Alto";
  confidence: "Confirmado" | "Heurística";
  docsUrl?: string;
}

export interface DependencyRow {
  name: string;
  installed: string;
  latest: string | null;
  kind: "runtime" | "dev";
  status: Severity | "ok" | "unknown";
  gap: string;
}

export interface ResolvedAlert {
  id: string;
  title: string;
  category: AlertKind;
  resolvedAt: string;
  note: string;
}

export interface HistoryPoint {
  date: string;
  score: number;
  critical: number;
  high: number;
}

export interface AlertCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface ScanSummary {
  counts: AlertCounts;
  outdated: number;
  scannedDependencies: number;
  resolvedCount: number;
}

export interface AutomationInfo {
  configured: boolean;
  cadence: Cadence;
  cron: string;
  scheduleLabel: string;
  nextRunLabel: string;
  lastScanAt: string;
  path: string;
  yaml: string;
}

export interface ScanReport {
  project: ProjectProfile;
  scannedAt: string;
  source: ScanSource;
  latestSource: "npm" | "catalog";
  score: number;
  status: HealthStatus;
  verdict: "Saudável" | "Atenção" | "Crítico";
  alerts: MaintenanceAlert[];
  dependencies: DependencyRow[];
  summary: ScanSummary;
  history: HistoryPoint[];
  resolved: ResolvedAlert[];
  automation: AutomationInfo;
  warnings: string[];
}

export interface ScanRequest {
  source: ScanSource;
  presetId: string | null;
  repo: string | null;
  cadence: Cadence;
}
