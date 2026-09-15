import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isOriginAllowed(
  req: NextRequest,
  allowedOrigins: string[],
): boolean {
  if (allowedOrigins.length === 0) return true;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin && allowedOrigins.includes(origin)) return true;

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.includes(refererOrigin)) return true;
    } catch {
      return false;
    }
  }

  // Same-origin navigations / non-browser clients may omit Origin.
  // Allow only when no Origin/Referer is present and this looks like a
  // non-browser tool; browser POSTs from other sites usually send Origin.
  if (!origin && !referer) return false;

  return false;
}

export type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function validateMessages(
  messages: unknown,
  maxMessages: number,
  maxMessageChars: number,
): { ok: true; messages: IncomingMessage[] } | { ok: false; error: string } {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "messages required" };
  }

  if (messages.length > maxMessages) {
    return {
      ok: false,
      error: `Too many messages (max ${maxMessages})`,
    };
  }

  const normalized: IncomingMessage[] = [];

  for (const item of messages) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Invalid message payload" };
    }

    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;

    if (
      role !== "user" &&
      role !== "assistant" &&
      role !== "system"
    ) {
      return { ok: false, error: "Invalid message role" };
    }

    if (typeof content !== "string") {
      return { ok: false, error: "Invalid message content" };
    }

    if (content.length > maxMessageChars) {
      return {
        ok: false,
        error: `Message too long (max ${maxMessageChars} characters)`,
      };
    }

    normalized.push({ role, content });
  }

  const last = normalized[normalized.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return { ok: false, error: "Last message must be a non-empty user message" };
  }

  return { ok: true, messages: normalized };
}
