import CopyButton from "./copy-button";
import { ChevronDown, InfoIcon } from "./icons";
import { Panel, PanelHead, cn } from "./ui";
import { fmtDateShort } from "@/lib/format";
import type { AutomationInfo } from "@/lib/types";

export default function AutomationCard({
  automation,
  className,
}: {
  automation: AutomationInfo;
  className?: string;
}) {
  return (
    <Panel id="automacao" className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="06 · Automação"
        title="Verificação agendada"
        subtitle="O GitHub Actions corre a análise sem ninguém abrir o painel e guarda o relatório como artefacto."
        aside={
          <span className={automation.configured ? "chip chip-mint" : "chip chip-amber"}>
            {automation.configured ? "ativo" : "por ativar"}
          </span>
        }
      />

      <div className="mt-4 px-5 pb-5 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
          <div className="bg-white p-3.5">
            <span className="kicker">Cadência</span>
            <p className="mt-1.5 text-[12px] font-medium leading-4 text-slate-900">
              {automation.scheduleLabel}
            </p>
            <code className="mt-1 block font-mono text-[9.5px] text-slate-500">{automation.cron}</code>
          </div>
          <div className="bg-white p-3.5">
            <span className="kicker">Próxima execução</span>
            <p
              className={cn(
                "mt-1.5 text-[12px] font-medium leading-4",
                automation.configured ? "text-slate-900" : "text-slate-500",
              )}
            >
              {automation.nextRunLabel}
            </p>
            <p className="mt-1 font-mono text-[9.5px] text-slate-500">
              última · {fmtDateShort(automation.lastScanAt)}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="kicker">Workflow</span>
              <p className="mt-1 break-all font-mono text-[10px] leading-4 text-slate-600">
                {automation.path}
              </p>
            </div>
            <CopyButton text={automation.yaml} label="Copiar YAML" />
          </div>

          <details className="code-details mt-3 border-t border-slate-200 pt-3">
            <summary className="flex cursor-pointer items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
              Ver conteúdo do workflow
              <ChevronDown size={12} className="code-chevron text-slate-400 transition-transform" />
            </summary>
            <pre className="code-block mt-2 max-h-[280px] overflow-y-auto">
              <code>{automation.yaml}</code>
            </pre>
          </details>
        </div>

        {automation.configured ? (
          <div className="mt-3 flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 animate-pulse-soft rounded-full bg-emerald-500" />
            <p className="text-[10.5px] leading-4 text-slate-500">
              Ativo. Em cada execução o workflow instala as dependências, corre{" "}
              <code className="font-mono text-slate-700">npm run scan:ci</code> e publica{" "}
              <code className="font-mono text-slate-700">maintenance-report.md</code> como artefacto.
              As permissões ficam limitadas a <code className="font-mono text-slate-700">contents: read</code>.
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <InfoIcon size={12} className="mt-0.5 shrink-0 text-amber" />
              <p className="text-[10.5px] leading-4 text-amber">
                Copia o YAML para <code className="font-mono">{automation.path}</code> e faz
                commit. A partir daí a análise deixa de depender de uma verificação manual.
              </p>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
