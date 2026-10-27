import { CheckIcon, InfoIcon } from "./icons";
import { KIND_LABEL, Panel, PanelHead, cn } from "./ui";
import { fmtDateShort } from "@/lib/format";
import type { ResolvedAlert } from "@/lib/types";

type StorageMode = "loading" | "supabase" | "local";

const STORAGE_LABEL: Record<StorageMode, string> = {
  loading: "a ligar",
  supabase: "Supabase",
  local: "local",
};

export default function ResolvedCard({
  resolved,
  storedIds,
  storage,
  error,
  clearing,
  onClearStored,
  className,
}: {
  resolved: ResolvedAlert[];
  storedIds: Set<string>;
  storage: StorageMode;
  error: string | null;
  clearing: boolean;
  onClearStored: () => void;
  className?: string;
}) {
  const items = [...resolved].sort((a, b) => b.resolvedAt.localeCompare(a.resolvedAt));
  const storedCount = storedIds.size;

  return (
    <Panel id="historico" className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="07 · Histórico"
        title="Alertas resolvidos"
        subtitle="A memória do projeto: o que já foi corrigido, quando e o que ficou aprendido."
        aside={
          <>
            <span className="chip chip-mint">{resolved.length}</span>
            <span className="chip">{STORAGE_LABEL[storage]}</span>
          </>
        }
      />

      <div className="mt-4 flex-1 px-5 pb-5 sm:px-6">
        {items.length > 0 ? (
          <ol className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
            {items.map((entry) => {
              const stored = storedIds.has(entry.id);
              return (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-mint">
                    <CheckIcon size={10} />
                  </span>
                  <div className="min-w-0 flex-1 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[12px] font-medium leading-4 text-slate-900">
                        {entry.title}
                      </p>
                      <time
                        dateTime={entry.resolvedAt}
                        className="shrink-0 text-[10.5px] text-slate-500"
                      >
                        {fmtDateShort(entry.resolvedAt)}
                      </time>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10.5px] font-medium text-slate-500">
                        {KIND_LABEL[entry.category]}
                      </span>
                      {stored && storage !== "loading" ? (
                        <span className={storage === "supabase" ? "chip chip-mint" : "chip chip-sky"}>
                          {STORAGE_LABEL[storage]}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[10.5px] leading-4 text-slate-500">{entry.note}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
              <CheckIcon size={15} />
            </span>
            <p className="mt-3 text-[12px] font-medium text-slate-900">
              Ainda não há resoluções registadas
            </p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-500">
              Marca um alerta como resolvido para começar a construir o histórico deste
              projeto.
            </p>
          </div>
        )}

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <InfoIcon size={12} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-[10.5px] leading-4 text-amber">{error}</p>
          </div>
        ) : null}

        {storedCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
            <span className="text-[10.5px] text-slate-500">
              {storedCount} {storedCount === 1 ? "resolução guardada" : "resoluções guardadas"}{" "}
              {storage === "supabase" ? "no Supabase" : "neste browser"}
            </span>
            <button
              type="button"
              onClick={onClearStored}
              disabled={clearing || storage === "loading"}
              className="text-[10.5px] font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              {clearing ? "A limpar…" : "Limpar histórico"}
            </button>
          </div>
        ) : (
          <p className="mt-4 border-t border-slate-200 pt-3 text-[10.5px] text-slate-500">
            {storage === "supabase"
              ? "Histórico de demonstração · novas ações guardadas no Supabase"
              : storage === "local"
                ? "Modo local · Supabase indisponível; ações guardadas neste browser"
                : "A sincronizar o histórico com o Supabase…"}
          </p>
        )}
      </div>
    </Panel>
  );
}
