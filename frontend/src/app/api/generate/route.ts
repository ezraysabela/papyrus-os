import { NextResponse } from "next/server";
import crypto from "crypto";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 300; // allow up to 5 minutes for the full pipeline

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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF uploads are supported" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. SHA-256 hash for on-chain proof of origin.
    const docHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 2. Extract text — unpdf avoids the pdfjs-dist canvas/DOMMatrix
    // dependency entirely, since we only need text, not rendering.
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text: paperText } = await extractText(pdf, { mergePages: true });

    if (!paperText || paperText.trim().length < 200) {
      return NextResponse.json(
        {
          error:
            "Couldn't extract enough text from this PDF (it may be scanned/image-based).",
        },
        { status: 422 }
      );
    }

    // 3. Run the AI extraction + commercialization pipeline.
    const report = await runAIPipeline(paperText, file.name);

    return NextResponse.json({ docHash, report });
  } catch (err) {
    console.error("generate route error:", err);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}

/**
 * Calls Groq's chat completions endpoint, retrying automatically if the
 * model produces malformed JSON (a known intermittent failure mode for
 * smaller/free-tier models under json_object mode, especially when the
 * output contains nested quotation marks).
 */
async function callGroqWithRetry(
  apiKey: string,
  body: object,
  retries = 2
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (response.ok) {
      return response.json();
    }

    const errText = await response.text();
    const isJsonFailure = errText.includes("json_validate_failed");

    if (isJsonFailure && attempt < retries) {
      console.warn(
        `Groq JSON validation failed, retrying (attempt ${attempt + 1}/${retries})`
      );
      lastError = new Error(`Groq API error (${response.status}): ${errText}`);
      continue;
    }

    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  throw lastError ?? new Error("Groq API failed after retries");
}

/**
 * Sends the extracted paper text to Groq (OpenAI-compatible chat completions)
 * and asks for a strictly-structured investor report. Every claim must cite
 * back to the source text (zero-hallucination requirement from the product spec).
 */
async function runAIPipeline(
  paperText: string,
  filename: string
): Promise<InvestorReport> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured on the server");
  }

  // Groq's free tier caps at 8000 tokens/minute for larger models — stay
  // well under that. ~4 chars/token is a safe rule of thumb, so cap
  // characters conservatively to leave room for the prompt + system message.
  const truncated = paperText.slice(0, 18_000);

  const systemPrompt = `You are Papyrus OS's commercialization analyst. You read technical/academic papers and produce investor-grade commercialization reports.

Rules:
- Every claim in "startup_concepts" and "citations" must be traceable to the source document. Do not invent facts not present in the paper.
- "tam_estimate" should be a range with a one-sentence justification, not a bare number.
- ALL SIX fields below are REQUIRED and must never be omitted, even if a field is only partially known — use an empty array [] rather than dropping a field.
- Do NOT include literal quotation marks inside any string value (e.g. in "source_excerpt" or "supporting_citation"). Paraphrase quoted material in your own words instead of quoting it directly, to avoid JSON escaping errors.
- Respond with ONLY valid JSON matching this exact shape, no prose, no markdown fences:
{
  "summary": string,
  "tam_estimate": string,
  "startup_concepts": [
    { "name": string, "thesis": string, "target_customer": string, "business_model": string, "supporting_citation": string }
  ],
  "key_risks": [string],
  "citations": [ { "claim": string, "source_excerpt": string } ]
}
Produce 3-5 startup_concepts.`;

  const data = await callGroqWithRetry(apiKey, {
    model: "openai/gpt-oss-20b",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Paper filename: "${filename}"\n\nPaper text:\n${truncated}\n\nAnalyze this and produce the investor report JSON now.`,
      },
    ],
  });

  const text: string | undefined = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No text response from model");
  }

  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    // Smaller/free-tier models don't always perfectly follow the schema —
    // normalize so the frontend never has to deal with undefined fields.
    return {
      summary: parsed.summary ?? "",
      tam_estimate: parsed.tam_estimate ?? "",
      startup_concepts: Array.isArray(parsed.startup_concepts)
        ? parsed.startup_concepts
        : [],
      key_risks: Array.isArray(parsed.key_risks) ? parsed.key_risks : [],
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    };
  } catch (err) {
    console.error("Failed to parse model output as JSON:", cleaned);
    throw new Error("Model did not return valid JSON");
  }
}