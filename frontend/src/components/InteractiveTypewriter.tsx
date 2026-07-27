"use client";

import { useCallback, useRef, useState } from "react";

/**
 * An actual interactive typewriter — click the paper and type.
 * Each keystroke triggers a short procedural "clack" via Web Audio
 * (no audio files needed) and a brief strike animation on the
 * decorative machine body underneath.
 */
export function InteractiveTypewriter() {
  const [text, setText] = useState("");
  const [striking, setStriking] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const strikeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
      playClack();
      setStriking(true);
      if (strikeTimeout.current) clearTimeout(strikeTimeout.current);
      strikeTimeout.current = setTimeout(() => setStriking(false), 90);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setText(e.currentTarget.textContent ?? "");
  };

  return (
    <div className="typewriter-wrap">
      <p className="label" style={{ textAlign: "center", color: "var(--red-seal)", marginBottom: 14 }}>
        Draft a Note
      </p>

      <div className="typewriter-paper" onClick={() => editableRef.current?.focus()}>
        <div
          ref={editableRef}
          className="typewriter-text"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          role="textbox"
          aria-label="Typewriter notepad"
        />
        {text.length === 0 && (
          <p className="typewriter-placeholder" style={{ marginTop: -96, paddingTop: 2 }}>
            Click here and start typing…
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

      <p className="typewriter-hint">A place to think before you upload.</p>
    </div>
  );
}
