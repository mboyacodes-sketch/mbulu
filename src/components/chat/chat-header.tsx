"use client";

type ChatHeaderProps = {
  accessRequired: boolean;
  showNewChat: boolean;
  disabled?: boolean;
  onLock: () => void;
  onNewChat: () => void;
};

export function ChatHeader({
  accessRequired,
  showNewChat,
  disabled = false,
  onLock,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="mbulu-header">
      <p className="mbulu-brand">Mbulu</p>
      <div className="mbulu-header-actions">
        {accessRequired ? (
          <button
            type="button"
            onClick={onLock}
            disabled={disabled}
            className="mbulu-chip"
          >
            Lock
          </button>
        ) : null}
        {showNewChat ? (
          <button
            type="button"
            onClick={onNewChat}
            disabled={disabled}
            className="mbulu-chip"
          >
            New chat
          </button>
        ) : null}
      </div>
    </header>
  );
}
