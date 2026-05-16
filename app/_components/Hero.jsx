"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, FileText, ShieldCheck } from "lucide-react";

const PILLS = [
  { icon: Sparkles,    label: "Groq-Powered AI" },
  { icon: FileText,    label: "Statement Parser" },
  { icon: TrendingUp,  label: "Cashflow Intelligence" },
  { icon: ShieldCheck, label: "Enterprise-Ready" },
];

const STATS = [
  { value: "10×", label: "Faster Reconciliation" },
  { value: "99%", label: "Extraction Accuracy" },
  { value: "∞",   label: "Statements Supported" },
];

function Hero() {
  return (
    <section className="w-full bg-white border-b overflow-hidden">
      {/* ── Top strip — full-bleed gradient bar ── */}
      <div className="h-1 w-full bg-gradient-to-r from-green-800 via-emerald-500 to-green-400" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-16">

        {/* ── Feature pills ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {PILLS.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-600 rounded-full px-3 py-1">
              <Icon className="w-3 h-3 text-green-700" />
              {label}
            </span>
          ))}
        </div>

        {/* ── Hero headline — left-aligned, no centering ── */}
        <div className="max-w-3xl">
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
            Automate Financial{" "}
            <span className="text-green-800">Operations</span>
            <br />
            for Your Agency.
          </h1>

          <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-2xl">
            Upload any bank statement and our{" "}
            <span className="font-semibold text-slate-700">Groq-powered AI</span> extracts,
            classifies, and syncs every transaction — credits into Revenue Streams,
            debits into Project Allocations — in seconds. No manual data entry. Ever.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link href="/sign-in">
              <Button className="h-11 px-7 rounded-full bg-green-800 hover:bg-green-700 text-white text-sm font-semibold shadow-md shadow-green-900/20">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="h-11 px-7 rounded-full text-sm font-semibold text-slate-600">
                View Dashboard →
              </Button>
            </Link>
          </div>

          {/* Social proof stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-slate-100">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{value}</p>
                <p className="text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dashboard screenshot — full width below headline ── */}
        <div className="mt-14 relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/60">
          {/* Frosted top bar */}
          <div className="absolute top-0 inset-x-0 h-8 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 px-4 z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-4 text-[10px] font-mono text-slate-400">finansmart.app/dashboard</span>
          </div>
          <Image
            src="/dashboard.png"
            alt="FinanSmart enterprise dashboard — cashflow overview"
            height={720}
            width={1400}
            className="w-full object-cover object-top mt-8"
            draggable={false}
            priority
          />
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>

      </div>
    </section>
  );
}

export default Hero;
