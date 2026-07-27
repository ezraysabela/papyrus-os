"use client";

import { useState } from "react";

const VOLUME_INFO: Record<
  "I" | "II" | "III",
  { title: string; body: string }
> = {
  I: {
    title: "Vol. I — The Reading",
    body:
      "Upload a white paper or research draft and Papyrus OS reads it the way an investor would — pulling out the commercial thesis, target market, business model, and risks, each claim traceable back to your own text. Nothing here leaves your hands unregistered: every reading is paired with a SHA-256 fingerprint of the source document.",
  },
  II: {
    title: "Vol. II — The Registry",
    body:
      "Every manuscript hash registered through Papyrus OS is timestamped immutably on the Stellar network via the papyrus_registry Soroban contract. The Registry is the public, searchable face of that ledger — a place for researchers to prove prior art, and for investors to verify a claim was made when it says it was made.",
  },
  III: {
    title: "Vol. III — The Pitch",
    body:
      "Once your research has been read and registered, The Pitch reshapes that same analysis into a clean, exportable one-pager — the kind of document a founder can print, send, or walk into a room with. No new AI pass, no new risk of drift from the source: just the reading, reframed for the room it needs to be in.",
  },
};

/**
 * Shared cross-page module switcher. Each "volume" is a distinct
 * Papyrus OS module serving the same audience (deep-tech founders &
 * investors), not a separate issue/edition.
 *
 * Drop this same component at the top of every page, passing the
 * current volume's roman numeral.
 */
export function VolumeNav({ current }: { current: "I" | "II" | "III" }) {
  const [openVolume, setOpenVolume] = useState<"I" | "II" | "III" | null>(null);
  const [closingId, setClosingId] = useState<"I" | "II" | "III" | null>(null);

  const volumes: { id: "I" | "II" | "III"; label: string; href: string }[] = [
    { id: "I", label: "The Reading", href: "/" },
    { id: "II", label: "The Registry", href: "/registry" },
    { id: "III", label: "The Pitch", href: "/pitch" },
  ];

  const handleEnvelopeClick = (id: "I" | "II" | "III") => {
    setClosingId(id);
    window.setTimeout(() => setClosingId(null), 300);
    setOpenVolume(id);
  };

  return (
    <>
      <nav className="volume-nav">
        {volumes.map((v) => (
          <span key={v.id} style={{ display: "inline-flex", alignItems: "center" }}>
            <a
              href={v.href}
              className={`volume-tab${v.id === current ? " active" : ""}`}
            >
              <span className="volume-tab-num">Vol. {v.id}</span>
              <span className="volume-tab-label">{v.label}</span>
            </a>
            <button
              type="button"
              aria-label={`About Volume ${v.id}`}
              className={`envelope-btn${closingId === v.id ? " opening" : ""}`}
              onClick={() => handleEnvelopeClick(v.id)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3.5 6 12 13 20.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </span>
        ))}
      </nav>

      {openVolume && (
        <div className="modal-overlay" onClick={() => setOpenVolume(null)}>
          <div className="modal-envelope-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Close"
              className="modal-close"
              onClick={() => setOpenVolume(null)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <p className="label" style={{ color: "var(--red-seal)", marginBottom: 10 }}>
              {VOLUME_INFO[openVolume].title}
            </p>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: "var(--ink)", margin: 0 }}>
              {VOLUME_INFO[openVolume].body}
            </p>
          </div>
        </div>
      )}
    </>
  );
}