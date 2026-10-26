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
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06]">
          <div className="bg-[#080d12] p-3.5">
            <span className="kicker">Cadência</span>
            <p className="mt-1.5 text-[11px] leading-4 text-white/85">
              {automation.scheduleLabel}
            </p>
            <code className="mt-1 block font-mono text-[8.5px] text-mist">{automation.cron}</code>
          </div>
          <div className="bg-[#080d12] p-3.5">
            <span className="kicker">Próxima execução</span>
            <p
              className={cn(
                "mt-1.5 text-[11px] leading-4",
                automation.configured ? "text-white/85" : "text-mist",
              )}
            >
              {automation.nextRunLabel}
            </p>
            <p className="mt-1 font-mono text-[8.5px] text-mist">
              última · {fmtDateShort(automation.lastScanAt)}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="kicker">Workflow</span>
              <p className="mt-1 break-all font-mono text-[9px] leading-4 text-fog">
                {automation.path}
              </p>
            </div>
            <CopyButton text={automation.yaml} label="Copiar YAML" />
          </div>

          <details className="code-details mt-3 border-t border-white/[0.06] pt-3">
            <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] text-fog">
              Ver conteúdo do workflow
              <ChevronDown size={12} className="code-chevron text-mist transition-transform" />
            </summary>
            <pre className="code-block mt-2 max-h-[280px] overflow-y-auto">
              <code>{automation.yaml}</code>
            </pre>
          </details>
        </div>

        {automation.configured ? (
          <div className="mt-3 flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 animate-pulse-soft rounded-full bg-mint" />
            <p className="text-[10px] leading-4 text-mist">
              Ativo. Em cada execução o workflow instala as dependências, corre{" "}
              <code className="font-mono text-fog">npm run scan:ci</code> e publica{" "}
              <code className="font-mono text-fog">maintenance-report.md</code> como artefacto.
              As permissões ficam limitadas a <code className="font-mono text-fog">contents: read</code>.
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-amber/20 bg-amber/[0.04] px-3 py-2.5">
            <div className="flex items-start gap-2">
              <InfoIcon size={12} className="mt-0.5 shrink-0 text-amber" />
              <p className="text-[10px] leading-4 text-amber/85">
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
