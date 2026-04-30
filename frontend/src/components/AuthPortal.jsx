import { useState } from "react";
import { LogIn, Moon, ShieldCheck, Sun, UserPlus, Ship, Anchor } from "lucide-react";
import { apiFetch } from "../utils/api";
import { useDarkMode } from "../hooks/useDarkMode";

const emptyOfficerRegister = {
  user_id: "",
  password: "",
  full_name: "",
  email: "",
  phone: "",
  role_title: "Customs Manager",
  badge_id: "",
  department: "Customs Risk Office",
  terminal: "",
  shift_name: "",
};

const emptyShipperRegister = {
  user_id: "",
  password: "",
  full_name: "",
  company_name: "",
  email: "",
  phone: "",
};

const SHIPPER_DEMO_ACCOUNT = {
  user_id: "3361",
  password: "3361",
};

const OFFICER_DEMO_ACCOUNT = {
  user_id: "manager01",
  password: "manager123",
};

export default function AuthPortal({ onLoginSuccess }) {
  const [dark, setDark] = useDarkMode();
  const [role, setRole] = useState(null); // null = pick screen, 'officer' | 'shipper'
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [loginForm, setLoginForm] = useState({ user_id: "", password: "" });
  const [officerForm, setOfficerForm] = useState(emptyOfficerRegister);
  const [shipperForm, setShipperForm] = useState(emptyShipperRegister);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function resetMessage() { setMessage(""); }

  // Fallback: try API first, fall back to local demo accounts if backend is old/offline
  const DEMO_ACCOUNTS = {
    officer: { user_id: "manager01", password: "manager123", full_name: "Pawan Kumar", role_title: "Customs Manager", badge_id: "CM-4172", email: "pawan.kumar@ghostship.local", terminal: "Terminal 4", shift_name: "Morning Shift", department: "Customs Risk Office", phone: "" },
  };

  async function handleLogin() {
    setLoading(true);
    resetMessage();
    const endpoint = role === "officer" ? "/api/auth/login" : "/api/shipper/login";
    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Login failed");
      onLoginSuccess({ ...data.user, user_type: role });
    } catch (err) {
      // Backend not updated yet — fall back to local accounts
      if (role === "officer") {
        const demo = DEMO_ACCOUNTS.officer;
        if (loginForm.user_id === demo.user_id && loginForm.password === demo.password) {
          onLoginSuccess({ ...demo, user_type: "officer" });
          setLoading(false);
          return;
        }
      }
      if (role === "shipper") {
        try {
          const stored = localStorage.getItem(`ghostship-shipper-${loginForm.user_id}`);
          if (stored) {
            const acc = JSON.parse(stored);
            if (acc.password === loginForm.password) {
              onLoginSuccess({ ...acc, user_type: "shipper" });
              setLoading(false);
              return;
            }
          }
        } catch {}
      }
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOfficerRegister() {
    setLoading(true);
    resetMessage();
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(officerForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Registration failed");
      setMode("login");
      setLoginForm({ user_id: officerForm.user_id, password: officerForm.password });
      setMessage("Registration complete. Sign in with your new credentials.");
      setOfficerForm(emptyOfficerRegister);
    } catch (err) {
      setMessage(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleShipperRegister() {
    setLoading(true);
    resetMessage();
    try {
      const res = await apiFetch("/api/shipper/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipperForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Registration failed");
      setMode("login");
      setLoginForm({ user_id: shipperForm.user_id, password: shipperForm.password });
      setMessage("Registration complete. Sign in with your new credentials.");
      setShipperForm(emptyShipperRegister);
    } catch (err) {
      // Backend not updated yet — store shipper locally for this session
      if (err.message === "Endpoint not found" || err.message.includes("404") || err.message.includes("not found")) {
        const newShipper = {
          user_id: shipperForm.user_id,
          full_name: shipperForm.full_name,
          company_name: shipperForm.company_name,
          email: shipperForm.email,
          phone: shipperForm.phone,
        };
        try { localStorage.setItem(`ghostship-shipper-${shipperForm.user_id}`, JSON.stringify({ ...newShipper, password: shipperForm.password })); } catch {}
        setMode("login");
        setLoginForm({ user_id: shipperForm.user_id, password: shipperForm.password });
        setMessage("Account created (local session). Sign in to continue.");
        setShipperForm(emptyShipperRegister);
      } else {
        setMessage(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Role Picker ─────────────────────────────────────────────────────────
  if (!role) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
        {/* Dark mode toggle */}
        <div className="absolute right-5 top-5">
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-[1.02] hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <main className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-5 py-10 sm:px-6 lg:px-8">
          <section className="w-full max-w-[900px]">
            {/* Brand */}
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-sm font-bold tracking-[0.2em] text-white dark:bg-slate-700">
                GS
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">GhostShip</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">Port Intelligence System</h1>
              <p className="mt-3 text-base text-slate-500 dark:text-slate-400">Select how you are accessing the system</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Shipper card */}
              <button
                type="button"
                onClick={() => { setRole("shipper"); setMode("login"); resetMessage(); }}
                className="group rounded-3xl border-2 border-slate-200 bg-white px-8 py-9 text-left shadow-sm transition hover:border-slate-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-900/50">
                  <Ship className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">I am a Shipper</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Submit your vessel details and supporting documents for customs clearance review.
                </p>
                <span className="mt-5 inline-block rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-slate-700 dark:bg-slate-700 dark:group-hover:bg-slate-600">
                  Shipper Login →
                </span>
              </button>

              {/* Officer card — glowing, pulsing call-to-action */}
              <div className="relative">
                {/* Animated glow ring behind the card */}
                <div className="absolute -inset-[3px] animate-pulse rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 opacity-75 blur-sm" />
                <button
                  type="button"
                  onClick={() => { setRole("officer"); setMode("login"); resetMessage(); }}
                  className="group relative w-full rounded-3xl border-2 border-amber-400 bg-white px-8 py-9 text-left shadow-lg transition hover:shadow-xl dark:border-amber-500 dark:bg-slate-900"
                >
                  {/* "Click me" badge */}
                  <span className="absolute -right-3 -top-3 animate-bounce rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900 shadow-lg">
                    ✦ Click me
                  </span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:group-hover:bg-amber-900/50">
                    <Anchor className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">I am a Customs Officer</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Review incoming shipments, run risk analysis, manage the audit queue and inspection pipeline.
                  </p>
                  <span className="mt-5 inline-block rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow transition group-hover:bg-amber-600">
                    Officer Login →
                  </span>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ── Login / Register ──────────────────────────────────────────────────────
  const isOfficer = role === "officer";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Dark mode toggle */}
      <div className="absolute right-5 top-5 z-10">
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-[1.02] hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
      <main className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-5 py-10 sm:px-6 lg:px-8">
        <section className="grid w-full max-w-[1280px] gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(540px,0.85fr)]">

          {/* Left panel */}
          <div className="rounded-[32px] border border-slate-200 bg-white px-7 py-8 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-sm font-bold tracking-[0.2em] text-white">
                GS
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">GhostShip</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Port Intelligence System</h1>
              </div>
            </div>

            <div className="mt-8">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold
                ${isOfficer ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                {isOfficer ? <Anchor className="h-3.5 w-3.5" /> : <Ship className="h-3.5 w-3.5" />}
                {isOfficer ? "Customs Officer Access" : "Shipper Access"}
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {isOfficer ? "Secure the floor before opening the dashboard" : "Submit your vessel for inspection"}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400">
                {isOfficer
                  ? "Sign in as a customs officer to access risk analysis, incoming shipper submissions, audit queue, and monitoring tools."
                  : "Sign in or register to submit your ship number and supporting documents for customs clearance."}
              </p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {isOfficer ? (
                <>
                  <FeatureCard title="Inspection Oversight" body="Manage active reviews, audit ownership, and terminal activity from one desk." />
                  <FeatureCard title="Risk Operations" body="Run AI-powered risk scoring on shipper-submitted documents instantly." />
                  <FeatureCard title="Incoming Queue" body="Review all shipper submissions and load any ship's documents into the analysis engine." />
                </>
              ) : (
                <>
                  <FeatureCard title="Submit Documents" body="Upload invoices, packing lists, BOLs or any custom documents for your vessel." />
                  <FeatureCard title="Track Status" body="See whether your submission is pending, under review, or cleared in real time." />
                  <FeatureCard title="Any Format" body="PDF, TXT, images — upload whatever you have and let customs do the rest." />
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setRole(null); resetMessage(); }}
              className="mt-6 text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 transition dark:text-slate-500 dark:hover:text-slate-300"
            >
              ← Back to role selection
            </button>
          </div>

          {/* Right panel — forms */}
          <div className="rounded-[32px] border border-slate-200 bg-white px-7 py-8 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900">
            <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => { setMode("login"); resetMessage(); }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "login" ? "bg-slate-900 text-white dark:bg-slate-600" : "text-slate-600 dark:text-slate-400"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); resetMessage(); }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "register" ? "bg-slate-900 text-white dark:bg-slate-600" : "text-slate-600 dark:text-slate-400"}`}
              >
                Register
              </button>
            </div>

            {mode === "login" && (
              <div className="mt-6 space-y-4">
                <Header
                  icon={isOfficer ? ShieldCheck : LogIn}
                  title={isOfficer ? "Officer Login" : "Shipper Login"}
                  subtitle={isOfficer ? "Enter your officer credentials to access the full dashboard." : "Enter your shipper credentials to submit vessels for inspection."}
                />
                {isOfficer && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                    <span className="font-semibold">Demo officer login:</span> Username `manager01` and password `manager123`.
                  </div>
                )}
                {!isOfficer && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <span className="font-semibold">Demo shipper login:</span> Username `3361` and password `3361`.
                  </div>
                )}
                <Field label="User ID">
                  <input
                    value={loginForm.user_id}
                    onChange={(e) => setLoginForm((c) => ({ ...c, user_id: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                    placeholder={isOfficer ? OFFICER_DEMO_ACCOUNT.user_id : SHIPPER_DEMO_ACCOUNT.user_id}
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((c) => ({ ...c, password: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    placeholder={isOfficer ? OFFICER_DEMO_ACCOUNT.password : SHIPPER_DEMO_ACCOUNT.password}
                  />
                </Field>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Signing In…" : isOfficer ? "Enter Dashboard" : "Enter Shipper Portal"}
                </button>
              </div>
            )}

            {mode === "register" && isOfficer && (
              <div className="mt-6 space-y-4">
                <Header icon={UserPlus} title="Register Customs Officer" subtitle="Create an officer account to access the operations dashboard." />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full Name"><Input value={officerForm.full_name} onChange={(v) => setOfficerForm((c) => ({ ...c, full_name: v }))} placeholder="Pawan Kumar" /></Field>
                  <Field label="User ID"><Input value={officerForm.user_id} onChange={(v) => setOfficerForm((c) => ({ ...c, user_id: v }))} placeholder="manager01" /></Field>
                  <Field label="Password"><Input type="password" value={officerForm.password} onChange={(v) => setOfficerForm((c) => ({ ...c, password: v }))} placeholder="Create password" /></Field>
                  <Field label="Email"><Input value={officerForm.email} onChange={(v) => setOfficerForm((c) => ({ ...c, email: v }))} placeholder="officer@port.local" /></Field>
                  <Field label="Phone"><Input value={officerForm.phone} onChange={(v) => setOfficerForm((c) => ({ ...c, phone: v }))} placeholder="+91 99999 99999" /></Field>
                  <Field label="Badge ID"><Input value={officerForm.badge_id} onChange={(v) => setOfficerForm((c) => ({ ...c, badge_id: v }))} placeholder="CM-4172" /></Field>
                  <Field label="Role Title"><Input value={officerForm.role_title} onChange={(v) => setOfficerForm((c) => ({ ...c, role_title: v }))} placeholder="Customs Manager" /></Field>
                  <Field label="Department"><Input value={officerForm.department} onChange={(v) => setOfficerForm((c) => ({ ...c, department: v }))} placeholder="Customs Risk Office" /></Field>
                  <Field label="Terminal"><Input value={officerForm.terminal} onChange={(v) => setOfficerForm((c) => ({ ...c, terminal: v }))} placeholder="Terminal 4" /></Field>
                  <Field label="Shift"><Input value={officerForm.shift_name} onChange={(v) => setOfficerForm((c) => ({ ...c, shift_name: v }))} placeholder="Morning Shift" /></Field>
                </div>
                <button
                  type="button"
                  onClick={handleOfficerRegister}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Registering…" : "Create Officer Account"}
                </button>
              </div>
            )}

            {mode === "register" && !isOfficer && (
              <div className="mt-6 space-y-4">
                <Header icon={UserPlus} title="Register as Shipper" subtitle="Create an account to submit vessels and track clearance status." />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full Name"><Input value={shipperForm.full_name} onChange={(v) => setShipperForm((c) => ({ ...c, full_name: v }))} placeholder="John Smith" /></Field>
                  <Field label="User ID"><Input value={shipperForm.user_id} onChange={(v) => setShipperForm((c) => ({ ...c, user_id: v }))} placeholder="shipper01" /></Field>
                  <Field label="Password"><Input type="password" value={shipperForm.password} onChange={(v) => setShipperForm((c) => ({ ...c, password: v }))} placeholder="Create password" /></Field>
                  <Field label="Company Name"><Input value={shipperForm.company_name} onChange={(v) => setShipperForm((c) => ({ ...c, company_name: v }))} placeholder="Acme Shipping Co." /></Field>
                  <Field label="Email"><Input value={shipperForm.email} onChange={(v) => setShipperForm((c) => ({ ...c, email: v }))} placeholder="john@acmeshipping.com" /></Field>
                  <Field label="Phone"><Input value={shipperForm.phone} onChange={(v) => setShipperForm((c) => ({ ...c, phone: v }))} placeholder="+91 99999 99999" /></Field>
                </div>
                <button
                  type="button"
                  onClick={handleShipperRegister}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Registering…" : "Create Shipper Account"}
                </button>
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {message}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Header({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-500"
      placeholder={placeholder}
    />
  );
}

function FeatureCard({ title, body }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{body}</p>
    </div>
  );
}
