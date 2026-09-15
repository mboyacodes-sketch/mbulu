"use client";

import { FormEvent } from "react";

type AccessGateProps = {
  accessInput: string;
  accessError: string | null;
  isUnlocking: boolean;
  onAccessInputChange: (value: string) => void;
  onUnlock: () => void;
};

export function AccessGate({
  accessInput,
  accessError,
  isUnlocking,
  onAccessInputChange,
  onUnlock,
}: AccessGateProps) {
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    onUnlock();
  }

  return (
    <div className="mbulu-gate">
      <header className="mbulu-header">
        <p className="mbulu-brand">Mbulu</p>
      </header>
      <main className="mbulu-gate-main">
        <section className="animate-fade-in">
          <h1 className="mbulu-gate-title">Enter to continue</h1>
          <p className="mbulu-gate-copy">
            This chat is gated. Use the access code to unlock it for this
            browser session.
          </p>
          <form onSubmit={onSubmit} className="mbulu-gate-form">
            <label htmlFor="access-code" className="sr-only">
              Access code
            </label>
            <input
              id="access-code"
              type="password"
              autoComplete="current-password"
              value={accessInput}
              onChange={(event) => onAccessInputChange(event.target.value)}
              placeholder="Access code"
              className="mbulu-input"
            />
            <button
              type="submit"
              disabled={isUnlocking || !accessInput.trim()}
              className="mbulu-btn mbulu-btn-primary"
            >
              {isUnlocking ? "Checking…" : "Unlock"}
            </button>
            {accessError ? <p className="mbulu-error">{accessError}</p> : null}
          </form>
        </section>
      </main>
    </div>
  );
}
