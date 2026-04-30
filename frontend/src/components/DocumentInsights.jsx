import { FileText } from "lucide-react";

const documentFields = [
  { key: "invoice", label: "Commercial Invoice" },
  { key: "packing_list", label: "Packing List" },
  { key: "bill_of_lading", label: "Bill of Lading" },
];

const defaultDocumentInsights = {
  invoice: {
    file_name: "No file selected",
    parsed_fields: {},
    text_excerpt: "Extracted text will appear here after document analysis.",
  },
  packing_list: {
    file_name: "No file selected",
    parsed_fields: {},
    text_excerpt: "Packing list data preview will appear here after analysis.",
  },
  bill_of_lading: {
    file_name: "No file selected",
    parsed_fields: {},
    text_excerpt: "Bill of lading text preview will appear here after analysis.",
  },
};

export default function DocumentInsights({ documents }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Document Intelligence</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Parsed Field Review</h2>
        </div>
        <FileText className="h-5 w-5 text-slate-400" />
      </div>

      <div className="grid gap-4 2xl:grid-cols-3">
        {documentFields.map((field) => {
          const document = documents[field.key] || defaultDocumentInsights[field.key];
          const fieldEntries = Object.entries(document.parsed_fields || {}).filter(
            ([key, value]) => key !== "document_type" && value !== null && value !== "",
          );

          return (
            <article key={field.key} className="min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/80 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{field.label}</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-900">{document.file_name}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Extracted
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {fieldEntries.length ? (
                  fieldEntries.slice(0, 6).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{key.replace(/_/g, " ")}</span>
                      <span className="text-right text-sm text-slate-800">{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">No fields parsed yet.</div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Text excerpt</p>
                <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-slate-700">{document.text_excerpt}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
