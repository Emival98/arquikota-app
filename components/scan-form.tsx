import type { FormEvent } from "react";
import { ArrowRight, SpinnerIcon } from "./icons";
import { Panel, PanelHead, cn } from "./ui";
import { fmtDateShort } from "@/lib/format";
import { DEMO_PRESETS, type DemoPresetId } from "@/lib/preset-options";
import type { Cadence, ScanReport, ScanSource } from "@/lib/types";

export default function ScanForm({
  source,
  onSourceChange,
  presetId,
  onPresetChange,
  repo,
  onRepoChange,
  cadence,
  onCadenceChange,
  pending,
  error,
  report,
  onSubmit,
  className,
}: {
  source: ScanSource;
  onSourceChange: (source: ScanSource) => void;
  presetId: DemoPresetId;
  onPresetChange: (preset: DemoPresetId) => void;
  repo: string;
  onRepoChange: (repo: string) => void;
  cadence: Cadence;
  onCadenceChange: (cadence: Cadence) => void;
  pending: boolean;
  error: string | null;
  report: ScanReport;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
}) {
  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="01 · Verificação"
        title="O que vamos analisar?"
        subtitle="Um cenário demo ou qualquer repositório Node.js público no GitHub."
        aside={<span className="chip">{report.project.runtime}</span>}
      />

      <form onSubmit={onSubmit} className="mt-5 flex flex-1 flex-col px-5 pb-5 sm:px-6">
        <fieldset disabled={pending} className="min-w-0 space-y-4 border-0 p-0">
          <div>
            <div
              role="group"
              aria-label="Origem da verificação"
              className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
            >
              {(
                [
                  { value: "demo" as const, label: "Cenário demo" },
                  { value: "github" as const, label: "GitHub público" },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={source === option.value}
                  onClick={() => onSourceChange(option.value)}
                  className={cn(
                    "h-9 rounded-lg text-[11.5px] font-semibold transition",
                    source === option.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {source === "demo" ? (
            <fieldset className="border-0 p-0">
              <legend className="field-label">Projeto de demonstração</legend>
              <div className="mt-2 space-y-1.5">
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    data-active={presetId === preset.id}
                    onClick={() => onPresetChange(preset.id)}
                    className="preset-button w-full"
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="preset-label text-[12px] font-semibold text-slate-900">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {preset.tagline}
                      </span>
                    </span>
                    <span className="mt-1 text-[10.5px] leading-4 text-slate-500">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <div>
              <label htmlFor="repo" className="field-label">
                Repositório público
              </label>
              <div className="field-shell">
                <input
                  id="repo"
                  name="repo"
                  className="field-input"
                  placeholder="owner/repo"
                  value={repo}
                  onChange={(event) => onRepoChange(event.target.value)}
                  required={source === "github"}
                  maxLength={200}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-describedby="repo-help"
                />
              </div>
              <p id="repo-help" className="mt-2 text-[10.5px] leading-4 text-slate-500">
                Só leitura. Também aceita o URL completo do GitHub. Nenhum token é
                enviado para o browser.
              </p>
            </div>
          )}

          <fieldset className="border-0 p-0">
            <legend className="field-label">Cadência da verificação</legend>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  { value: "weekly" as const, label: "Semanal", note: "segunda · 06:00 UTC" },
                  { value: "daily" as const, label: "Diária", note: "todos os dias · 06:00 UTC" },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={cadence === option.value}
                  onClick={() => onCadenceChange(option.value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left transition",
                    cadence === option.value
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[11.5px] font-semibold",
                      cadence === option.value ? "text-mint" : "text-slate-700",
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[9.5px] text-slate-500">
                    {option.note}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </fieldset>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-5 text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? (
              <>
                <SpinnerIcon size={14} />
                A verificar…
              </>
            ) : (
              <>
                Verificar projeto
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-500">
            <span>Última leitura · {fmtDateShort(report.scannedAt)}</span>
            <span>
              {report.project.branch} · {report.project.runtime}
            </span>
          </div>
        </div>
      </form>
    </Panel>
  );
}
