import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/parse";
import { consumeRateLimit, getClientKey } from "@/lib/rate-limit";
import {
  normaliseProjectId,
  parseNewResolutionInput,
} from "@/lib/resolution-contract";
import {
  ResolutionStoreError,
  addResolution,
  clearResolutions,
  listResolutions,
} from "@/lib/resolutions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;
const WRITE_LIMIT = 30;
const WRITE_WINDOW_MS = 10 * 60_000;

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

function handle(cause: unknown) {
  if (cause instanceof ValidationError) return error(cause.message, cause.status);
  if (cause instanceof ResolutionStoreError) return error(cause.message, cause.status);
  console.error("Falha na API de resoluções", cause);
  return error("Não foi possível concluir o pedido.", 500);
}

function writeAllowed(request: Request): boolean {
  return consumeRateLimit(
    `resolutions:${getClientKey(request)}`,
    WRITE_LIMIT,
    WRITE_WINDOW_MS,
  );
}

export async function GET(request: Request) {
  try {
    const projectId = normaliseProjectId(
      new URL(request.url).searchParams.get("projectId"),
    );
    const resolutions = await listResolutions(projectId);
    return json({ resolutions });
  } catch (cause) {
    return handle(cause);
  }
}

export async function POST(request: Request) {
  if (!writeAllowed(request)) {
    return error("Demasiadas alterações ao histórico. Tenta novamente mais tarde.", 429);
  }

  try {
    const input = parseNewResolutionInput(await readJson(request));
    const resolution = await addResolution(input);
    return json({ resolution }, 201);
  } catch (cause) {
    return handle(cause);
  }
}

export async function DELETE(request: Request) {
  if (!writeAllowed(request)) {
    return error("Demasiadas alterações ao histórico. Tenta novamente mais tarde.", 429);
  }

  try {
    const projectId = normaliseProjectId(
      new URL(request.url).searchParams.get("projectId"),
    );
    const removed = await clearResolutions(projectId);
    return json({ removed });
  } catch (cause) {
    return handle(cause);
  }
}
