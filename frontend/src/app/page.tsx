"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";
import { useTypewriter } from "@/hooks/useTypewriter";

type Stage = "idle" | "analyzing" | "ready" | "attesting" | "done" | "error";

const TAGLINE = "An investor's reading of your research, drawn in five minutes.";

export default function UploadPage() {
  const { address, isConnected, isInstalled, error: walletError, connect } =
    useFreighter();
  const router = useRouter();
  const { typed: taglineTyped, done: taglineDone } = useTypewriter(TAGLINE);

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported.");
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

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (stage === "analyzing") return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 460, width: "100%" }}>
        {/* Masthead */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1
            style={{
              fontSize: 44,
              fontVariationSettings: '"opsz" 40',
            }}
          >
            Papyrus OS
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              color: "var(--ink-soft)",
              fontSize: 16,
              marginTop: 10,
              marginBottom: 0,
              minHeight: "1.4em",
            }}
          >
            {taglineTyped}
            {!taglineDone && <span className="typewriter-cursor" />}
          </p>
        </div>

        <div className="ornament-rule" style={{ margin: "32px 0" }}>
          <span className="ornament-diamond" />
        </div>

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
            <p
              style={{
                color: "var(--error)",
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                marginTop: 8,
              }}
            >
              {walletError}
            </p>
          )}
        </div>

        {/* Upload plate — styled like a catalog card slot */}
        <label
          className={`upload-plate${stage === "analyzing" ? " busy" : ""}${
            isDragging ? " dragging" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (stage !== "analyzing") setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="application/pdf"
            disabled={stage === "analyzing"}
            style={{ display: "none" }}
            onChange={(e) =>
              e.target.files?.[0] && handleUpload(e.target.files[0])
            }
          />
          <div className={`icon-badge${stage === "analyzing" ? " pulse" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 5 C13 7 9 11 6 19"
                stroke="var(--gold-leaf)"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M19 5 C15 5.5 12.5 7 11 9.5 C13 8.7 15.5 8 18 8.5 C18.7 7.2 19 6 19 5 Z"
                stroke="var(--gold-leaf)"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <path
                d="M16 8.5 C13.8 9.5 11.8 11.3 10.3 13.8"
                stroke="var(--gold-leaf)"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <circle cx="6" cy="19" r="1" fill="var(--gold-leaf)" />
            </svg>
          </div>
          {stage === "analyzing" ? (
            <>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  marginBottom: 6,
                }}
              >
                Reading {fileName}
              </p>
              <p
                className="label"
                style={{
                  color: "var(--ink-faint)",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg
                  className="ink-drop"
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="var(--red-seal)"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M12 3 C12 3 6 11.5 6 15.5 a6 6 0 0 0 12 0 C18 11.5 12 3 12 3 Z" />
                </svg>
                The ink is still wet
              </p>
            </>
          ) : (
            <>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  marginBottom: 6,
                }}
              >
                {isDragging ? "Release to place it here" : "Place a manuscript here"}
              </p>
              <p className="label" style={{ color: "var(--ink-faint)" }}>
                PDF, up to a few dozen pages — click or drag
              </p>
            </>
          )}
        </label>

        {stage === "error" && (
          <div className="error-banner" style={{ marginTop: 16 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="9" stroke="var(--error)" strokeWidth="1.5" />
              <path d="M12 8v5M12 16h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="ornament-rule" style={{ margin: "44px 0 36px" }}>
          <span className="ornament-diamond" />
        </div>

        <div className="how-it-works">
          <div className="how-step">
            <div className="how-step-num">I</div>
            <p className="how-step-title">Submit</p>
            <p className="how-step-desc">Drop in a PDF white paper or research draft.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">II</div>
            <p className="how-step-title">Read</p>
            <p className="how-step-desc">An analyst pass extracts claims, market fit, and risk.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">III</div>
            <p className="how-step-title">Record</p>
            <p className="how-step-desc">Timestamp the hash on Stellar as proof of origin.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
