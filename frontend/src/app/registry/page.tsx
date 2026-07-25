"use client";

import { useEffect, useMemo, useState } from "react";
import { VolumeNav } from "../page";
import { useTypewriter } from "@/hooks/useTypewriter";

interface RegistryEntry {
  docHash: string;
  title: string;
  owner: string;
  registeredAt: string; // ISO date
  metadataUri?: string;
}

/**
 * Vol. II — The Registry
 *
 * Public, searchable index of every manuscript hash registered on the
 * papyrus_registry Soroban contract. Until the on-chain indexer is wired
 * up (see roadmap), this reads from /api/registry, which should return
 * RegistryEntry[] sourced from contract REG/UPDATE events.
 */
export default function RegistryPage() {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { typed: taglineTyped, done: taglineDone } = useTypewriter(
    "Every manuscript timestamped on Stellar, searchable by title, hash, or researcher — an open record of prior art."
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/registry");
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data: RegistryEntry[] = await res.json();
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load the registry"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.docHash.toLowerCase().includes(q) ||
        e.owner.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <main style={{ minHeight: "100vh" }}>
      <VolumeNav current="II" />

      <div className="hero-band" style={{ padding: "48px 24px 40px" }}>
        <p className="hero-eyebrow">Vol. II — The Registry</p>
        <h1 className="hero-title" style={{ fontSize: 48 }}>
          The Public Ledger
        </h1>
        <p className="hero-tagline">
          {taglineTyped}
          {!taglineDone && <span className="typewriter-cursor" />}
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 96px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, hash, or Stellar address…"
            style={{
              width: "100%",
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              padding: "14px 18px",
              borderRadius: 8,
              border: "1px solid var(--rule)",
              background: "var(--paper-raised)",
              color: "var(--ink)",
              boxShadow: "var(--shadow-soft)",
              outline: "none",
            }}
          />
        </div>

        <div className="ornament-rule" style={{ margin: "0 0 32px" }}>
          <span className="ornament-diamond" />
        </div>

        {loading && (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-faint)", textAlign: "center" }}>
            Consulting the ledger…
          </p>
        )}

        {error && (
          <div className="error-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="9" stroke="var(--error)" strokeWidth="1.5" />
              <path d="M12 8v5M12 16h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>
              {error}. The registry indexer may not be deployed yet — see
              the roadmap for indexer integration status.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-faint)", textAlign: "center" }}>
            {entries.length === 0
              ? "No manuscripts registered yet. Be the first — head to Vol. I."
              : "No entries match your search."}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((entry) => (
            <div
              key={entry.docHash}
              className="concept-card"
              style={{
                background: "var(--paper-raised)",
                border: "1px solid var(--rule)",
                borderLeft: "3px solid var(--teal-pop)",
                borderRadius: "4px 8px 8px 4px",
                padding: "20px 24px",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ fontSize: 19, color: "var(--ink)" }}>{entry.title}</h3>
                <span className="wallet-pill" style={{ flexShrink: 0 }}>
                  <span className="wallet-dot" />
                  Verified
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 12,
                  color: "var(--ink-faint)",
                  marginTop: 10,
                  wordBreak: "break-all",
                }}
              >
                <span className="label" style={{ marginRight: 8 }}>SHA-256</span>
                {entry.docHash}
              </p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--ink-faint)", marginTop: 6 }}>
                <span className="label" style={{ marginRight: 8 }}>Owner</span>
                {entry.owner.slice(0, 8)}…{entry.owner.slice(-6)}
                <span style={{ margin: "0 8px" }}>·</span>
                {new Date(entry.registeredAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}