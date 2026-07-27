"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";
import { useTypewriter } from "@/hooks/useTypewriter";
import { InteractiveTypewriter } from "@/components/InteractiveTypewriter";
import { VolumeNav } from "@/components/VolumeNav";

type Stage = "idle" | "analyzing" | "ready" | "attesting" | "done" | "error";

export default function UploadPage() {
  const { address, isConnected, isInstalled, error: walletError, connect } =
    useFreighter();
  const router = useRouter();
  const { typed: taglineTyped, done: taglineDone } = useTypewriter(
    "An investor's reading of your research, drawn in five minutes."
  );

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasExistingReport, setHasExistingReport] = useState(false);

  useEffect(() => {
    setHasExistingReport(!!sessionStorage.getItem("papyrus:lastReport"));
  }, []);

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setErrorMsg("Only PDF manuscripts are supported.");
      setStage("error");
      return;
    }

    setErrorMsg(null);
    setFileName(file.name);
    setStage("analyzing");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const { docHash, report } = await res.json();

      sessionStorage.setItem(
        "papyrus:lastReport",
        JSON.stringify({ docHash, report, fileName: file.name })
      );

      setStage("done");
      router.push("/dashboard");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  };

  const busy = stage === "analyzing" || stage === "done";

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (busy) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [busy]
  );

  return (
    <main style={{ minHeight: "100vh" }}>
      <VolumeNav current="I" />

      {/* Bold dark hero band */}
      <div className="hero-band">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <HomeWaxSeal />
        </div>
        <p className="hero-eyebrow">Vol. I — The Reading</p>
        <h1 className="hero-title">Papyrus OS</h1>
        <p className="hero-tagline">
          {taglineTyped}
          {!taglineDone && <span className="typewriter-cursor" />}
        </p>
      </div>

      <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", padding: "40px 24px 24px" }}>
        {/* Wallet status */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {!isInstalled && (
            <p className="install-warning">
              Freighter wallet not detected — you can still generate a
              report, but registering it on-chain will require it.
            </p>
          )}
          {!isConnected ? (
            <button className="btn" onClick={connect}>
              Connect Freighter Wallet
            </button>
          ) : (
            <span className="wallet-pill">
              <span className="wallet-dot" />
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
          )}
          {walletError && (
            <p style={{ color: "var(--red-seal)", fontSize: 13, fontFamily: "var(--font-ui)", marginTop: 8 }}>
              {walletError}
            </p>
          )}
        </div>

        {hasExistingReport && (
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <a
              href="/dashboard"
              className="btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                color: "var(--teal-pop)",
                borderColor: "rgba(31, 111, 102, 0.4)",
              }}
            >
              View Last Reading
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        )}

        {/* Upload plate */}
        <label
          className={`upload-plate${isDragging ? " dragging" : ""}${busy ? " busy" : ""}`}
          onDragOver={(e) => { e.preventDefault(); if (!busy) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept="application/pdf"
            disabled={busy}
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <div className={`icon-badge${stage === "analyzing" ? " pulse" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--gold-leaf)" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="var(--gold-leaf)" strokeWidth="1.3" strokeLinejoin="round" />
              {stage === "done" ? (
                <path d="M9 12l2 2 4-4" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M12 11v7M9 14l3-3 3 3" stroke="var(--red-seal)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          {stage === "analyzing" && (
            <>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 6, color: "var(--red-seal)" }}>
                Reading {fileName}
              </p>
              <p className="label" style={{ color: "var(--gold-leaf)", fontWeight: 500 }}>
                This can take a minute or two
              </p>
            </>
          )}

          {stage === "done" && (
            <>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 6, color: "var(--success)" }}>
                Manuscript registered
              </p>
              <p className="label" style={{ color: "var(--ink-soft)" }}>Opening your dashboard…</p>
            </>
          )}

          {(stage === "idle" || stage === "error") && (
            <>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 6 }}>
                {isDragging ? "Release to place it" : "Place a manuscript here"}
              </p>
              <p className="label" style={{ color: "var(--ink-soft)" }}>PDF, up to a few dozen pages</p>
            </>
          )}
        </label>

        {stage === "error" && (
          <div className="error-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="9" stroke="var(--error)" strokeWidth="1.5" />
              <path d="M12 8v5M12 16h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="ornament-rule" style={{ margin: "48px 0 36px" }}>
          <span className="ornament-diamond" />
        </div>

        <InteractiveTypewriter />
      </div>
    </main>
  );
}

function HomeWaxSeal() {
  return (
    <svg width="52" height="52" viewBox="0 0 64 64" className="wax-seal" style={{ flexShrink: 0 }}>
      <defs>
        <filter id="homeWaxEdge" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" />
        </filter>
      </defs>
      <g filter="url(#homeWaxEdge)">
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
    </svg>
  );
}