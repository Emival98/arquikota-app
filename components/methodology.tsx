import { ExternalIcon } from "./icons";

const METHODS = [
  {
    id: "01",
    title: "Inventário",
    formula: "package.json + config + workflows",
    body: "Lê dependências, scripts, runtime, lockfile, next.config, vercel.json e workflows a partir do branch predefinido. Só repositórios públicos, apenas leitura.",
  },
  {
    id: "02",
    title: "Comparação",
    formula: "instalada vs latest",
    body: "Cada pacote é comparado com a versão latest do npm. Se o registry falhar, o snapshot local é usado e o relatório di-lo em vez de esconder a falha.",
  },
  {
    id: "03",
    title: "Regras",
    formula: "severidade + confiança",
    body: "Node em fim de vida, pacotes descontinuados, APIs removidas do Next/Vercel, ausência de lockfile, testes e verificação agendada. Heurísticas ficam marcadas como tal.",
  },
  {
    id: "04",
    title: "Prioridade",
    formula: "score = 100 − Σ pesos",
    body: "Pesos: 12 crítico, 7 alto, 3 médio, 1 baixo. Resolver um alerta atualiza o score. 75+ saudável, 55–74 atenção, abaixo de 55 crítico.",
  },
];

const CYCLE = [
  {
    title: "Detetar",
    body: "O workflow agendado lê o repositório e consulta o npm sem ninguém abrir o painel.",
  },
  {
    title: "Triar",
    body: "A severidade combina o tipo de risco com o esforço. O texto explica o que acontece se esperares.",
  },
  {
    title: "Corrigir",
    body: "Cada alerta traz um comando ou snippet pronto a colar e o link para a fonte oficial.",
  },
  {
    title: "Confirmar",
    body: "Marcar como resolvido atualiza o score e deixa rasto no histórico do projeto.",
  },
];

const SOURCES = [
  {
    label: "Next.js · upgrade",
    href: "https://nextjs.org/docs/app/guides/upgrading/version-16",
  },
  {
    label: "Node.js · releases",
    href: "https://nodejs.org/en/about/previous-releases",
  },
  {
    label: "Supabase · SSR",
    href: "https://supabase.com/docs/guides/auth/server-side/nextjs",
  },
  {
    label: "Vercel · configuração",
    href: "https://vercel.com/docs/project-configuration",
  },
  {
    label: "Supabase · segurança",
    href: "https://supabase.com/docs/guides/database/secure-data",
  },
  {
    label: "EmailJS · REST API",
    href: "https://www.emailjs.com/docs/rest-api/send/",
  },
];

export default function Methodology() {
  return (
    <section id="metodologia" className="scroll-mt-20 border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <span className="kicker">Metodologia</span>
            <h2 className="mt-4 max-w-sm text-[26px] font-semibold leading-tight tracking-[-0.04em] text-white">
              A prioridade não se adivinha. Calcula-se.
            </h2>
            <p className="mt-4 max-w-sm text-[12px] leading-6 text-fog">
              O relatório combina o que está declarado no repositório com versões
              publicadas e um catálogo de regras versionado. O resultado é
              reproduzível — não é uma sugestão de IA.
            </p>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <span className="kicker">O que muda com o tempo</span>
              <p className="mt-2 text-[11px] leading-5 text-fog">
                Dependências recebem patches todas as semanas, APIs são removidas
                nas versões major e práticas aceites há dois anos deixam de ser
                suportadas. Uma verificação única envelhece no dia seguinte;
                por isso o ciclo tem de ser agendado.
              </p>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist">
              <span className="h-1 w-1 rounded-full bg-mint" />
              snapshot de versões · 22 out 2026
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2">
            {METHODS.map((method) => (
              <div key={method.id} className="bg-[#080d12] p-5">
                <div className="flex items-center justify-between">
                  <span className="kicker">{method.id}</span>
                  <span className="h-1 w-1 rounded-full bg-mint/60" />
                </div>
                <h3 className="mt-3 text-[13px] font-medium text-white/90">
                  {method.title}
                </h3>
                <code className="mt-2 block font-mono text-[10px] leading-5 text-mint/85">
                  {method.formula}
                </code>
                <p className="mt-2 text-[10.5px] leading-5 text-mist">{method.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="kicker">Ciclo de manutenção</span>
              <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-white/90">
                Quatro passos, repetidos sem drama.
              </h3>
            </div>
            <span className="chip chip-mint">contínuo</span>
          </div>

          <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {CYCLE.map((step, index) => (
              <div key={step.title} className="bg-[#080d12] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[0.16em] text-mint/60">
                    0{index + 1}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-mist">
                    {step.title}
                  </span>
                </div>
                <h4 className="mt-3 text-[13px] font-medium text-white/90">{step.title}</h4>
                <p className="mt-2 text-[10.5px] leading-5 text-mist">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-8 border-t border-white/[0.06] pt-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <span className="kicker">Limites do modelo</span>
            <p className="mt-3 max-w-3xl text-[10.5px] leading-5 text-mist">
              O ArquiKota não substitui <code className="font-mono text-fog">npm audit</code>,
              testes de integração ou revisão humana. Não procura vulnerabilidades no
              código da aplicação; observa dependências, configuração e práticas
              declaradas no repositório. Versões e cronogramas mudam — confirma sempre
              na fonte oficial. O histórico de resoluções fica guardado no Supabase e a
              cache local funciona como reserva; sem credenciais, o núcleo continua a
              funcionar com o que estiver no browser. Os relatórios podem ser enviados
              por EmailJS a partir do servidor.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Next.js 16",
                "TypeScript",
                "GitHub REST",
                "npm registry",
                "GitHub Actions",
                "Vercel",
                "Supabase",
                "EmailJS",
              ].map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="kicker">Fontes oficiais</span>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {SOURCES.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-[10px] text-fog transition hover:border-white/[0.14] hover:text-white"
                >
                  {source.label}
                  <ExternalIcon size={11} className="shrink-0 text-mist" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
