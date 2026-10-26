import { NextResponse } from "next/server";
import { EmailConfigError, EmailSendError, sendReportEmail } from "@/lib/email";
import { parseReportEmailInput } from "@/lib/email-contract";
import { ValidationError } from "@/lib/parse";
import { consumeRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;
const SEND_LIMIT = 5;
const SEND_WINDOW_MS = 10 * 60_000;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function error(message: string, status: number) {
  return json({ error: message }, status);
}

async function readJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new ValidationError("O pedido é demasiado grande.", 413);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new ValidationError("O pedido é demasiado grande.", 413);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError("O corpo do pedido não é um JSON válido.");
  }
}

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Falls back to the request origin when the optional variable is malformed.
    }
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!consumeRateLimit(`notify:${getClientKey(request)}`, SEND_LIMIT, SEND_WINDOW_MS)) {
    return error("Limite de envios atingido. Tenta novamente dentro de alguns minutos.", 429);
  }

  try {
    const input = parseReportEmailInput(await readJson(request));
    await sendReportEmail(input, `${siteOrigin(request)}/#diagnostico`);
    return json({ ok: true });
  } catch (cause) {
    if (cause instanceof ValidationError) return error(cause.message, cause.status);
    if (cause instanceof EmailConfigError) return error(cause.message, 503);
    if (cause instanceof EmailSendError) return error(cause.message, cause.status);
    console.error("Falha no envio do relatório", cause);
    return error("Não foi possível enviar o relatório. Tenta novamente.", 502);
  }
}
