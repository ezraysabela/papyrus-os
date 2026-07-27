"use client";

import { useCallback, useRef, useState } from "react";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

/**
 * An actual interactive typewriter — click the paper and type on your
 * keyboard, or click the on-screen keys directly. Both paths run through
 * the same insert/strike/clack logic so the experience is identical
 * either way.
 */
export function InteractiveTypewriter() {
  const [text, setText] = useState("");
  const [striking, setStriking] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const strikeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playClack = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(120 + Math.random() * 40, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // audio unsupported — typewriter still works silently
    }
  }, []);

  const strike = useCallback(() => {
    playClack();
    setStriking(true);
    if (strikeTimeout.current) clearTimeout(strikeTimeout.current);
    strikeTimeout.current = setTimeout(() => setStriking(false), 90);
  }, [playClack]);

  /** Single source of truth for all text mutations, whether they come
   * from the on-screen keys or the physical keyboard. */
  const insert = useCallback(
    (value: string) => {
      strike();
      setText((prev) => {
        if (value === "\u232B") return prev.slice(0, -1); // backspace glyph
        return prev + value;
      });
    },
    [strike]
  );

  const handleKeyClick = (label: string) => {
    setPressedKey(label);
    if (pressTimeout.current) clearTimeout(pressTimeout.current);
    pressTimeout.current = setTimeout(() => setPressedKey(null), 120);

    if (label === "SPACE") insert(" ");
    else if (label === "⌫") insert("\u232B");
    else if (label === "⏎") insert("\n");
    else insert(label.toLowerCase());

    hiddenInputRef.current?.focus();
  };

  // Physical keyboard: mirror every keystroke into the same strike()
  // path so paper + sound + strike animation stay in sync with clicked keys.
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
      strike();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="typewriter-wrap">
      <p className="label" style={{ textAlign: "center", color: "var(--red-seal)", marginBottom: 14 }}>
        Draft a Note
      </p>

      <div className="typewriter-paper" onClick={() => hiddenInputRef.current?.focus()}>
        {/* Real, focusable input capturing physical typing — visually hidden but functional */}
        <textarea
          ref={hiddenInputRef}
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={handleTextareaKeyDown}
          aria-label="Typewriter notepad"
          style={{
            position: "absolute",
            opacity: 0,
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
        />
        <div className="typewriter-text">
          {text || null}
          <span className="typewriter-caret" />
        </div>
        {text.length === 0 && (
          <p className="typewriter-placeholder" style={{ marginTop: -96, paddingTop: 2 }}>
            Start typing…
          </p>
        )}
      </div>

      <div className="typewriter-rollers">
        <span className="typewriter-roller" />
        <span className="typewriter-roller" />
      </div>
      <div className={`typewriter-body${striking ? " striking" : ""}`}>
        <span className="typewriter-body-label">PAPYRUS</span>
      </div>

      {/* Actual clickable keyboard */}
      <div className="typewriter-keyboard">
        {ROWS.map((row, i) => (
          <div className="typewriter-key-row" key={i}>
            {row.map((k) => (
              <button
                key={k}
                type="button"
                className={`typewriter-key${pressedKey === k ? " key-pressed" : ""}`}
                onClick={() => handleKeyClick(k)}
              >
                {k}
              </button>
            ))}
          </div>
        ))}
        <div className="typewriter-key-row">
          <button
            type="button"
            className={`typewriter-key typewriter-key-wide${pressedKey === "⌫" ? " key-pressed" : ""}`}
            onClick={() => handleKeyClick("⌫")}
          >
            back
          </button>
          <button
            type="button"
            className={`typewriter-key typewriter-key-space${pressedKey === "SPACE" ? " key-pressed" : ""}`}
            onClick={() => handleKeyClick("SPACE")}
          >
            space
          </button>
          <button
            type="button"
            className={`typewriter-key typewriter-key-wide typewriter-key-accent${pressedKey === "⏎" ? " key-pressed" : ""}`}
            onClick={() => handleKeyClick("⏎")}
          >
            return
          </button>
        </div>
      </div>

      <p className="typewriter-hint">A place to think before you upload.</p>
    </div>
  );
}