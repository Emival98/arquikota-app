import { describe, expect, it } from "vitest";
import {
  ValidationError,
  parseRepoReference,
  parseScanRequest,
} from "../lib/parse";

describe("parseRepoReference", () => {
  it("aceita owner/repo e URLs do GitHub", () => {
    expect(parseRepoReference("vercel/next-learn")).toEqual({
      owner: "vercel",
      repo: "next-learn",
      fullName: "vercel/next-learn",
    });
    expect(parseRepoReference("https://github.com/vercel/next.js")).toEqual({
      owner: "vercel",
      repo: "next.js",
      fullName: "vercel/next.js",
    });
    expect(parseRepoReference("https://github.com/owner/repo.git/")).toEqual({
      owner: "owner",
      repo: "repo",
      fullName: "owner/repo",
    });
    expect(parseRepoReference("github.com/owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
      fullName: "owner/repo",
    });
  });

  it("rejeita referências que não sejam GitHub", () => {
    for (const value of [
      "",
      "owner",
      "owner/repo/extra",
      "https://github.com.evil.com/owner/repo",
      "https://evil.com/owner/repo",
      "owner/repo?tab=readme",
      "../repo",
      "owner-/-repo",
      "owner/..",
    ]) {
      expect(() => parseRepoReference(value)).toThrow(ValidationError);
    }
  });

  it("limita o tamanho da referência", () => {
    expect(() => parseRepoReference(`owner/${"a".repeat(120)}`)).toThrow(ValidationError);
    expect(() => parseRepoReference(`owner/${"a".repeat(300)}`)).toThrow(ValidationError);
  });
});

describe("parseScanRequest", () => {
  it("valida um pedido demo e aplica a cadência por omissão", () => {
    expect(
      parseScanRequest({ source: "demo", presetId: "kota-commerce" }),
    ).toEqual({
      source: "demo",
      presetId: "kota-commerce",
      repo: null,
      cadence: "weekly",
    });
  });

  it("valida um pedido GitHub e normaliza o repositório", () => {
    expect(
      parseScanRequest({
        source: "github",
        repo: "https://github.com/vercel/next-learn",
        cadence: "daily",
      }),
    ).toEqual({
      source: "github",
      presetId: null,
      repo: "vercel/next-learn",
      cadence: "daily",
    });
  });

  it("recusa origens, cenários e cadências desconhecidas", () => {
    expect(() => parseScanRequest(null)).toThrow(ValidationError);
    expect(() => parseScanRequest([])).toThrow(ValidationError);
    expect(() => parseScanRequest({ source: "ftp" })).toThrow(ValidationError);
    expect(() =>
      parseScanRequest({ source: "demo", presetId: "nao-existe" }),
    ).toThrow(ValidationError);
    expect(() =>
      parseScanRequest({ source: "demo", presetId: "kota-studio", cadence: "hourly" }),
    ).toThrow(ValidationError);
    expect(() => parseScanRequest({ source: "github" })).toThrow(ValidationError);
    expect(() =>
      parseScanRequest({ source: "github", repo: "https://gitlab.com/owner/repo" }),
    ).toThrow(ValidationError);
  });

  it("expõe mensagens em português", () => {
    try {
      parseScanRequest({ source: "demo", presetId: "x" });
      throw new Error("deveria falhar");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as Error).message).toMatch(/cenário/i);
    }
  });
});
