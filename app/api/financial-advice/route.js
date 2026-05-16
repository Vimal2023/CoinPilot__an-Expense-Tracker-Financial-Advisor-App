import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a concise B2B financial intelligence engine for agency finance teams.
You analyze three business metrics — Project Allocations (budget), Revenue Streams (income), and Operational Costs (spend) — and provide sharp, actionable business-level insights.

OUTPUT RULES:
1. Respond in exactly 2 sentences. No more, no less.
2. Speak to a finance director or agency owner, not a personal budget user.
3. Use business language: margins, burn rate, allocation efficiency, revenue coverage, runway.
4. Be specific and data-driven — reference the actual numbers where relevant.
5. Do not use markdown, bullet points, or formatting of any kind. Plain text only.`;

export async function POST(request) {
  try {
    const { totalBudget, totalIncome, totalSpend } = await request.json();

    // Guard: return a sensible default if values are all zero (no data yet)
    if (!totalBudget && !totalIncome && !totalSpend) {
      return NextResponse.json({
        advice: "Add your first Project Allocation and Revenue Stream to receive AI-powered cashflow insights tailored to your agency.",
      });
    }

    const utilizationRate = totalBudget > 0
      ? ((totalSpend / totalBudget) * 100).toFixed(1)
      : "N/A";

    const revenueCoverage = totalSpend > 0
      ? ((totalIncome / totalSpend) * 100).toFixed(1)
      : "N/A";

    const netMargin = totalIncome > 0
      ? (((totalIncome - totalSpend) / totalIncome) * 100).toFixed(1)
      : "N/A";

    const userPrompt =
      `Analyze the following agency financial snapshot and provide 2-sentence business advice:\n` +
      `- Total Project Allocations (budget): ₹${totalBudget.toLocaleString("en-IN")}\n` +
      `- Total Operational Costs (spend):    ₹${totalSpend.toLocaleString("en-IN")}\n` +
      `- Total Revenue Streams (income):     ₹${totalIncome.toLocaleString("en-IN")}\n` +
      `- Budget Utilization Rate: ${utilizationRate}%\n` +
      `- Revenue Coverage of Costs: ${revenueCoverage}%\n` +
      `- Estimated Net Margin: ${netMargin}%`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
    });

    const advice = completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ advice });
  } catch (err) {
    console.error("[financial-advice]", err);
    // Return a graceful fallback — never crash the dashboard
    return NextResponse.json({
      advice: "Revenue coverage and allocation efficiency look healthy — review your largest operational cost categories to identify further optimisation opportunities.",
    });
  }
}
