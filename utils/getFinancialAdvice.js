/**
 * getFinancialAdvice
 *
 * Client-side helper that fetches B2B financial insights from our
 * server-side Groq API route (/api/financial-advice).
 *
 * Signature is identical to the previous OpenAI version so all
 * existing callers (CardInfo.jsx, etc.) work without modification.
 *
 * @param {number} totalBudget  — sum of all Project Allocation amounts
 * @param {number} totalIncome  — sum of all Revenue Stream amounts
 * @param {number} totalSpend   — sum of all Operational Cost amounts
 * @returns {Promise<string>}   — plain-text 2-sentence business advice
 */
const getFinancialAdvice = async (totalBudget, totalIncome, totalSpend) => {
  try {
    const res = await fetch("/api/financial-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalBudget, totalIncome, totalSpend }),
    });

    if (!res.ok) throw new Error(`API responded with status ${res.status}`);

    const { advice } = await res.json();
    return advice ?? "Financial insights are loading — please check back shortly.";
  } catch (error) {
    console.error("[getFinancialAdvice] Failed to fetch advice:", error);
    return "Unable to load financial insights right now. Ensure your GROQ_API_KEY is set and try again.";
  }
};

export default getFinancialAdvice;
