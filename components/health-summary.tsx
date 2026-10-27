import { ArrowRight, CheckIcon, ExternalIcon, InfoIcon } from "./icons";
import {
  KIND_LABEL,
  MiniStat,
  Panel,
  PanelHead,
  SEVERITY_CHIP,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  STATUS_CHIP,
  STATUS_COLOR,
  SeverityDot,
  cn,
} from "./ui";
import { fmtDateShort } from "@/lib/format";
import type {
  AlertCounts,
  HealthStatus,
  HistoryPoint,
  MaintenanceAlert,
  ScanReport,
  Severity,
} from "@/lib/types";

const TILES: Array<{ severity: Severity; label: string }> = [
  { severity: "critical", label: "Críticos" },
  { severity: "high", label: "Altos" },
  { severity: "medium", label: "Médios" },
  { severity: "low", label: "Baixos" },
];

const PRIORITY_TONE: Record<Severity, string> = {
  critical: "border-red-200 bg-red-50",
  high: "border-amber-200 bg-amber-50",
  medium: "border-blue-200 bg-blue-50",
  low: "border-slate-200 bg-slate-50",
};

function Gauge({ score, status }: { score: number; status: HealthStatus }) {
  const color = STATUS_COLOR[status];
  const angle = Math.PI * (1 + Math.max(0, Math.min(100, score)) / 100);
  const markerX = 90 + 70 * Math.cos(angle);
  const markerY = 96 + 70 * Math.sin(angle);

  return (
    <div className="relative mx-auto w-full max-w-[190px]">
      <svg
        viewBox="0 0 180 112"
        className="w-full"
        role="img"
        aria-label={`Índice de manutenção ${score} de 100`}
      >
        <path
          d="M20 96 A70 70 0 0 1 160 96"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
        />
        <path
          d="M20 96 A70 70 0 0 1 160 96"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${Math.max(score, 0.8)} 100`}
        />
        <circle cx={markerX} cy={markerY} r="3.1" fill="#ffffff" stroke={color} strokeWidth="2" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center">
        <span className="font-mono text-[36px] font-medium leading-none tracking-[-0.05em] tabular-nums text-slate-900">
          {score}
        </span>
        <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          índice / 100
        </span>
      </div>
    </div>
  );
}

export default function HealthSummary({
  report,
  alerts,
  score,
  status,
  verdict,
  counts,
  resolvedCount,
  history,
  className,
}: {
  report: ScanReport;
  alerts: MaintenanceAlert[];
  score: number;
  status: HealthStatus;
  verdict: "Saudável" | "Atenção" | "Crítico";
  counts: AlertCounts;
  resolvedCount: number;
  history: HistoryPoint[];
  className?: string;
}) {
  const previous = history.length > 1 ? history[history.length - 2].score : null;
  const delta = previous === null ? null : score - previous;
  const priority =
    alerts.find((alert) => alert.severity === "critical") ??
    alerts.find((alert) => alert.severity === "high") ??
    alerts[0] ??
    null;

  return (
    <Panel id="diagnostico" className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="02 · Diagnóstico"
        title={report.project.name}
        subtitle={report.project.description}
        aside={
          <>
            {report.source === "github" ? (
              <a
                href={report.project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="chip chip-sky transition hover:brightness-110"
              >
                GitHub
                <ExternalIcon size={10} />
              </a>
            ) : (
              <span className="chip chip-mint">demo</span>
            )}
            <span className="chip">
              {report.latestSource === "npm" ? "npm ao vivo" : "snapshot local"}
            </span>
          </>
        }
      />

      <div className="mt-5 grid flex-1 gap-5 px-5 pb-5 sm:px-6 lg:grid-cols-[205px_minmax(0,1fr)]">
        <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Gauge score={score} status={status} />
          <span className={cn("mt-3", STATUS_CHIP[status])}>{verdict}</span>
          <p className="mt-2 text-center text-[10.5px] leading-4 text-slate-500">
            {delta === null
              ? "Primeira leitura registada."
              : delta === 0
                ? "Sem alteração face à leitura anterior."
                : `${delta > 0 ? "+" : ""}${delta} pts face à leitura anterior.`}
          </p>
          <p className="mt-3 w-full border-t border-slate-200 pt-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">
            {verdict === "Saudável"
              ? "manter a cadência"
              : verdict === "Atenção"
                ? "agir esta semana"
                : "intervenção imediata"}
          </p>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
            {TILES.map(({ severity, label }) => {
              const count = counts[severity];
              return (
                <div key={severity} className="bg-white p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="kicker">{label}</span>
                    <SeverityDot severity={severity} />
                  </div>
                  <p
                    className="mt-2 font-mono text-[24px] font-medium leading-none tracking-[-0.04em] tabular-nums"
                    style={{ color: count > 0 ? SEVERITY_COLOR[severity] : "#94a3b8" }}
                  >
                    {String(count).padStart(2, "0")}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className={cn(
              "mt-4 rounded-xl border p-3.5",
              priority ? PRIORITY_TONE[priority.severity] : "border-teal-200 bg-teal-50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="kicker">
                {priority ? "Prioridade imediata" : "Estado atual"}
              </span>
              {priority ? (
                <span className={SEVERITY_CHIP[priority.severity]}>
                  {SEVERITY_LABEL[priority.severity]}
                </span>
              ) : (
                <span className="chip chip-mint">limpo</span>
              )}
            </div>
            {priority ? (
              <>
                <p className="mt-2 text-[12.5px] font-medium leading-5 text-slate-900">
                  {priority.title}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">
                  {KIND_LABEL[priority.kind]} · esforço {priority.effort.toLowerCase()} ·{" "}
                  {priority.confidence.toLowerCase()}
                </p>
                <a
                  href="#alertas"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 transition hover:text-sky"
                >
                  Ver plano de correção
                  <ArrowRight size={12} />
                </a>
              </>
            ) : (
              <div className="mt-2 flex items-start gap-2">
                <CheckIcon size={13} className="mt-0.5 shrink-0 text-mint" />
                <p className="text-[11.5px] leading-5 text-slate-600">
                  Nenhum alerta ativo neste projeto. Mantém a verificação agendada e
                  reconfirma depois de cada dependência nova.
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
            <MiniStat
              label="Dependências"
              value={`${report.summary.outdated} / ${report.summary.scannedDependencies}`}
              note="desatualizadas"
            />
            <MiniStat
              label="Resolvidos"
              value={String(resolvedCount).padStart(2, "0")}
              note="no histórico"
            />
            <MiniStat
              label="Última leitura"
              value={fmtDateShort(report.scannedAt)}
              note="UTC · sob pedido"
            />
          </div>
        </div>
      </div>

      {report.warnings.length > 0 ? (
        <div className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 sm:mx-6">
          <div className="flex items-start gap-2">
            <InfoIcon size={12} className="mt-0.5 shrink-0 text-amber" />
            <ul className="space-y-1 text-[10.5px] leading-4 text-amber">
              {report.warnings.slice(0, 3).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
