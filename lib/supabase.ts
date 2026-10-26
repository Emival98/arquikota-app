import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const RESOLUTIONS_TABLE = "arquikota_resolutions";

export class SupabaseConfigError extends Error {
  constructor(message = "O histórico partilhado não está configurado no servidor.") {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !serviceKey) {
    throw new SupabaseConfigError();
  }

  let projectUrl: string;
  try {
    projectUrl = new URL(rawUrl).origin;
  } catch {
    throw new SupabaseConfigError("O URL do Supabase não é válido.");
  }

  cached = createClient(projectUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
