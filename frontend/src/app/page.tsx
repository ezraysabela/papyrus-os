"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";

type Stage = "idle" | "analyzing" | "ready" | "attesting" | "done" | "error";

export default function UploadPage() {
  const { address, isConnected, isInstalled, error: walletError, connect } =
    useFreighter();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
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
          <p className="label" style={{ marginBottom: 14, color: "var(--red-seal)" }}>
            Vol. I — Research Commercialization
          </p>
          <h1
            style={{
              fontSize: 44,
              fontVariationSettings: '"opsz" 40',
              color: "var(--ink)",
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
            }}
          >
            An investor's reading of your research, drawn in five minutes.
          </p>
        </div>

        {/* Updated Book-Style Ornament */}
        <div className="ornament-rule" style={{ margin: "32px 0" }}>
          <span className="ornament-diamond" />
        </div>

        {/* Wallet status */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {!isInstalled && (
            <p
              style={{
                color: "var(--red-seal)",
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                marginBottom: 14,
              }}
            >
              Freighter wallet not detected — you can still generate a
              report, but registering it on-chain will require it.
            </p>
          )}
          {!isConnected ? (
            <button className="btn" onClick={connect}>
              Connect Freighter Wallet
            </button>
          ) : (
            <p
              className="label"
              style={{ color: "var(--gold-leaf)", letterSpacing: "0.02em" }}
            >
              Connected — {address?.slice(0, 6)}…{address?.slice(-4)}
            </p>
          )}
          {walletError && (
            <p
              style={{
                color: "var(--red-seal)",
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
          className="panel"
          style={{
            display: "block",
            border: `1px solid ${stage === "analyzing" ? "var(--rule)" : "var(--gold-leaf)"}`,
            padding: "44px 32px",
            textAlign: "center",
            cursor: stage === "analyzing" ? "not-allowed" : "pointer",
            opacity: stage === "analyzing" ? 0.7 : 1,
            transition: "border-color 0.15s ease",
            backgroundColor: "var(--paper-raised)",
          }}
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
          <div
            style={{
              width: 44,
              height: 44,
              margin: "0 auto 16px",
              borderRadius: "50%",
              border: "1px solid var(--gold-leaf)",
              background: "var(--paper)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Updated SVG Icon colors */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="var(--gold-leaf)"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="M14 2v6h6" stroke="var(--gold-leaf)" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M12 11v7M9 14l3-3 3 3" stroke="var(--red-seal)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {stage === "analyzing" ? (
            <>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  marginBottom: 6,
                  color: "var(--red-seal)",
                }}
              >
                Reading {fileName}
              </p>
              <p
                className="label"
                style={{ color: "var(--gold-leaf)", fontWeight: 500 }}
              >
                This can take a minute or two
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
                Place a manuscript here
              </p>
              <p className="label" style={{ color: "var(--ink-soft)" }}>
                PDF, up to a few dozen pages
              </p>
            </>
          )}
        </label>

        {stage === "error" && (
          <p
            style={{
              color: "var(--red-seal)",
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {errorMsg}
          </p>
        )}
      </div>
    </main>
  );
}