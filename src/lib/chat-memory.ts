import type { ChatMessage } from "@/lib/types";

const STORAGE_KEY = "mbulu.chat.v1";

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as ChatMessage;
  return (
    typeof message.id === "string" &&
    (message.role === "user" ||
      message.role === "assistant" ||
      message.role === "system") &&
    typeof message.content === "string"
  );
}

export function loadChatMemory(): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is ChatMessage =>
        isMessage(item) && item.content.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export function saveChatMemory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;

  const durable = messages.filter((message) => message.content.trim().length > 0);

  try {
    if (durable.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(durable));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearChatMemory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
