"use client";

import { useLayoutEffect, useRef } from "react";

const NEAR_BOTTOM_PX = 120;

type UseChatScrollOptions = {
  enabled: boolean;
  itemCount: number;
  contentLength: number;
  forceStick?: boolean;
};

export function useChatScroll({
  enabled,
  itemCount,
  contentLength,
  forceStick = false,
}: UseChatScrollOptions) {
  const scrollerRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

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

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !enabled) return;

    function onScroll() {
      const el = scrollerRef.current;
      if (!el) return;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = remaining <= NEAR_BOTTOM_PX;
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [enabled]);

  useLayoutEffect(() => {
    if (!enabled || itemCount === 0) return;
    if (stickToBottomRef.current || forceStick) {
      scrollToBottom();
    }
  }, [enabled, itemCount, contentLength, forceStick]);

  return {
    scrollerRef,
    bottomRef,
    stickToBottomRef,
    scrollToBottom,
    pinToBottom,
  };
}
