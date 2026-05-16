"use client";
import { db } from "@/utils/dbConfig";
import { projectAllocations, operationalCosts } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import BudgetItem from "../../budgets/_components/BudgetItem";
import AddExpense from "../_components/AddExpense";
import ExpenseListTable from "../_components/ExpenseListTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import EditBudget from "../_components/EditBudget";

function ExpensesScreen({ params }) {
  const { user } = useUser();
  const [budgetInfo, setbudgetInfo] = useState();
  const [expensesList, setExpensesList] = useState([]);
  const route = useRouter();

  useEffect(() => {
    user && getBudgetInfo();
  }, [user]);

  /**
   * Get Project Allocation Information
   */
  const getBudgetInfo = async () => {
    const result = await db
      .select({
        ...getTableColumns(projectAllocations),
        totalSpend: sql`sum(${operationalCosts.amount})`.mapWith(Number),
        totalItem: sql`count(${operationalCosts.id})`.mapWith(Number),
      })
      .from(projectAllocations)
      .leftJoin(operationalCosts, eq(projectAllocations.id, operationalCosts.allocationId))
      .where(eq(projectAllocations.createdBy, user?.primaryEmailAddress?.emailAddress))
      .where(eq(projectAllocations.id, params.id))
      .groupBy(projectAllocations.id);

    setbudgetInfo(result[0]);
    getExpensesList();
  };

  /**
   * Get Latest Operational Costs
   */
  const getExpensesList = async () => {
    const result = await db
      .select()
      .from(operationalCosts)
      .where(eq(operationalCosts.allocationId, params.id))
      .orderBy(desc(operationalCosts.id));
    setExpensesList(result);
    console.log(result);
  };

  /**
   * Delete allocation and all its associated operational costs
   */
  const deleteBudget = async () => {
    const deleteExpenseResult = await db
      .delete(operationalCosts)
      .where(eq(operationalCosts.allocationId, params.id))
      .returning();

    if (deleteExpenseResult) {
      const result = await db
        .delete(projectAllocations)
        .where(eq(projectAllocations.id, params.id))
        .returning();
    }
    toast("Allocation Deleted!");
    route.replace("/dashboard/budgets");
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold gap-2 flex justify-between items-center">
        <span className="flex gap-2 items-center">
          <ArrowLeft onClick={() => route.back()} className="cursor-pointer" />
          Allocation Detail
        </span>
        <div className="flex gap-2 items-center">
          <EditBudget
            budgetInfo={budgetInfo}
            refreshData={() => getBudgetInfo()}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex gap-2 rounded-full" variant="destructive">
                <Trash className="w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this project allocation along with all its operational costs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteBudget()}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 mt-6 gap-5">
        {budgetInfo ? (
          <BudgetItem budget={budgetInfo} />
        ) : (
          <div className="h-[150px] w-full bg-slate-200 rounded-lg animate-pulse"></div>
        )}
        <AddExpense
          budgetId={params.id}
          user={user}
          refreshData={() => getBudgetInfo()}
        />
      </div>
      <div className="mt-4">
        <ExpenseListTable
          expensesList={expensesList}
          refreshData={() => getBudgetInfo()}
        />
      </div>
    </div>
  );
}

export default ExpensesScreen;
