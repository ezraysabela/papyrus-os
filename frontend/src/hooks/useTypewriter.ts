"use client";

import { useEffect, useState } from "react";

/**
 * Types out `text` one character at a time, starting after `delayMs`.
 * Returns the text typed so far and whether typing has finished
 * (so callers can stop rendering the blinking cursor once it's done).
 */
export function useTypewriter(
  text: string,
  speedMs: number = 28,
  delayMs: number = 300
): { typed: string; done: boolean } {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let interval: ReturnType<typeof setInterval>;

    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setTyped(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speedMs);
    }, delayMs);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, speedMs, delayMs]);

  return { typed, done };
}