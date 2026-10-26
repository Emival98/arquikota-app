const buckets = new Map<string, number[]>();

export function consumeRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > 2_000) {
    for (const [bucketKey, timestamps] of buckets) {
      if (!timestamps.some((timestamp) => now - timestamp < windowMs)) {
        buckets.delete(bucketKey);
      }
    }
  }

  return true;
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const address = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return address || "local";
}
