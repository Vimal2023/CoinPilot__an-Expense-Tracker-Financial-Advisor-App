"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useUser } from "@clerk/nextjs";
import {
  FileText, UploadCloud, CheckCircle2, XCircle, Loader2,
  AlertTriangle, ArrowRight, TrendingUp, TrendingDown,
  ArrowUpDown, Database, Hash, RefreshCw, ShieldCheck, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS = { IDLE: "idle", LOADING: "loading", SUCCESS: "success", ERROR: "error" };
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const CATEGORY_COLORS = {
  Revenue: "bg-green-50 text-green-700", Infrastructure: "bg-sky-50 text-sky-700",
  Payroll: "bg-violet-50 text-violet-700", Tooling: "bg-amber-50 text-amber-700",
  Marketing: "bg-pink-50 text-pink-700", Tax: "bg-orange-50 text-orange-700",
  Transfers: "bg-slate-100 text-slate-600", Other: "bg-slate-50 text-slate-500",
};

function TypeChip({ type }) {
  const isCredit = type === "credit";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isCredit ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      {isCredit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isCredit ? "Credit" : "Debit"}
    </span>
  );
}
function CategoryChip({ category }) {
  const cls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
  return <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{category}</span>;
}
function KpiCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? "border-green-200 bg-green-50/40" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-slate-300" />}
      </div>
      <p className="font-bold text-xl text-slate-800 tabular-nums">{value}</p>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map((i) => (
          <div key={i} className="border rounded-xl p-4 h-[80px]">
            <div className="h-2.5 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-5 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-4">
        <Loader2 className="w-5 h-5 text-green-600 animate-spin shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-700">AI is reading your statement…</p>
          <p className="text-xs text-slate-400 mt-0.5">Extracting transactions · Classifying categories · Saving to database</p>
        </div>
      </div>
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-slate-50 h-10 px-4 border-b flex items-center gap-4">
          {[80,180,90,80,80].map((w,i) => <div key={i} className="h-2.5 bg-slate-200 rounded" style={{width:w}} />)}
        </div>
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="px-4 py-3.5 border-b last:border-b-0 flex items-center gap-4">
            {[80,180,90,80,80].map((w,j) => <div key={j} className="h-2 bg-slate-100 rounded" style={{width:w}} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pending approval queue ───────────────────────────────────────────────────
function PendingQueue({ userEmail, onApproved }) {
  const [records, setRecords] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [fetching, setFetching] = useState(false);

  const fetchPending = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/approve-statement");
      const json = await res.json();
      if (json.success) setRecords(json.records);
    } catch { /* silent */ } finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (record) => {
    setLoadingId(record.id);
    try {
      const res = await fetch("/api/approve-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: record.id, createdBy: userEmail }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(json.message);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      onApproved?.();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoadingId(null); }
  };

  if (fetching) {
    return (
      <div className="border rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 rounded mb-4" />
        {[1,2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl mb-3" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="border rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-700">No pending statements</p>
          <p className="text-xs text-slate-400 mt-0.5">All parsed statements have been approved and synced.</p>
        </div>
        <button onClick={fetchPending} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-lg text-slate-800">Pending Approvals</h2>
          <p className="text-xs text-slate-400 mt-0.5">{records.length} statement{records.length > 1 ? "s" : ""} awaiting review</p>
        </div>
        <button onClick={fetchPending} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {records.map((rec) => {
          let txs = [];
          try { txs = JSON.parse(rec.parsedData); } catch {}
          const credits = txs.filter((t) => t.type === "credit").length;
          const debits  = txs.filter((t) => t.type === "debit").length;
          const totalAmt = txs.reduce((s, t) => s + Number(t.amount || 0), 0);

          return (
            <div key={rec.id} className="border rounded-2xl overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">{rec.fileName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Uploaded {rec.uploadedAt ? new Date(rec.uploadedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                      {" · "}Record #{rec.id}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full">
                  Pending
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x px-0">
                <div className="px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Transactions</p>
                  <p className="font-bold text-lg text-slate-800 tabular-nums mt-0.5">{txs.length}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Credits / Debits</p>
                  <p className="font-bold text-lg text-slate-800 tabular-nums mt-0.5">
                    <span className="text-green-600">{credits}</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-red-500">{debits}</span>
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Total Volume</p>
                  <p className="font-bold text-lg text-slate-800 tabular-nums mt-0.5">{fmt(totalAmt)}</p>
                </div>
              </div>

              {/* Action footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t bg-white">
                <p className="text-xs text-slate-400">
                  Approving will sync <span className="font-medium text-green-700">{credits} revenue streams</span> and <span className="font-medium text-red-500">{debits} operational costs</span> to your dashboard.
                </p>
                <Button
                  onClick={() => handleApprove(rec)}
                  disabled={loadingId === rec.id}
                  className="flex items-center gap-1.5 bg-green-800 hover:bg-green-700 rounded-full text-xs h-8 px-4 ml-4 shrink-0"
                >
                  {loadingId === rec.id ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Syncing…</>
                  ) : (
                    <><ShieldCheck className="w-3 h-3" /> Approve &amp; Sync</>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AutomationPage() {
  const { user } = useUser();
  const [status, setStatus]     = useState(STATUS.IDLE);
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [queueKey, setQueueKey] = useState(0);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) { toast.error("Only PDF files are accepted."); return; }
    setFile(accepted[0]); setResult(null); setStatus(STATUS.IDLE); setErrorMsg("");
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1, multiple: false,
    disabled: status === STATUS.LOADING,
  });

  const handleParse = async () => {
    if (!file) return;
    setStatus(STATUS.LOADING); setResult(null); setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("statement", file);
      formData.append("createdBy", user?.primaryEmailAddress?.emailAddress ?? "anonymous");
      const res  = await fetch("/api/parse-statement", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Parsing failed.");
      setResult(json); setStatus(STATUS.SUCCESS);
      toast.success(`${json.data.summary.totalTransactions} transactions extracted and saved.`);
      setQueueKey((k) => k + 1); // refresh pending queue
    } catch (err) {
      setErrorMsg(err.message); setStatus(STATUS.ERROR); toast.error(err.message);
    }
  };

  const handleReset = () => { setFile(null); setResult(null); setStatus(STATUS.IDLE); setErrorMsg(""); };

  const dzBase   = "w-full border-2 border-dashed rounded-2xl transition-all duration-200";
  const dzCursor = status === STATUS.LOADING ? "cursor-not-allowed opacity-60" : "cursor-pointer";
  const dzColor  = isDragReject ? "border-red-400 bg-red-50"
    : isDragActive ? "border-green-500 bg-green-50 scale-[1.01]"
    : file ? "border-green-600 bg-green-50/40"
    : "border-slate-300 bg-slate-50 hover:border-green-500 hover:bg-green-50/30";

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="p-6">
      {/* Header */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">AI Feature</p>
      <h1 className="font-bold text-3xl text-slate-800 mt-0.5">Statement Parser</h1>
      <p className="text-slate-500 text-sm mt-1 max-w-xl">
        Upload a PDF bank statement. Groq AI extracts every transaction, classifies it, and saves it for your review before syncing to your live dashboard.
      </p>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Drop zone */}
          <div>
            <h2 className="font-semibold text-base text-slate-700 mb-2">Upload Bank Statement</h2>
            <div {...getRootProps()} className={`${dzBase} ${dzColor} ${dzCursor}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center select-none">
                {isDragReject ? (
                  <><XCircle className="w-12 h-12 text-red-400" /><p className="text-sm font-medium text-red-500">Only PDF files accepted</p></>
                ) : isDragActive ? (
                  <><UploadCloud className="w-12 h-12 text-green-600 animate-bounce" /><p className="text-sm font-semibold text-green-700">Drop to upload</p></>
                ) : status === STATUS.LOADING ? (
                  <><Loader2 className="w-12 h-12 text-green-700 animate-spin" /><p className="text-sm font-semibold text-slate-600">Processing…</p></>
                ) : file ? (
                  <>
                    <FileText className="w-12 h-12 text-green-700" />
                    <div><p className="text-sm font-semibold text-slate-800">{file.name}</p><p className="text-xs text-slate-400 mt-0.5">{(file.size/1024).toFixed(1)} KB · PDF</p></div>
                    <p className="text-xs text-slate-400">Drop a different file to replace</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-slate-300" />
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Drag &amp; drop your PDF here</p>
                      <p className="text-xs text-slate-400 mt-1">or <span className="text-green-700 font-medium underline underline-offset-2">click to browse</span></p>
                    </div>
                    <p className="text-[11px] text-slate-400">PDF · Max 10 MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3">
            <Button id="btn-parse-statement" onClick={handleParse} disabled={!file || status === STATUS.LOADING} className="flex items-center gap-2 bg-green-800 hover:bg-green-700 rounded-full px-6">
              {status === STATUS.LOADING ? <><Loader2 className="w-4 h-4 animate-spin" />Parsing…</> : <>Parse Statement<ArrowRight className="w-4 h-4" /></>}
            </Button>
            {(file || result) && status !== STATUS.LOADING && (
              <Button variant="outline" onClick={handleReset} className="rounded-full px-5 text-slate-500">Reset</Button>
            )}
          </div>

          {/* Skeleton */}
          {status === STATUS.LOADING && <ResultsSkeleton />}

          {/* Error */}
          {status === STATUS.ERROR && (
            <div className="flex items-start gap-3 border border-red-200 bg-red-50 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div><p className="text-sm font-semibold text-red-700">Parse failed</p><p className="text-xs text-red-500 mt-0.5">{errorMsg}</p></div>
            </div>
          )}

          {/* Results */}
          {status === STATUS.SUCCESS && result && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm font-semibold text-green-700">{result.fileName} — parsed &amp; saved{result.recordId ? ` (record #${result.recordId})` : ""}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-700 mb-2">Parse Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Transactions" value={result.data.summary.totalTransactions} icon={Hash} />
                  <KpiCard label="Total Credits" value={fmt(result.data.summary.totalCredits)} icon={TrendingUp} />
                  <KpiCard label="Total Debits" value={fmt(result.data.summary.totalDebits)} icon={TrendingDown} />
                  <KpiCard label="Net Cashflow" value={fmt(result.data.summary.netCashflow)} icon={ArrowUpDown} highlight={result.data.summary.netCashflow >= 0} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Database className="w-3.5 h-3.5" />
                Saved to <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">raw_statements</code> with status <span className="bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded text-[11px]">pending</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-700 mb-2">Extracted Transactions ({result.data.transactions.length})</h3>
                <div className="rounded-xl border overflow-hidden">
                  <div className="grid grid-cols-[90px_1fr_110px_90px_90px] bg-slate-50 px-4 py-2.5 border-b">
                    {["Date","Description","Amount","Category","Type"].map((h) => (
                      <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</span>
                    ))}
                  </div>
                  {result.data.transactions.map((tx, i) => (
                    <div key={i} className="grid grid-cols-[90px_1fr_110px_90px_90px] px-4 py-3 border-b last:border-b-0 hover:bg-slate-50/80 transition-colors">
                      <span className="text-xs text-slate-500 tabular-nums">{tx.date}</span>
                      <span className="text-xs text-slate-800 font-medium pr-4 truncate">{tx.description}</span>
                      <span className={`text-xs font-semibold tabular-nums ${tx.type === "credit" ? "text-green-700" : "text-red-500"}`}>
                        {tx.type === "credit" ? "+" : "−"}{fmt(tx.amount)}
                      </span>
                      <span><CategoryChip category={tx.category} /></span>
                      <span><TypeChip type={tx.type} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Pending approval queue — always visible below upload ── */}
          <div className="border-t pt-6">
            <PendingQueue key={queueKey} userEmail={userEmail} onApproved={() => setQueueKey((k) => k + 1)} />
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-base text-slate-700">How It Works</h2>
          <div className="border rounded-2xl p-5 flex flex-col gap-4">
            {[
              { step:"01", title:"Upload PDF", desc:"Drop your bank statement — any text-layer PDF export." },
              { step:"02", title:"Text Extraction", desc:"pdf-parse pulls every line of text from the document server-side." },
              { step:"03", title:"Groq AI Parse", desc:"llama-3.1-8b-instant classifies each transaction by date, amount, category, and type." },
              { step:"04", title:"Saved to DB", desc:"Results land in raw_statements with status 'pending' for your review." },
              { step:"05", title:"Approve & Sync", desc:"One click syncs credits → Revenue Streams and debits → Operational Costs." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-green-800 text-white text-[10px] font-bold">{step}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Supported Banks</p>
            {["HDFC Bank","ICICI Bank","Axis Bank","SBI","Kotak","Yes Bank"].map((b) => (
              <span key={b} className="inline-block text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 mr-1.5 mb-1.5">{b}</span>
            ))}
            <p className="text-[10px] text-slate-400 mt-2">+ any text-layer PDF · Scanned images not supported</p>
          </div>

        </div>
      </div>
    </div>
  );
}
