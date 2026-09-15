"use client";

import type { ChatMessage } from "@/lib/types";
import { MessageContent } from "@/components/message-content";
import { ThinkingIndicator } from "@/components/thinking-indicator";

type MessageBubbleProps = {
  message: ChatMessage;
  streaming?: boolean;
};

export function MessageBubble({ message, streaming = false }: MessageBubbleProps) {
  return (
    <article
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
          streaming={streaming}
        />
      ) : (
        <ThinkingIndicator />
      )}
    </article>
  );
}
