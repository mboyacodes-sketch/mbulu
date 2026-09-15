"use client";

import { useChat } from "@/hooks/use-chat";
import { AccessGate } from "@/components/chat/access-gate";
import { ChatHeader } from "@/components/chat/chat-header";
import { Composer } from "@/components/chat/composer";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { VoicePanel } from "@/components/chat/voice-panel";

export function Chat() {
  const {
    ready,
    accessRequired,
    unlocked,
    accessInput,
    accessError,
    isUnlocking,
    setAccessInput,
    unlock,
    messages,
    isStreaming,
    lockSession,
    startNewChat,
    scrollerRef,
    bottomRef,
    sendMessage,
    speech,
    input,
    setInput,
    error,
    textareaRef,
    toggleVoice,
    stopGeneration,
  } = useChat();

  if (!ready) {
    return <div className="mbulu-shell" aria-hidden="true" />;
  }

  if (accessRequired && !unlocked) {
    return (
      <AccessGate
        accessInput={accessInput}
        accessError={accessError}
        isUnlocking={isUnlocking}
        onAccessInputChange={setAccessInput}
        onUnlock={() => void unlock()}
      />
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="mbulu-shell">
      <ChatHeader
        accessRequired={accessRequired}
        showNewChat={!isEmpty}
        disabled={isStreaming}
        onLock={lockSession}
        onNewChat={startNewChat}
      />

      <main ref={scrollerRef} className="mbulu-scroller">
        {isEmpty ? (
          <EmptyState onSuggest={(text) => void sendMessage(text)} />
        ) : (
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            bottomRef={bottomRef}
          />
        )}
      </main>

      <div className="mbulu-dock">
        <div className="mbulu-dock-fade" />
        <div className="mbulu-dock-inner">
          {speech.listening ? (
            <VoicePanel
              draftText={speech.draftText}
              canSend={Boolean(speech.draftText.trim() || input.trim())}
              onStop={toggleVoice}
              onSend={() => void sendMessage(speech.draftText || input)}
            />
          ) : (
            <Composer
              input={input}
              isStreaming={isStreaming}
              speechSupported={speech.supported}
              error={error}
              textareaRef={textareaRef}
              onInputChange={setInput}
              onSubmit={() => void sendMessage(input)}
              onToggleVoice={toggleVoice}
              onStop={stopGeneration}
            />
          )}
        </div>
      </div>
    </div>
  );
}
