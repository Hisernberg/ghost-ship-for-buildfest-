import { useEffect, useState } from "react";
import { Ship, RefreshCw, Play, FileText, ChevronDown, ChevronUp, Loader2, Pencil } from "lucide-react";
import { statusColor, StatusIcon } from "../utils/statusUtils";
import DocumentEditModal from "./DocumentEditModal";
import { apiFetch, assetUrl } from "../utils/api";

const STATUS_OPTIONS = ["Pending", "Under Review", "Cleared", "Flagged", "Rejected"];

export default function OfficerInbox({ onLoadSubmission }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(null);
  const [filter, setFilter] = useState("All");
  const [editTarget, setEditTarget] = useState(null); // { submissionId, field, label }

  useEffect(() => {
    loadSubmissions();
  }, []);

  function _loadLocal() {
    try { return JSON.parse(localStorage.getItem("ghostship-all-submissions") || "[]"); } catch { return []; }
  }
  function _saveLocal(list) {
    try { localStorage.setItem("ghostship-all-submissions", JSON.stringify(list)); } catch {}
  }

  async function loadSubmissions() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/submissions");
      const data = await res.json();
      if (data.ok) setSubmissions(data.submissions);
      else setSubmissions(_loadLocal());
    } catch {
      setSubmissions(_loadLocal());
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      const res = await apiFetch(`/api/submissions/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmissions((prev) => prev.map((s) => (s.id === id ? data.submission : s)));
        return;
      }
    } catch {}
    // Fallback: update localStorage
    const updated = _loadLocal().map((s) => s.id === id ? { ...s, status } : s);
    _saveLocal(updated);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    setUpdating(null);
  }

  async function handleLoadForAnalysis(sub) {
    setLoadingAnalysis(sub.id);
    async function urlToFile(url, name) {
      if (!url) return null;
      try {
        const res = await fetch(assetUrl(url));
        const blob = await res.blob();
        return new File([blob], name, { type: blob.type });
      } catch { return null; }
    }

    try {
      if (sub.intake_mode === "csv" && sub.csv_url) {
        const csvFile = await urlToFile(sub.csv_url, sub.csv_name || "shipment.csv");
        onLoadSubmission({ submission: sub, csvFile, documents: {} });
      } else {
        const [invoice, packing_list, bill_of_lading] = await Promise.all([
          urlToFile(sub.invoice_url, "invoice.pdf"),
          urlToFile(sub.packing_list_url, "packing_list.pdf"),
          urlToFile(sub.bill_of_lading_url, "bill_of_lading.pdf"),
        ]);
        onLoadSubmission({ submission: sub, documents: { invoice, packing_list, bill_of_lading } });
      }
      if (sub.status === "Pending") updateStatus(sub.id, "Under Review");
    } finally {
      setLoadingAnalysis(null);
    }
  }

  const filterOptions = ["All", "Pending", "Under Review", "Cleared", "Flagged"];
  const displayed = filter === "All" ? submissions : submissions.filter((s) => s.status === filter);
  const pendingCount = submissions.filter((s) => s.status === "Pending").length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Ship className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Incoming</p>
            <h2 className="text-lg font-semibold text-slate-950">
              Shipper Submissions
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  {pendingCount} new
                </span>
              )}
            </h2>
          </div>
        </div>
        <button
          onClick={loadSubmissions}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition
              ${filter === f ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
          >
            {f}
            {f === "Pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-block rounded-full bg-red-500 px-1.5 text-white text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && (
        <p className="text-sm text-slate-400 italic py-4">Loading submissions…</p>
      )}

      {!loading && displayed.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <Ship className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No submissions in this category yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {displayed.map((sub) => {
          const isOpen = expanded === sub.id;
          const docList = [
            sub.invoice_url && { field: "invoice", label: "Invoice", url: sub.invoice_url },
            sub.packing_list_url && { field: "packing_list", label: "Packing List", url: sub.packing_list_url },
            sub.bill_of_lading_url && { field: "bill_of_lading", label: "Bill of Lading", url: sub.bill_of_lading_url },
            sub.extra_doc_1_url && { field: "extra_doc_1", label: sub.extra_doc_1_name || "Extra 1", url: sub.extra_doc_1_url },
            sub.extra_doc_2_url && { field: "extra_doc_2", label: sub.extra_doc_2_name || "Extra 2", url: sub.extra_doc_2_url },
          ].filter(Boolean);

          const csvLabel = sub.csv_name || (sub.intake_mode === "csv" ? "CSV File" : null);
          const totalDocs = docList.length + (csvLabel ? 1 : 0);
          const canAnalyze = sub.csv_url || sub.invoice_url || sub.packing_list_url || sub.bill_of_lading_url;

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border transition-all duration-200
                ${isOpen ? "border-slate-300 bg-white shadow-sm" : "border-slate-100 bg-slate-50 hover:border-slate-200"}`}
            >
              {/* Row header */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : sub.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  <Ship className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-800">{sub.ship_number}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor(sub.status)}`}>
                      <StatusIcon status={sub.status} />
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sub.shipper_name} · {sub.company_name} · {totalDocs} doc{totalDocs !== 1 ? "s" : ""}
                    {sub.created_at ? ` · ${new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-4">
                  {sub.notes && (
                    <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
                      <span className="font-semibold">Shipper note: </span>{sub.notes}
                    </div>
                  )}

                  {/* Documents */}
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {sub.intake_mode === "csv" ? "CSV File" : "Documents"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {csvLabel && (
                        sub.csv_url ? (
                          <a href={assetUrl(sub.csv_url)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                            <FileText className="h-3.5 w-3.5" />
                            {csvLabel}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            <FileText className="h-3.5 w-3.5" />
                            {csvLabel}
                            <span className="text-blue-400 font-normal">(restart backend to download)</span>
                          </span>
                        )
                      )}
                      {docList.map((doc) => (
                        <div key={doc.label} className="inline-flex items-center gap-1">
                          <a
                            href={assetUrl(doc.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            {doc.label}
                          </a>
                          <button
                            type="button"
                            title={`Edit ${doc.label}`}
                            onClick={() => setEditTarget({ submissionId: sub.id, field: doc.field, label: doc.label })}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {totalDocs === 0 && (
                        <span className="text-xs text-slate-400 italic">No documents uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {canAnalyze && (
                      <button
                        type="button"
                        onClick={() => handleLoadForAnalysis(sub)}
                        disabled={loadingAnalysis === sub.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {loadingAnalysis === sub.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Play className="h-4 w-4" />}
                        {loadingAnalysis === sub.id ? "Loading…" : "Load into Analysis"}
                      </button>
                    )}

                    {/* Status changer */}
                    <select
                      value={sub.status}
                      disabled={updating === sub.id}
                      onChange={(e) => updateStatus(sub.id, e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition hover:bg-white disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {updating === sub.id && (
                      <span className="text-xs text-slate-400 animate-pulse">Saving…</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editTarget && (
        <DocumentEditModal
          submissionId={editTarget.submissionId}
          field={editTarget.field}
          label={editTarget.label}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
