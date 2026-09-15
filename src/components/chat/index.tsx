"use client";

import { useChat } from "@/hooks/use-chat";
import { AccessGate } from "@/components/chat/access-gate";
import { ChatHeader } from "@/components/chat/chat-header";
import { Composer } from "@/components/chat/composer";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { VoicePanel } from "@/components/chat/voice-panel";

export function Chat() {
  const chat = useChat();

  if (!chat.ready) {
    return <div className="mbulu-shell" aria-hidden="true" />;
  }

  if (chat.accessRequired && !chat.unlocked) {
    return (
      <AccessGate
        accessInput={chat.accessInput}
        accessError={chat.accessError}
        isUnlocking={chat.isUnlocking}
        onAccessInputChange={chat.setAccessInput}
        onUnlock={() => void chat.unlock()}
      />
    );
  }

  const isEmpty = chat.messages.length === 0;

  return (
    <div className="mbulu-shell">
      <ChatHeader
        accessRequired={chat.accessRequired}
        showNewChat={!isEmpty}
        disabled={chat.isStreaming}
        onLock={chat.lockSession}
        onNewChat={chat.startNewChat}
      />

      <main ref={chat.scrollerRef} className="mbulu-scroller">
        {isEmpty ? (
          <EmptyState onSuggest={(text) => void chat.sendMessage(text)} />
        ) : (
          <MessageList
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            bottomRef={chat.bottomRef}
          />
        )}
      </main>

      <div className="mbulu-dock">
        <div className="mbulu-dock-fade" />
        <div className="mbulu-dock-inner">
          {chat.speech.listening ? (
            <VoicePanel
              draftText={chat.speech.draftText}
              canSend={Boolean(
                chat.speech.draftText.trim() || chat.input.trim(),
              )}
              onStop={chat.toggleVoice}
              onSend={() =>
                void chat.sendMessage(chat.speech.draftText || chat.input)
              }
            />
          ) : (
            <Composer
              input={chat.input}
              isStreaming={chat.isStreaming}
              speechSupported={chat.speech.supported}
              error={chat.error}
              textareaRef={chat.textareaRef}
              onInputChange={chat.setInput}
              onSubmit={() => void chat.sendMessage(chat.input)}
              onToggleVoice={chat.toggleVoice}
              onStop={chat.stopGeneration}
            />
          )}
        </div>
      </div>
    </div>
  );
}
