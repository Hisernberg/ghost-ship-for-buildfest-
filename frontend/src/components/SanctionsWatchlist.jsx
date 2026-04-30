import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Shield,
  Globe,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
} from "lucide-react";
import { apiFetch } from "../utils/api";

const riskTierStyles = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

const policyLevelStyles = {
  Blacklisted: "bg-red-100 text-red-700 border-red-200",
  "Inspection First": "bg-amber-100 text-amber-700 border-amber-200",
  Watchlist: "bg-sky-100 text-sky-700 border-sky-200",
};

const emptyForm = {
  name: "",
  country: "",
  authority: "",
  dateAdded: new Date().toISOString().split("T")[0],
  riskTier: "Medium",
  policyLevel: "Watchlist",
  category: "",
  reason: "",
};

export default function SanctionsWatchlist() {
  const [entities, setEntities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    async function loadWatchlist() {
      try {
        const response = await apiFetch("/api/sanctions-watchlist");
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.message || "Could not load watchlist");
        }
        setEntities(payload.entities || []);
      } catch (err) {
        setMessage(err.message || "Could not load watchlist");
      } finally {
        setLoading(false);
      }
    }

    loadWatchlist();
  }, []);

  const filteredEntities = useMemo(
    () =>
      entities.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.authority.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.policyLevel.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [entities, searchTerm],
  );

  const isEditing = isAdding || editingId !== null;

  function handleAdd() {
    setIsAdding(true);
    setEditingId(null);
    setDeleteTargetId(null);
    setFormData(emptyForm);
    setMessage("");
  }

  function handleEdit(entity) {
    setEditingId(entity.id);
    setIsAdding(false);
    setDeleteTargetId(null);
    setFormData({ ...entity });
    setMessage("");
  }

  function handleCancel() {
    setIsAdding(false);
    setEditingId(null);
    setDeleteTargetId(null);
    setFormData(emptyForm);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      setMessage("Entity name is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const endpoint = isAdding ? "/api/sanctions-watchlist" : `/api/sanctions-watchlist/${editingId}`;
      const method = isAdding ? "POST" : "PUT";
      const response = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Could not save sanctions entity");
      }

      if (isAdding) {
        setEntities((current) => [payload.entity, ...current]);
        setMessage("Entity added to watchlist.");
      } else {
        setEntities((current) => current.map((entity) => (entity.id === payload.entity.id ? payload.entity : entity)));
        setMessage("Entity updated.");
      }

      handleCancel();
    } catch (err) {
      setMessage(err.message || "Could not save sanctions entity");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entityId) {
    setSaving(true);
    setMessage("");
    try {
      const response = await apiFetch(`/api/sanctions-watchlist/${entityId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Could not remove entity");
      }
      setEntities((current) => current.filter((entity) => entity.id !== entityId));
      setDeleteTargetId(null);
      setMessage("Entity removed from watchlist.");
    } catch (err) {
      setMessage(err.message || "Could not remove entity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Sanctions Watchlist</h3>
            <p className="text-sm text-slate-500">Persisted entity rules that can force watchlist review, inspection-first handling, or full blacklist escalation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">{entities.length} Entities</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={isEditing || saving}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Entity
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by entity, country, authority, category, or policy..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          {message}
        </div>
      ) : null}

      {isEditing ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-4 text-sm font-semibold text-slate-900">
            {isAdding ? "Add New Sanctioned Entity" : "Edit Entity"}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Entity Name *">
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Company or entity name"
              />
            </Field>
            <Field label="Country">
              <input
                type="text"
                value={formData.country}
                onChange={(event) => setFormData({ ...formData, country: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="e.g. Russia, China"
              />
            </Field>
            <Field label="Category">
              <input
                type="text"
                value={formData.category}
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="e.g. Shipping, Technology"
              />
            </Field>
            <Field label="Authority">
              <input
                type="text"
                value={formData.authority}
                onChange={(event) => setFormData({ ...formData, authority: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="e.g. OFAC, UN"
              />
            </Field>
            <Field label="Date Added">
              <input
                type="date"
                value={formData.dateAdded}
                onChange={(event) => setFormData({ ...formData, dateAdded: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </Field>
            <Field label="Risk Tier">
              <select
                value={formData.riskTier}
                onChange={(event) => setFormData({ ...formData, riskTier: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </Field>
            <Field label="Enforcement Policy">
              <select
                value={formData.policyLevel}
                onChange={(event) => setFormData({ ...formData, policyLevel: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="Watchlist">Watchlist</option>
                <option value="Inspection First">Inspection First</option>
                <option value="Blacklisted">Blacklisted</option>
              </select>
            </Field>
            <Field label="Reason for Sanction" spanAll>
              <input
                type="text"
                value={formData.reason}
                onChange={(event) => setFormData({ ...formData, reason: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Brief description of sanction reason"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-sm text-slate-500">
              <th className="pb-3 font-medium">Entity Name</th>
              <th className="pb-3 font-medium">Country</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Authority</th>
              <th className="pb-3 font-medium">Added</th>
              <th className="pb-3 font-medium">Policy</th>
              <th className="pb-3 font-medium">Risk</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-500">Loading watchlist...</td>
              </tr>
            ) : filteredEntities.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-500">No entities match your search</td>
              </tr>
            ) : (
              filteredEntities.map((entity) => (
                <tr key={entity.id} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-slate-900">{entity.name}</p>
                      <p className="text-xs text-slate-500">{entity.reason}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700">{entity.country}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{entity.category}</td>
                  <td className="py-3 pr-4">
                    <span className="font-medium text-slate-700">{entity.authority}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {entity.dateAdded}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${policyLevelStyles[entity.policyLevel] || policyLevelStyles.Watchlist}`}>
                      {entity.policyLevel}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${riskTierStyles[entity.riskTier]}`}>
                      {entity.riskTier}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {deleteTargetId === entity.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDeleteTargetId(null)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(entity.id)}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(entity)}
                          disabled={isEditing || saving}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(entity.id)}
                          disabled={isEditing || saving}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Port Officer Guidance:</strong> Policy levels are now active. `Watchlist` raises the shipment for review, `Inspection First` pushes it into inspection, and `Blacklisted` forces the highest escalation path when the shipment company matches.
      </div>
    </div>
  );
}

function Field({ label, children, spanAll = false }) {
  return (
    <div className={spanAll ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
