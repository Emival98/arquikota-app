import { appendFile, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { LATEST_VERSIONS } from "../lib/catalog";
import { parseVersion, scanProject } from "../lib/engine";
import { fmtDateTimeUtc } from "../lib/format";
import { fetchRegistryData } from "../lib/registry";
import type { Cadence, DependencyInfo, ProjectProfile, Severity } from "../lib/types";

interface PackageJson {
  name?: string;
  description?: string;
  engines?: { node?: string };
  scripts?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
}

const NEXT_CONFIG_PATHS = [
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "next.config.mts",
  "next.config.cjs",
];
const LOCKFILES = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "CRÍTICO",
  high: "ALTO",
  medium: "MÉDIO",
  low: "BAIXO",
};

async function readOptional(path: string): Promise<string | null> {
  try {
    return await readFile(join(process.cwd(), path), "utf8");
  } catch {
    return null;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await readFile(join(process.cwd(), path), "utf8");
    return true;
  } catch {
    return false;
  }
}

function extractDependencies(pkg: PackageJson): DependencyInfo[] {
  const seen = new Set<string>();
  const dependencies: DependencyInfo[] = [];

  function add(source: Record<string, unknown> | undefined, kind: "runtime" | "dev") {
    if (!source) return;
    for (const name of Object.keys(source).sort((a, b) => a.localeCompare(b))) {
      const version = source[name];
      if (seen.has(name) || typeof version !== "string") continue;
      if (/^(workspace|file|link|portal|git|git\+|https?|npm):/i.test(version)) continue;
      seen.add(name);
      dependencies.push({ name, installed: version, kind });
    }
  }

  add(pkg.dependencies, "runtime");
  add(pkg.devDependencies, "dev");
  return dependencies;
}

function buildStack(
  dependencies: DependencyInfo[],
  hasWorkflow: boolean,
): string[] {
  const find = (name: string) => dependencies.find((dependency) => dependency.name === name);
  const stack: string[] = [];
  const next = find("next");
  const nextMajor = parseVersion(next?.installed)?.major;
  if (next) stack.push(nextMajor ? `Next.js ${nextMajor}` : "Next.js");
  if (find("react")) stack.push("React");
  if (dependencies.some((dependency) => dependency.name.startsWith("@supabase/"))) {
    stack.push("Supabase");
  }
  if (find("tailwindcss")) stack.push("Tailwind CSS");
  if (hasWorkflow) stack.push("GitHub Actions");
  if (next) stack.push("Vercel");
  return Array.from(new Set(stack)).slice(0, 5);
}

function buildMarkdown(report: Awaited<ReturnType<typeof scanProject>>): string {
  const lines: string[] = [];
  lines.push("# ArquiKota · relatório de manutenção", "");
  lines.push(
    `**${report.project.name}** · ${fmtDateTimeUtc(report.scannedAt)} · versões ${
      report.latestSource === "npm" ? "consultadas no npm" : "do snapshot local"
    }`,
    "",
  );
  lines.push(
    `## Índice ${report.score}/100 · ${report.verdict}`,
    "",
    `| Críticos | Altos | Médios | Baixos | Dependências desatualizadas |`,
    `| --- | --- | --- | --- | --- |`,
    `| ${report.summary.counts.critical} | ${report.summary.counts.high} | ${report.summary.counts.medium} | ${report.summary.counts.low} | ${report.summary.outdated} de ${report.summary.scannedDependencies} |`,
    "",
  );

  lines.push("## O que corrigir", "");
  if (report.alerts.length === 0) {
    lines.push("Nenhum alerta ativo. Mantém a cadência para detetar a próxima alteração.", "");
  } else {
    for (const alert of report.alerts) {
      lines.push(
        `### [${SEVERITY_LABEL[alert.severity]}] ${alert.title}`,
        "",
        `${alert.subject} · esforço ${alert.effort.toLowerCase()} · ${alert.confidence.toLowerCase()}`,
        "",
        alert.summary,
        "",
        `**Risco de ignorar:** ${alert.risk}`,
        "",
        `**${alert.fix.label}:**`,
        "",
        "```",
        alert.fix.content,
        "```",
        "",
      );
    }
  }

  const outdated = report.dependencies.filter(
    (dependency) => dependency.status !== "ok" && dependency.status !== "unknown",
  );
  lines.push("## Dependências desatualizadas", "");
  if (outdated.length === 0) {
    lines.push("Todas as dependências comparadas estão atualizadas.", "");
  } else {
    lines.push(
      "| Pacote | Tipo | Instalada | Latest | Desvio |",
      "| --- | --- | --- | --- | --- |",
      ...outdated.map(
        (dependency) =>
          `| ${dependency.name} | ${dependency.kind} | ${dependency.installed} | ${
            dependency.latest ?? "—"
          } | ${dependency.gap} |`,
      ),
      "",
    );
  }

  lines.push("## Automação", "");
  lines.push(
    report.automation.configured
      ? `Workflow ativo · ${report.automation.scheduleLabel} · próxima execução ${report.automation.nextRunLabel}`
      : "Workflow ausente. Copia o template do painel para `.github/workflows/arquikota-scan.yml`.",
    "",
  );

  if (report.warnings.length > 0) {
    lines.push("## Avisos da verificação", "");
    for (const warning of report.warnings) lines.push(`- ${warning}`);
    lines.push("");
  }

  lines.push(
    "---",
    "",
    "Relatório gerado por ArquiKota. Não substitui `npm audit`, testes de integração ou revisão humana.",
    "",
  );

  return lines.join("\n");
}

