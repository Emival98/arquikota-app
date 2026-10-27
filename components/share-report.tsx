"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckIcon, InfoIcon, SpinnerIcon } from "./icons";
import { STATUS_COLOR, Panel, PanelHead, cn } from "./ui";
import { fmtDateShort } from "@/lib/format";
import type {
  AlertCounts,
  HealthStatus,
  MaintenanceAlert,
  ScanReport,
} from "@/lib/types";

export default function ShareReport({
  report,
  score,
  status,
  verdict,
  counts,
  alerts,
  className,
}: {
  report: ScanReport;
  score: number;
  status: HealthStatus;
  verdict: "Saudável" | "Atenção" | "Crítico";
  counts: AlertCounts;
  alerts: MaintenanceAlert[];
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const to = email.trim();
    setPending(true);
    setError(null);
    setSentTo(null);

    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          projectName: report.project.name,
          score,
          verdict,
          critical: counts.critical,
          high: counts.high,
          total: counts.total,
          topAlert:
            alerts.find((alert) => alert.severity === "critical")?.title ??
            alerts[0]?.title ??
            "Sem alertas ativos",
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Não foi possível enviar o relatório.");
      }

      setSentTo(to);
      setEmail("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível enviar o relatório.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel id="partilha" className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="08 · Partilha"
        title="Enviar resumo por email"
        subtitle="Indica o destinatário e envia. O resumo é entregue pelo EmailJS a partir do servidor; não abre o teu cliente de email e não anexa ficheiros."
        aside={<span className="chip chip-sky">EmailJS</span>}
      />

      <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col px-5 pb-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div className="min-w-0">
            <span className="kicker">Resumo a enviar</span>
            <p className="mt-1 truncate text-[12px] font-medium text-slate-900">
              {report.project.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-medium text-slate-500">
            <span className="text-[17px] font-semibold leading-none tracking-[-0.03em] text-slate-900">
              {score}
            </span>
            <span>/100</span>
            <span className="h-3 w-px bg-slate-300" />
            <span style={{ color: STATUS_COLOR[status] }}>{verdict}</span>
            <span className="h-3 w-px bg-slate-300" />
            <span>{counts.critical} crít.</span>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="report-email" className="field-label">
            Email de destino
          </label>
          <div className="field-shell mt-2">
            <input
              id="report-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              className="field-input"
              placeholder="nome@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
              aria-describedby="report-email-help"
            />
          </div>
          <p id="report-email-help" className="mt-2 text-[10.5px] leading-4 text-slate-500">
            O destinatário recebe o score, o estado, as contagens de alertas e a prioridade
            imediata. Limite de 5 envios por 10 minutos.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-5 text-red-700"
          >
            {error}
          </div>
        ) : null}

        {sentTo ? (
          <div
            role="status"
            className="mt-3 flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[11px] leading-5 text-teal-700"
          >
            <CheckIcon size={12} className="mt-0.5 shrink-0" />
            <span>Relatório enviado para {sentTo}. Verifica também a pasta de spam.</span>
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? (
              <>
                <SpinnerIcon size={14} />
                A enviar…
              </>
            ) : (
              <>
                Enviar relatório
                <ArrowRight size={14} />
              </>
            )}
          </button>
          <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-slate-500">
            <InfoIcon size={10} className="shrink-0" />
            Leitura {fmtDateShort(report.scannedAt)} · via EmailJS
          </p>
        </div>
      </form>
    </Panel>
  );
}
