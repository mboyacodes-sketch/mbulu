import { NextRequest } from "next/server";
import { clientIp, isOriginAllowed, safeEqual } from "@/lib/chat-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { getChatEnv } from "@/lib/server-env";

export const runtime = "nodejs";

export async function GET() {
  let env: ReturnType<typeof getChatEnv>;
  try {
    env = getChatEnv();
  } catch {
    return Response.json({ error: "Server env is not configured" }, { status: 500 });
  }

  return Response.json({
    accessRequired: Boolean(env.accessSecret),
  });
}

export async function POST(req: NextRequest) {
  let env: ReturnType<typeof getChatEnv>;
  try {
    env = getChatEnv();
  } catch {
    return Response.json({ error: "Server env is not configured" }, { status: 500 });
  }

  if (!isOriginAllowed(req, env.allowedOrigins)) {
    return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (!env.accessSecret) {
    return Response.json({ ok: true, accessRequired: false });
  }

  const ip = clientIp(req);
  const unlockAttempts = checkRateLimit(`unlock:${ip}`, 10, 15 * 60_000);
  if (!unlockAttempts.ok) {
    return Response.json(
      { error: "Too many unlock attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(unlockAttempts.retryAfterSec) },
      },
    );
  }

  let secret = "";
  try {
    const body = await req.json();
    secret = typeof body.secret === "string" ? body.secret : "";
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!secret || !safeEqual(secret, env.accessSecret)) {
    return Response.json({ error: "Invalid access code" }, { status: 401 });
  }

  return Response.json({ ok: true, accessRequired: true });
}
