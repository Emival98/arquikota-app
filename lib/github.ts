import { parseVersion } from "./engine";
import { fetchWithTimeout } from "./http";
import { parseRepoReference } from "./parse";
import type { DependencyInfo, ProjectProfile } from "./types";

export class GithubError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "GithubError";
    this.status = status;
  }
}

interface GithubRepoMeta {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  pushed_at: string | null;
  archived: boolean;
  language: string | null;
}

interface GithubTreeEntry {
  path: string;
  type: string;
}

interface PackageJson {
  name?: string;
  description?: string;
  engines?: { node?: string };
  scripts?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
}

export interface GithubImport {
  project: ProjectProfile;
  warnings: string[];
}

const MAX_DEPENDENCIES = 80;
const MAX_FILE_BYTES = 256_000;
const NEXT_CONFIG_PATHS = [
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "next.config.mts",
  "next.config.cjs",
];
const LOCKFILE_PATHS = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"];

function headers(accept = "application/vnd.github+json"): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ArquiKota-Maintenance-Scanner",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function rawUrl(owner: string, repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${encodePath(branch)}/${encodePath(path)}`;
}

async function githubJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetchWithTimeout(`https://api.github.com${path}`, { headers: headers() });
  } catch {
    throw new GithubError("Não foi possível contactar o GitHub. Tenta novamente.", 502);
  }

  if (response.status === 404) {
    throw new GithubError(
      "Repositório não encontrado. Confirma que é público e que o nome está correto.",
      404,
    );
  }
  if (response.status === 403 || response.status === 429) {
    throw new GithubError(
      "Limite de pedidos ao GitHub atingido. Tenta novamente dentro de alguns minutos.",
      429,
    );
  }
  if (response.status === 409) {
    throw new GithubError("O repositório está vazio.", 422);
  }
  if (!response.ok) {
    throw new GithubError(`O GitHub respondeu com o estado ${response.status}.`, 502);
  }

  return (await response.json()) as T;
}

async function readRawFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  let response: Response;
  try {
    response = await fetchWithTimeout(
      rawUrl(owner, repo, branch, path),
      { headers: { "User-Agent": "ArquiKota-Maintenance-Scanner" } },
      9_000,
    );
  } catch {
    return null;
  }

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_FILE_BYTES) return null;

  const text = await response.text();
  return text.length > MAX_FILE_BYTES ? text.slice(0, MAX_FILE_BYTES) : text;
}

async function rawFileExists(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      rawUrl(owner, repo, branch, path),
      {
        method: "HEAD",
        headers: { "User-Agent": "ArquiKota-Maintenance-Scanner" },
      },
      6_000,
    );
    return response.ok;
  } catch {
    return false;
  }
}

function parseDependencies(pkg: PackageJson): {
  dependencies: DependencyInfo[];
  dropped: number;
} {
  const seen = new Set<string>();
  const dependencies: DependencyInfo[] = [];

  const add = (source: Record<string, unknown> | undefined, kind: "runtime" | "dev") => {
    if (!source || typeof source !== "object") return;
    const names = Object.keys(source).sort((a, b) => a.localeCompare(b));
    for (const name of names) {
      if (seen.has(name)) continue;
      const version = source[name];
      if (typeof version !== "string") continue;
      if (/^(workspace|file|link|portal|git|git\+|https?|npm):/i.test(version)) continue;
      if (version.length > 80 || name.length > 214) continue;
      seen.add(name);
      dependencies.push({ name, installed: version, kind });
    }
  };

  add(pkg.dependencies, "runtime");
  add(pkg.devDependencies, "dev");

  return {
    dependencies: dependencies.slice(0, MAX_DEPENDENCIES),
    dropped: Math.max(0, dependencies.length - MAX_DEPENDENCIES),
  };
}

function buildStack(
  dependencies: DependencyInfo[],
  signals: { hasWorkflow: boolean; hasVercelConfig: boolean; usesSupabase: boolean },
): string[] {
  const find = (name: string) => dependencies.find((dependency) => dependency.name === name);
  const stack: string[] = [];
  const next = find("next");
  const react = find("react");
  const nextMajor = parseVersion(next?.installed)?.major;
  const reactMajor = parseVersion(react?.installed)?.major;

  if (next) stack.push(nextMajor ? `Next.js ${nextMajor}` : "Next.js");
  if (react) stack.push(reactMajor ? `React ${reactMajor}` : "React");
  if (signals.usesSupabase) stack.push("Supabase");
  if (find("tailwindcss")) stack.push("Tailwind CSS");
  if (signals.hasWorkflow) stack.push("GitHub Actions");
  if (signals.hasVercelConfig || next) stack.push("Vercel");

  return Array.from(new Set(stack)).slice(0, 5);
}

