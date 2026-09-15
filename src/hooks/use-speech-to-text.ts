"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechRecognitionConstructor } from "@/lib/speech";

type UseSpeechToTextOptions = {
  lang?: string;
  onError?: (message: string) => void;
};

export function useSpeechToText({
  lang = "en-US",
  onError,
}: UseSpeechToTextOptions = {}) {
  const [supported] = useState(() =>
    Boolean(getSpeechRecognitionConstructor()),
  );
  const [listening, setListening] = useState(false);
  const [committedText, setCommittedText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const committedRef = useRef("");
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    setListening(false);
    setInterimTranscript("");

    if (!recognition) return;
    try {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    } catch {
      // already stopped
    }
  }, []);

  const start = useCallback(
    (currentText: string) => {
      const Recognition = getSpeechRecognitionConstructor();
      if (!Recognition) {
        onErrorRef.current?.(
          "Voice input isn’t supported in this browser. Try Chrome or Edge.",
        );
        return;
      }

      stop();

      const recognition = new Recognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      const seed = currentText.trimEnd();
      committedRef.current = seed;
      setCommittedText(seed);
      setInterimTranscript("");
      setListening(true);
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result) continue;
          const piece = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalChunk += piece;
          } else {
            interim += piece;
          }
        }

        if (finalChunk) {
          const prefix = committedRef.current;
          const next =
            `${prefix}${prefix ? " " : ""}${finalChunk.trim()}`.trim();
          committedRef.current = next;
          setCommittedText(next);
        }

        setInterimTranscript(interim.trim());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted" || event.error === "no-speech") {
          return;
        }
        if (event.error === "not-allowed") {
          onErrorRef.current?.(
            "Microphone permission is blocked. Allow mic access to dictate.",
          );
        } else {
          onErrorRef.current?.("Voice input failed. Try again.");
        }
        stop();
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          setListening(false);
          setInterimTranscript("");
          recognitionRef.current = null;
        }
      };

      try {
        recognition.start();
      } catch {
        onErrorRef.current?.("Could not start voice input.");
        stop();
      }
    },
    [lang, stop],
  );

  useEffect(() => () => stop(), [stop]);

  const draftText = [committedText, interimTranscript]
    .filter(Boolean)
    .join(committedText && interimTranscript ? " " : "");

  return {
    supported,
    listening,
    interimTranscript,
    draftText,
    committedText,
    start,
    stop,
  };
}
