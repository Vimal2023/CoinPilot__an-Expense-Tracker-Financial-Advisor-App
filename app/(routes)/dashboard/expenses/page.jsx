"use client";
import { db } from "@/utils/dbConfig";
import { projectAllocations, operationalCosts } from "@/utils/schema";
import { desc, eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import ExpenseListTable from "./_components/ExpenseListTable";
import { useUser } from "@clerk/nextjs";

function ExpensesScreen() {
  const [expensesList, setExpensesList] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    user && getAllExpenses();
  }, [user]);

  const getAllExpenses = async () => {
    const result = await db
      .select({
        id: operationalCosts.id,
        name: operationalCosts.name,
        amount: operationalCosts.amount,
        createdAt: operationalCosts.createdAt,
      })
      .from(projectAllocations)
      .rightJoin(operationalCosts, eq(projectAllocations.id, operationalCosts.allocationId))
      .where(eq(projectAllocations.createdBy, user?.primaryEmailAddress.emailAddress))
      .orderBy(desc(operationalCosts.id));
    setExpensesList(result);
  };

  return (
    <div className="p-6">
      <h2 className="font-bold text-3xl">Operational Costs</h2>
      <ExpenseListTable
        refreshData={() => getAllExpenses()}
        expensesList={expensesList}
      />
    </div>
  );
}

export default ExpensesScreen;