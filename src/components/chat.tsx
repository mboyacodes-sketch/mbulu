"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  clearAccessSecret,
  loadAccessSecret,
  saveAccessSecret,
} from "@/lib/access-client";
import {
  clearChatMemory,
  loadChatMemory,
  saveChatMemory,
} from "@/lib/chat-memory";
import type { ChatMessage } from "@/lib/types";
import { MessageContent } from "@/components/message-content";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { VoiceOrb } from "@/components/voice-orb";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

function createId() {
  return crypto.randomUUID();
}

const NEAR_BOTTOM_PX = 120;
const ACCESS_HEADER = "x-mbulu-access";

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [accessRequired, setAccessRequired] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [accessInput, setAccessInput] = useState("");
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const scrollerRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const accessSecretRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamFrameRef = useRef<number | null>(null);
  const streamTextRef = useRef("");
  const streamAssistantIdRef = useRef<string | null>(null);

  const onSpeechError = useCallback((message: string) => {
    setError(message);
  }, []);

  const speech = useSpeechToText({ onError: onSpeechError });

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastContentLength = lastMessage?.content.length ?? 0;

  function scrollToBottom() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }

  function pinToBottom() {
    stickToBottomRef.current = true;
    requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
  }

  function flushStreamFrame() {
    streamFrameRef.current = null;
    const assistantId = streamAssistantIdRef.current;
    const nextText = streamTextRef.current;
    if (!assistantId) return;

    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantId
          ? { ...message, content: nextText }
          : message,
      ),
    );

    if (stickToBottomRef.current) {
      scrollToBottom();
    }
  }

  function queueStreamUpdate(assistantId: string, nextText: string) {
    streamAssistantIdRef.current = assistantId;
    streamTextRef.current = nextText;
    if (streamFrameRef.current != null) return;
    streamFrameRef.current = window.requestAnimationFrame(flushStreamFrame);
  }

  function clearStreamFrame() {
    if (streamFrameRef.current != null) {
      window.cancelAnimationFrame(streamFrameRef.current);
      streamFrameRef.current = null;
    }
  }

  useEffect(() => {
    async function boot() {
      const storedMessages = loadChatMemory();
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
        stickToBottomRef.current = true;
      }

      try {
        const response = await fetch("/api/access");
        const payload = (await response.json().catch(() => null)) as {
          accessRequired?: boolean;
        } | null;
        const required = Boolean(payload?.accessRequired);
        setAccessRequired(required);

        if (!required) {
          setUnlocked(true);
        } else {
          const storedSecret = loadAccessSecret();
          if (storedSecret) {
            accessSecretRef.current = storedSecret;
            setUnlocked(true);
          }
        }
      } catch {
        setAccessRequired(false);
        setUnlocked(true);
      } finally {
        setReady(true);
      }
    }

    void boot();
  }, []);

  useEffect(() => {
    if (!ready || isStreaming) return;
    saveChatMemory(messages);
  }, [messages, ready, isStreaming]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function onScroll() {
      const el = scrollerRef.current;
      if (!el) return;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = remaining <= NEAR_BOTTOM_PX;
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [ready, unlocked]);

  useLayoutEffect(() => {
    if (!ready || !unlocked || messages.length === 0) return;

    if (stickToBottomRef.current || isStreaming) {
      scrollToBottom();
    }
  }, [messages.length, lastContentLength, isStreaming, ready, unlocked]);

  useEffect(() => {
    if (speech.listening) {
      setInput(speech.draftText);
    }
  }, [speech.listening, speech.draftText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function startNewChat() {
    if (isStreaming) {
      stopGeneration();
    }
    speech.stop();
    clearChatMemory();
    setMessages([]);
    setError(null);
    setInput("");
    stickToBottomRef.current = true;
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    const secret = accessInput.trim();
    if (!secret || isUnlocking) return;

    setIsUnlocking(true);
    setAccessError(null);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not unlock");
      }

      accessSecretRef.current = secret;
      saveAccessSecret(secret);
      setUnlocked(true);
      setAccessInput("");
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Could not unlock");
    } finally {
      setIsUnlocking(false);
    }
  }

  function lockSession() {
    speech.stop();
    clearAccessSecret();
    accessSecretRef.current = null;
    setUnlocked(false);
    setAccessInput("");
  }

  function toggleVoice() {
    if (isStreaming) return;

    if (speech.listening) {
      const finalText = speech.draftText;
      speech.stop();
      setInput(finalText);
      textareaRef.current?.focus();
      return;
    }

    setError(null);
    speech.start(input);
  }

  function stopGeneration() {
    clearStreamFrame();
    abortRef.current?.abort();
    abortRef.current = null;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || !unlocked) return;

    if (speech.listening) {
      speech.stop();
    }

    setError(null);
    setInput("");
    pinToBottom();

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };
    const assistantId = createId();
    const nextMessages = [...messages, userMessage];

    setMessages([
      ...nextMessages,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    streamAssistantIdRef.current = assistantId;
    streamTextRef.current = "";
    let assistantText = "";

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessSecretRef.current) {
        headers[ACCESS_HEADER] = accessSecretRef.current;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
          lockSession();
        }
        throw new Error(payload?.error ?? "Could not reach the assistant");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as { content?: string };
            if (!parsed.content) continue;
            assistantText += parsed.content;
            queueStreamUpdate(assistantId, assistantText);
          } catch {
            // ignore partial JSON
          }
        }
      }

      clearStreamFrame();
      const finalText = assistantText.trim()
        ? assistantText
        : "I didn’t catch that — try again?";
      streamTextRef.current = finalText;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: finalText }
            : message,
        ),
      );
    } catch (err) {
      clearStreamFrame();
      if (
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError")
      ) {
        const partial = streamTextRef.current.trim() || assistantText.trim();
        if (!partial) {
          setMessages((prev) =>
            prev.filter((item) => item.id !== assistantId),
          );
        } else {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: partial }
                : message,
            ),
          );
        }
      } else {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setMessages((prev) => prev.filter((item) => item.id !== assistantId));
        setInput(trimmed);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      streamAssistantIdRef.current = null;
      setIsStreaming(false);
      textareaRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  if (!ready) {
    return <div className="mbulu-shell" aria-hidden="true" />;
  }

  if (accessRequired && !unlocked) {
    return (
      <div className="mbulu-gate">
        <header className="mbulu-header">
          <p className="mbulu-brand">Mbulu</p>
        </header>
        <main className="mbulu-gate-main">
          <section className="animate-fade-in">
            <h1 className="mbulu-gate-title">Enter to continue</h1>
            <p className="mbulu-gate-copy">
              This chat is gated. Use the access code to unlock it for this
              browser session.
            </p>
            <form onSubmit={unlock} className="mbulu-gate-form">
              <label htmlFor="access-code" className="sr-only">
                Access code
              </label>
              <input
                id="access-code"
                type="password"
                autoComplete="current-password"
                value={accessInput}
                onChange={(event) => setAccessInput(event.target.value)}
                placeholder="Access code"
                className="mbulu-input"
              />
              <button
                type="submit"
                disabled={isUnlocking || !accessInput.trim()}
                className="mbulu-btn mbulu-btn-primary"
              >
                {isUnlocking ? "Checking…" : "Unlock"}
              </button>
              {accessError ? (
                <p className="mbulu-error">{accessError}</p>
              ) : null}
            </form>
          </section>
        </main>
      </div>
    );
  }

  const isEmpty = messages.length === 0;
  const canSend = Boolean(input.trim()) && !isStreaming;

  return (
    <div className="mbulu-shell">
      <header className="mbulu-header">
        <p className="mbulu-brand">Mbulu</p>
        <div className="mbulu-header-actions">
          {accessRequired ? (
            <button
              type="button"
              onClick={lockSession}
              disabled={isStreaming}
              className="mbulu-chip"
            >
              Lock
            </button>
          ) : null}
          {!isEmpty ? (
            <button
              type="button"
              onClick={startNewChat}
              disabled={isStreaming}
              className="mbulu-chip"
            >
              New chat
            </button>
          ) : null}
        </div>
      </header>

      <main ref={scrollerRef} className="mbulu-scroller">
        {isEmpty ? (
          <section className="mbulu-empty animate-fade-in">
            <h1 className="mbulu-empty-title">Mbulu</h1>
            <p className="mbulu-empty-copy">
              Ask anything. Keep it simple — I’ll meet you there.
            </p>
            <div className="mbulu-suggestions">
              {[
                "Help me plan my day",
                "Explain this simply",
                "Draft a short note",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="mbulu-suggestion"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="mbulu-thread" aria-live="polite">
            {messages.map((message, index) => {
              const isLiveAssistant =
                isStreaming &&
                message.role === "assistant" &&
                index === messages.length - 1;

              return (
                <article
                  key={message.id}
                  className={`mbulu-message animate-rise ${
                    message.role === "user"
                      ? "mbulu-message-user"
                      : "mbulu-message-assistant"
                  }`}
                >
                  {message.content ? (
                    <MessageContent
                      content={message.content}
                      variant={message.role === "user" ? "user" : "assistant"}
                      streaming={isLiveAssistant}
                    />
                  ) : (
                    <ThinkingIndicator />
                  )}
                </article>
              );
            })}
            <div ref={bottomRef} className="mbulu-thread-end" />
          </section>
        )}
      </main>

      <div className="mbulu-dock">
        <div className="mbulu-dock-fade" />

        <div className="mbulu-dock-inner">
          {speech.listening ? (
            <div className="mbulu-voice-panel animate-fade-in">
              <VoiceOrb active />
              <p className="mbulu-voice-title">Listening…</p>
              <p className="mbulu-voice-transcript">
                {speech.draftText || "Say something"}
              </p>
              <div className="mbulu-voice-actions">
                <button
                  type="button"
                  onClick={toggleVoice}
                  className="mbulu-btn mbulu-btn-ghost"
                >
                  Stop
                </button>
                <button
                  type="button"
                  onClick={() => void sendMessage(speech.draftText || input)}
                  disabled={!speech.draftText.trim() && !input.trim()}
                  className="mbulu-btn mbulu-btn-primary"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mbulu-composer">
              <label htmlFor="message" className="sr-only">
                Message
              </label>
              <textarea
                id="message"
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Message Mbulu…"
                disabled={isStreaming}
                className="mbulu-composer-input"
              />

              {speech.supported ? (
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={isStreaming}
                  className="mbulu-icon-btn mbulu-icon-btn-ghost"
                  aria-label="Start voice input"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <path d="M12 18v3" />
                  </svg>
                </button>
              ) : null}

              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="mbulu-icon-btn mbulu-icon-btn-primary"
                  aria-label="Stop generating"
                >
                  <span className="mbulu-stop-square" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  className="mbulu-icon-btn mbulu-icon-btn-primary"
                  aria-label="Send message"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </button>
              )}
            </form>
          )}

          {error ? (
            <p className="mbulu-hint mbulu-hint-error">{error}</p>
          ) : (
            <p className="mbulu-hint">
              {isStreaming
                ? "Generating… tap stop to halt"
                : speech.supported
                  ? "Enter to send · Mic to dictate · Shift+Enter for a new line"
                  : "Enter to send · Shift+Enter for a new line"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
