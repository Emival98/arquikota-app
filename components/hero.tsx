import { ArrowRight, CheckIcon } from "./icons";

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

const TRUST = ["GitHub Actions", "npm registry", "Supabase", "EmailJS"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(760px_320px_at_78%_0%,rgba(29,78,216,0.08),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-sky" />
              Manutenção contínua · Next.js + Vercel
            </span>

            <h1 className="mt-6 max-w-[780px] text-[clamp(2.5rem,4.6vw,4.35rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-slate-900">
              Mantém o projeto <span className="text-sky">saudável</span>, não só a
              funcionar.
            </h1>

            <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-slate-600">
              O ArquiKota lê o repositório, compara dependências com o npm e sinaliza
              APIs depreciadas, runtimes em fim de vida e práticas que já não se usam.
              Cada alerta revela o risco e o comando para corrigir.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#painel"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-navy px-5 text-[13px] font-semibold text-white shadow-[0_12px_24px_-16px_rgba(15,42,74,0.75)] transition hover:bg-navy-soft"
              >
                Verificar um projeto
                <ArrowRight size={15} />
              </a>
              <a
                href="#metodologia"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-[13px] font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Como o modelo decide
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-slate-200/80 pt-5">
              {TRUST.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500"
                >
                  <CheckIcon size={12} className="text-teal-700" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:justify-self-end lg:max-w-[440px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,42,74,0.45)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="kicker">Como funciona</span>
                  <p className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-slate-900">
                    Quatro passos, repetidos sem drama.
                  </p>
                </div>
                <span className="chip chip-sky">4 passos</span>
              </div>

              <ol className="mt-5 space-y-4">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[11px] font-semibold text-sky">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="kicker">Próxima leitura</span>
                  <span className="chip chip-mint">semanal</span>
                </div>
                <p className="mt-2 text-[13px] font-medium text-slate-800">
                  Segunda-feira · 06:00 UTC
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  GitHub Actions · permissões de leitura
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
