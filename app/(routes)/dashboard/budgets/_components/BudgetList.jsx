"use client";
import React, { useEffect, useState } from "react";
import CreateBudget from "./CreateBudget";
import { db } from "@/utils/dbConfig";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { projectAllocations, operationalCosts } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import BudgetItem from "./BudgetItem";

function BudgetList() {
  const [budgetList, setBudgetList] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    user && getBudgetList();
  }, [user]);

  /**
   * Fetch project allocations with aggregated operational cost totals
   */
  const getBudgetList = async () => {
    const result = await db
      .select({
        ...getTableColumns(projectAllocations),
        totalSpend: sql`sum(${operationalCosts.amount})`.mapWith(Number),
        totalItem: sql`count(${operationalCosts.id})`.mapWith(Number),
      })
      .from(projectAllocations)
      .leftJoin(operationalCosts, eq(projectAllocations.id, operationalCosts.allocationId))
      .where(eq(projectAllocations.createdBy, user?.primaryEmailAddress?.emailAddress))
      .groupBy(projectAllocations.id)
      .orderBy(desc(projectAllocations.id));

    setBudgetList(result);
  };

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <CreateBudget refreshData={() => getBudgetList()} />
        {budgetList?.length > 0
          ? budgetList.map((budget, index) => (
              <BudgetItem budget={budget} key={index} />
            ))
          : [1, 2, 3, 4, 5].map((item, index) => (
              <div
                key={index}
                className="w-full bg-slate-200 rounded-lg h-[150px] animate-pulse"
              ></div>
            ))}
      </div>
    </div>
  );
}

export default BudgetList;