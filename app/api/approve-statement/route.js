import { NextResponse } from "next/server";
import { db } from "@/utils/dbConfig";
import { rawStatements, revenueStreams, operationalCosts, projectAllocations } from "@/utils/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const pending = await db
      .select()
      .from(rawStatements)
      .where(eq(rawStatements.status, "pending"))
      .orderBy(asc(rawStatements.uploadedAt));
    return NextResponse.json({ success: true, records: pending });
  } catch (err) {
    console.error("[approve-statement GET]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch pending statements." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { recordId, createdBy } = await request.json();
    if (!recordId) return NextResponse.json({ success: false, error: "recordId is required." }, { status: 400 });

    const [record] = await db.select().from(rawStatements).where(eq(rawStatements.id, recordId));
    if (!record) return NextResponse.json({ success: false, error: "Record not found." }, { status: 404 });
    if (record.status === "approved") return NextResponse.json({ success: false, error: "Already approved." }, { status: 409 });

    let transactions = [];
    try { transactions = JSON.parse(record.parsedData); } catch { return NextResponse.json({ success: false, error: "parsedData corrupted." }, { status: 422 }); }

    const userEmail = createdBy || record.createdBy;

    // Resolve or create a default allocation for debits
    let defaultAllocationId = null;
    const existing = await db.select({ id: projectAllocations.id }).from(projectAllocations).where(eq(projectAllocations.createdBy, userEmail)).limit(1);
    if (existing.length > 0) {
      defaultAllocationId = existing[0].id;
    } else {
      const [created] = await db.insert(projectAllocations).values({ name: "Statement Import", amount: "0", icon: "📄", createdBy: userEmail }).returning({ id: projectAllocations.id });
      defaultAllocationId = created.id;
    }

    const credits = transactions.filter((t) => t.type === "credit");
    const debits  = transactions.filter((t) => t.type === "debit");

    if (credits.length > 0) {
      await db.insert(revenueStreams).values(credits.map((t) => ({ name: (t.description || "Credit").slice(0, 200), amount: String(t.amount), icon: "💰", createdBy: userEmail })));
    }
    if (debits.length > 0) {
      await db.insert(operationalCosts).values(debits.map((t) => ({ name: (t.description || "Debit").slice(0, 200), amount: String(t.amount), allocationId: defaultAllocationId, createdAt: t.date || new Date().toLocaleDateString("en-GB") })));
    }

    await db.update(rawStatements).set({ status: "approved" }).where(eq(rawStatements.id, recordId));

    return NextResponse.json({ success: true, recordId, insertedCredits: credits.length, insertedDebits: debits.length, message: `Synced ${credits.length} revenue streams and ${debits.length} operational costs.` });
  } catch (err) {
    console.error("[approve-statement POST]", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
