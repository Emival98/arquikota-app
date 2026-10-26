import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  dependencyStatus,
  parseVersion,
  scanProject,
  versionGap,
  versionGapLabel,
} from "../lib/engine";
import { createDemoScan } from "../lib/presets";
import { scoreAlerts, statusFromScore } from "../lib/score";

const NOW = new Date("2026-10-23T12:00:00.000Z");

describe("comparação de versões", () => {
  it("lê versões com intervalos e prefixos", () => {
    expect(parseVersion("^18.2.0")).toEqual({ major: 18, minor: 2, patch: 0 });
    expect(parseVersion(">=18.x")).toEqual({ major: 18, minor: 0, patch: 0 });
    expect(parseVersion("16.4.2")).toEqual({ major: 16, minor: 4, patch: 2 });
    expect(parseVersion("sem versão")).toBeNull();
    expect(parseVersion(undefined)).toBeNull();
  });

  it("classifica o desvio entre instalada e latest", () => {
    expect(versionGap("14.2.15", "16.4.2")).toBe("major");
    expect(versionGap("19.2.9", "19.3.1")).toBe("minor");
    expect(versionGap("19.3.0", "19.3.1")).toBe("patch");
    expect(versionGap("19.3.1", "19.3.1")).toBe("ok");
    expect(versionGap("1.0.0", null)).toBe("unknown");

    expect(versionGapLabel("14.2.15", "16.4.2")).toBe("2 majors");
    expect(versionGapLabel("19.3.1", "19.3.1")).toBe("atual");
  });

  it("traduz o desvio em severidade", () => {
    expect(dependencyStatus("14.2.15", "16.4.2")).toBe("critical");
    expect(dependencyStatus("15.5.28", "16.4.2")).toBe("high");
    expect(dependencyStatus("19.2.9", "19.3.1")).toBe("medium");
    expect(dependencyStatus("19.3.0", "19.3.1")).toBe("low");
    expect(dependencyStatus("19.3.1", "19.3.1")).toBe("ok");
  });
});

describe("score de manutenção", () => {
  it("aplica os pesos por severidade", () => {
    expect(
      scoreAlerts([
        { severity: "critical" },
        { severity: "high" },
        { severity: "medium" },
        { severity: "low" },
      ]),
    ).toBe(77);
    expect(scoreAlerts([])).toBe(100);
    expect(scoreAlerts(Array.from({ length: 12 }, () => ({ severity: "critical" as const })))).toBe(0);
  });

  it("mapeia o score para o estado de saúde", () => {
    expect(statusFromScore(100)).toBe("good");
    expect(statusFromScore(75)).toBe("good");
    expect(statusFromScore(74)).toBe("warning");
    expect(statusFromScore(55)).toBe("warning");
    expect(statusFromScore(54)).toBe("critical");
  });
});

describe("cenário Kota Commerce", () => {
  const report = createDemoScan("kota-commerce", "weekly", NOW);

  it("deteta as duas falhas críticas e o desvio do framework", () => {
    expect(report.score).toBe(57);
    expect(report.verdict).toBe("Atenção");
    expect(report.summary.counts).toEqual({
      critical: 2,
      high: 1,
      medium: 4,
      low: 0,
      total: 7,
    });

    const ids = report.alerts.map((alert) => alert.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "runtime-node-18",
        "deprecated-@supabase/auth-helpers-nextjs",
        "dependency-framework-major",
        "practice-next-lint",
        "platform-next-images-domains",
        "automation-workflow-missing",
        "dependency-outdated-rollup",
      ]),
    );
  });

  it("explica sempre o risco e oferece uma correção", () => {
    for (const alert of report.alerts) {
      expect(alert.risk.length).toBeGreaterThan(40);
      expect(alert.summary.length).toBeGreaterThan(20);
      expect(alert.fix.content.length).toBeGreaterThan(5);
      expect(alert.fix.label.length).toBeGreaterThan(3);
    }
  });

  it("compara as dependências com o snapshot do catálogo", () => {
    const next = report.dependencies.find((dependency) => dependency.name === "next");
    expect(next).toMatchObject({
      installed: "14.2.15",
      latest: "16.4.2",
      status: "critical",
      gap: "2 majors",
      kind: "runtime",
    });
    expect(report.latestSource).toBe("catalog");
    expect(report.summary.outdated).toBeGreaterThan(5);
  });

  it("associa o histórico e as resoluções ao relatório", () => {
    expect(report.resolved).toHaveLength(3);
    expect(report.summary.resolvedCount).toBe(3);
    expect(report.history).toHaveLength(6);
    expect(report.history.at(-1)).toMatchObject({
      date: "2026-10-23",
      score: 57,
      critical: 2,
      high: 1,
    });
  });

  it("mantém o workflow por ativar e agenda a próxima leitura", () => {
    expect(report.automation).toMatchObject({
      configured: false,
      cadence: "weekly",
      cron: "0 6 * * 1",
      nextRunLabel: "Ativa o workflow para agendar",
    });
    expect(report.automation.yaml).toContain("npm run scan:ci");
    expect(report.automation.yaml).toContain('cron: "0 6 * * 1"');
  });
});

