import { NextResponse } from "next/server";
import { LATEST_VERSIONS } from "@/lib/catalog";
import { scanProject } from "@/lib/engine";
import { GithubError, importGithubProfile } from "@/lib/github";
import { ValidationError, parseScanRequest } from "@/lib/parse";
import { createDemoScan } from "@/lib/presets";
import { fetchRegistryData } from "@/lib/registry";
import type { ScanReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

function json(report: ScanReport) {
  return NextResponse.json(report, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function error(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return error("O pedido é demasiado grande.", 413);
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return error("O pedido é demasiado grande.", 413);
    }
    body = JSON.parse(text);
  } catch {
    return error("O corpo do pedido não é um JSON válido.", 400);
  }

  try {
    const parsed = parseScanRequest(body);

    if (parsed.source === "demo" && parsed.presetId) {
      const report = createDemoScan(parsed.presetId, parsed.cadence);
      return json(report);
    }

    const imported = await importGithubProfile(parsed.repo);
    const registry = await fetchRegistryData(imported.project.dependencies, LATEST_VERSIONS);
    const report = scanProject(imported.project, {
      scannedAt: new Date().toISOString(),
      latest: registry.latest,
      deprecations: registry.deprecations,
      cadence: parsed.cadence,
      latestSource: registry.latestSource,
      warnings: [...imported.warnings, ...registry.warnings],
    });

    return json(report);
  } catch (cause) {
    if (cause instanceof ValidationError) {
      return error(cause.message, cause.status);
    }
    if (cause instanceof GithubError) {
      return error(cause.message, cause.status);
    }
    console.error("Falha na verificação ArquiKota", cause);
    return error(
      "A verificação falhou. Confirma o repositório e tenta novamente dentro de instantes.",
      502,
    );
  }
}
