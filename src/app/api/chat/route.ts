import { NextRequest } from "next/server";
import {
  clientIp,
  isOriginAllowed,
  safeEqual,
  validateMessages,
} from "@/lib/chat-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { getChatEnv } from "@/lib/server-env";

export const runtime = "nodejs";

const ACCESS_HEADER = "x-mbulu-access";

export async function POST(req: NextRequest) {
  let env: ReturnType<typeof getChatEnv>;
  try {
    env = getChatEnv();
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Server env is not configured",
      },
      { status: 500 },
    );
  }

  if (!isOriginAllowed(req, env.allowedOrigins)) {
    return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (env.accessSecret) {
    const provided = req.headers.get(ACCESS_HEADER) ?? "";
    if (!provided || !safeEqual(provided, env.accessSecret)) {
      return Response.json({ error: "Access denied" }, { status: 401 });
    }
  }

  const ip = clientIp(req);
  const perMin = checkRateLimit(
    `chat:min:${ip}`,
    env.rateLimitPerMin,
    60_000,
  );
  if (!perMin.ok) {
    return Response.json(
      { error: "Too many requests. Slow down a bit." },
      {
        status: 429,
        headers: { "Retry-After": String(perMin.retryAfterSec) },
      },
    );
  }

  const perHour = checkRateLimit(
    `chat:hour:${ip}`,
    env.rateLimitPerHour,
    60 * 60_000,
  );
  if (!perHour.ok) {
    return Response.json(
      { error: "Hourly limit reached. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(perHour.retryAfterSec) },
      },
    );
  }

  let messages;
  try {
    const body = await req.json();
    const validated = validateMessages(
      body.messages,
      env.maxMessages,
      env.maxMessageChars,
    );
    if (!validated.ok) {
      return Response.json({ error: validated.error }, { status: 400 });
    }
    messages = validated.messages;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  const contextMessages = messages.slice(-env.contextMessages);

  const upstream = await fetch(`${env.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.model,
      stream: true,
      messages: [
        {
          role: "system",
          content: env.systemPrompt,
        },
        ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
    signal: req.signal,
  });

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { error: "Upstream request failed" },
      { status: 502 },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";

      const onAbort = () => {
        void reader.cancel().catch(() => undefined);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      if (req.signal.aborted) {
        onAbort();
        return;
      }

      req.signal.addEventListener("abort", onAbort, { once: true });

      try {
        while (true) {
          if (req.signal.aborted) break;

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta =
                parsed.choices?.[0]?.delta?.content ??
                parsed.choices?.[0]?.message?.content ??
                "";
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        if (!req.signal.aborted) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } catch (error) {
        if (!req.signal.aborted) {
          controller.error(error);
        }
      } finally {
        req.signal.removeEventListener("abort", onAbort);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-RateLimit-Remaining": String(perMin.remaining),
    },
  });
}
