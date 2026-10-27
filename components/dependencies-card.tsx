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
    <span className="text-[10.5px] font-medium text-slate-500">
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
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              runtime {dependencies.filter((dependency) => dependency.kind === "runtime").length}
            </span>
            <span className="h-2.5 w-px bg-slate-300" />
            <span>dev {dependencies.filter((dependency) => dependency.kind === "dev").length}</span>
          </div>
          <button
            type="button"
            onClick={() => setOnlyOutdated((current) => !current)}
            aria-pressed={onlyOutdated}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-2.5 text-[10.5px] font-medium transition",
              onlyOutdated
                ? "border-amber-300 bg-amber-50 text-amber"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {onlyOutdated ? "Ver todas" : "Só desatualizadas"}
          </button>
        </div>
      </div>

      <div className="mt-3 hidden px-5 sm:px-6 md:block">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <th scope="col" className="px-3 py-2.5 font-semibold">Pacote</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Tipo</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Instalada</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Latest</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length > 0 ? (
                visible.map((dependency) => (
                  <tr
                    key={`${dependency.kind}-${dependency.name}`}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="max-w-[260px] px-3 py-2.5">
                      <span className="block truncate font-mono text-[11px] text-slate-900">
                        {dependency.name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <KindLabel kind={dependency.kind} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-600">
                      {dependency.installed}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-700">
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
                    <span className="inline-flex items-center gap-2 text-[11.5px] text-slate-600">
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
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-mono text-[11px] text-slate-900">
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
              <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-slate-500">
                <span className="text-slate-600">{dependency.installed}</span>
                <span>→</span>
                <span>{dependency.latest ?? "—"}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-6 text-center">
            <span className="inline-flex items-center gap-2 text-[11.5px] text-slate-600">
              <CheckIcon size={13} className="text-mint" />
              Todas as dependências estão atualizadas.
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-slate-200 px-5 py-3 text-[10.5px] text-slate-500 sm:px-6">
        {latestSource === "npm"
          ? "Latest consultado no npm registry durante esta verificação."
          : "Snapshot versionado · sem chamada ao npm registry."}
      </div>
    </Panel>
  );
}
