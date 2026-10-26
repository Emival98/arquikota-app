import { LATEST_VERSIONS } from "./catalog";
import { scanProject, type HistorySeed } from "./engine";
import type { DemoPresetId } from "./preset-options";
import type {
  Cadence,
  DependencyInfo,
  ProjectProfile,
  ResolvedAlert,
  ScanReport,
} from "./types";

const commerceDependencies: DependencyInfo[] = [
  { name: "next", installed: "14.2.15", kind: "runtime" },
  { name: "react", installed: "18.2.0", kind: "runtime" },
  { name: "react-dom", installed: "18.2.0", kind: "runtime" },
  { name: "@supabase/supabase-js", installed: "2.45.4", kind: "runtime" },
  { name: "@supabase/auth-helpers-nextjs", installed: "0.10.0", kind: "runtime" },
  { name: "zod", installed: "3.23.8", kind: "runtime" },
  { name: "tailwindcss", installed: "3.4.4", kind: "dev" },
  { name: "typescript", installed: "5.4.5", kind: "dev" },
  { name: "eslint", installed: "8.57.0", kind: "dev" },
  { name: "eslint-config-next", installed: "14.2.15", kind: "dev" },
  { name: "@types/node", installed: "20.12.12", kind: "dev" },
  { name: "@types/react", installed: "18.3.3", kind: "dev" },
  { name: "@types/react-dom", installed: "18.3.0", kind: "dev" },
  { name: "vitest", installed: "1.6.0", kind: "dev" },
];

const studioDependencies: DependencyInfo[] = [
  { name: "next", installed: "16.4.2", kind: "runtime" },
  { name: "react", installed: "19.3.1", kind: "runtime" },
  { name: "react-dom", installed: "19.3.1", kind: "runtime" },
  { name: "@supabase/supabase-js", installed: "2.118.0", kind: "runtime" },
  { name: "@supabase/ssr", installed: "0.12.7", kind: "runtime" },
  { name: "zod", installed: "4.6.7", kind: "runtime" },
  { name: "tailwindcss", installed: "4.3.3", kind: "dev" },
  { name: "typescript", installed: "7.0.2", kind: "dev" },
  { name: "eslint", installed: "10.13.0", kind: "dev" },
  { name: "eslint-config-next", installed: "16.4.2", kind: "dev" },
  { name: "@types/node", installed: "26.6.5", kind: "dev" },
  { name: "@types/react", installed: "19.3.0", kind: "dev" },
  { name: "@types/react-dom", installed: "19.3.0", kind: "dev" },
  { name: "vitest", installed: "5.0.5", kind: "dev" },
];

const legacyDependencies: DependencyInfo[] = [
  { name: "next", installed: "12.3.4", kind: "runtime" },
  { name: "react", installed: "17.0.2", kind: "runtime" },
  { name: "react-dom", installed: "17.0.2", kind: "runtime" },
  { name: "@supabase/supabase-js", installed: "1.35.7", kind: "runtime" },
  { name: "@supabase/auth-helpers-nextjs", installed: "0.10.0", kind: "runtime" },
  { name: "zod", installed: "3.22.4", kind: "runtime" },
  { name: "tailwindcss", installed: "2.2.19", kind: "dev" },
  { name: "typescript", installed: "4.9.5", kind: "dev" },
  { name: "eslint", installed: "7.32.0", kind: "dev" },
  { name: "eslint-config-next", installed: "12.3.4", kind: "dev" },
  { name: "@types/node", installed: "16.18.0", kind: "dev" },
  { name: "@types/react", installed: "17.0.2", kind: "dev" },
  { name: "@types/react-dom", installed: "17.0.2", kind: "dev" },
];

function daysBefore(now: Date, days: number): string {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function commerceProfile(now: Date): ProjectProfile {
  return {
    id: "demo:kota-commerce",
    name: "Kota Commerce",
    repoUrl: "https://github.com/arquikota/kota-commerce",
    description:
      "Loja de demonstração com catálogo, checkout e autenticação Supabase alojada na Vercel.",
    branch: "main",
    lastCommitAt: daysBefore(now, 3),
    runtime: "Node 18",
    stack: ["Next.js 14", "React 18", "Supabase Auth", "Vercel"],
    dependencies: commerceDependencies,
    signals: {
      enginesNode: ">=18.x",
      nvmrc: "18",
      nextConfig: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com"],
  },
};

export default nextConfig;`,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
        test: "vitest run",
        typecheck: "tsc --noEmit",
      },
      hasWorkflow: false,
      hasLockfile: true,
      usesSupabase: true,
    },
    source: "demo",
  };
}

function studioProfile(now: Date): ProjectProfile {
  return {
    id: "demo:kota-studio",
    name: "Kota Studio",
    repoUrl: "https://github.com/arquikota/kota-studio",
    description:
      "Site editorial com formulário de contacto, imagens otimizadas e deploys contínuos na Vercel.",
    branch: "main",
    lastCommitAt: daysBefore(now, 1),
    runtime: "Node 24",
    stack: ["Next.js 16", "React 19", "Supabase", "GitHub Actions"],
    dependencies: studioDependencies,
    signals: {
      enginesNode: ">=24",
      nvmrc: "24",
      nextConfig: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;`,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "eslint .",
        test: "vitest run",
        typecheck: "tsc --noEmit",
        "scan:ci": "tsx scripts/scan-ci.ts",
      },
      hasWorkflow: true,
      hasLockfile: true,
      usesSupabase: true,
    },
    source: "demo",
  };
}

