import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/utils/dbConfig";
import { rawStatements } from "@/utils/schema";
import PDFParser from "pdf2json";
export const runtime = "nodejs";

// Extend serverless function timeout for large PDF processing (Vercel)
export const maxDuration = 60;

// ─── Groq client (server-side only — never expose this key to the browser) ───
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── Strip markdown code fences the model may wrap JSON in ───────────────────
function stripMarkdown(raw) {
  return raw
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a precise financial data extraction engine.
Your ONLY job is to parse bank statement text and return structured transaction data.

OUTPUT RULES — follow these strictly:
1. Return ONLY a valid JSON array. No markdown, no code fences, no explanations.
2. Each element must have exactly these fields:
   - "date"        : string  — transaction date in DD/MM/YYYY format
   - "description" : string  — payee / narration text, cleaned up
   - "amount"      : number  — positive numeric value (no currency symbols)
   - "category"    : string  — one of: "Revenue", "Infrastructure", "Payroll", "Tooling", "Marketing", "Tax", "Transfers", "Other"
   - "type"        : string  — exactly "credit" or "debit"
3. If a field cannot be determined, use sensible defaults ("Other" for category, today's date for missing dates).
4. Do NOT include balance columns, headers, or footnotes as transactions.
5. Do NOT wrap output in any object — the root must be a JSON array [...].`;

/**
 * POST /api/parse-statement
 *
 * Body: multipart/form-data
 *   statement  — PDF file (required)
 *   createdBy  — user email string (optional, falls back to "anonymous")
 */
export async function POST(request) {
  try {
    // ── 1. Parse FormData ──────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("statement");
    const createdBy = formData.get("createdBy") || "anonymous";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        {
          success: false,
          error: "No file uploaded. Send the PDF under the key 'statement'.",
        },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: `Expected PDF. Received: ${file.type}` },
        { status: 415 },
      );
    }

    // ── 2. Extract text from PDF ───────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfText = "";
    try {
      pdfText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = extract text only

        pdfParser.on("pdfParser_dataError", (errData) => {
          reject(errData.parserError);
        });

        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });

        pdfParser.parseBuffer(buffer);
      });
    } catch (pdfErr) {
      console.error("[parse-statement] pdf extraction failed:", pdfErr);
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not extract text from the PDF. Ensure it is not scanned/image-only.",
        },
        { status: 422 },
      );
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The PDF appears to contain no readable text (possibly a scanned image).",
        },
        { status: 422 },
      );
    }

    // Trim to 12 000 chars — well within llama-3.1-8b-instant's context window
    const truncatedText = pdfText.slice(0, 12000);

    // ── 3. Send to Groq LLM ────────────────────────────────────────────────
    let rawLLMOutput = "";
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.1, // low temp → deterministic structured output
        max_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Parse every transaction from the following bank statement text and return a JSON array:\n\n${truncatedText}`,
          },
        ],
      });
      rawLLMOutput = completion.choices[0]?.message?.content ?? "";
    } catch (groqErr) {
      console.error("[parse-statement] Groq API error:", groqErr);
      return NextResponse.json(
        {
          success: false,
          error: "AI parsing service unavailable. Please try again.",
        },
        { status: 503 },
      );
    }

    // ── 4. Parse & validate JSON ───────────────────────────────────────────
    let transactions = [];
    try {
      const cleaned = stripMarkdown(rawLLMOutput);
      transactions = JSON.parse(cleaned);
      if (!Array.isArray(transactions))
        throw new Error("LLM did not return an array.");
    } catch (parseErr) {
      console.error(
        "[parse-statement] JSON parse failed. Raw output:",
        rawLLMOutput,
      );
      return NextResponse.json(
        {
          success: false,
          error: "AI returned malformed data. Try again or use a cleaner PDF.",
          rawOutput: rawLLMOutput,
        },
        { status: 502 },
      );
    }

    // ── 5. Persist to rawStatements table ─────────────────────────────────
    const [inserted] = await db
      .insert(rawStatements)
      .values({
        fileName: file.name,
        parsedData: JSON.stringify(transactions),
        status: "pending",
        createdBy,
      })
      .returning({
        id: rawStatements.id,
        uploadedAt: rawStatements.uploadedAt,
      });

    // ── 6. Derive summary stats ────────────────────────────────────────────
    const credits = transactions.filter((t) => t.type === "credit");
    const debits = transactions.filter((t) => t.type === "debit");
    const totalCredits = credits.reduce((s, t) => s + Number(t.amount), 0);
    const totalDebits = debits.reduce((s, t) => s + Number(t.amount), 0);

    return NextResponse.json({
      success: true,
      recordId: inserted?.id,
      uploadedAt: inserted?.uploadedAt,
      fileName: file.name,
      fileSize: file.size,
      status: "parsed",
      data: {
        summary: {
          totalTransactions: transactions.length,
          totalCredits,
          totalDebits,
          netCashflow: totalCredits - totalDebits,
        },
        transactions,
      },
    });
  } catch (err) {
    console.error("[parse-statement] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
