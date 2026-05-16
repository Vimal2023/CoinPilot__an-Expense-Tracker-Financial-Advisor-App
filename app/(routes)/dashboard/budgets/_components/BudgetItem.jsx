import Link from "next/link";
import React from "react";

function BudgetItem({ budget }) {
  const spend     = Number(budget.totalSpend) || 0;
  const allocated = Number(budget.amount)     || 0;
  const remaining = allocated - spend;

  const calculateProgressPerc = () => {
    if (allocated === 0) return 0;
    const perc = (spend / allocated) * 100;
    return Math.min(perc, 100);          // cap at 100 %
  };

  const perc = calculateProgressPerc();

  // Colour shifts red when over 80 % utilised
  const barColor =
    perc >= 100 ? "bg-red-500"
    : perc >= 80  ? "bg-orange-500"
    : "bg-green-700";

  return (
    <Link href={"/dashboard/expenses/" + budget?.id}>
      <div className="p-5 border rounded-2xl hover:shadow-md cursor-pointer h-[170px]">

        {/* ── Header row ── */}
        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-2 items-center">
            <h2 className="text-2xl p-3 px-4 bg-slate-100 rounded-full">
              {budget?.icon}
            </h2>
            <div>
              <h2 className="font-bold leading-tight">{budget.name}</h2>
              <h2 className="text-sm text-gray-500">{budget.totalItem ?? 0} Item</h2>
            </div>
          </div>
          <h2 className="font-bold text-green-800 text-lg shrink-0">
            ₹{allocated.toLocaleString("en-IN")}
          </h2>
        </div>

        {/* ── Progress section ── */}
        <div className="mt-5">
          {/* Labels — edge-to-edge, no extra padding */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">
              ₹{spend.toLocaleString("en-IN")} spent
            </span>
            <span className={`text-xs font-medium ${remaining < 0 ? "text-red-500" : "text-slate-400"}`}>
              {remaining >= 0
                ? `₹${remaining.toLocaleString("en-IN")} left`
                : `₹${Math.abs(remaining).toLocaleString("en-IN")} over`}
            </span>
          </div>

          {/* Track */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            {/* Fill — inline style drives the dynamic width */}
            <div
              className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${perc}%` }}
            />
          </div>

          {/* Percentage label */}
          <p className="text-[10px] text-slate-400 mt-1 text-right tabular-nums">
            {perc.toFixed(1)}% utilised
          </p>
        </div>
      </div>
    </Link>
  );
}

export default BudgetItem;