export async function importGithubProfile(repoInput: string): Promise<GithubImport> {
  const reference = parseRepoReference(repoInput);
  const meta = await githubJson<GithubRepoMeta>(
    `/repos/${reference.owner}/${reference.repo}`,
  );
  const branch = meta.default_branch || "main";
  const warnings: string[] = [];

  if (meta.archived) {
    warnings.push("Este repositório está arquivado no GitHub. A análise reflete o último estado.");
  }

  let paths: Set<string> | null = null;
  let hasWorkflow = false;

  try {
    const tree = await githubJson<{ tree?: GithubTreeEntry[]; truncated?: boolean }>(
      `/repos/${reference.owner}/${reference.repo}/git/trees/${encodeURIComponent(
        branch,
      )}?recursive=1`,
    );
    paths = new Set(
      (tree.tree ?? []).filter((entry) => entry.type === "blob").map((entry) => entry.path),
    );
    hasWorkflow = Array.from(paths).some(
      (path) => path.startsWith(".github/workflows/") && /\.ya?ml$/i.test(path),
    );
    if (tree.truncated) {
      warnings.push(
        "A árvore do repositório é demasiado grande e foi truncada; a deteção de ficheiros pode estar incompleta.",
      );
    }
  } catch (error) {
    if (error instanceof GithubError && (error.status === 429 || error.status === 404)) throw error;
    warnings.push(
      "Não foi possível listar os ficheiros do repositório; a deteção de workflows e lockfiles ficou limitada.",
    );
  }

  const packageText = await readRawFile(reference.owner, reference.repo, branch, "package.json");
  if (!packageText) {
    throw new GithubError(
      "Este repositório não tem um package.json legível na raiz. O ArquiKota analisa projetos Node.js.",
      422,
    );
  }

  let pkg: PackageJson;
  try {
    pkg = JSON.parse(packageText) as PackageJson;
  } catch {
    throw new GithubError("O package.json do repositório não é um JSON válido.", 422);
  }

  const nextConfigPath =
    NEXT_CONFIG_PATHS.find((path) => paths?.has(path)) ??
    (paths ? null : NEXT_CONFIG_PATHS[0]);

  const [nvmrc, nextConfig, vercelJson] = await Promise.all([
    readRawFile(reference.owner, reference.repo, branch, ".nvmrc"),
    nextConfigPath
      ? readRawFile(reference.owner, reference.repo, branch, nextConfigPath)
      : Promise.resolve(null),
    readRawFile(reference.owner, reference.repo, branch, "vercel.json"),
  ]);

  let hasLockfile = paths
    ? LOCKFILE_PATHS.some((path) => paths?.has(path))
    : false;

  if (!paths) {
    const probes = await Promise.all(
      LOCKFILE_PATHS.map((path) =>
        rawFileExists(reference.owner, reference.repo, branch, path),
      ),
    );
    hasLockfile = probes.some(Boolean);
  }

  const { dependencies, dropped } = parseDependencies(pkg);
  if (dropped > 0) {
    warnings.push(
      `Foram analisadas apenas ${MAX_DEPENDENCIES} dependências; ${dropped} ficaram fora do limite do painel.`,
    );
  }

  const enginesNode = typeof pkg.engines?.node === "string" ? pkg.engines.node : undefined;
  const nvmrcValue = nvmrc?.trim().split(/\r?\n/)[0]?.slice(0, 20) || undefined;
  const nodeMajor = parseVersion(enginesNode)?.major ?? parseVersion(nvmrcValue)?.major;
  const scripts: Record<string, string> = {};
  for (const [name, value] of Object.entries(pkg.scripts ?? {})) {
    if (typeof value === "string" && name.length <= 60 && value.length <= 400) {
      scripts[name] = value;
    }
  }

  const usesSupabase = dependencies.some((dependency) =>
    dependency.name.startsWith("@supabase/"),
  );

  const signals = {
    enginesNode,
    nvmrc: nvmrcValue,
    nextConfig: nextConfig ?? undefined,
    vercelJson: vercelJson ?? undefined,
    scripts,
    hasWorkflow,
    hasLockfile,
    usesSupabase,
  };

  const project: ProjectProfile = {
    id: `github:${meta.full_name.toLowerCase()}`,
    name: meta.name,
    repoUrl: meta.html_url,
    description:
      meta.description ??
      pkg.description ??
      `Repositório público ${meta.full_name} importado do GitHub.`,
    branch,
    lastCommitAt: meta.pushed_at,
    runtime: nodeMajor ? `Node ${nodeMajor}` : "Node não fixado",
    stack: buildStack(dependencies, {
      hasWorkflow,
      hasVercelConfig: Boolean(vercelJson),
      usesSupabase,
    }),
    dependencies,
    signals,
    source: "github",
  };

  return { project, warnings };
}
