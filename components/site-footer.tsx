import { LogoMark } from "./icons";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex items-center gap-2.5">
          <LogoMark size={24} />
          <span className="text-[11px] text-fog">
            ArquiKota <span className="text-mist">· maintenance studio</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[0.12em] text-mist">
          <span>API · /scan · /resolutions · /notify</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span>regras v1 · out 2026</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
