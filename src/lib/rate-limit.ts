type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

function prune(timestamps: number[], windowMs: number, now: number) {
  while (timestamps.length > 0 && now - timestamps[0]! >= windowMs) {
    timestamps.shift();
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function resetRateLimits() {
  buckets.clear();
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  prune(bucket.timestamps, windowMs, now);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000),
    );
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
  };
}
