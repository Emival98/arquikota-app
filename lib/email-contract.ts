import { ValidationError } from "./parse";

export type EmailVerdict = "Saudável" | "Atenção" | "Crítico";

const VERDICTS: readonly EmailVerdict[] = ["Saudável", "Atenção", "Crítico"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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

function cleanCount(value: unknown, field: string): number {
  const number = typeof value === "number" ? value : Number.NaN;
  if (!Number.isInteger(number) || number < 0 || number > 5_000) {
    throw new ValidationError(`O campo ${field} deve ser um número inteiro válido.`);
  }
  return number;
}

export interface ReportEmailInput {
  to: string;
  projectName: string;
  score: number;
  verdict: EmailVerdict;
  critical: number;
  high: number;
  total: number;
  topAlert: string;
}

export function parseReportEmailInput(input: unknown): ReportEmailInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("O pedido deve ser um objeto JSON.");
  }

  const body = input as Record<string, unknown>;
  const to = cleanText(body.to, "to", 254);
  if (!EMAIL_PATTERN.test(to) || CONTROL_CHARS.test(to)) {
    throw new ValidationError("Indica um endereço de email válido.");
  }

  const projectName = cleanText(body.projectName, "projectName", 120);
  const topAlert = cleanText(body.topAlert, "topAlert", 220);

  if (typeof body.score !== "number" || !Number.isInteger(body.score) || body.score < 0 || body.score > 100) {
    throw new ValidationError("O score deve estar entre 0 e 100.");
  }

  if (!VERDICTS.includes(body.verdict as EmailVerdict)) {
    throw new ValidationError("O estado do projeto não é válido.");
  }

  const critical = cleanCount(body.critical, "critical");
  const high = cleanCount(body.high, "high");
  const total = cleanCount(body.total, "total");

  if (total < critical + high) {
    throw new ValidationError("A contagem de alertas não é coerente.");
  }

  return {
    to,
    projectName,
    score: body.score,
    verdict: body.verdict as EmailVerdict,
    critical,
    high,
    total,
    topAlert,
  };
}

export function buildReportEmailParams(
  input: ReportEmailInput,
  panelUrl: string,
  scannedAt: string,
): Record<string, string> {
  return {
    to_email: input.to,
    project_name: input.projectName,
    score: String(input.score),
    status: input.verdict,
    critical_count: String(input.critical),
    high_count: String(input.high),
    total_alerts: String(input.total),
    top_alert: input.topAlert,
    scanned_at: scannedAt,
    panel_url: panelUrl,
  };
}
