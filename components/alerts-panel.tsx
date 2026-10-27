"use client";

import { useEffect, useState } from "react";
import CopyButton from "./copy-button";
import { AlertIcon, ArrowRight, CheckIcon, ChevronDown, ExternalIcon } from "./icons";
import {
  KIND_LABEL,
  Panel,
  PanelHead,
  SEVERITY_CHIP,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  SeverityDot,
  cn,
} from "./ui";
import type { MaintenanceAlert, ScanReport, Severity } from "@/lib/types";

type SeverityFilter = "all" | Severity;

const FILTER_LABEL: Record<SeverityFilter, string> = {
  all: "Todos",
  critical: "Críticos",
  high: "Altos",
  medium: "Médios",
  low: "Baixos",
};

function AlertCard({
  alert,
  expanded,
  onToggle,
  onResolve,
}: {
  alert: MaintenanceAlert;
  expanded: boolean;
  onToggle: () => void;
  onResolve: () => void;
}) {
  const detailId = `alert-details-${alert.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <article
      className={cn(
        "border-t border-slate-200 transition-colors first:border-t-0",
        expanded && "bg-slate-50/70",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={detailId}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
      >
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor: `${SEVERITY_COLOR[alert.severity]}2e`,
            backgroundColor: `${SEVERITY_COLOR[alert.severity]}10`,
          }}
        >
          <SeverityDot severity={alert.severity} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={SEVERITY_CHIP[alert.severity]}>
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="text-[10.5px] font-medium text-slate-500">
              {KIND_LABEL[alert.kind]}
            </span>
            {alert.confidence === "Heurística" ? (
              <span className="text-[10.5px] font-medium text-slate-400">
                · heurística
              </span>
            ) : null}
          </span>

          <span className="mt-2 block text-[13px] font-medium leading-5 text-slate-900">
            {alert.title}
          </span>

          {alert.current || alert.recommended ? (
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {alert.current ? (
                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[9.5px] text-slate-600">
                  {alert.current}
                </span>
              ) : null}
              {alert.current && alert.recommended ? (
                <ArrowRight size={10} className="shrink-0 text-slate-400" />
              ) : null}
              {alert.recommended ? (
                <span className="rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 font-mono text-[9.5px] text-teal-700">
                  {alert.recommended}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>

        <ChevronDown
          size={14}
          className={cn(
            "mt-1 shrink-0 text-slate-400 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div id={detailId} className="px-5 pb-5 sm:px-6">
          <p className="max-w-3xl text-[12px] leading-5 text-slate-600">{alert.summary}</p>

          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-1.5">
              <AlertIcon size={11} className="text-red-600" />
              <span className="kicker text-red-700">Se ignorares</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-5 text-slate-600">{alert.risk}</p>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="kicker">{alert.fix.label}</span>
              <CopyButton
                text={alert.fix.content}
                label={alert.fix.kind === "command" ? "Copiar comando" : "Copiar código"}
              />
            </div>
            <pre className="code-block mt-2 max-h-[220px] overflow-y-auto">
              <code>{alert.fix.content}</code>
            </pre>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-medium text-slate-500">
              <span>esforço {alert.effort.toLowerCase()}</span>
              <span className="h-2.5 w-px bg-slate-300" />
              <span>{alert.confidence.toLowerCase()}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {alert.docsUrl ? (
                <a
                  href={alert.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Documentação
                  <ExternalIcon size={10} />
                </a>
              ) : null}
              <button
                type="button"
                onClick={onResolve}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-2.5 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-100"
              >
                <CheckIcon size={10} />
                Marcar resolvido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function AlertsPanel({
  report,
  alerts,
  onResolve,
  className,
}: {
  report: ScanReport;
  alerts: MaintenanceAlert[];
  onResolve: (alert: MaintenanceAlert) => void;
  className?: string;
}) {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [openId, setOpenId] = useState<string | null>(alerts[0]?.id ?? null);

  useEffect(() => {
    setOpenId(alerts[0]?.id ?? null);
    // Only reset when a different scan arrives, not when an alert is resolved.
  }, [report.project.id, report.scannedAt]);

  const counts: Record<SeverityFilter, number> = {
    all: alerts.length,
    critical: alerts.filter((alert) => alert.severity === "critical").length,
    high: alerts.filter((alert) => alert.severity === "high").length,
    medium: alerts.filter((alert) => alert.severity === "medium").length,
    low: alerts.filter((alert) => alert.severity === "low").length,
  };

  const visible = filter === "all" ? alerts : alerts.filter((alert) => alert.severity === filter);

  function resolve(alert: MaintenanceAlert) {
    onResolve(alert);
    setOpenId(null);
  }

  return (
    <Panel id="alertas" className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="03 · Alertas"
        title="O que precisa de atenção"
        subtitle="Cada alerta explica o risco de ignorar e traz um comando pronto a executar."
        aside={
          <span className={counts.critical > 0 ? "chip chip-coral" : "chip chip-mint"}>
            {counts.critical > 0
              ? `${counts.critical} ${counts.critical === 1 ? "crítico" : "críticos"}`
              : "sem críticos"}
          </span>
        }
      />

      <div className="mt-4 flex flex-wrap gap-1.5 px-5 sm:px-6" role="group" aria-label="Filtrar alertas por urgência">
        {(Object.keys(FILTER_LABEL) as SeverityFilter[]).map((value) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(value)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-medium transition",
                active
                  ? "border-blue-300 bg-blue-50 text-sky"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700",
              )}
            >
              {FILTER_LABEL[value]}
              <span className={cn("tabular-nums", active ? "text-sky/80" : "text-slate-400")}>
                {counts[value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex-1 border-t border-slate-200">
        {visible.length > 0 ? (
          visible.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              expanded={openId === alert.id}
              onToggle={() => setOpenId((current) => (current === alert.id ? null : alert.id))}
              onResolve={() => resolve(alert)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-mint">
              <CheckIcon size={16} />
            </span>
            <p className="mt-3 text-[12.5px] font-medium text-slate-900">
              {alerts.length === 0 ? "Nenhum alerta ativo" : "Nada neste filtro"}
            </p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-500">
              {alerts.length === 0
                ? "As dependências e configurações verificadas estão em dia. Mantém a cadência para detetar a próxima alteração."
                : "Escolhe outro nível de urgência para ver os restantes alertas."}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-5 py-3 text-[10.5px] text-slate-500 sm:px-6">
        {alerts.length} {alerts.length === 1 ? "alerta ativo" : "alertas ativos"} · score
        calculado por severidade
      </div>
    </Panel>
  );
}
