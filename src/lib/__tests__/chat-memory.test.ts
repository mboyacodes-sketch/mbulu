import {
  clearChatMemory,
  loadChatMemory,
  saveChatMemory,
} from "@/lib/chat-memory";
import type { ChatMessage } from "@/lib/types";

describe("chat-memory", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const sample: ChatMessage[] = [
    { id: "1", role: "user", content: "hello" },
    { id: "2", role: "assistant", content: "hi there" },
  ];

  it("round-trips messages through localStorage", () => {
    saveChatMemory(sample);
    expect(loadChatMemory()).toEqual(sample);
  });

  it("drops blank content and clears storage when empty", () => {
    saveChatMemory([
      { id: "1", role: "user", content: "keep" },
      { id: "2", role: "assistant", content: "   " },
    ]);
    expect(loadChatMemory()).toEqual([
      { id: "1", role: "user", content: "keep" },
    ]);

    saveChatMemory([{ id: "3", role: "user", content: "  " }]);
    expect(window.localStorage.getItem("mbulu.chat.v1")).toBeNull();
    expect(loadChatMemory()).toEqual([]);
  });

  it("ignores corrupt or non-array storage values", () => {
    window.localStorage.setItem("mbulu.chat.v1", "{not-json");
    expect(loadChatMemory()).toEqual([]);

    window.localStorage.setItem("mbulu.chat.v1", JSON.stringify({ bad: true }));
    expect(loadChatMemory()).toEqual([]);

    window.localStorage.setItem(
      "mbulu.chat.v1",
      JSON.stringify([{ id: 1, role: "user", content: "nope" }]),
    );
    expect(loadChatMemory()).toEqual([]);
  });

  it("clearChatMemory removes the key", () => {
    saveChatMemory(sample);
    clearChatMemory();
    expect(loadChatMemory()).toEqual([]);
  });
});
