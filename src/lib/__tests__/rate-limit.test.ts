import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows requests under the limit and tracks remaining", () => {
    expect(checkRateLimit("ip:1", 3, 60_000)).toEqual({
      ok: true,
      remaining: 2,
    });
    expect(checkRateLimit("ip:1", 3, 60_000)).toEqual({
      ok: true,
      remaining: 1,
    });
    expect(checkRateLimit("ip:1", 3, 60_000)).toEqual({
      ok: true,
      remaining: 0,
    });
  });

  it("blocks once the limit is reached", () => {
    checkRateLimit("ip:2", 2, 60_000);
    checkRateLimit("ip:2", 2, 60_000);

    expect(checkRateLimit("ip:2", 2, 60_000)).toEqual({
      ok: false,
      retryAfterSec: 60,
    });
  });

  it("isolates buckets by key", () => {
    checkRateLimit("a", 1, 60_000);
    expect(checkRateLimit("a", 1, 60_000).ok).toBe(false);
    expect(checkRateLimit("b", 1, 60_000).ok).toBe(true);
  });

  it("frees capacity after the window elapses", () => {
    checkRateLimit("ip:3", 1, 10_000);
    expect(checkRateLimit("ip:3", 1, 10_000).ok).toBe(false);

    jest.advanceTimersByTime(10_000);

    expect(checkRateLimit("ip:3", 1, 10_000)).toEqual({
      ok: true,
      remaining: 0,
    });
  });
});
