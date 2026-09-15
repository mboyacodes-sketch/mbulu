"use client";

export function ThinkingIndicator() {
  return (
    <div
      className="imessage-typing"
      role="status"
      aria-live="polite"
      aria-label="Mbulu is typing"
    >
      <span className="imessage-typing-dot" />
      <span className="imessage-typing-dot" />
      <span className="imessage-typing-dot" />
    </div>
  );
}
