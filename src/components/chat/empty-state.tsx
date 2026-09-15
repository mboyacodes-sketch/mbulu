"use client";

const SUGGESTIONS = [
  "Help me plan my day",
  "Explain this simply",
  "Draft a short note",
];

type EmptyStateProps = {
  onSuggest: (text: string) => void;
};

export function EmptyState({ onSuggest }: EmptyStateProps) {
  return (
    <section className="mbulu-empty animate-fade-in">
      <h1 className="mbulu-empty-title">Mbulu</h1>
      <p className="mbulu-empty-copy">
        Ask anything. Keep it simple — I’ll meet you there.
      </p>
      <div className="mbulu-suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggest(suggestion)}
            className="mbulu-suggestion"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
