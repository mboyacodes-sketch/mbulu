"use client";

import { FormEvent, KeyboardEvent, RefObject } from "react";

type ComposerProps = {
  input: string;
  isStreaming: boolean;
  speechSupported: boolean;
  error: string | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onToggleVoice: () => void;
  onStop: () => void;
};

export function Composer({
  input,
  isStreaming,
  speechSupported,
  error,
  textareaRef,
  onInputChange,
  onSubmit,
  onToggleVoice,
  onStop,
}: ComposerProps) {
  const canSend = Boolean(input.trim()) && !isStreaming;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mbulu-composer">
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message Mbulu…"
          disabled={isStreaming}
          className="mbulu-composer-input"
        />

        {speechSupported ? (
          <button
            type="button"
            onClick={onToggleVoice}
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
            onClick={onStop}
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

      {error ? (
        <p className="mbulu-hint mbulu-hint-error">{error}</p>
      ) : (
        <p className="mbulu-hint">
          {isStreaming
            ? "Generating… tap stop to halt"
            : speechSupported
              ? "Enter to send · Mic to dictate · Shift+Enter for a new line"
              : "Enter to send · Shift+Enter for a new line"}
        </p>
      )}
    </>
  );
}
