import { useRef, useCallback, useEffect } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const SILENCE_GAP_MS = 2500;
const MAX_RETRIES = 3;

/**
 * Continuous speech recognition hook with silence gap detection.
 *
 * @param {Object} opts
 * @param {string}   opts.lang           – BCP-47 language tag (default 'en-US')
 * @param {Function} opts.onInterim      – (text: string) interim transcript fragment
 * @param {Function} opts.onFinal        – (text: string) finalized transcript fragment
 * @param {Function} opts.onSilenceGap   – (accumulatedText: string) fires after SILENCE_GAP_MS of no speech
 * @param {Function} opts.getAccumulated – () => string, returns current accumulated transcript
 *
 * @returns {{ start, stop, isListeningRef }}
 */
export default function useSpeechRecognition({
  lang = 'en-US',
  onInterim,
  onFinal,
  onSilenceGap,
  getAccumulated,
} = {}) {
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const retryCountRef = useRef(0);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      const text = getAccumulated?.();
      if (text && text.trim()) {
        onSilenceGap?.(text);
      }
    }, SILENCE_GAP_MS);
  }, [onSilenceGap, getAccumulated]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    isListeningRef.current = false;
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }

    stop();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      retryCountRef.current = 0;
      resetSilenceTimer();

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (!text) continue;

        if (result.isFinal) {
          onFinal?.(text);
        } else {
          onInterim?.(text);
        }
      }
    };

    recognition.onend = () => {
      if (shouldRestartRef.current && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        try { recognition.start(); } catch {}
      } else if (shouldRestartRef.current) {
        retryCountRef.current = 0;
        setTimeout(() => {
          if (shouldRestartRef.current) {
            try { recognition.start(); } catch {}
          }
        }, 1000);
      } else {
        isListeningRef.current = false;
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      console.warn('SpeechRecognition error:', event.error);
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    isListeningRef.current = true;
    retryCountRef.current = 0;

    try { recognition.start(); } catch {}
    resetSilenceTimer();
  }, [lang, onInterim, onFinal, stop, resetSilenceTimer]);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  return { start, stop, isListeningRef };
}
