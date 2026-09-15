"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

const ACCESS_HEADER = "x-mbulu-access";

function createId() {
  return crypto.randomUUID();
}

export function useChat() {
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const scroll = useChatScroll({
    enabled: ready && unlocked,
    itemCount: messages.length,
    contentLength: lastContentLength,
    forceStick: isStreaming,
  });

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

    if (scroll.stickToBottomRef.current) {
      scroll.scrollToBottom();
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
        scroll.stickToBottomRef.current = true;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  useEffect(() => {
    if (!ready || isStreaming) return;
    saveChatMemory(messages);
  }, [messages, ready, isStreaming]);

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

  function stopGeneration() {
    clearStreamFrame();
    abortRef.current?.abort();
    abortRef.current = null;
  }

  function startNewChat() {
    if (isStreaming) {
      stopGeneration();
    }
    speech.stop();
    clearChatMemory();
    setMessages([]);
    setError(null);
    setInput("");
    scroll.stickToBottomRef.current = true;
  }

  async function unlock() {
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

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || !unlocked) return;

    if (speech.listening) {
      speech.stop();
    }

    setError(null);
    setInput("");
    scroll.pinToBottom();

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

  return {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    ready,
    accessRequired,
    unlocked,
    accessInput,
    setAccessInput,
    accessError,
    isUnlocking,
    speech,
    textareaRef,
    scrollerRef: scroll.scrollerRef,
    bottomRef: scroll.bottomRef,
    startNewChat,
    unlock,
    lockSession,
    toggleVoice,
    stopGeneration,
    sendMessage,
  };
}
