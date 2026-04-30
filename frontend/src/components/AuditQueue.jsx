import { useMemo, useState } from "react";
import { Clock3, Plus, Save, Trash2 } from "lucide-react";
import { severityTone } from "../utils/formatters";

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const emptyDraft = {
  shipmentId: "",
  stage: "Pending Review",
  owner: "",
  eta: "",
  priority: "MEDIUM",
  notes: "",
};

export default function AuditQueue({
  rows,
  onCreateRow,
  onUpdateRow,
  onDeleteRow,
  saving,
  message,
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const counts = useMemo(
    () => ({
      open: rows.filter((row) => row.stage !== "Cleared").length,
      cleared: rows.filter((row) => row.stage === "Cleared").length,
    }),
    [rows],
  );

  async function handleCreate() {
    if (!draft.shipmentId.trim() || !draft.owner.trim() || !draft.eta.trim()) return;
    await onCreateRow(draft);
    setDraft(emptyDraft);
  }

  async function handleFieldUpdate(row, key, value) {
    await onUpdateRow({ ...row, [key]: value });
    setEditingId(null);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Audit Queue</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Escalation Workflow</h2>
        </div>
        <Clock3 className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Open Cases</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.open}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cleared</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.cleared}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Queue State</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{saving ? "Saving changes..." : "Synced to backend"}</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Create Audit Case</h3>
        </div>
        <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_auto]">
          <input
            value={draft.shipmentId}
            onChange={(event) => setDraft((current) => ({ ...current, shipmentId: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            placeholder="Shipment or container ID"
          />
          <input
            value={draft.owner}
            onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            placeholder="Owner"
          />
          <input
            value={draft.eta}
            onChange={(event) => setDraft((current) => ({ ...current, eta: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            placeholder="ETA"
          />
          <select
            value={draft.stage}
            onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            <option>Pending Review</option>
            <option>Secondary Inspection</option>
            <option>Full Inspection</option>
            <option>Cleared</option>
          </select>
          <select
            value={draft.priority}
            onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Add
          </button>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id ?? row.shipmentId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{row.shipmentId}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-950">{row.stage}</span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${severityTone(row.priority)}`}>
                    {row.priority}
                  </span>
                </div>
                {row.notes ? <p className="mt-2 text-sm text-slate-600">{row.notes}</p> : null}
              </div>

              <div className="grid gap-3 md:grid-cols-4 xl:min-w-[760px]">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Stage
                  <select
                    value={row.stage}
                    onFocus={() => setEditingId(row.id)}
                    onChange={(event) => handleFieldUpdate(row, "stage", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-slate-400"
                  >
                    <option>Pending Review</option>
                    <option>Secondary Inspection</option>
                    <option>Full Inspection</option>
                    <option>Cleared</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Owner
                  <input
                    defaultValue={row.owner}
                    onFocus={() => setEditingId(row.id)}
                    onBlur={(event) => {
                      if (event.target.value !== row.owner) {
                        handleFieldUpdate(row, "owner", event.target.value);
                      } else {
                        setEditingId(null);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  ETA
                  <input
                    defaultValue={row.eta}
                    onFocus={() => setEditingId(row.id)}
                    onBlur={(event) => {
                      if (event.target.value !== row.eta) {
                        handleFieldUpdate(row, "eta", event.target.value);
                      } else {
                        setEditingId(null);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <select
                    value={row.priority}
                    onFocus={() => setEditingId(row.id)}
                    onChange={(event) => handleFieldUpdate(row, "priority", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(row.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    title="Remove case"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {editingId === row.id ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <Save className="h-3.5 w-3.5" />
                Changes saved to queue
              </div>
            ) : null}

            {deleteTargetId === row.id ? (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-medium text-red-700">Remove this audit case from the queue?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(null)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteRow(row.id);
                      setDeleteTargetId(null);
                    }}
                    className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                  >
                    Confirm Remove
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No audit cases yet. Create one above to seed the inspection queue.
          </div>
        ) : null}
      </div>
    </section>
  );
}
