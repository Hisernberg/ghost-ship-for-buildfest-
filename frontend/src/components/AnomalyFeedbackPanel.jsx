import { useState } from "react";
import { AlertCircle, Edit2, History, X, Check, MessageSquare, User, Clock } from "lucide-react";
import { severityTone } from "../utils/formatters";

const riskOptions = [
  { value: "CRITICAL", label: "Critical (Red)", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "HIGH", label: "High (Red)", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "MEDIUM", label: "Medium (Yellow)", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "LOW", label: "Low (Green)", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "CLEARED", label: "Cleared (Green)", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

export default function AnomalyFeedbackPanel({ 
  anomalies, 
  feedbackOverrides, 
  onApplyOverride, 
  officerName = "Inspector" 
}) {
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [newSeverity, setNewSeverity] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const handleOpenFeedback = (anomaly) => {
    setSelectedAnomaly(anomaly);
    const existing = feedbackOverrides[anomaly.id];
    setNewSeverity(existing?.newSeverity || anomaly.severity);
    setFeedbackNote(existing?.note || "");
  };

  const handleClose = () => {
    setSelectedAnomaly(null);
    setNewSeverity("");
    setFeedbackNote("");
  };

  const handleSubmit = () => {
    if (!selectedAnomaly || !newSeverity) return;
    
    onApplyOverride({
      anomalyId: selectedAnomaly.id,
      originalSeverity: selectedAnomaly.severity,
      newSeverity,
      note: feedbackNote,
      officer: officerName,
      timestamp: new Date().toISOString(),
    });
    
    handleClose();
  };

  const getEffectiveSeverity = (anomaly) => {
    const override = feedbackOverrides[anomaly.id];
    return override ? override.newSeverity : anomaly.severity;
  };

  const getOverrideBadge = (anomaly) => {
    const override = feedbackOverrides[anomaly.id];
    if (!override) return null;
    
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
        <Edit2 className="h-3 w-3" />
        Modified
      </span>
    );
  };

  const allFeedbackHistory = Object.values(feedbackOverrides).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Anomaly Feedback Loop</h3>
            <p className="text-sm text-slate-500">Override risk flags with inspector notes</p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <History className="h-4 w-4" />
          {showHistory ? "Hide History" : `History (${allFeedbackHistory.length})`}
        </button>
      </div>

      {/* Feedback History Panel */}
      {showHistory && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Recent Overrides</h4>
          {allFeedbackHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No overrides yet</p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {allFeedbackHistory.map((feedback, idx) => (
                <div key={idx} className="rounded-lg bg-white p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {feedback.anomalyType || `Anomaly #${feedback.anomalyId.slice(-4)}`}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(feedback.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className={`rounded px-1.5 py-0.5 ${severityTone(feedback.originalSeverity)}`}>
                      {feedback.originalSeverity}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className={`rounded px-1.5 py-0.5 ${severityTone(feedback.newSeverity)}`}>
                      {feedback.newSeverity}
                    </span>
                  </div>
                  {feedback.note && (
                    <p className="mt-1 text-xs text-slate-500">"{feedback.note}"</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">by {feedback.officer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Anomalies List with Override Option */}
      <div className="space-y-2">
        {anomalies.map((anomaly, idx) => {
          const effectiveSeverity = getEffectiveSeverity(anomaly);
          const isOverridden = !!feedbackOverrides[anomaly.id];
          
          return (
            <div
              key={anomaly.id || idx}
              className={`rounded-xl border p-3 transition ${
                isOverridden 
                  ? "border-blue-200 bg-blue-50/30" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${severityTone(effectiveSeverity)}`}>
                      {effectiveSeverity}
                    </span>
                    {getOverrideBadge(anomaly)}
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">{anomaly.type}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5">
                      {anomaly.engine || "DOC"}
                    </span>
                    <span>{anomaly.timestamp}</span>
                    <span>Status: {anomaly.status}</span>
                  </div>
                  {isOverridden && feedbackOverrides[anomaly.id]?.note && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{feedbackOverrides[anomaly.id].note}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleOpenFeedback(anomaly)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title="Override risk assessment"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">Override Risk Assessment</h4>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">Anomaly</p>
              <p className="text-sm font-medium text-slate-900">{selectedAnomaly.type}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">Original:</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityTone(selectedAnomaly.severity)}`}>
                  {selectedAnomaly.severity}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Risk Level
              </label>
              <div className="grid grid-cols-1 gap-2">
                {riskOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setNewSeverity(option.value)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                      newSeverity === option.value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span>{option.label}</span>
                    {newSeverity === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Feedback Note
              </label>
              <textarea
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="Explain why you're overriding the risk assessment..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <User className="h-4 w-4 shrink-0" />
              <span>This override will be logged under your badge: <strong>{officerName}</strong></span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newSeverity || newSeverity === selectedAnomaly.severity}
                className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
