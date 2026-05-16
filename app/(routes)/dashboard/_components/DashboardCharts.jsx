"use client";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// ─── Brand Palette ─────────────────────────────────────────────────────────────
const COLORS = [
  "#166534", // deep green
  "#4ade80", // light green
  "#0ea5e9", // sky
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#fb923c", // orange
];

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      {label && <p className="font-semibold text-slate-600 mb-1.5">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}:{" "}
          <span className="font-semibold text-slate-800 ml-auto pl-3 tabular-nums">
            ₹{Number(entry.value).toLocaleString("en-IN")}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Custom Donut Label ────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null; // hide tiny slices
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Legend Item ───────────────────────────────────────────────────────────────
function DonutLegend({ data }) {
  return (
    <ul className="mt-4 space-y-1.5">
      {data.map((entry, i) => (
        <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
          <span
            className="shrink-0 w-2.5 h-2.5 rounded-sm"
            style={{ background: COLORS[i % COLORS.length] }}
          />
          <span className="truncate flex-1">{entry.name}</span>
          <span className="tabular-nums font-medium text-slate-800 ml-2">
            ₹{Number(entry.value).toLocaleString("en-IN")}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
/**
 * Props:
 *   budgetList  – [ { name, amount, totalSpend, ... } ]   (from projectAllocations join)
 *   incomeList  – [ { name, totalAmount, ... } ]           (from revenueStreams)
 *   expensesList – [ { name, amount, createdAt } ]         (all operationalCosts)
 */
function DashboardCharts({ budgetList, incomeList, expensesList }) {
  // ── 1. Cashflow Trend: group costs by month, compare against total revenue ──
  const trendData = useMemo(() => {
    // Sum costs per month from expensesList
    const costByMonth = {};
    (expensesList || []).forEach((e) => {
      // createdAt is stored as "DD/MM/YYYY"
      const parts = (e.createdAt || "").split("/");
      if (parts.length < 3) return;
      const label = `${parts[1]}/${parts[2]}`; // MM/YYYY
      costByMonth[label] = (costByMonth[label] || 0) + Number(e.amount || 0);
    });

    // Total revenue (flat – same for every month as a baseline reference)
    const totalRevenue = (incomeList || []).reduce(
      (acc, s) => acc + Number(s.totalAmount || s.amount || 0),
      0
    );

    // Build sorted array
    const months = Object.keys(costByMonth).sort((a, b) => {
      const [ma, ya] = a.split("/").map(Number);
      const [mb, yb] = b.split("/").map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });

    if (!months.length) {
      // Fallback: show allocation data
      return (budgetList || []).map((b) => ({
        month: b.name,
        revenue: Number(b.amount || 0),
        costs: Number(b.totalSpend || 0),
      }));
    }

    return months.map((m) => ({
      month: m,
      revenue: totalRevenue,
      costs: costByMonth[m],
    }));
  }, [expensesList, incomeList, budgetList]);

  // ── 2. Donut: operational costs per project allocation ──────────────────────
  const donutData = useMemo(
    () =>
      (budgetList || [])
        .filter((b) => Number(b.totalSpend) > 0)
        .map((b) => ({ name: b.name, value: Number(b.totalSpend) })),
    [budgetList]
  );

  // Empty-state skeleton
  const isEmpty = !budgetList?.length;

  if (isEmpty) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="h-[340px] w-full bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* ── Line Chart: Cashflow Trend ──────────────────────────────────────── */}
      <div className="border rounded-2xl overflow-hidden">
        {/* Header — flush to the container edge, no inner horizontal padding */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Overview
          </p>
          <h2 className="font-bold text-base text-slate-800 leading-tight mt-0.5">
            Cashflow Trend
          </h2>
        </div>

        <div className="pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={trendData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#166534"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#166534", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="costs"
                name="Op. Costs"
                stroke="#f43f5e"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Donut Chart: Cost Breakdown by Allocation ───────────────────────── */}
      <div className="border rounded-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Breakdown
          </p>
          <h2 className="font-bold text-base text-slate-800 leading-tight mt-0.5">
            Cost by Allocation
          </h2>
        </div>

        {donutData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
            No cost data yet — add operational costs to see the breakdown.
          </div>
        ) : (
          <div className="pb-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={false}
                >
                  {donutData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardCharts;
