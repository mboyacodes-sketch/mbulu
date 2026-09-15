import { getChatEnv } from "@/lib/server-env";

describe("getChatEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CHAT_API_KEY;
    delete process.env.CHAT_BASE_URL;
    delete process.env.CHAT_MODEL;
    delete process.env.CHAT_SYSTEM_PROMPT;
    delete process.env.CHAT_ACCESS_SECRET;
    delete process.env.CHAT_ALLOWED_ORIGINS;
    delete process.env.CHAT_RATE_LIMIT_PER_MIN;
    delete process.env.CHAT_RATE_LIMIT_PER_HOUR;
    delete process.env.CHAT_MAX_MESSAGES;
    delete process.env.CHAT_MAX_MESSAGE_CHARS;
    delete process.env.CHAT_CONTEXT_MESSAGES;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when required values are missing", () => {
    expect(() => getChatEnv()).toThrow("CHAT_API_KEY is not configured");
  });

  it("parses required and optional values with defaults", () => {
    process.env.CHAT_API_KEY = " key ";
    process.env.CHAT_BASE_URL = "https://llm.example/v1/";
    process.env.CHAT_MODEL = "demo";
    process.env.CHAT_SYSTEM_PROMPT = "Be helpful";
    process.env.CHAT_ACCESS_SECRET = "gate";
    process.env.CHAT_ALLOWED_ORIGINS =
      "https://a.example, https://b.example ,";

    expect(getChatEnv()).toEqual({
      apiKey: "key",
      baseUrl: "https://llm.example/v1",
      model: "demo",
      systemPrompt: "Be helpful",
      accessSecret: "gate",
      allowedOrigins: ["https://a.example", "https://b.example"],
      rateLimitPerMin: 8,
      rateLimitPerHour: 60,
      maxMessages: 40,
      maxMessageChars: 32000,
      contextMessages: 16,
    });
  });

  it("uses positive integer overrides and ignores invalid ints", () => {
    process.env.CHAT_API_KEY = "k";
    process.env.CHAT_BASE_URL = "https://llm.example";
    process.env.CHAT_MODEL = "m";
    process.env.CHAT_SYSTEM_PROMPT = "s";
    process.env.CHAT_RATE_LIMIT_PER_MIN = "12";
    process.env.CHAT_MAX_MESSAGES = "0";
    process.env.CHAT_CONTEXT_MESSAGES = "nope";

    const env = getChatEnv();
    expect(env.rateLimitPerMin).toBe(12);
    expect(env.maxMessages).toBe(40);
    expect(env.contextMessages).toBe(16);
  });
});
