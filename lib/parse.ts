import { isDemoPresetId, type DemoPresetId } from "./preset-options";
import type { Cadence, ScanSource } from "./types";

const MAX_REPO_LENGTH = 200;
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export class ValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

export interface RepoReference {
  owner: string;
  repo: string;
  fullName: string;
}

export type ParsedScanRequest =
  | { source: "demo"; presetId: DemoPresetId; repo: null; cadence: Cadence }
  | { source: "github"; presetId: null; repo: string; cadence: Cadence };

export function parseRepoReference(raw: string): RepoReference {
  const value = raw.trim();
  if (!value) {
    throw new ValidationError("Indica um repositório GitHub no formato owner/repo.");
  }
  if (value.length > MAX_REPO_LENGTH) {
    throw new ValidationError("A referência do repositório é demasiado longa.");
  }

  let owner: string | undefined;
  let repo: string | undefined;

  const urlMatch = value.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+)\/?$/i,
  );

  if (urlMatch) {
    owner = urlMatch[1];
    repo = urlMatch[2];
  } else if (/^[^/?#]+\/[^/?#]+$/.test(value)) {
    [owner, repo] = value.split("/");
  }

  if (!owner || !repo) {
    throw new ValidationError(
      "Usa o formato owner/repo ou https://github.com/owner/repo.",
    );
  }

  repo = repo.replace(/\.git$/i, "");

  if (!OWNER_PATTERN.test(owner) || !REPO_PATTERN.test(repo) || repo === "." || repo === "..") {
    throw new ValidationError("O repositório indicado não é válido.");
  }

  return { owner, repo, fullName: `${owner}/${repo}` };
}

export function parseScanRequest(input: unknown): ParsedScanRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("O pedido deve ser um objeto JSON.");
  }

  const body = input as Record<string, unknown>;

  const source: ScanSource | undefined =
    body.source === "demo" || body.source === "github" ? body.source : undefined;
  if (!source) {
    throw new ValidationError("A origem deve ser demo ou github.");
  }

  let cadence: Cadence = "weekly";
  if (body.cadence !== undefined) {
    if (body.cadence !== "daily" && body.cadence !== "weekly") {
      throw new ValidationError("A cadência deve ser daily ou weekly.");
    }
    cadence = body.cadence;
  }

  if (source === "demo") {
    if (typeof body.presetId !== "string" || !isDemoPresetId(body.presetId)) {
      throw new ValidationError("O cenário demo indicado não existe.");
    }
    return { source, presetId: body.presetId, repo: null, cadence };
  }

  if (typeof body.repo !== "string") {
    throw new ValidationError("Indica um repositório GitHub público.");
  }

  const reference = parseRepoReference(body.repo);
  return { source, presetId: null, repo: reference.fullName, cadence };
}
