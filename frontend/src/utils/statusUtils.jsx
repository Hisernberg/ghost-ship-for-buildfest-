import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export function statusColor(status) {
  if (status === "Cleared") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Flagged" || status === "Rejected") return "bg-red-100 text-red-700 border-red-200";
  if (status === "Under Review") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export function StatusIcon({ status }) {
  if (status === "Cleared") return <CheckCircle className="h-3.5 w-3.5" />;
  if (status === "Flagged" || status === "Rejected") return <AlertCircle className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
}
