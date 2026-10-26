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
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#05080b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <a href="#top" className="flex items-center gap-3 rounded-lg">
          <LogoMark size={34} />
          <span>
            <span className="block text-[14.5px] font-semibold leading-none tracking-[-0.025em] text-white">
              ArquiKota
            </span>
            <span className="mt-1.5 block font-mono text-[7.5px] uppercase tracking-[0.26em] text-mist">
              maintenance studio
            </span>
          </span>
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[11.5px] text-fog transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 lg:flex">
            <span className="h-1 w-1 animate-pulse-soft rounded-full bg-mint" />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist">
              verificação contínua
            </span>
          </span>
          <a
            href="#painel"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-mint/25 bg-mint/[0.06] px-3 text-[10px] font-medium text-mint transition hover:bg-mint/[0.1]"
          >
            Nova verificação
            <ArrowRight size={12} />
          </a>
        </div>
      </div>
    </header>
  );
}
