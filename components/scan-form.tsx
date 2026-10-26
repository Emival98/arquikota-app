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
              className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-black/20 p-1"
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
                    "h-9 rounded-lg font-mono text-[9px] uppercase tracking-[0.1em] transition",
                    source === option.value
                      ? "bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-mist hover:text-fog",
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
                      <span className="preset-label text-[11.5px] font-medium text-white/85">
                        {preset.name}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-mist">
                        {preset.tagline}
                      </span>
                    </span>
                    <span className="mt-1 text-[9.5px] leading-4 text-mist">
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
              <p id="repo-help" className="mt-2 text-[9.5px] leading-4 text-mist">
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
                      ? "border-mint/35 bg-mint/[0.06]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]",
                  )}
                >
                  <span
                    className={cn(
                      "block font-mono text-[9px] uppercase tracking-[0.08em]",
                      cadence === option.value ? "text-mint" : "text-fog",
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="mt-1 block text-[8.5px] text-mist">{option.note}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </fieldset>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-coral/25 bg-coral/[0.06] px-3 py-2 text-[10.5px] leading-4 text-coral"
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[7.5px] uppercase tracking-[0.1em] text-mist">
            <span>última leitura · {fmtDateShort(report.scannedAt)}</span>
            <span>
              {report.project.branch} · {report.project.runtime}
            </span>
          </div>
        </div>
      </form>
    </Panel>
  );
}
