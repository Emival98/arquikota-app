import { LogoMark } from "./icons";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="text-[12px] text-slate-600">
            ArquiKota{" "}
            <span className="text-slate-400">· manutenção contínua de software</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10.5px] font-medium text-slate-500">
          <span>API · /scan · /resolutions · /notify</span>
          <span className="hidden h-3 w-px bg-slate-200 sm:block" />
          <span>Regras v1 · out 2026</span>
          <span className="hidden h-3 w-px bg-slate-200 sm:block" />
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
