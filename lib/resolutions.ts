import "server-only";
import { isAlertKind, type NewResolutionInput } from "./resolution-contract";
import {
  RESOLUTIONS_TABLE,
  SupabaseConfigError,
  getSupabaseAdmin,
} from "./supabase";
import type { ResolvedAlert } from "./types";

const SELECT_COLUMNS = "alert_id,title,category,note,resolved_at";
const LIMIT = 80;

export class ResolutionStoreError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "ResolutionStoreError";
    this.status = status;
  }
}

interface ResolutionRow {
  alert_id: string;
  title: string;
  category: string;
  note: string;
  resolved_at: string;
}

function mapRow(row: ResolutionRow): ResolvedAlert | null {
  if (!isAlertKind(row.category)) return null;
  return {
    id: row.alert_id,
    title: row.title,
    category: row.category,
    note: row.note,
    resolvedAt: row.resolved_at,
  };
}

function mapError(error: { code?: string; message?: string } | null, fallback: string): never {
  if (
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    /could not find the table|does not exist|schema cache/i.test(error?.message ?? "")
  ) {
    throw new ResolutionStoreError(
      "A tabela de histórico ainda não existe no Supabase. Aplica a migração do projeto.",
      503,
    );
  }

  console.error("Falha no histórico Supabase", error?.code ?? "", error?.message ?? fallback);
  throw new ResolutionStoreError(fallback, 502);
}

function mapThrown(cause: unknown, fallback: string): never {
  if (cause instanceof ResolutionStoreError) throw cause;
  if (cause instanceof SupabaseConfigError) {
    throw new ResolutionStoreError(cause.message, 503);
  }
  console.error("Falha inesperada no histórico Supabase", cause);
  throw new ResolutionStoreError(fallback, 502);
}

export async function listResolutions(projectId: string): Promise<ResolvedAlert[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(RESOLUTIONS_TABLE)
      .select(SELECT_COLUMNS)
      .eq("project_id", projectId)
      .order("resolved_at", { ascending: false })
      .limit(LIMIT);

    if (error) mapError(error, "Não foi possível carregar o histórico partilhado.");
    return ((data ?? []) as ResolutionRow[])
      .map(mapRow)
      .filter((entry): entry is ResolvedAlert => entry !== null);
  } catch (cause) {
    mapThrown(cause, "Não foi possível carregar o histórico partilhado.");
  }
}

export async function addResolution(input: NewResolutionInput): Promise<ResolvedAlert> {
  const resolvedAt = new Date().toISOString();
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(RESOLUTIONS_TABLE)
      .upsert(
        {
          project_id: input.projectId,
          alert_id: input.alertId,
          title: input.title,
          category: input.category,
          note: input.note,
          resolved_at: resolvedAt,
        },
        { onConflict: "project_id,alert_id" },
      )
      .select(SELECT_COLUMNS)
      .single();

    if (error) mapError(error, "Não foi possível guardar a resolução.");
    if (!data) mapError(null, "O Supabase não devolveu a resolução guardada.");

    const entry = mapRow(data as ResolutionRow);
    if (!entry) mapError(null, "O Supabase devolveu uma resolução inválida.");
    return entry;
  } catch (cause) {
    mapThrown(cause, "Não foi possível guardar a resolução.");
  }
}

export async function clearResolutions(projectId: string): Promise<number> {
  try {
    const { error, count } = await getSupabaseAdmin()
      .from(RESOLUTIONS_TABLE)
      .delete({ count: "exact" })
      .eq("project_id", projectId);

    if (error) mapError(error, "Não foi possível limpar o histórico partilhado.");
    return count ?? 0;
  } catch (cause) {
    mapThrown(cause, "Não foi possível limpar o histórico partilhado.");
  }
}