describe("restantes cenários demo", () => {
  it("o cenário saudável não tem alertas e agenda a próxima execução", () => {
    const report = createDemoScan("kota-studio", "weekly", NOW);
    expect(report.score).toBe(100);
    expect(report.verdict).toBe("Saudável");
    expect(report.alerts).toHaveLength(0);
    expect(report.summary.outdated).toBe(0);
    expect(report.automation.configured).toBe(true);
    expect(report.automation.nextRunLabel).toBe("26 out 2026 · 06:00 UTC");
  });

  it("o cenário legado expõe dívida acumulada", () => {
    const report = createDemoScan("kota-legado", "weekly", NOW);
    expect(report.score).toBeLessThan(55);
    expect(report.verdict).toBe("Crítico");
    expect(report.summary.counts.critical).toBe(2);
    const ids = report.alerts.map((alert) => alert.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "platform-next-target",
        "platform-vercel-builds",
        "practice-lockfile",
        "practice-tests",
        "practice-typecheck",
      ]),
    );
  });

  it("a cadência diária altera o cron e a próxima execução", () => {
    const report = createDemoScan("kota-studio", "daily", NOW);
    expect(report.automation.cron).toBe("0 6 * * *");
    expect(report.automation.yaml).toContain('cron: "0 6 * * *"');
    expect(report.automation.nextRunLabel).toBe("24 out 2026 · 06:00 UTC");
  });
});

describe("resolução de alertas", () => {
  it("subir o score quando um alerta é fechado", () => {
    const report = createDemoScan("kota-commerce", "weekly", NOW);
    const remaining = report.alerts.filter((alert) => alert.id !== "runtime-node-18");
    expect(scoreAlerts(remaining)).toBe(report.score + 12);
  });

  it("elimina a penalização quando todos os alertas são resolvidos", () => {
    expect(scoreAlerts([])).toBe(100);
  });
});

describe("workflow versionado", () => {
  it("o ficheiro do repositório segue o template semanal", () => {
    const workflow = readFileSync(
      new URL("../.github/workflows/arquikota-scan.yml", import.meta.url),
      "utf8",
    );
    expect(workflow).toContain('cron: "0 6 * * 1"');
    expect(workflow).toContain("permissions:");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("npm run scan:ci");
  });
});

describe("scanProject é determinístico", () => {
  it("produz o mesmo relatório para a mesma entrada", () => {
    const first = createDemoScan("kota-commerce", "weekly", NOW);
    const second = createDemoScan("kota-commerce", "weekly", NOW);
    expect(second).toEqual(first);
  });

  it("acrescenta apenas o ponto atual ao histórico fornecido", () => {
    const base = createDemoScan("kota-studio", "weekly", NOW);
    const rebuilt = scanProject(base.project, {
      scannedAt: NOW.toISOString(),
      latest: Object.fromEntries(
        base.dependencies.map((dependency) => [dependency.name, dependency.latest ?? ""]),
      ),
      cadence: "weekly",
      history: [{ daysAgo: 7, score: 96, critical: 0, high: 0 }],
    });
    expect(rebuilt.history).toHaveLength(2);
    expect(rebuilt.history.at(-1)?.score).toBe(rebuilt.score);
  });
});
