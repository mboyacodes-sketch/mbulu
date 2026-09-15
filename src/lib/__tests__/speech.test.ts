import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
} from "@/lib/speech";

describe("speech", () => {
  const originalSpeech = window.SpeechRecognition;
  const originalWebkit = window.webkitSpeechRecognition;

  afterEach(() => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: originalSpeech,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: originalWebkit,
    });
  });

  it("reports unsupported when no constructors exist", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    expect(getSpeechRecognitionConstructor()).toBeNull();
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it("prefers SpeechRecognition over webkitSpeechRecognition", () => {
    const SpeechRecognition = jest.fn();
    const webkitSpeechRecognition = jest.fn();

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: SpeechRecognition,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: webkitSpeechRecognition,
    });

    expect(getSpeechRecognitionConstructor()).toBe(SpeechRecognition);
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it("falls back to webkitSpeechRecognition", () => {
    const webkitSpeechRecognition = jest.fn();

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: webkitSpeechRecognition,
    });

    expect(getSpeechRecognitionConstructor()).toBe(webkitSpeechRecognition);
  });
});
