import type { ReactNode } from "react";
import type { AlertKind, HealthStatus, Severity } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const STATUS_COLOR: Record<HealthStatus, string> = {
  good: "#8ef0c2",
  warning: "#f5c97b",
  critical: "#ff9686",
};

export const STATUS_CHIP: Record<HealthStatus, string> = {
  good: "chip chip-mint",
  warning: "chip chip-amber",
  critical: "chip chip-coral",
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#ff9686",
  high: "#f5c97b",
  medium: "#93bdf4",
  low: "#94a3b1",
};

export const SEVERITY_CHIP: Record<Severity, string> = {
  critical: "chip chip-coral",
  high: "chip chip-amber",
  medium: "chip chip-sky",
  low: "chip",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "crítico",
  high: "alto",
  medium: "médio",
  low: "baixo",
};

export const KIND_LABEL: Record<AlertKind, string> = {
  runtime: "runtime",
  dependency: "dependência",
  platform: "plataforma",
  practice: "prática",
  automation: "automação",
};

export function SeverityDot({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: SEVERITY_COLOR[severity] }}
      aria-hidden="true"
    />
  );
}

export function Panel({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("card min-w-0 scroll-mt-24", className)}>
      {children}
    </section>
  );
}

export function PanelHead({
  kicker,
  title,
  subtitle,
  aside,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="min-w-0">
        <span className="kicker">{kicker}</span>
        <h3 className="panel-title mt-2">{title}</h3>
        {subtitle ? (
          <p className="mt-1.5 max-w-lg text-[11.5px] leading-5 text-mist">{subtitle}</p>
        ) : null}
      </div>
      {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
    </div>
  );
}

export function MiniStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <span className="kicker">{label}</span>
      <p className="mt-1.5 font-mono text-[14px] tracking-[-0.03em] text-white/90">
        {value}
      </p>
      {note ? <p className="mt-0.5 text-[10px] leading-4 text-mist">{note}</p> : null}
    </div>
  );
}