async function main() {
  const packageText = await readOptional("package.json");
  if (!packageText) throw new Error("package.json não encontrado na raiz do repositório.");
  const pkg = JSON.parse(packageText) as PackageJson;

  const workflowDirectory = await readdir(join(process.cwd(), ".github", "workflows")).catch(
    () => [] as string[],
  );
  const hasWorkflow = workflowDirectory.some((file) => /\.ya?ml$/i.test(file));

  let nextConfig: string | null = null;
  for (const path of NEXT_CONFIG_PATHS) {
    nextConfig = await readOptional(path);
    if (nextConfig) break;
  }

  const [vercelJson, nvmrc, lockfile] = await Promise.all([
    readOptional("vercel.json"),
    readOptional(".nvmrc"),
    Promise.all(LOCKFILES.map(exists)).then((results) => results.some(Boolean)),
  ]);

  const dependencies = extractDependencies(pkg);
  const enginesNode = typeof pkg.engines?.node === "string" ? pkg.engines.node : undefined;
  const nvmrcValue = nvmrc?.trim().split(/\r?\n/)[0]?.slice(0, 20) || undefined;
  const nodeMajor = parseVersion(enginesNode)?.major ?? parseVersion(nvmrcValue)?.major;
  const scripts: Record<string, string> = {};
  for (const [name, value] of Object.entries(pkg.scripts ?? {})) {
    if (typeof value === "string") scripts[name] = value;
  }

  const repository = process.env.GITHUB_REPOSITORY ?? "local/arquikota";
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const cadence: Cadence = process.env.ARQUIKOTA_CADENCE === "daily" ? "daily" : "weekly";

  const project: ProjectProfile = {
    id: `github:${repository.toLowerCase()}`,
    name: pkg.name ?? repository,
    repoUrl: `${server}/${repository}`,
    description: pkg.description ?? "Relatório de manutenção ArquiKota.",
    branch: process.env.GITHUB_REF_NAME ?? "main",
    lastCommitAt: null,
    runtime: nodeMajor ? `Node ${nodeMajor}` : "Node não fixado",
    stack: buildStack(dependencies, hasWorkflow),
    dependencies,
    signals: {
      enginesNode,
      nvmrc: nvmrcValue,
      nextConfig: nextConfig ?? undefined,
      vercelJson: vercelJson ?? undefined,
      scripts,
      hasWorkflow,
      hasLockfile: lockfile,
      usesSupabase: dependencies.some((dependency) =>
        dependency.name.startsWith("@supabase/"),
      ),
    },
    source: "github",
  };

  const registry = await fetchRegistryData(dependencies, LATEST_VERSIONS);
  const report = scanProject(project, {
    scannedAt: new Date().toISOString(),
    latest: registry.latest,
    deprecations: registry.deprecations,
    cadence,
    latestSource: registry.latestSource,
    warnings: registry.warnings,
  });

  const markdown = buildMarkdown(report);
  await writeFile(join(process.cwd(), "maintenance-report.md"), markdown, "utf8");

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) await appendFile(summaryFile, markdown, "utf8");

  console.log(
    `ArquiKota · ${project.name} · score ${report.score}/100 (${report.verdict}) · ` +
      `${report.summary.counts.critical} críticos, ${report.summary.counts.high} altos, ` +
      `${report.summary.counts.medium} médios, ${report.summary.counts.low} baixos`,
  );
  console.log("Relatório escrito em maintenance-report.md");
}

main().catch((error: unknown) => {
  console.error("ArquiKota falhou:", error);
  process.exitCode = 1;
});
