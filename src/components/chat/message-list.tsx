"use client";

import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "@/components/chat/message-bubble";

type MessageListProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function MessageList({
  messages,
  isStreaming,
  bottomRef,
}: MessageListProps) {
  return (
    <section className="mbulu-thread" aria-live="polite">
      {messages.map((message, index) => {
        const isLiveAssistant =
          isStreaming &&
          message.role === "assistant" &&
          index === messages.length - 1;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            streaming={isLiveAssistant}
          />
        );
      })}
      <div ref={bottomRef} className="mbulu-thread-end" />
    </section>
  );
}
