import { ArrowRight, LogoMark } from "./icons";

const NAV_LINKS = [
  { href: "#painel", label: "Painel" },
  { href: "#dependencias", label: "Dependências" },
  { href: "#automacao", label: "Automação" },
  { href: "#partilha", label: "Partilha" },
  { href: "#metodologia", label: "Método" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <a href="#top" className="flex items-center gap-3 rounded-lg">
          <LogoMark size={34} />
          <span>
            <span className="block text-[15px] font-semibold leading-none tracking-[-0.02em] text-slate-900">
              ArquiKota
            </span>
            <span className="mt-1.5 hidden text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:block">
              Manutenção de software
            </span>
          </span>
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-slate-600 transition hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 lg:flex">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-600" />
            <span className="text-[11px] font-medium text-emerald-700">
              Verificação contínua
            </span>
          </span>
          <a
            href="#painel"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-navy px-3.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-navy-soft"
          >
            <span className="sm:hidden">Verificar</span>
            <span className="hidden sm:inline">Nova verificação</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </header>
  );
}
