import {
  clientIp,
  isOriginAllowed,
  safeEqual,
  validateMessages,
} from "@/lib/chat-guard";
import type { NextRequest } from "next/server";

function mockRequest(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  } as NextRequest;
}

describe("clientIp", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const req = mockRequest({
      "x-forwarded-for": "1.1.1.1, 2.2.2.2",
      "x-real-ip": "9.9.9.9",
    });
    expect(clientIp(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip then cf-connecting-ip", () => {
    expect(clientIp(mockRequest({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(
      clientIp(mockRequest({ "cf-connecting-ip": "4.4.4.4" })),
    ).toBe("4.4.4.4");
  });

  it("returns unknown when no IP headers are present", () => {
    expect(clientIp(mockRequest({}))).toBe("unknown");
  });
});

describe("safeEqual", () => {
  it("compares equal strings", () => {
    expect(safeEqual("secret", "secret")).toBe(true);
  });

  it("rejects unequal or different-length strings", () => {
    expect(safeEqual("secret", "Secret")).toBe(false);
    expect(safeEqual("short", "longer")).toBe(false);
  });
});

describe("isOriginAllowed", () => {
  const allowed = ["https://mbulu.example"];

  it("allows any origin when the allowlist is empty", () => {
    expect(isOriginAllowed(mockRequest({ origin: "https://evil.test" }), [])).toBe(
      true,
    );
  });

  it("allows matching Origin", () => {
    expect(
      isOriginAllowed(
        mockRequest({ origin: "https://mbulu.example" }),
        allowed,
      ),
    ).toBe(true);
  });

  it("allows matching Referer origin", () => {
    expect(
      isOriginAllowed(
        mockRequest({ referer: "https://mbulu.example/chat" }),
        allowed,
      ),
    ).toBe(true);
  });

  it("rejects foreign Origin and missing Origin/Referer", () => {
    expect(
      isOriginAllowed(mockRequest({ origin: "https://evil.test" }), allowed),
    ).toBe(false);
    expect(isOriginAllowed(mockRequest({}), allowed)).toBe(false);
  });
});

describe("validateMessages", () => {
  it("accepts a valid trailing user message", () => {
    const result = validateMessages(
      [
        { role: "assistant", content: "hi" },
        { role: "user", content: "hello" },
      ],
      40,
      100,
    );
    expect(result).toEqual({
      ok: true,
      messages: [
        { role: "assistant", content: "hi" },
        { role: "user", content: "hello" },
      ],
    });
  });

  it("rejects empty, oversized, or invalid payloads", () => {
    expect(validateMessages([], 40, 100)).toEqual({
      ok: false,
      error: "messages required",
    });
    expect(
      validateMessages([{ role: "user", content: "a" }, { role: "user", content: "b" }], 1, 100)
        .ok,
    ).toBe(false);
    expect(
      validateMessages([{ role: "bot", content: "x" }], 40, 100),
    ).toEqual({ ok: false, error: "Invalid message role" });
    expect(
      validateMessages([{ role: "user", content: "too long!!" }], 40, 5),
    ).toEqual({
      ok: false,
      error: "Message too long (max 5 characters)",
    });
  });

  it("requires the last message to be a non-empty user message", () => {
    expect(
      validateMessages([{ role: "assistant", content: "done" }], 40, 100),
    ).toEqual({
      ok: false,
      error: "Last message must be a non-empty user message",
    });
    expect(
      validateMessages([{ role: "user", content: "   " }], 40, 100),
    ).toEqual({
      ok: false,
      error: "Last message must be a non-empty user message",
    });
  });
});
