import {
  AUTOMATION_PATH,
  buildWorkflowYaml,
  CADENCE,
  DEPRECATED_PACKAGES,
  LATEST_VERSIONS,
  MINIMUM_NODE_MAJOR,
  NODE_RELEASES,
  RECOMMENDED_NODE_MAJOR,
} from "./catalog";
import { fmtDateTimeUtc } from "./format";
import { scoreAlerts, statusFromScore, verdictFromStatus } from "./score";
import type {
  AlertCounts,
  AlertKind,
  Cadence,
  DependencyRow,
  HistoryPoint,
  MaintenanceAlert,
  ProjectProfile,
  ResolvedAlert,
  ScanReport,
  Severity,
} from "./types";

export interface Semver {
  major: number;
  minor: number;
  patch: number;
}

export interface HistorySeed {
  daysAgo: number;
  score: number;
  critical: number;
  high: number;
}

export interface ScanOptions {
  scannedAt: string;
  latest: Record<string, string>;
  deprecations?: Record<string, string>;
  cadence: Cadence;
  latestSource?: "npm" | "catalog";
  resolved?: ResolvedAlert[];
  history?: HistorySeed[];
  warnings?: string[];
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function parseVersion(raw: string | null | undefined): Semver | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
  };
}

export function versionGap(
  installed: string,
  latest: string | null,
): "ok" | "patch" | "minor" | "major" | "unknown" {
  const from = parseVersion(installed);
  const to = parseVersion(latest);
  if (!from || !to) return "unknown";
  if (to.major > from.major) return "major";
  if (to.major < from.major) return "ok";
  if (to.minor > from.minor) return "minor";
  if (to.minor < from.minor) return "ok";
  if (to.patch > from.patch) return "patch";
  return "ok";
}

export function versionGapLabel(installed: string, latest: string | null): string {
  const from = parseVersion(installed);
  const to = parseVersion(latest);
  if (!from || !to) return "—";
  if (to.major > from.major) {
    const diff = to.major - from.major;
    return `${diff} ${diff === 1 ? "major" : "majors"}`;
  }
  if (to.minor > from.minor) {
    const diff = to.minor - from.minor;
    return `${diff} ${diff === 1 ? "minor" : "minors"}`;
  }
  if (to.patch > from.patch) {
    const diff = to.patch - from.patch;
    return `${diff} ${diff === 1 ? "patch" : "patches"}`;
  }
  return "atual";
}

