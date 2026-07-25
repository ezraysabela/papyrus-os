"use client";

import { useEffect, useState } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import { PapyrusRegistryClient } from "../../../packages/papyrus_registry";

interface StartupConcept {
  name: string;
  thesis: string;
  target_customer: string;
  business_model: string;
  supporting_citation: string;
}

interface InvestorReport {
  summary: string;
  tam_estimate: string;
  startup_concepts: StartupConcept[];
  key_risks: string[];
  citations: { claim: string; source_excerpt: string }[];
}

interface StoredResult {
  docHash: string;
  report: InvestorReport;
  fileName: string;
}

const CONTRACT_ID = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID ?? "";
const ACCENTS = ["var(--gold-leaf)", "var(--teal-pop)", "var(--red-seal)"];

export default function DashboardPage() {
  const { address, isConnected, connect } = useFreighter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [attestState, setAttestState] = useState<
    "idle" | "pending" | "done" | "error"
  >("idle");
  const [attestError, setAttestError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("papyrus:lastReport");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  const handleCopyHash = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.docHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const handleAttest = async () => {
    if (!result || !address) return;
    if (!CONTRACT_ID) {
      setAttestError(
        "NEXT_PUBLIC_REGISTRY_CONTRACT_ID is not set — deploy the contract and add it to your env."
      );
      setAttestState("error");
      return;
    }

    setAttestState("pending");
    setAttestError(null);
    try {
      const client = new PapyrusRegistryClient({
        network: "testnet",
        contractId: CONTRACT_ID,
      });
      await client.register_document({
        owner: address,
        doc_hash: result.docHash,
        metadata_uri: `ipfs://placeholder/${result.docHash}`,
      });
      setAttestState("done");
    } catch (err) {
      setAttestError(err instanceof Error ? err.message : "Attestation failed");
      setAttestState("error");
    }
  };

  if (!result) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
        <div className="icon-badge" style={{ margin: "0 auto 20px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="var(--gold-leaf)"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M14 2v6h6" stroke="var(--gold-leaf)" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--red-seal)" }}>
          No manuscript loaded.
        </p>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--ink-faint)", marginTop: 8 }}>
          Return to the front page and upload a white paper first.
        </p>
      </main>
    );
  }

  const { report, docHash, fileName } = result;
  const startupConcepts = report.startup_concepts ?? [];
  const keyRisks = report.key_risks ?? [];

  const tocItems = [
    report.summary && { id: "summary", label: "Summary" },
    report.tam_estimate && { id: "tam", label: "Market" },
    startupConcepts.length > 0 && { id: "concepts", label: "Concepts" },
    keyRisks.length > 0 && { id: "risks", label: "Risks" },
    { id: "colophon", label: "Colophon" },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="dashboard-grid">
      <nav className="toc">
        {tocItems.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <main style={{ maxWidth: 680 }}>
        {/* Masthead */}
        <p className="label" style={{ marginBottom: 8, color: "var(--red-seal)" }}>{fileName}</p>
        <h1 style={{ fontSize: 38, marginBottom: 14, letterSpacing: "-0.015em" }}>Investor Reading</h1>

        <button
          onClick={handleCopyHash}
          title="Copy full hash"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            color: "var(--gold-leaf)",
            letterSpacing: "0.03em",
            background: "var(--paper-raised)",
            border: "1px solid var(--rule)",
            borderRadius: 6,
            padding: "7px 12px",
            cursor: "pointer",
            marginTop: 4,
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <span className="label" style={{ color: "var(--ink-faint)", letterSpacing: "0.06em" }}>
            SHA-256
          </span>
          <span style={{ wordBreak: "break-all", color: "var(--ink-soft)" }}>
            {docHash.slice(0, 16)}…{docHash.slice(-8)}
          </span>
          <span style={{ color: copied ? "var(--success)" : "var(--gold-leaf)", fontWeight: 600 }}>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>

        {/* Literary ornament */}
        <div className="ornament-rule" style={{ margin: "40px 0 44px" }}>
          <span className="ornament-diamond" />
        </div>

        {report.summary && (
          <Section title="Summary" id="summary">
            <p className="drop-cap" style={{ fontSize: 17, lineHeight: 1.75 }}>{report.summary}</p>
          </Section>
        )}

        {report.tam_estimate && (
          <Section title="Total Addressable Market" id="tam">
            <div
              style={{
                background: "linear-gradient(135deg, var(--paper-raised), var(--paper-sunken))",
                border: "1px solid var(--rule)",
                borderLeft: "5px solid var(--teal-pop)",
                borderRadius: "4px 10px 10px 4px",
                padding: "24px 26px",
                boxShadow: "var(--shadow-lift)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--teal-pop)",
                  marginBottom: 10,
                }}
              >
                Market Opportunity
              </p>
              <p style={{ fontSize: 19, lineHeight: 1.7, margin: 0 }}>{report.tam_estimate}</p>
            </div>
          </Section>
        )}

        {startupConcepts.length > 0 && (
          <Section title="Startup Concepts" id="concepts">
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
              {startupConcepts.map((c, i) => {
                const accent = ACCENTS[i % ACCENTS.length];
                return (
                  <div
                    key={i}
                    className="concept-card"
                    style={{
                      background: "var(--paper-raised)",
                      border: "1px solid var(--rule)",
                      borderTop: `3px solid ${accent}`,
                      padding: "26px 28px",
                      borderRadius: 8,
                      boxShadow: "var(--shadow-soft)",
                    }}
                  >
                    <span className="ghost-number" style={{ color: accent }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: accent,
                          color: "var(--paper-raised)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: 15,
                          flexShrink: 0,
                          boxShadow: "var(--shadow-soft)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <h3 style={{ fontSize: 23, color: "var(--ink)" }}>{c.name}</h3>
                    </div>
                    <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 18 }}>{c.thesis}</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                        <span className="label" style={{ color: accent, marginRight: 8 }}>
                          Target
                        </span>
                        {c.target_customer}
                      </p>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                        <span className="label" style={{ color: accent, marginRight: 8 }}>
                          Model
                        </span>
                        {c.business_model}
                      </p>
                    </div>

                    {c.supporting_citation && (
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontStyle: "italic",
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: "var(--ink)",
                          borderLeft: `2px solid ${accent}`,
                          margin: 0,
                          background: "var(--paper-sunken)",
                          padding: "12px 16px",
                          borderRadius: "0 4px 4px 0",
                        }}
                      >
                        "{c.supporting_citation}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {keyRisks.length > 0 && (
          <Section title="Key Risks" id="risks">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {keyRisks.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    fontSize: 16,
                    lineHeight: 1.7,
                    background: "var(--paper-raised)",
                    border: "1px solid var(--rule)",
                    borderLeft: "3px solid var(--red-seal)",
                    borderRadius: "0 6px 6px 0",
                    padding: "14px 18px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                    <path d="M12 3.5 L21.5 20 H2.5 Z" stroke="var(--red-seal)" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M12 9.5v5" stroke="var(--red-seal)" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="0.9" fill="var(--red-seal)" />
                  </svg>
                  <p style={{ margin: 0 }}>{r}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Colophon */}
        <Section
          title="Colophon"
          id="colophon"
          icon={
            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--red-seal)" style={{ flexShrink: 0 }}>
              <path d="M12 3 C12 3 6 11.5 6 15.5 a6 6 0 0 0 12 0 C18 11.5 12 3 12 3 Z" />
            </svg>
          }
        >
          <div
            style={{
              position: "relative",
              border: "1px solid var(--rule)",
              borderRadius: 10,
              padding: "28px 30px",
              background: "radial-gradient(circle at 0% 0%, rgba(197, 160, 89, 0.08), var(--paper-raised) 60%)",
              boxShadow: "var(--shadow-lift)",
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <WaxSeal pressed={attestState === "done"} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 18 }}>
                Registering this hash on Stellar timestamps your claim to this
                research as prior art, immutably and publicly.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                {!isConnected ? (
                  <button className="btn" onClick={connect}>
                    Connect Freighter Wallet
                  </button>
                ) : attestState === "done" ? (
                  <span className="wallet-pill" style={{ color: "var(--success)" }}>
                    <span className="wallet-dot" style={{ background: "var(--success)" }} />
                    Registered on Stellar testnet
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleAttest}
                    disabled={attestState === "pending"}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M19 5 C13 7 9 11 6 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      <path
                        d="M19 5 C15 5.5 12.5 7 11 9.5 C13 8.7 15.5 8 18 8.5 C18.7 7.2 19 6 19 5 Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {attestState === "pending"
                      ? "Signing & submitting…"
                      : "Register on Stellar"}
                  </button>
                )}

                {isConnected && attestState !== "done" && (
                  <span className="wallet-pill">
                    <span className="wallet-dot" />
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </span>
                )}
              </div>

              {attestError && (
                <div className="error-banner" style={{ marginTop: 16 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="9" stroke="var(--error)" strokeWidth="1.5" />
                    <path d="M12 8v5M12 16h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p>{attestError}</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}

function WaxSeal({ pressed }: { pressed: boolean }) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className={`wax-seal${pressed ? " pressed" : ""}`}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <filter id="waxEdge" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" />
        </filter>
      </defs>
      {pressed ? (
        <>
          <g filter="url(#waxEdge)">
            <circle cx="32" cy="32" r="27" fill="var(--red-seal)" />
          </g>
          <circle cx="32" cy="32" r="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <text
            x="32"
            y="41"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="26"
            fontWeight="600"
            fill="var(--gold-leaf)"
          >
            P
          </text>
        </>
      ) : (
        <>
          <g filter="url(#waxEdge)">
            <circle cx="32" cy="32" r="27" fill="none" stroke="var(--rule-strong)" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>
          <text
            x="32"
            y="41"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="26"
            fontWeight="600"
            fill="var(--ink-faint)"
          >
            P
          </text>
        </>
      )}
    </svg>
  );
}

function Section({
  title,
  id,
  icon,
  children,
}: {
  title: string;
  id?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: 44, scrollMarginTop: 24 }}>
      <p
        className="label"
        style={{
          marginBottom: 16,
          color: "var(--red-seal)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon}
        {title}
      </p>
      {children}
    </section>
  );
}