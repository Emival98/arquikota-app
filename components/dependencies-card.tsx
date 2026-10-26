"use client";

import { useState } from "react";
import { CheckIcon } from "./icons";
import {
  Panel,
  PanelHead,
  SEVERITY_CHIP,
  SeverityDot,
  cn,
} from "./ui";
import type { DependencyRow, Severity } from "@/lib/types";

function StatusBadge({ status, gap }: { status: Severity | "ok" | "unknown"; gap: string }) {
  if (status === "ok") return <span className="chip chip-mint">atual</span>;
  if (status === "unknown") return <span className="chip">n/d</span>;
  return <span className={SEVERITY_CHIP[status]}>{gap}</span>;
}

function KindLabel({ kind }: { kind: "runtime" | "dev" }) {
  return (
    <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-mist">
      {kind === "runtime" ? "runtime" : "dev"}
    </span>
  );
}

export default function DependenciesCard({
  dependencies,
  latestSource,
  className,
}: {
  dependencies: DependencyRow[];
  latestSource: "npm" | "catalog";
  className?: string;
}) {
  const [onlyOutdated, setOnlyOutdated] = useState(false);
  const outdated = dependencies.filter(
    (dependency) => dependency.status !== "ok" && dependency.status !== "unknown",
  );
  const visible = onlyOutdated ? outdated : dependencies;

  return (
    <Panel id="dependencias" className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="05 · Inventário"
        title="Dependências"
        subtitle={
          latestSource === "npm"
            ? "Cada versão instalada é comparada com a versão latest publicada no npm."
            : "Comparação com o snapshot de versões do catálogo local."
        }
        aside={
          <span className={outdated.length > 0 ? "chip chip-amber" : "chip chip-mint"}>
            {outdated.length} {outdated.length === 1 ? "desatualizada" : "desatualizadas"}
          </span>
        }
      />

      <div className="mt-4 px-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-mist">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-mint/70" />
              runtime {dependencies.filter((dependency) => dependency.kind === "runtime").length}
            </span>
            <span className="h-2.5 w-px bg-white/10" />
            <span>dev {dependencies.filter((dependency) => dependency.kind === "dev").length}</span>
          </div>
          <button
            type="button"
            onClick={() => setOnlyOutdated((current) => !current)}
            aria-pressed={onlyOutdated}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-2.5 font-mono text-[8px] uppercase tracking-[0.08em] transition",
              onlyOutdated
                ? "border-amber/30 bg-amber/[0.07] text-amber"
                : "border-white/[0.08] text-mist hover:border-white/[0.16] hover:text-fog",
            )}
          >
            {onlyOutdated ? "Ver todas" : "Só desatualizadas"}
          </button>
        </div>
      </div>

      <div className="mt-3 hidden px-5 sm:px-6 md:block">
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-white/[0.02]">
              <tr className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-mist">
                <th scope="col" className="px-3 py-2.5 font-medium">Pacote</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Tipo</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Instalada</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Latest</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {visible.length > 0 ? (
                visible.map((dependency) => (
                  <tr
                    key={`${dependency.kind}-${dependency.name}`}
                    className="transition-colors hover:bg-white/[0.018]"
                  >
                    <td className="max-w-[260px] px-3 py-2.5">
                      <span className="block truncate font-mono text-[10.5px] text-white/85">
                        {dependency.name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <KindLabel kind={dependency.kind} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-fog">
                      {dependency.installed}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-white/75">
                      {dependency.latest ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <StatusBadge status={dependency.status} gap={dependency.gap} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <span className="inline-flex items-center gap-2 text-[11px] text-fog">
                      <CheckIcon size={13} className="text-mint" />
                      Todas as dependências estão na versão mais recente.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 space-y-2 px-5 md:hidden">
        {visible.length > 0 ? (
          visible.map((dependency) => (
            <div
              key={`${dependency.kind}-${dependency.name}`}
              className="rounded-lg border border-white/[0.06] bg-black/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-mono text-[10.5px] text-white/85">
                    {dependency.name}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <KindLabel kind={dependency.kind} />
                    {dependency.status !== "ok" && dependency.status !== "unknown" ? (
                      <SeverityDot severity={dependency.status} />
                    ) : null}
                  </div>
                </div>
                <StatusBadge status={dependency.status} gap={dependency.gap} />
              </div>
              <div className="mt-2 flex items-center gap-2 font-mono text-[9px] text-mist">
                <span className="text-fog">{dependency.installed}</span>
                <span>→</span>
                <span>{dependency.latest ?? "—"}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-mint/15 bg-mint/[0.035] px-3 py-6 text-center">
            <span className="inline-flex items-center gap-2 text-[11px] text-fog">
              <CheckIcon size={13} className="text-mint" />
              Todas as dependências estão atualizadas.
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-white/[0.06] px-5 py-3 font-mono text-[8px] uppercase tracking-[0.08em] text-mist sm:px-6">
        {latestSource === "npm"
          ? "latest consultado no npm registry durante esta verificação"
          : "snapshot versionado · sem chamada ao npm registry"}
      </div>
    </Panel>
  );
}
