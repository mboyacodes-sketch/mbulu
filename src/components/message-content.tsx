"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";
import { CodeBlock } from "@/components/code-block";
import { safeHref } from "@/lib/safe-href";

const components: Components = {
  a: ({ href, children }) => {
    const safe = safeHref(href);
    if (!safe) {
      return <span>{children}</span>;
    }

    return (
      <a href={safe} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  },
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ className, children, ...props }) => {
    const text = String(children);
    const isBlock =
      Boolean(className?.includes("language-")) || text.includes("\n");

    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className="md-inline-code" {...props}>
        {children}
      </code>
    );
  },
};

type MessageContentProps = {
  content: string;
  variant?: "assistant" | "user";
  streaming?: boolean;
};

export const MessageContent = memo(function MessageContent({
  content,
  variant = "assistant",
  streaming = false,
}: MessageContentProps) {
  if (variant === "user") {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // Keep streaming lightweight — full markdown/highlight after the reply settles.
  if (streaming) {
    return (
      <div className="md-content whitespace-pre-wrap break-words">{content}</div>
    );
  }

  return (
    <div className="md-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