function legacyProfile(now: Date): ProjectProfile {
  return {
    id: "demo:kota-legado",
    name: "Kota Legado",
    repoUrl: "https://github.com/arquikota/kota-legado",
    description:
      "Backoffice interno de gestão de encomendas, ainda com a base técnica de 2022.",
    branch: "master",
    lastCommitAt: daysBefore(now, 94),
    runtime: "Node 16",
    stack: ["Next.js 12", "React 17", "Vercel (legacy)"],
    dependencies: legacyDependencies,
    signals: {
      enginesNode: ">=16",
      nvmrc: "16",
      nextConfig: `/** @type {import('next').NextConfig} */
const nextConfig = {
  target: "serverless",
  images: {
    domains: ["cdn.kotagroup.pt", "images.unsplash.com"],
  },
};

export default nextConfig;`,
      vercelJson: `{
  "version": 2,
  "builds": [{ "src": "package.json", "use": "@vercel/next" }]
}`,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      hasWorkflow: false,
      hasLockfile: false,
      usesSupabase: true,
    },
    source: "demo",
  };
}

function resolvedCommerce(now: Date): ResolvedAlert[] {
  return [
    {
      id: "seed-commerce-lockfile",
      title: "Repositório sem package-lock.json",
      category: "practice",
      resolvedAt: daysBefore(now, 21),
      note: "Lockfile gerado e commitado; os builds passaram a ser reprodutíveis.",
    },
    {
      id: "seed-commerce-node16",
      title: "Runtime Node 16 em fim de vida",
      category: "runtime",
      resolvedAt: daysBefore(now, 12),
      note: "Atualizado para Node 18 antes do EOL. A próxima paragem é o Node 24.",
    },
    {
      id: "seed-commerce-image",
      title: "Imagens externas sem dimensões explícitas",
      category: "practice",
      resolvedAt: daysBefore(now, 4),
      note: "Width e height definidos; o layout shift do catálogo desapareceu.",
    },
  ];
}

function resolvedStudio(now: Date): ResolvedAlert[] {
  return [
    {
      id: "seed-studio-next16",
      title: "Next.js 15 → 16",
      category: "dependency",
      resolvedAt: daysBefore(now, 31),
      note: "Upgrade concluído com o codemod oficial e revisão dos handlers assíncronos.",
    },
    {
      id: "seed-studio-eslint10",
      title: "ESLint 9 → 10",
      category: "dependency",
      resolvedAt: daysBefore(now, 15),
      note: "Configuração flat validada e script `next lint` substituído por `eslint .`.",
    },
  ];
}

function resolvedLegacy(now: Date): ResolvedAlert[] {
  return [
    {
      id: "seed-legacy-tailwind1",
      title: "Tailwind CSS 1 → 2",
      category: "dependency",
      resolvedAt: daysBefore(now, 64),
      note: "Migração feita apenas para desbloquear o build. A versão 4 continua pendente.",
    },
  ];
}

const commerceHistory: HistorySeed[] = [
  { daysAgo: 35, score: 42, critical: 3, high: 1 },
  { daysAgo: 28, score: 45, critical: 3, high: 1 },
  { daysAgo: 21, score: 48, critical: 2, high: 1 },
  { daysAgo: 14, score: 51, critical: 2, high: 1 },
  { daysAgo: 7, score: 54, critical: 2, high: 1 },
];

const studioHistory: HistorySeed[] = [
  { daysAgo: 35, score: 84, critical: 0, high: 0 },
  { daysAgo: 28, score: 90, critical: 0, high: 0 },
  { daysAgo: 21, score: 93, critical: 0, high: 0 },
  { daysAgo: 14, score: 96, critical: 0, high: 0 },
  { daysAgo: 7, score: 100, critical: 0, high: 0 },
];

const legacyHistory: HistorySeed[] = [
  { daysAgo: 35, score: 69, critical: 1, high: 1 },
  { daysAgo: 28, score: 63, critical: 1, high: 1 },
  { daysAgo: 21, score: 58, critical: 2, high: 1 },
  { daysAgo: 14, score: 52, critical: 2, high: 1 },
  { daysAgo: 7, score: 47, critical: 2, high: 1 },
];

export function createDemoScan(
  presetId: DemoPresetId,
  cadence: Cadence,
  now: Date = new Date(),
): ScanReport {
  const presets: Record<
    DemoPresetId,
    {
      profile: (date: Date) => ProjectProfile;
      resolved: (date: Date) => ResolvedAlert[];
      history: HistorySeed[];
      deprecations: Record<string, string>;
    }
  > = {
    "kota-commerce": {
      profile: commerceProfile,
      resolved: resolvedCommerce,
      history: commerceHistory,
      deprecations: {
        "@supabase/auth-helpers-nextjs":
          "Pacote arquivado em favor de @supabase/ssr. O fluxo de autenticação baseado em getSession não acompanha as proteções atuais de cookies.",
      },
    },
    "kota-studio": {
      profile: studioProfile,
      resolved: resolvedStudio,
      history: studioHistory,
      deprecations: {},
    },
    "kota-legado": {
      profile: legacyProfile,
      resolved: resolvedLegacy,
      history: legacyHistory,
      deprecations: {
        "@supabase/auth-helpers-nextjs":
          "Pacote arquivado em favor de @supabase/ssr. O fluxo de autenticação baseado em getSession não acompanha as proteções atuais de cookies.",
      },
    },
  };

  const preset = presets[presetId];
  return scanProject(preset.profile(now), {
    scannedAt: now.toISOString(),
    latest: LATEST_VERSIONS,
    deprecations: preset.deprecations,
    cadence,
    latestSource: "catalog",
    resolved: preset.resolved(now),
    history: preset.history,
  });
}
