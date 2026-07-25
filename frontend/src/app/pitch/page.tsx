"use client";

import { useEffect, useState } from "react";
import { VolumeNav } from "../page";
import { useTypewriter } from "@/hooks/useTypewriter";

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

/**
 * Vol. III — The Pitch
 *
 * Takes the investor report already generated in Vol. I (stored in
 * sessionStorage as "papyrus:lastReport") and lays it out as a clean,
 * printable one-pager a founder can hand to a VC — no new AI calls,
 * just a different rendering of data that already exists.
 */
export default function PitchPage() {
  const [result, setResult] = useState<StoredResult | null>(null);
  const [selectedConcept, setSelectedConcept] = useState(0);
  const [copied, setCopied] = useState(false);
  const { typed: taglineTyped, done: taglineDone } = useTypewriter(
    "Your research, reframed as the pitch a VC actually reads."
  );

  useEffect(() => {
    const raw = sessionStorage.getItem("papyrus:lastReport");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  if (!result) {
    return (
      <main style={{ minHeight: "100vh" }}>
        <VolumeNav current="III" />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--red-seal)" }}>
            No reading on file.
          </p>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--ink-faint)", marginTop: 8 }}>
            Generate an investor reading in Vol. I first, then return here
            to build the pitch.
          </p>
        </div>
      </main>
    );
  }

  const { report, fileName } = result;
  const concept = report.startup_concepts?.[selectedConcept];

  const handleCopyPitch = async () => {
    if (!concept) return;
    const text = `${concept.name}\n\n${concept.thesis}\n\nTarget: ${concept.target_customer}\nModel: ${concept.business_model}\n\nMarket: ${report.tam_estimate}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <main style={{ minHeight: "100vh" }}>
      <div className="no-print">
        <VolumeNav current="III" />
      </div>

      <div className="hero-band no-print" style={{ padding: "48px 24px 40px" }}>
        <p className="hero-eyebrow">Vol. III — The Pitch</p>
        <h1 className="hero-title" style={{ fontSize: 48 }}>
          The One-Pager
        </h1>
        <p className="hero-tagline">
          {taglineTyped}
          {!taglineDone && <span className="typewriter-cursor" />}
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 96px" }}>
        {/* Concept switcher — only shown on screen, not in print */}
        {report.startup_concepts.length > 1 && (
          <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {report.startup_concepts.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedConcept(i)}
                className="btn"
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  ...(i === selectedConcept
                    ? { borderColor: "var(--red-seal)", color: "var(--red-seal)", background: "var(--paper-sunken)" }
                    : {}),
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {concept ? (
          <div
            style={{
              background: "var(--paper-raised)",
              border: "1px solid var(--rule)",
              borderRadius: 10,
              padding: "40px 40px",
              boxShadow: "var(--shadow-lift)",
            }}
          >
            <p className="label" style={{ color: "var(--red-seal)", marginBottom: 6 }}>{fileName}</p>
            <h2 style={{ fontSize: 32, marginBottom: 20, letterSpacing: "-0.01em" }}>{concept.name}</h2>

            <p style={{ fontSize: 18, lineHeight: 1.75, marginBottom: 28 }}>{concept.thesis}</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 28,
              }}
            >
              <PitchStat label="Target Customer" value={concept.target_customer} />
              <PitchStat label="Business Model" value={concept.business_model} />
            </div>

            <div
              style={{
                background: "var(--paper-sunken)",
                borderLeft: "4px solid var(--teal-pop)",
                borderRadius: "0 6px 6px 0",
                padding: "18px 22px",
                marginBottom: 28,
              }}
            >
              <p className="label" style={{ color: "var(--teal-pop)", marginBottom: 8 }}>Market Opportunity</p>
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0 }}>{report.tam_estimate}</p>
            </div>

            {concept.supporting_citation && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontStyle: "italic",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--ink-soft)",
                  borderLeft: "2px solid var(--gold-leaf)",
                  padding: "4px 0 4px 16px",
                  margin: 0,
                }}
              >
                "{concept.supporting_citation}"
              </p>
            )}

            <div className="no-print" style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button className="btn btn-primary" onClick={() => window.print()}>
                Export as PDF
              </button>
              <button className="btn" onClick={handleCopyPitch}>
                {copied ? "Copied" : "Copy as Text"}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--ink-faint)", textAlign: "center" }}>
            No startup concepts were generated for this reading.
          </p>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </main>
  );
}

function PitchStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label" style={{ color: "var(--gold-leaf)", marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}