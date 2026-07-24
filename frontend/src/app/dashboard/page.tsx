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

export default function DashboardPage() {
  const { address, isConnected, connect } = useFreighter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [attestState, setAttestState] = useState<
    "idle" | "pending" | "done" | "error"
  >("idle");
  const [attestError, setAttestError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("papyrus:lastReport");
    if (raw) setResult(JSON.parse(raw));
  }, []);

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
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--red-seal)" }}>
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

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px 96px" }}>
      {/* Masthead */}
      <p className="label" style={{ marginBottom: 6, color: "var(--red-seal)" }}>{fileName}</p>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>Investor Reading</h1>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 11,
          color: "var(--gold-leaf)",
          marginTop: 10,
          wordBreak: "break-all",
          letterSpacing: "0.03em"
        }}
      >
        SHA-256 {docHash}
      </p>

      {/* Literary ornament */}
      <div className="ornament-rule" style={{ margin: "36px 0 44px" }}>
        <span className="ornament-diamond" />
      </div>

      {report.summary && (
        <Section title="Summary">
          <p style={{ fontSize: 17, lineHeight: 1.75 }}>{report.summary}</p>
        </Section>
      )}

      {report.tam_estimate && (
        <Section title="Total Addressable Market">
          <p style={{ fontSize: 17, lineHeight: 1.75 }}>{report.tam_estimate}</p>
        </Section>
      )}

      {startupConcepts.length > 0 && (
        <Section title="Startup Concepts">
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 8 }}>
            {startupConcepts.map((c, i) => (
              <div
                key={i}
                style={{
                  background: "var(--paper-sunken)",
                  border: "1px solid var(--rule-strong)",
                  borderTop: "3px solid var(--gold-leaf)",
                  padding: "24px 28px",
                  borderRadius: 2,
                }}
              >
                <h3 style={{ fontSize: 22, marginBottom: 12, color: "var(--red-seal)" }}>{c.name}</h3>
                <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>{c.thesis}</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                    <span style={{ color: "var(--gold-leaf)", fontWeight: 600, marginRight: 6 }}>TARGET</span>
                    {c.target_customer}
                  </p>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                    <span style={{ color: "var(--gold-leaf)", fontWeight: 600, marginRight: 6 }}>MODEL</span>
                    {c.business_model}
                  </p>
                </div>

                {c.supporting_citation && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontStyle: "italic",
                      fontSize: 14,
                      color: "var(--ink)",
                      borderLeft: "2px solid var(--gold-leaf)",
                      paddingLeft: 12,
                      margin: 0,
                      background: "var(--paper)",
                      padding: "10px 14px",
                      borderRadius: "0 2px 2px 0",
                    }}
                  >
                    "{c.supporting_citation}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {keyRisks.length > 0 && (
        <Section title="Key Risks">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {keyRisks.map((r, i) => (
              <li key={i} style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 8 }}>{r}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Colophon */}
      <Section title="Colophon">
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
          Registering this hash on Stellar timestamps your claim to this
          research as prior art, immutably and publicly.
        </p>
        {!isConnected ? (
          <button className="btn" onClick={connect}>
            Connect Freighter Wallet
          </button>
        ) : attestState === "done" ? (
          <p style={{ color: "var(--success)", fontFamily: "var(--font-ui)", fontSize: 14 }}>
            ✓ Registered on Stellar testnet.
          </p>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleAttest}
            disabled={attestState === "pending"}
          >
            {attestState === "pending"
              ? "Signing & submitting…"
              : "Register on Stellar"}
          </button>
        )}
        {attestError && (
          <p style={{ color: "var(--red-seal)", fontFamily: "var(--font-ui)", fontSize: 13, marginTop: 10 }}>
            {attestError}
          </p>
        )}
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <p className="label" style={{ marginBottom: 16, color: "var(--red-seal)" }}>{title}</p>
      {children}
    </section>
  );
}