export function dependencyStatus(
  installed: string,
  latest: string | null,
): Severity | "ok" | "unknown" {
  const gap = versionGap(installed, latest);
  if (gap === "unknown") return "unknown";
  if (gap === "ok") return "ok";
  if (gap === "major") {
    const from = parseVersion(installed);
    const to = parseVersion(latest);
    if (!from || !to) return "high";
    return to.major - from.major >= 2 ? "critical" : "high";
  }
  if (gap === "minor") return "medium";
  return "low";
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

function generations(gap: number): string {
  if (gap === 1) return "uma geração";
  if (gap === 2) return "duas gerações";
  if (gap === 3) return "três gerações";
  return `${gap} gerações`;
}

function buildRows(project: ProjectProfile, latest: Record<string, string>): DependencyRow[] {
  return project.dependencies.map((dependency) => {
    const latestVersion = latest[dependency.name] ?? null;
    return {
      ...dependency,
      latest: latestVersion,
      status: dependencyStatus(dependency.installed, latestVersion),
      gap: versionGapLabel(dependency.installed, latestVersion),
    };
  });
}

function nodeAlert(project: ProjectProfile): MaintenanceAlert | null {
  const declared = project.signals.enginesNode ?? project.signals.nvmrc;
  const major = parseVersion(declared)?.major ?? null;

  if (major === null) {
    return {
      id: "runtime-unpinned",
      kind: "runtime",
      severity: "low",
      title: "Runtime Node sem versão fixada",
      subject: "engines.node / .nvmrc",
      current: "não fixado",
      recommended: `Node ${RECOMMENDED_NODE_MAJOR} LTS`,
      summary:
        "O projeto não declara a versão de Node em engines.node nem em .nvmrc. O runtime escolhido pela Vercel pode mudar sem uma alteração no repositório.",
      risk:
        "Um deploy pode passar a correr noutra versão de Node sem aviso. A diferença de comportamento só aparece em produção, quando já é difícil reproduzir.",
      fix: {
        kind: "command",
        label: "Fixar a versão de Node",
        language: "bash",
        content: `echo "${RECOMMENDED_NODE_MAJOR}" > .nvmrc\nnpm pkg set engines.node=">=${RECOMMENDED_NODE_MAJOR}"`,
      },
      effort: "Baixo",
      confidence: "Confirmado",
      docsUrl: "https://nodejs.org/en/about/previous-releases",
    };
  }

  if (major >= MINIMUM_NODE_MAJOR) return null;

  const release = NODE_RELEASES.find((entry) => entry.major === major);
  const critical = major < 20;
  return {
    id: `runtime-node-${major}`,
    kind: "runtime",
    severity: critical ? "critical" : "high",
    title: `Runtime Node ${major} em fim de vida`,
    subject: "engines.node / Vercel",
    current: `Node ${major}`,
    recommended: `Node ${RECOMMENDED_NODE_MAJOR} LTS`,
    summary: `A linha Node ${major} já não recebe correções de segurança${
      release ? ` desde ${release.eol}` : ""
    }. O runtime mais recente suportado pela arquitetura é o Node ${RECOMMENDED_NODE_MAJOR}.`,
    risk:
      "Sem patches de segurança, qualquer vulnerabilidade conhecida no runtime fica permanente. A Vercel pode retirar o suporte e bloquear novos deploys, e o salto de versão fica maior com o tempo.",
    fix: {
      kind: "command",
      label: "Atualizar o runtime e fixar a versão",
      language: "bash",
      content: `nvm install ${RECOMMENDED_NODE_MAJOR}\nnvm use ${RECOMMENDED_NODE_MAJOR}\necho "${RECOMMENDED_NODE_MAJOR}" > .nvmrc\nnpm pkg set engines.node=">=${RECOMMENDED_NODE_MAJOR}"`,
    },
    effort: "Baixo",
    confidence: "Confirmado",
    docsUrl: "https://nodejs.org/en/about/previous-releases",
  };
}

function frameworkAlert(rows: DependencyRow[]): MaintenanceAlert | null {
  const next = rows.find((row) => row.name === "next");
  const react = rows.find((row) => row.name === "react");
  const nextVersion = parseVersion(next?.installed);
  const nextLatest = parseVersion(next?.latest);
  const reactVersion = parseVersion(react?.installed);
  const reactLatest = parseVersion(react?.latest);

  const nextGap =
    next && nextVersion && nextLatest ? Math.max(0, nextLatest.major - nextVersion.major) : 0;
  const reactGap =
    react && reactVersion && reactLatest
      ? Math.max(0, reactLatest.major - reactVersion.major)
      : 0;

  if (nextGap === 0 && reactGap === 0) return null;

  if (nextGap > 0 && next && next.latest) {
    const reactBehind = reactGap > 0 && react?.latest;
    const current = `Next ${next.installed}${react && reactBehind ? ` · React ${react.installed}` : ""}`;
    const recommended = `Next ${next.latest}${react && reactBehind ? ` · React ${react.latest}` : ""}`;
    return {
      id: "dependency-framework-major",
      kind: "dependency",
      severity: "high",
      title: `Next.js ${nextVersion?.major} está ${generations(nextGap)} atrás`,
      subject: "Next.js + React",
      current,
      recommended,
      summary: `O projeto está preso ao Next.js ${nextVersion?.major}${
        reactBehind ? ` e ao React ${reactVersion?.major}` : ""
      }. As versões atuais do catálogo são Next.js ${next.latest}${
        reactBehind ? ` e React ${react.latest}` : ""
      }, com correções e APIs mais recentes.`,
      risk:
        "As linhas antigas deixam de receber correções de segurança e de compatibilidade com a Vercel. Adiar o upgrade aumenta o número de breaking changes de uma só vez, incluindo middleware, APIs assíncronas e configuração de imagens.",
      fix: {
        kind: "command",
        label: "Atualizar Next.js, React e o preset de ESLint",
        language: "bash",
        content:
          "npm install next@latest react@latest react-dom@latest eslint-config-next@latest",
      },
      effort: "Alto",
      confidence: "Confirmado",
      docsUrl: "https://nextjs.org/docs/app/guides/upgrading/version-16",
    };
  }

  if (reactGap > 0 && react?.latest) {
    return {
      id: "dependency-react-major",
      kind: "dependency",
      severity: "medium",
      title: `React ${reactVersion?.major} está atrás da versão atual`,
      subject: "React",
      current: react.installed,
      recommended: react.latest,
      summary: `O Next.js está atualizado, mas o React ${reactVersion?.major} continua instalado. O catálogo atual aponta para React ${react.latest}.`,
      risk:
        "A versão antiga do React pode ficar incompatível com o compilador e as APIs mais recentes do Next.js, além de perder correções de renderização.",
      fix: {
        kind: "command",
        label: "Atualizar React",
        language: "bash",
        content: "npm install react@latest react-dom@latest",
      },
      effort: "Médio",
      confidence: "Confirmado",
      docsUrl: "https://react.dev/blog",
    };
  }

  return null;
}

function deprecatedAlerts(
  rows: DependencyRow[],
  deprecations: Record<string, string>,
): MaintenanceAlert[] {
  return rows.flatMap((row) => {
    const message = deprecations[row.name];
    if (!message) return [];
    const known = DEPRECATED_PACKAGES[row.name];
    return [
      {
        id: `deprecated-${row.name}`,
        kind: "dependency",
        severity: known?.severity ?? "high",
        title: `Pacote descontinuado: ${row.name}`,
        subject: row.name,
        current: row.installed,
        recommended: known?.replacement ?? "pacote mantido",
        summary: known?.reason ?? truncate(message, 240),
        risk:
          known?.risk ??
          "O pacote já não recebe correções. Uma alteração no runtime ou nas dependências vizinhas pode quebrá-lo sem que exista uma versão corrigida.",
        fix: {
          kind: "command",
          label: "Substituir o pacote",
          language: "bash",
          content: known?.fixCommand ?? `npm uninstall ${row.name}`,
        },
        effort: known?.effort ?? "Médio",
        confidence: "Confirmado",
        docsUrl: known?.docsUrl,
      } satisfies MaintenanceAlert,
    ];
  });
}

function lintAlert(project: ProjectProfile): MaintenanceAlert | null {
  if (!/\bnext\s+lint\b/.test(project.signals.scripts.lint ?? "")) return null;
  return {
    id: "practice-next-lint",
    kind: "practice",
    severity: "medium",
    title: "O script `next lint` já não existe no Next.js atual",
    subject: "package.json › scripts.lint",
    current: "next lint",
    recommended: "eslint .",
    summary:
      "O comando `next lint` foi retirado no Next.js 16. O script continua declarado no projeto e falhará assim que o Next.js for atualizado.",
    risk:
      "O lint deixa de correr localmente ou o pipeline falha num passo que parecia estável. Sem lint, importações inválidas e regras de acessibilidade passam para produção.",
    fix: {
      kind: "command",
      label: "Migrar para o CLI do ESLint",
      language: "bash",
      content:
        'npm pkg delete scripts.lint\nnpm pkg set scripts.lint="eslint ."\nnpm install -D eslint eslint-config-next',
    },
    effort: "Baixo",
    confidence: "Confirmado",
    docsUrl: "https://nextjs.org/docs/app/api-reference/config/eslint",
  };
}

function imagesAlert(project: ProjectProfile): MaintenanceAlert | null {
  const config = project.signals.nextConfig;
  if (!config || !config.includes("images") || !/domains\s*:/.test(config)) return null;
  const domainsBlock = config.match(/domains\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const hostname = domainsBlock.match(/["']([^"']+)["']/)?.[1] ?? "images.example.com";
  return {
    id: "platform-next-images-domains",
    kind: "platform",
    severity: "medium",
    title: "`images.domains` é uma API depreciada",
    subject: "next.config › images.domains",
    current: `domains: ["${hostname}"]`,
    recommended: "images.remotePatterns",
    summary:
      "A lista `domains` foi substituída por `remotePatterns`, que permite limitar protocolo, host e caminho. A configuração antiga não acompanha as proteções atuais de otimização de imagens.",
    risk:
      "Imagens externas podem deixar de ser otimizadas ou de carregar após um upgrade do Next.js. Uma allowlist demasiado larga também abre a otimização a hosts que não controlas.",
    fix: {
      kind: "snippet",
      label: "Substituir pela configuração atual",
      language: "ts",
      content: `images: {\n  remotePatterns: [\n    { protocol: "https", hostname: "${hostname}" },\n  ],\n},`,
    },
    effort: "Baixo",
    confidence: "Confirmado",
    docsUrl: "https://nextjs.org/docs/app/api-reference/components/image#remotepatterns",
  };
}

function targetAlert(project: ProjectProfile): MaintenanceAlert | null {
  if (!/target\s*:\s*["']serverless["']/.test(project.signals.nextConfig ?? "")) return null;
  return {
    id: "platform-next-target",
    kind: "platform",
    severity: "medium",
    title: "A opção `target: \"serverless\"` está obsoleta",
    subject: "next.config › target",
    current: 'target: "serverless"',
    recommended: "remover a opção",
    summary:
      "O Next.js moderno deteta o output na Vercel sem esta opção. `target: \"serverless\"` foi removido e não altera o comportamento atual.",
    risk:
      "A configuração dá uma falsa sensação de controlo sobre o output. Numa atualização, a opção desconhecida pode falhar a validação do next.config e bloquear o build.",
    fix: {
      kind: "snippet",
      label: "Remover a chave do next.config",
      language: "ts",
      content: `const nextConfig = {\n  // Mantém as restantes opções; remove apenas \`target\`.\n};`,
    },
    effort: "Baixo",
    confidence: "Heurística",
    docsUrl: "https://nextjs.org/docs/app/api-reference/config/next-config-js",
  };
}

function vercelBuildsAlert(project: ProjectProfile): MaintenanceAlert | null {
  if (!project.signals.vercelJson?.includes('"builds"')) return null;
  return {
    id: "platform-vercel-builds",
    kind: "platform",
    severity: "medium",
    title: "`builds` no vercel.json ignora a deteção automática",
    subject: "vercel.json › builds",
    current: "builds: [...]",
    recommended: "framework: nextjs",
    summary:
      "A lista `builds` é uma configuração antiga da Vercel. Com Next.js, a plataforma deteta o framework e o output automaticamente; a lista manual pode ficar desalinhada com o build atual.",
    risk:
      "O build pode usar um builder antigo, ignorar otimizações do framework ou divergir do build local. O erro aparece apenas no deploy, sem relação óbvia com a alteração feita.",
    fix: {
      kind: "snippet",
      label: "Simplificar a configuração da Vercel",
      language: "json",
      content: `{\n  "framework": "nextjs"\n}`,
    },
    effort: "Baixo",
    confidence: "Heurística",
    docsUrl: "https://vercel.com/docs/project-configuration",
  };
}

function workflowAlert(
  project: ProjectProfile,
  cadence: Cadence,
): MaintenanceAlert | null {
  if (project.signals.hasWorkflow) return null;
  return {
    id: "automation-workflow-missing",
    kind: "automation",
    severity: "medium",
    title: "Sem verificação periódica no GitHub Actions",
    subject: AUTOMATION_PATH,
    current: "inexistente",
    recommended: CADENCE[cadence].label,
    summary:
      "Não foi encontrado um workflow de manutenção no repositório. A análise só acontece quando alguém abre este painel, o que depende de disciplina e memória.",
    risk:
      "Dependências e APIs depreciadas acumulam-se entre deploys. A equipa descobre a quebra quando a produção falha, já com menos tempo para corrigir e sem histórico de quando o problema começou.",
    fix: {
      kind: "snippet",
      label: "Criar o workflow agendado",
      language: "yaml",
      content: buildWorkflowYaml(cadence),
    },
    effort: "Baixo",
    confidence: "Heurística",
    docsUrl:
      "https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule",
  };
}

function lockfileAlert(project: ProjectProfile): MaintenanceAlert | null {
  if (project.signals.hasLockfile) return null;
  return {
    id: "practice-lockfile",
    kind: "practice",
    severity: "medium",
    title: "Repositório sem lockfile versionado",
    subject: "package-lock.json / pnpm-lock.yaml",
    current: "ausente",
    recommended: "lockfile commitado",
    summary:
      "Sem um lockfile no repositório, cada instalação pode resolver versões diferentes das mesmas dependências declaradas no package.json.",
    risk:
      "O build na Vercel pode receber versões que nunca foram testadas localmente. A falha é intermitente e difícil de reproduzir; também não é possível auditar com precisão o que está em produção.",
    fix: {
      kind: "command",
      label: "Gerar e versionar o lockfile",
      language: "bash",
      content:
        'npm install --package-lock-only\ngit add package-lock.json\ngit commit -m "chore: fixar lockfile"',
    },
    effort: "Baixo",
    confidence: "Heurística",
    docsUrl: "https://docs.npmjs.com/cli/configuring-npm/package-lock-json",
  };
}

function testsAlert(project: ProjectProfile): MaintenanceAlert | null {
  if (project.signals.scripts.test) return null;
  return {
    id: "practice-tests",
    kind: "practice",
    severity: "low",
    title: "Sem script de testes automatizados",
    subject: "package.json › scripts.test",
    current: "ausente",
    recommended: "vitest run",
    summary:
      "O projeto não declara um comando de testes. Não existe uma forma rápida de confirmar que uma atualização de dependências não alterou o comportamento.",
    risk:
      "Cada upgrade passa a ser validado manualmente ou diretamente em produção. Regressões pequenas ficam escondidas até um utilizador as encontrar.",
    fix: {
      kind: "command",
      label: "Adicionar uma base de testes",
      language: "bash",
      content: 'npm install -D vitest\nnpm pkg set scripts.test="vitest run"',
    },
    effort: "Alto",
    confidence: "Heurística",
    docsUrl: "https://vitest.dev/guide/",
  };
}

function typecheckAlert(
  project: ProjectProfile,
  rows: DependencyRow[],
): MaintenanceAlert | null {
  if (!rows.some((row) => row.name === "typescript")) return null;
  if (project.signals.scripts.typecheck) return null;
  return {
    id: "practice-typecheck",
    kind: "practice",
    severity: "low",
    title: "TypeScript sem script de verificação",
    subject: "package.json › scripts.typecheck",
    current: "ausente",
    recommended: "tsc --noEmit",
    summary:
      "O projeto usa TypeScript, mas não expõe um comando de verificação de tipos. O editor valida ficheiros abertos, não o projeto inteiro.",
    risk:
      "Erros de tipo em ficheiros não abertos só aparecem no build ou em produção. O `next build` pode ignorar erros conforme a configuração, deixando passar contratos inválidos.",
    fix: {
      kind: "command",
      label: "Adicionar verificação de tipos",
      language: "bash",
      content: 'npm pkg set scripts.typecheck="tsc --noEmit"',
    },
    effort: "Baixo",
    confidence: "Heurística",
    docsUrl: "https://www.typescriptlang.org/docs/handbook/tsconfig-json.html",
  };
}

function outdatedAlert(
  rows: DependencyRow[],
  deprecations: Record<string, string>,
): MaintenanceAlert | null {
  const excluded = new Set(["next", "react", "react-dom", "eslint-config-next"]);
  const outdated = rows.filter(
    (row) =>
      row.latest !== null &&
      row.status !== "ok" &&
      row.status !== "unknown" &&
      !excluded.has(row.name) &&
      !deprecations[row.name],
  );
  if (outdated.length === 0) return null;

  const onlyPatches = outdated.every((row) => row.status === "low");
  const preview = outdated
    .slice(0, 4)
    .map((row) => `${row.name} ${row.installed} → ${row.latest}`)
    .join(", ");
  const rest = outdated.length > 4 ? ` e mais ${outdated.length - 4}` : "";
  return {
    id: "dependency-outdated-rollup",
    kind: "dependency",
    severity: onlyPatches ? "low" : "medium",
    title: `${outdated.length} ${
      outdated.length === 1 ? "dependência está" : "dependências estão"
    } fora da versão mais recente`,
    subject: "dependências secundárias",
    current: `${outdated.length} desatualizadas`,
    recommended: "latest",
    summary: `${preview}${rest}. As versões indicadas vêm do npm registry e podem incluir correções de segurança e de compatibilidade.`,
    risk:
      "Cada atualização adiada aumenta o número de alterações que terão de ser testadas juntas. Correções de segurança em dependências diretas e transitivas podem ficar bloqueadas por versões antigas.",
    fix: {
      kind: "command",
      label: "Atualizar as dependências indicadas",
      language: "bash",
      content: `npm install ${outdated.map((row) => `${row.name}@latest`).join(" ")}`,
    },
    effort: "Médio",
    confidence: "Confirmado",
    docsUrl: "https://docs.npmjs.com/cli/commands/npm-update",
  };
}

export function buildAlerts(
  project: ProjectProfile,
  rows: DependencyRow[],
  deprecations: Record<string, string>,
  cadence: Cadence,
): MaintenanceAlert[] {
  const candidates: Array<MaintenanceAlert | null> = [
    nodeAlert(project),
    workflowAlert(project, cadence),
    frameworkAlert(rows),
    ...deprecatedAlerts(rows, deprecations),
    lintAlert(project),
    imagesAlert(project),
    targetAlert(project),
    vercelBuildsAlert(project),
    lockfileAlert(project),
    outdatedAlert(rows, deprecations),
    testsAlert(project),
    typecheckAlert(project, rows),
  ];

  return candidates
    .filter((alert): alert is MaintenanceAlert => alert !== null)
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        a.title.localeCompare(b.title, "pt"),
    );
}

function nextScheduledRun(scannedAt: string, cadence: Cadence): string {
  const now = new Date(scannedAt);
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0);

  if (cadence === "daily") {
    if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString();
  }

  let delta = (1 - next.getUTCDay() + 7) % 7;
  if (delta === 0 && next.getTime() <= now.getTime()) delta = 7;
  next.setUTCDate(next.getUTCDate() + delta);
  return next.toISOString();
}

function historyWithCurrent(
  scannedAt: string,
  score: number,
  counts: AlertCounts,
  seeds: HistorySeed[],
): HistoryPoint[] {
  const currentDate = scannedAt.slice(0, 10);
  const base = new Date(`${currentDate}T00:00:00.000Z`);
  const points = seeds.map((seed) => {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() - seed.daysAgo);
    return {
      date: date.toISOString().slice(0, 10),
      score: Math.max(0, Math.min(100, seed.score)),
      critical: seed.critical,
      high: seed.high,
    };
  });
  points.push({
    date: currentDate,
    score,
    critical: counts.critical,
    high: counts.high,
  });
  return points;
}

export function scanProject(project: ProjectProfile, options: ScanOptions): ScanReport {
  const rows = buildRows(project, options.latest);
  const deprecations = options.deprecations ?? {};
  const alerts = buildAlerts(project, rows, deprecations, options.cadence);
  const score = scoreAlerts(alerts);
  const status = statusFromScore(score);
  const counts: AlertCounts = {
    critical: alerts.filter((alert) => alert.severity === "critical").length,
    high: alerts.filter((alert) => alert.severity === "high").length,
    medium: alerts.filter((alert) => alert.severity === "medium").length,
    low: alerts.filter((alert) => alert.severity === "low").length,
    total: alerts.length,
  };
  const resolved = [...(options.resolved ?? [])].sort((a, b) =>
    b.resolvedAt.localeCompare(a.resolvedAt),
  );
  const outdated = rows.filter((row) => row.status !== "ok" && row.status !== "unknown").length;
  const configured = project.signals.hasWorkflow;
  const cron = CADENCE[options.cadence];
  const nextRun = configured ? nextScheduledRun(options.scannedAt, options.cadence) : null;

  return {
    project,
    scannedAt: options.scannedAt,
    source: project.source,
    latestSource: options.latestSource ?? "catalog",
    score,
    status,
    verdict: verdictFromStatus(status),
    alerts,
    dependencies: rows,
    summary: {
      counts,
      outdated,
      scannedDependencies: rows.length,
      resolvedCount: resolved.length,
    },
    history: historyWithCurrent(options.scannedAt, score, counts, options.history ?? []),
    resolved,
    automation: {
      configured,
      cadence: options.cadence,
      cron: cron.cron,
      scheduleLabel: cron.label,
      nextRunLabel: nextRun ? fmtDateTimeUtc(nextRun) : "Ativa o workflow para agendar",
      lastScanAt: options.scannedAt,
      path: AUTOMATION_PATH,
      yaml: buildWorkflowYaml(options.cadence),
    },
    warnings: options.warnings ?? [],
  };
}

export function latestSnapshot(): Record<string, string> {
  return { ...LATEST_VERSIONS };
}
