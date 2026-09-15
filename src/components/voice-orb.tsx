"use client";

type VoiceOrbProps = {
  active: boolean;
};

export function VoiceOrb({ active }: VoiceOrbProps) {
  if (!active) return null;

  return (
    <div className="voice-orb" aria-hidden="true">
      <span className="voice-orb-ring voice-orb-ring-a" />
      <span className="voice-orb-ring voice-orb-ring-b" />
      <span className="voice-orb-core">
        <span className="voice-orb-blob voice-orb-blob-a" />
        <span className="voice-orb-blob voice-orb-blob-b" />
        <span className="voice-orb-blob voice-orb-blob-c" />
      </span>
      <span className="voice-wave" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
