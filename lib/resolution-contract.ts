import { isDemoPresetId } from "./preset-options";
import { ValidationError, parseRepoReference } from "./parse";
import type { AlertKind, ResolvedAlert } from "./types";

const ALERT_KINDS: readonly AlertKind[] = [
  "runtime",
  "dependency",
  "platform",
  "practice",
  "automation",
];

const MAX_PROJECT_ID = 160;
const MAX_ALERT_ID = 160;
const MAX_TITLE = 220;
const MAX_FIX_LABEL = 160;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function cleanText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new ValidationError(`O campo ${field} é obrigatório.`);
  }
  const text = value.trim();
  if (!text || text.length > maxLength || CONTROL_CHARS.test(text)) {
    throw new ValidationError(`O campo ${field} não é válido.`);
  }
  return text;
}

export function isAlertKind(value: unknown): value is AlertKind {
  return typeof value === "string" && (ALERT_KINDS as readonly string[]).includes(value);
}

export function normaliseProjectId(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("Indica um projeto válido.");
  }
  const projectId = value.trim();
  if (!projectId || projectId.length > MAX_PROJECT_ID) {
    throw new ValidationError("O identificador do projeto não é válido.");
  }

  if (projectId.startsWith("demo:")) {
    const presetId = projectId.slice(5);
    if (!isDemoPresetId(presetId)) {
      throw new ValidationError("O projeto demo indicado não existe.");
    }
    return `demo:${presetId}`;
  }

  if (projectId.startsWith("github:")) {
    const reference = parseRepoReference(projectId.slice(7));
    return `github:${reference.fullName.toLowerCase()}`;
  }

  throw new ValidationError("O identificador do projeto não é válido.");
}

export interface NewResolutionInput {
  projectId: string;
  alertId: string;
  title: string;
  category: AlertKind;
  note: string;
}

export function parseNewResolutionInput(input: unknown): NewResolutionInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("O pedido deve ser um objeto JSON.");
  }

  const body = input as Record<string, unknown>;
  const projectId = normaliseProjectId(body.projectId);
  const alertId = cleanText(body.alertId, "alertId", MAX_ALERT_ID);
  const title = cleanText(body.title, "title", MAX_TITLE);

  if (!isAlertKind(body.category)) {
    throw new ValidationError("A categoria do alerta não é válida.");
  }

  const fixLabel =
    body.fixLabel === undefined
      ? "Correção aplicada"
      : cleanText(body.fixLabel, "fixLabel", MAX_FIX_LABEL);

  return {
    projectId,
    alertId,
    title,
    category: body.category,
    note: `Marcado como resolvido no painel. Correção associada: ${fixLabel}.`,
  };
}

export function isResolvedAlert(value: unknown): value is ResolvedAlert {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    entry.id.length <= MAX_ALERT_ID &&
    typeof entry.title === "string" &&
    entry.title.length > 0 &&
    entry.title.length <= MAX_TITLE &&
    isAlertKind(entry.category) &&
    typeof entry.note === "string" &&
    entry.note.length <= 400 &&
    typeof entry.resolvedAt === "string" &&
    entry.resolvedAt.length <= 40 &&
    !Number.isNaN(Date.parse(entry.resolvedAt))
  );
}
