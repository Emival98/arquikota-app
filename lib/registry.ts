import { fetchWithTimeout, mapLimit } from "./http";
import type { DependencyInfo } from "./types";

interface RegistryEntry {
  latest: string | null;
  deprecated: string | null;
  fetchedAt: number;
}

export interface RegistryResult {
  latest: Record<string, string>;
  deprecations: Record<string, string>;
  warnings: string[];
  latestSource: "npm" | "catalog";
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, RegistryEntry>();

function isRegistryName(name: string): boolean {
  return name.length > 0 && name.length <= 214 && !/\s/.test(name);
}

async function loadPackage(name: string): Promise<RegistryEntry> {
  const cached = cache.get(name);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;

  const response = await fetchWithTimeout(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "ArquiKota-Maintenance-Scanner",
      },
    },
    8_000,
  );

  if (response.status === 404) {
    const entry = { latest: null, deprecated: null, fetchedAt: Date.now() };
    cache.set(name, entry);
    return entry;
  }

  if (!response.ok) {
    throw new Error(`npm registry respondeu ${response.status}`);
  }

  const data = (await response.json()) as {
    version?: unknown;
    deprecated?: unknown;
  };

  const entry: RegistryEntry = {
    latest: typeof data.version === "string" ? data.version : null,
    deprecated: typeof data.deprecated === "string" ? data.deprecated : null,
    fetchedAt: Date.now(),
  };
  cache.set(name, entry);
  return entry;
}

export async function fetchRegistryData(
  dependencies: DependencyInfo[],
  fallback: Record<string, string>,
): Promise<RegistryResult> {
  const names = Array.from(new Set(dependencies.map((dependency) => dependency.name))).filter(
    isRegistryName,
  );

  let failed = 0;
  let missing = 0;

  const entries = await mapLimit(names, 6, async (name) => {
    try {
      return { name, entry: await loadPackage(name) };
    } catch {
      failed += 1;
      return { name, entry: null };
    }
  });

  const latest: Record<string, string> = {};
  const deprecations: Record<string, string> = {};

  for (const { name, entry } of entries) {
    if (!entry) {
      if (fallback[name]) latest[name] = fallback[name];
      continue;
    }

    if (!entry.latest) {
      missing += 1;
      if (fallback[name]) latest[name] = fallback[name];
      continue;
    }

    latest[name] = entry.latest;
    if (entry.deprecated) deprecations[name] = entry.deprecated;
  }

  const warnings: string[] = [];
  if (failed > 0) {
    warnings.push(
      `Não foi possível confirmar ${failed} ${
        failed === 1 ? "pacote" : "pacotes"
      } no npm; foram usadas versões do snapshot local quando disponíveis.`,
    );
  }
  if (missing > 0) {
    warnings.push(
      `${missing} ${
        missing === 1 ? "dependência não foi encontrada" : "dependências não foram encontradas"
      } no npm e ficou sem comparação de versão.`,
    );
  }

  return {
    latest,
    deprecations,
    warnings,
    latestSource: entries.some(({ entry }) => entry?.latest) ? "npm" : "catalog",
  };
}
