"use client";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import CardInfo from "./_components/CardInfo";
import { db } from "@/utils/dbConfig";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { projectAllocations, operationalCosts, revenueStreams } from "@/utils/schema";
import DashboardCharts from "./_components/DashboardCharts";
import BudgetItem from "./budgets/_components/BudgetItem";
import ExpenseListTable from "./expenses/_components/ExpenseListTable";

function Dashboard() {
  const { user } = useUser();

  const [budgetList, setBudgetList] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);

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
    getAllExpenses();
    getIncomeList();
  };

  /**
   * Fetch revenue stream list — scoped to the current authenticated user
   */
  const getIncomeList = async () => {
    try {
      const result = await db
        .select()
        .from(revenueStreams)
        .where(eq(revenueStreams.createdBy, user?.primaryEmailAddress?.emailAddress))
        .orderBy(desc(revenueStreams.id));
      setIncomeList(result);
    } catch (error) {
      console.error("Error fetching revenue streams:", error);
    }
  };

  /**
   * Fetch all operational costs belonging to the current user
   */
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
      <h2 className="font-bold text-4xl">Hi, {user?.fullName} 👋</h2>
      <p className="text-gray-500 mt-1">
        Here's an overview of your project financials. Stay on top of your allocations.
      </p>

      <CardInfo budgetList={budgetList} incomeList={incomeList} />

      <div className="grid grid-cols-1 lg:grid-cols-3 mt-6 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <DashboardCharts
            budgetList={budgetList}
            incomeList={incomeList}
            expensesList={expensesList}
          />
          <ExpenseListTable
            expensesList={expensesList}
            refreshData={() => getBudgetList()}
          />
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="font-bold text-lg">Latest Allocations</h2>
          {budgetList?.length > 0
            ? budgetList.map((budget, index) => (
                <BudgetItem budget={budget} key={index} />
              ))
            : [1, 2, 3, 4].map((item, index) => (
                <div
                  key={index}
                  className="h-[180px] w-full bg-slate-200 rounded-lg animate-pulse"
                ></div>
              ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
