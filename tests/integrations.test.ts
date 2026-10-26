import { describe, expect, it } from "vitest";
import { ValidationError } from "../lib/parse";
import {
  isAlertKind,
  isResolvedAlert,
  normaliseProjectId,
  parseNewResolutionInput,
} from "../lib/resolution-contract";
import {
  buildReportEmailParams,
  parseReportEmailInput,
} from "../lib/email-contract";

describe("normaliseProjectId", () => {
  it("aceita cenários demo conhecidos", () => {
    expect(normaliseProjectId("demo:kota-studio")).toBe("demo:kota-studio");
    expect(normaliseProjectId("  demo:kota-legado  ")).toBe("demo:kota-legado");
  });

  it("normaliza referências GitHub para minúsculas", () => {
    expect(normaliseProjectId("github:Vercel/Next.js")).toBe("github:vercel/next.js");
    expect(normaliseProjectId("github:https://github.com/Owner/Repo")).toBe(
      "github:owner/repo",
    );
  });

  it("recusa identificadores fora do contrato", () => {
    for (const value of [
      "",
      "kota-studio",
      "demo:nao-existe",
      "github:owner",
      "github:https://gitlab.com/owner/repo",
      "vercel/next.js",
      "demo:",
      "x".repeat(161),
      null,
      42,
    ]) {
      expect(() => normaliseProjectId(value)).toThrow(ValidationError);
    }
  });
});

describe("parseNewResolutionInput", () => {
  it("valida e constrói a nota no servidor", () => {
    expect(
      parseNewResolutionInput({
        projectId: "demo:kota-commerce",
        alertId: "dep-next-14",
        title: "  Next.js 14 desatualizado  ",
        category: "dependency",
        fixLabel: "npm install next@16",
      }),
    ).toEqual({
      projectId: "demo:kota-commerce",
      alertId: "dep-next-14",
      title: "Next.js 14 desatualizado",
      category: "dependency",
      note: "Marcado como resolvido no painel. Correção associada: npm install next@16.",
    });
  });

  it("usa uma nota por omissão quando não há correção associada", () => {
    const parsed = parseNewResolutionInput({
      projectId: "github:owner/repo",
      alertId: "runtime-node-16",
      title: "Node 16 em fim de vida",
      category: "runtime",
    });
    expect(parsed.note).toBe(
      "Marcado como resolvido no painel. Correção associada: Correção aplicada.",
    );
  });

  it("recusa categorias e conteúdos inválidos", () => {
    const valid = {
      projectId: "demo:kota-commerce",
      alertId: "alert-1",
      title: "Alerta",
      category: "dependency",
    };

    expect(() => parseNewResolutionInput(null)).toThrow(ValidationError);
    expect(() => parseNewResolutionInput([valid])).toThrow(ValidationError);
    expect(() => parseNewResolutionInput({ ...valid, category: "security" })).toThrow(
      ValidationError,
    );
    expect(() => parseNewResolutionInput({ ...valid, alertId: "   " })).toThrow(
      ValidationError,
    );
    expect(() => parseNewResolutionInput({ ...valid, title: "a".repeat(221) })).toThrow(
      ValidationError,
    );
    expect(() =>
      parseNewResolutionInput({ ...valid, title: "linha\u0000quebrada" }),
    ).toThrow(ValidationError);
    expect(() =>
      parseNewResolutionInput({ ...valid, fixLabel: "a".repeat(161) }),
    ).toThrow(ValidationError);
  });
});

describe("isResolvedAlert", () => {
  const valid = {
    id: "alert-1",
    title: "Alerta",
    category: "practice",
    note: "Nota",
    resolvedAt: "2026-10-25T10:00:00.000Z",
  };

  it("aceita entradas com data interpretável", () => {
    expect(isAlertKind("automation")).toBe(true);
    expect(isAlertKind("security")).toBe(false);
    expect(isResolvedAlert(valid)).toBe(true);
  });

  it("rejeita entradas incompletas ou com data inválida", () => {
    expect(isResolvedAlert(null)).toBe(false);
    expect(isResolvedAlert([])).toBe(false);
    expect(isResolvedAlert({ ...valid, resolvedAt: "ontem" })).toBe(false);
    expect(isResolvedAlert({ ...valid, note: "a".repeat(401) })).toBe(false);
    expect(isResolvedAlert({ ...valid, category: "security" })).toBe(false);
    expect(isResolvedAlert({ ...valid, id: "" })).toBe(false);
  });
});

describe("parseReportEmailInput", () => {
  const valid = {
    to: "  professor@example.com ",
    projectName: "Kota Commerce",
    score: 57,
    verdict: "Atenção",
    critical: 2,
    high: 3,
    total: 9,
    topAlert: "Node 18 em fim de vida",
  };

  it("normaliza o destinatário e preserva as contagens", () => {
    expect(parseReportEmailInput(valid)).toEqual({
      ...valid,
      to: "professor@example.com",
    });
  });

  it("recusa emails, scores e contagens inválidos", () => {
    expect(() => parseReportEmailInput(null)).toThrow(ValidationError);
    expect(() => parseReportEmailInput({ ...valid, to: "sem-arroba" })).toThrow(
      ValidationError,
    );
    expect(() => parseReportEmailInput({ ...valid, score: 101 })).toThrow(
      ValidationError,
    );
    expect(() => parseReportEmailInput({ ...valid, score: 57.5 })).toThrow(
      ValidationError,
    );
    expect(() => parseReportEmailInput({ ...valid, verdict: "Bom" })).toThrow(
      ValidationError,
    );
    expect(() => parseReportEmailInput({ ...valid, critical: -1 })).toThrow(
      ValidationError,
    );
    expect(() => parseReportEmailInput({ ...valid, high: 1.5 })).toThrow(
      ValidationError,
    );
    expect(() => parseReportEmailInput({ ...valid, total: 4 })).toThrow(
      ValidationError,
    );
    expect(() => parseReportEmailInput({ ...valid, topAlert: "" })).toThrow(
      ValidationError,
    );
  });
});

describe("buildReportEmailParams", () => {
  it("converte o relatório em variáveis de template", () => {
    const input = parseReportEmailInput({
      to: "professor@example.com",
      projectName: "Kota Commerce",
      score: 57,
      verdict: "Atenção",
      critical: 2,
      high: 3,
      total: 9,
      topAlert: "Node 18 em fim de vida",
    });

    expect(
      buildReportEmailParams(input, "https://arquikota.vercel.app/#diagnostico", "25 out 2026"),
    ).toEqual({
      to_email: "professor@example.com",
      project_name: "Kota Commerce",
      score: "57",
      status: "Atenção",
      critical_count: "2",
      high_count: "3",
      total_alerts: "9",
      top_alert: "Node 18 em fim de vida",
      scanned_at: "25 out 2026",
      panel_url: "https://arquikota.vercel.app/#diagnostico",
    });
  });
});
