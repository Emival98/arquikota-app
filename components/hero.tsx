import { ArrowRight } from "./icons";

const STEPS = [
  {
    title: "Detetar",
    description: "Dependências, APIs e configurações fora de prazo.",
  },
  {
    title: "Priorizar",
    description: "Severidade, risco explicado e esforço de correção.",
  },
  {
    title: "Corrigir",
    description: "Comando pronto a colar, com documentação oficial.",
  },
  {
    title: "Registar",
    description: "Histórico do que já foi resolvido e quando.",
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-52 hidden lg:block"
      >
        <div className="relative h-[560px] w-[560px]">
          <div className="absolute inset-0 rounded-full border border-white/[0.05]" />
          <div className="absolute inset-16 rounded-full border border-white/[0.045]" />
          <div className="absolute inset-32 rounded-full border border-mint/[0.09]" />
          <div className="absolute inset-48 rounded-full border border-white/[0.05]" />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/70 shadow-[0_0_16px_rgba(142,240,194,0.7)]" />
        </div>
      </div>

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:py-16 xl:py-20">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-mint/50" />
              <span className="kicker text-mint/75">
                Manutenção contínua · Next.js + Vercel
              </span>
            </div>

            <h1 className="mt-6 max-w-[850px] text-[clamp(2.65rem,5vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-[#f4f8fb]">
              Mantém o projeto <span className="text-mint">saudável</span>, não
              só a funcionar.
            </h1>

            <p className="mt-6 max-w-[540px] text-[13.5px] leading-6 text-fog sm:text-[14px]">
              O ArquiKota lê o repositório, compara dependências com o npm e
              sinaliza APIs depreciadas, runtimes em fim de vida e práticas que
              já não se usam. Cada alerta revela o risco e o comando para
              corrigir.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#painel"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-mint px-4 text-[12px] font-semibold text-[#062115] shadow-[0_10px_28px_-14px_rgba(126,231,184,0.7)] transition hover:brightness-105"
              >
                Verificar um projeto
                <ArrowRight size={14} />
              </a>
              <a
                href="#metodologia"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.1] px-4 text-[12px] text-fog transition hover:border-white/20 hover:text-white"
              >
                Como o modelo decide
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-mist">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-mint/70" />
                npm registry · github actions
              </span>
              <span className="hidden h-3 w-px bg-white/10 sm:block" />
              <span>histórico de resoluções</span>
              <span className="hidden h-3 w-px bg-white/10 sm:block" />
              <span>regras determinísticas</span>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-end lg:justify-end">
            <div className="w-full max-w-[286px]">
              <ol className="border-l border-white/[0.1]">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="relative pb-6 pl-6 last:pb-0">
                    <span className="absolute -left-[3.5px] top-1 h-1.5 w-1.5 rounded-full bg-mint/70" />
                    <span className="font-mono text-[8.5px] tracking-[0.16em] text-mint/60">
                      0{index + 1}
                    </span>
                    <p className="mt-1.5 text-[12px] font-medium text-white/90">
                      {step.title}
                    </p>
                    <p className="mt-1 text-[10.5px] leading-4 text-mist">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/20 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="kicker">Próxima leitura</span>
                  <span className="chip chip-mint">semanal</span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-fog">
                  segunda · 06:00 UTC
                </p>
                <div className="mt-2 flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-mist">
                  <span className="h-1 w-1 rounded-full bg-mint/60" />
                  github actions · contents: read
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
