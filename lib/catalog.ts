import type { Cadence, Severity } from "./types";

export const CATALOG_AS_OF = "2026-10-22";
export const RECOMMENDED_NODE_MAJOR = 24;
export const MINIMUM_NODE_MAJOR = 22;
export const AUTOMATION_PATH = ".github/workflows/arquikota-scan.yml";

export const LATEST_VERSIONS: Record<string, string> = {
  next: "16.4.2",
  react: "19.3.1",
  "react-dom": "19.3.1",
  "@supabase/supabase-js": "2.118.0",
  "@supabase/ssr": "0.12.7",
  "@supabase/auth-helpers-nextjs": "0.15.0",
  zod: "4.6.7",
  tailwindcss: "4.3.3",
  typescript: "7.0.2",
  eslint: "10.13.0",
  "eslint-config-next": "16.4.2",
  "@types/node": "26.6.5",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  vitest: "5.0.5",
  tsx: "4.23.15",
};

export const NODE_RELEASES = [
  { major: 24, status: "LTS ativo", eol: "2028-04" },
  { major: 22, status: "LTS em manutenção", eol: "2027-04" },
  { major: 20, status: "fim de vida", eol: "2026-04" },
  { major: 18, status: "fim de vida", eol: "2025-04" },
  { major: 16, status: "fim de vida", eol: "2023-09" },
] as const;

export interface DeprecatedPackage {
  replacement: string;
  severity: Severity;
  reason: string;
  risk: string;
  fixCommand: string;
  docsUrl: string;
  effort: "Baixo" | "Médio" | "Alto";
}

export const DEPRECATED_PACKAGES: Record<string, DeprecatedPackage> = {
  "@supabase/auth-helpers-nextjs": {
    replacement: "@supabase/ssr",
    severity: "critical",
    reason:
      "O pacote oficial de auth-helpers foi arquivado e não acompanha o fluxo SSR atual do Supabase.",
    risk:
      "A autenticação pode falhar ao renovar cookies de sessão, deixar rotas protegidas abertas ou quebrar após uma atualização do Supabase. Não há correções de segurança para esta linha.",
    fixCommand:
      "npm uninstall @supabase/auth-helpers-nextjs && npm install @supabase/ssr @supabase/supabase-js",
    docsUrl: "https://supabase.com/docs/guides/auth/server-side/nextjs",
    effort: "Médio",
  },
};

export const CADENCE: Record<Cadence, { cron: string; label: string; short: string }> = {
  daily: {
    cron: "0 6 * * *",
    label: "Diária · todos os dias às 06:00 UTC",
    short: "diária",
  },
  weekly: {
    cron: "0 6 * * 1",
    label: "Semanal · segundas às 06:00 UTC",
    short: "semanal",
  },
};

export function buildWorkflowYaml(cadence: Cadence): string {
  return `name: ArquiKota maintenance scan

on:
  schedule:
    - cron: "${CADENCE[cadence].cron}"
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: arquikota-scan
  cancel-in-progress: true

jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${RECOMMENDED_NODE_MAJOR}
          cache: npm
      - run: npm ci
      - run: npm run scan:ci
      - name: Guardar relatório
        uses: actions/upload-artifact@v4
        with:
          name: arquikota-report
          path: maintenance-report.md
          retention-days: 30
`;
}
