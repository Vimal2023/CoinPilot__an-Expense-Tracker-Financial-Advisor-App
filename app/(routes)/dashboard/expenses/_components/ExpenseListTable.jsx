"use client";
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { db } from "@/utils/dbConfig";
import { operationalCosts } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { toast } from "sonner";
import { ArrowUpDown, ArrowUp, ArrowDown, Trash, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportToCSV(data, filename = "operational_costs.csv") {
  if (!data.length) return;
  const headers = ["Name", "Amount (₹)", "Date"];
  const rows = data.map((r) => [
    `"${r.name}"`,
    r.amount,
    `"${r.createdAt}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sortable Column Header ───────────────────────────────────────────────────
function SortHeader({ column, label }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="w-3 h-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ExpenseListTable({ expensesList, refreshData }) {
  const [sorting, setSorting] = useState([]);

  const deleteExpense = async (expense) => {
    const result = await db
      .delete(operationalCosts)
      .where(eq(operationalCosts.id, expense.id))
      .returning();
    if (result) {
      toast("Cost entry deleted.");
      refreshData();
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortHeader column={column} label="Name" />,
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-800">{getValue()}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <SortHeader column={column} label="Amount (₹)" />,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-slate-700">
            ₹{Number(getValue()).toLocaleString("en-IN")}
          </span>
        ),
        sortingFn: "alphanumeric",
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <SortHeader column={column} label="Date" />,
        cell: ({ getValue }) => (
          <span className="text-slate-500">{getValue()}</span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Action
          </span>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => deleteExpense(row.original)}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
          >
            <Trash className="w-3 h-3" />
            Delete
          </button>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: expensesList,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = expensesList.length;

  return (
    <div className="mt-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-lg">Operational Costs</h2>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs h-8"
          onClick={() => exportToCSV(expensesList)}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-b hover:bg-slate-50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="first:pl-4">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="first:pl-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-slate-400">
                  No operational costs recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>
          Showing {pageIndex * pageSize + 1}–
          {Math.min((pageIndex + 1) * pageSize, totalRows)} of {totalRows} entries
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ← Prev
          </Button>
          <span className="font-medium text-slate-700">
            Page {pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExpenseListTable;
