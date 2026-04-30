import { UserCircle2 } from "lucide-react";

export default function OfficerProfilePanel({ profile, form, onChange, onPhotoChange, onSave, saving, saveMessage }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Officer Account</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Customs Officer Profile</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Maintain the operator identity shown in the GhostShip navbar and keep the duty assignment current for audit visibility.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-slate-200 text-slate-500">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-10 w-10" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-950">{profile.full_name}</p>
            <p className="truncate text-sm text-slate-600">{profile.role_title}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{profile.badge_id}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Full Name</span>
          <input 
            className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none" 
            value={form.full_name} 
            onChange={(e) => onChange("full_name", e.target.value)} 
          />
        </label>
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Role Title</span>
          <input 
            className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none" 
            value={form.role_title} 
            onChange={(e) => onChange("role_title", e.target.value)} 
          />
        </label>
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Badge ID</span>
          <input 
            className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none" 
            value={form.badge_id} 
            onChange={(e) => onChange("badge_id", e.target.value)} 
          />
        </label>
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Email</span>
          <input 
            className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none" 
            value={form.email} 
            onChange={(e) => onChange("email", e.target.value)} 
          />
        </label>
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Terminal</span>
          <input 
            className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none" 
            value={form.terminal} 
            onChange={(e) => onChange("terminal", e.target.value)} 
          />
        </label>
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Shift</span>
          <input 
            className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none" 
            value={form.shift_name} 
            onChange={(e) => onChange("shift_name", e.target.value)} 
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white xl:w-auto">
          <input 
            type="file" 
            accept=".png,.jpg,.jpeg,.webp" 
            className="hidden" 
            onChange={(e) => onPhotoChange(e.target.files?.[0] || null)} 
          />
          Upload Officer Photo
        </label>
        <div className="flex flex-col gap-3 xl:items-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? "Saving Profile..." : "Save Officer Profile"}
          </button>
          {saveMessage ? <p className="text-sm text-slate-600">{saveMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
