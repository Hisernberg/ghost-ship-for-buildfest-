import { useEffect, useState } from "react";
import { X, Download, Loader2, FileText, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import { apiFetch } from "../utils/api";

export default function DocumentEditModal({ submissionId, field, label, onClose }) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchText() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/submissions/${submissionId}/document-text/${field}`);
        const data = await res.json();
        if (data.ok) {
          setText(data.text);
          setFilename(data.filename || `${field}.pdf`);
        } else {
          setError(data.message || "Could not extract text from this document.");
        }
      } catch {
        setError("Network error — could not reach the server.");
      } finally {
        setLoading(false);
      }
    }
    fetchText();
  }, [submissionId, field]);

  function handleDownload() {
    setDownloading(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - margin * 2;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, margin + 5);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Edited document — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, margin, margin + 11);
      doc.setTextColor(0, 0, 0);

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

      // Body text
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, maxLineWidth);
      let y = margin + 22;
      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }

      const safeName = filename.replace(/\.[^.]+$/, "") || field;
      doc.save(`${safeName}_edited.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl"
           style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Edit Document</p>
            <h2 className="truncate text-base font-semibold text-slate-950">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          {loading && (
            <div className="flex items-center gap-2 py-12 justify-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Extracting document text…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Document Text — edit freely, then download as PDF
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-72 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                spellCheck={false}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={loading || !!error || downloading}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? "Generating…" : "Download Edited PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
