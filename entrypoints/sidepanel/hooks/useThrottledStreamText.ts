import { useEffect, useRef, useState } from 'react';

/** Longest interval between two updates */
const MAX_WAIT = 2000;
/** Multiplier of the previous render cost: the next update is allowed after that window */
const TIME_CONSUMING_RATE = 2;

/**
 * Adaptive throttle for streaming text rendering.
 * Each commit records how long the render took, and the next allowed update is
 * `now + cost * TIME_CONSUMING_RATE` (capped by MAX_WAIT). Text arriving in between
 * is collapsed into a single update, so per-token re-parsing never blocks the main thread.
 * When `enable` is false the latest text is returned as-is so the final content is always complete.
 */
export function useThrottledStreamText(text: string, enable: boolean) {
  // First render starts counting from mount
  const startRef = useRef(performance.now());
  const updatableAtRef = useRef(0);
  const latestRef = useRef(text);
  const [output, setOutput] = useState(text);

  latestRef.current = text;

  useEffect(() => {
    const now = performance.now();
    updatableAtRef.current =
      now + Math.min(MAX_WAIT, (now - startRef.current) * TIME_CONSUMING_RATE);
  }, [output]);

  // When streaming starts, align to the newest text first so we never sit on a stale chunk
  useEffect(() => {
    if (!enable) return;
    startRef.current = performance.now();
    setOutput(latestRef.current);
  }, [enable]);

  useEffect(() => {
    if (!enable) return;
    const update = () => {
      startRef.current = performance.now();
      setOutput(latestRef.current);
    };
    const delay = updatableAtRef.current - performance.now();
    if (delay <= 0) {
      update();
      return;
    }
    const timer = setTimeout(update, delay);
    return () => clearTimeout(timer);
  }, [text, enable]);

  return enable ? output : text;
}
