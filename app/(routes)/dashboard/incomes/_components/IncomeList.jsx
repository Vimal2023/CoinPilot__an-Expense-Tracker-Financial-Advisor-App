"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { db } from "@/utils/dbConfig";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { revenueStreams, operationalCosts } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateIncomes from "./CreateIncomes";

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportToCSV(data, filename = "revenue_streams.csv") {
  if (!data.length) return;
  const headers = ["Name", "Amount (₹)", "Icon", "Created By"];
  const rows = data.map((r) => [
    `"${r.name}"`,
    r.amount,
    `"${r.icon ?? ""}"`,
    `"${r.createdBy}"`,
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
function IncomeList() {
  const [incomelist, setIncomelist] = useState([]);
  const [sorting, setSorting] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    user && getIncomelist();
  }, [user]);

  const getIncomelist = async () => {
    const result = await db
      .select({
        ...getTableColumns(revenueStreams),
        totalSpend: sql`sum(${operationalCosts.amount})`.mapWith(Number),
        totalItem: sql`count(${operationalCosts.id})`.mapWith(Number),
      })
      .from(revenueStreams)
      .leftJoin(operationalCosts, eq(revenueStreams.id, operationalCosts.allocationId))
      .where(eq(revenueStreams.createdBy, user?.primaryEmailAddress?.emailAddress))
      .groupBy(revenueStreams.id)
      .orderBy(desc(revenueStreams.id));
    setIncomelist(result);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "icon",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Icon
          </span>
        ),
        cell: ({ getValue }) => (
          <span className="text-xl leading-none">{getValue()}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <SortHeader column={column} label="Stream Name" />,
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
        accessorKey: "totalItem",
        header: ({ column }) => <SortHeader column={column} label="Linked Costs" />,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-slate-500">{getValue()}</span>
        ),
      },
      {
        accessorKey: "totalSpend",
        header: ({ column }) => <SortHeader column={column} label="Total Spend (₹)" />,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-slate-700">
            ₹{Number(getValue()).toLocaleString("en-IN")}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: incomelist,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = incomelist.length;

  return (
    <div className="mt-5">
      {/* Create card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <CreateIncomes refreshData={() => getIncomelist()} />
        {incomelist.length === 0 &&
          [1, 2].map((item, index) => (
            <div
              key={index}
              className="w-full bg-slate-200 rounded-lg h-[150px] animate-pulse"
            />
          ))}
      </div>

      {/* DataTable section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">Revenue Streams</h2>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs h-8"
            onClick={() => exportToCSV(incomelist)}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>

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
                    No revenue streams recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            Showing {totalRows === 0 ? 0 : pageIndex * pageSize + 1}–
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
              Page {table.getPageCount() === 0 ? 0 : pageIndex + 1} /{" "}
              {table.getPageCount()}
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
    </div>
  );
}

export default IncomeList;
