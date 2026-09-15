"use client";

import { VoiceOrb } from "@/components/voice-orb";

type VoicePanelProps = {
  draftText: string;
  canSend: boolean;
  onStop: () => void;
  onSend: () => void;
};

export function VoicePanel({
  draftText,
  canSend,
  onStop,
  onSend,
}: VoicePanelProps) {
  return (
    <div className="mbulu-voice-panel animate-fade-in">
      <VoiceOrb active />
      <p className="mbulu-voice-title">Listening…</p>
      <p className="mbulu-voice-transcript">{draftText || "Say something"}</p>
      <div className="mbulu-voice-actions">
        <button
          type="button"
          onClick={onStop}
          className="mbulu-btn mbulu-btn-ghost"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="mbulu-btn mbulu-btn-primary"
        >
          Send
        </button>
      </div>
    </div>
  );
}
