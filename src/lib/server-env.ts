function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getChatEnv() {
  const allowedOrigins = (optional("CHAT_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    apiKey: required("CHAT_API_KEY"),
    baseUrl: required("CHAT_BASE_URL").replace(/\/$/, ""),
    model: required("CHAT_MODEL"),
    systemPrompt: required("CHAT_SYSTEM_PROMPT"),
    accessSecret: optional("CHAT_ACCESS_SECRET"),
    allowedOrigins,
    rateLimitPerMin: intEnv("CHAT_RATE_LIMIT_PER_MIN", 8),
    rateLimitPerHour: intEnv("CHAT_RATE_LIMIT_PER_HOUR", 60),
    maxMessages: intEnv("CHAT_MAX_MESSAGES", 40),
    maxMessageChars: intEnv("CHAT_MAX_MESSAGE_CHARS", 32000),
    contextMessages: intEnv("CHAT_CONTEXT_MESSAGES", 16),
  };
}
