import { useEffect, useMemo, useState } from "react";
import { Globe, MapPin, Clock, Ship, BarChart3, CheckCircle, Flag, Save, RotateCcw, Edit3, History, AlertCircle } from "lucide-react";

const WORLD_MAP_BG = "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";

const LOCATIONS = {
  USA: { x: 180, y: 150, risk: 20, region: "North America" },
  Canada: { x: 150, y: 100, risk: 15, region: "North America" },
  Mexico: { x: 200, y: 210, risk: 35, region: "North America" },
  Brazil: { x: 270, y: 310, risk: 42, region: "South America" },
  Venezuela: { x: 260, y: 250, risk: 75, region: "South America" },
  UK: { x: 445, y: 95, risk: 15, region: "Europe" },
  Germany: { x: 485, y: 105, risk: 12, region: "Europe" },
  Netherlands: { x: 465, y: 100, risk: 10, region: "Europe" },
  Ukraine: { x: 540, y: 120, risk: 65, region: "Europe" },
  Russia: { x: 700, y: 80, risk: 60, region: "Eurasia" },
  Turkey: { x: 530, y: 155, risk: 40, region: "Middle East" },
  Syria: { x: 540, y: 185, risk: 90, region: "Middle East" },
  Iran: { x: 590, y: 190, risk: 85, region: "Middle East" },
  UAE: { x: 575, y: 215, risk: 35, region: "Middle East" },
  Yemen: { x: 565, y: 245, risk: 85, region: "Middle East" },
  Egypt: { x: 520, y: 200, risk: 45, region: "Africa" },
  Libya: { x: 490, y: 215, risk: 70, region: "Africa" },
  Nigeria: { x: 470, y: 255, risk: 55, region: "Africa" },
  Kenya: { x: 540, y: 280, risk: 52, region: "Africa" },
  Somalia: { x: 565, y: 265, risk: 85, region: "Africa" },
  SouthAfrica: { x: 500, y: 375, risk: 45, region: "Africa", label: "South Africa" },
  India: { x: 640, y: 230, risk: 40, region: "South Asia" },
  Pakistan: { x: 605, y: 205, risk: 48, region: "South Asia" },
  Bangladesh: { x: 695, y: 225, risk: 45, region: "South Asia" },
  SriLanka: { x: 650, y: 270, risk: 35, region: "South Asia", label: "Sri Lanka" },
  Afghanistan: { x: 600, y: 200, risk: 85, region: "South Asia" },
  China: { x: 780, y: 180, risk: 45, region: "East Asia" },
  HongKong: { x: 765, y: 220, risk: 20, region: "East Asia", label: "Hong Kong" },
  Taiwan: { x: 795, y: 215, risk: 25, region: "East Asia" },
  Japan: { x: 835, y: 165, risk: 18, region: "East Asia" },
  SouthKorea: { x: 810, y: 170, risk: 20, region: "East Asia", label: "South Korea" },
  NorthKorea: { x: 805, y: 160, risk: 95, region: "East Asia", label: "North Korea" },
  Thailand: { x: 720, y: 235, risk: 38, region: "Southeast Asia" },
  Vietnam: { x: 750, y: 240, risk: 40, region: "Southeast Asia" },
  Malaysia: { x: 735, y: 275, risk: 35, region: "Southeast Asia" },
  Singapore: { x: 745, y: 285, risk: 15, region: "Southeast Asia" },
  Indonesia: { x: 760, y: 310, risk: 42, region: "Southeast Asia" },
  Philippines: { x: 790, y: 235, risk: 35, region: "Southeast Asia" },
  Australia: { x: 850, y: 380, risk: 25, region: "Oceania" },
};

const TRADE_ROUTES = [
  ["USA", "Germany"],
  ["USA", "Japan"],
  ["Brazil", "China"],
  ["Egypt", "India"],
  ["India", "Singapore"],
  ["India", "UAE"],
  ["China", "USA"],
  ["China", "Singapore"],
  ["China", "Germany"],
  ["China", "Australia"],
  ["Vietnam", "USA"],
  ["Singapore", "Netherlands"],
  ["UAE", "Germany"],
  ["Russia", "China"],
  ["SouthKorea", "USA"],
];

const getRiskColor = (risk) => {
  if (risk >= 70) return "#ef4444";
  if (risk >= 40) return "#f59e0b";
  return "#22c55e";
};

function normalizeKey(name) {
  return String(name || "").replace(/\s+/g, "");
}

function getLocationData(name, overrides = {}) {
  const key = normalizeKey(name);
  const base = LOCATIONS[key] || { x: 500, y: 250, risk: 50, region: "Unknown" };
  const lng = (base.x / 1000) * 360 - 180;
  const lat = 90 - (base.y / 500) * 180;
  return {
    name: base.label || name || "Unknown",
    x: base.x,
    y: base.y,
    risk: overrides[key]?.risk ?? base.risk,
    region: base.region,
    lat,
    lng,
    key,
  };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function buildRouteReasons(originData, destData, routeRisk) {
  const reasons = [];
  reasons.push({
    title: "Origin profile",
    body:
      originData.risk >= 70
        ? `${originData.name} is currently treated as a high-risk origin zone.`
        : `${originData.name} is within a lower-risk export corridor, but still contributes to route scoring.`,
  });
  reasons.push({
    title: "Destination profile",
    body:
      destData.risk >= 70
        ? `${destData.name} carries elevated destination risk, increasing inspection likelihood on arrival.`
        : `${destData.name} is not a top-risk destination, so destination risk pressure is moderate.`,
  });
  reasons.push({
    title: "Corridor spread",
    body:
      Math.abs(originData.risk - destData.risk) >= 25
        ? "The risk difference between origin and destination suggests an unusual corridor that merits review."
        : "Origin and destination sit in a fairly consistent corridor, reducing abrupt route variance.",
  });
  reasons.push({
    title: "Route conclusion",
    body:
      routeRisk >= 70
        ? "This lane should be treated as inspection-first until the declaration story is confirmed."
        : routeRisk >= 40
          ? "This lane supports a secondary review posture with document validation before release."
          : "This lane appears operationally stable and better suited for standard monitoring.",
  });
  return reasons;
}

export default function RouteIntelligence({ origin, destination }) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showAllRoutes, setShowAllRoutes] = useState(true);
  const [riskOverrides, setRiskOverrides] = useState({});
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [proposedRisk, setProposedRisk] = useState(null);

  const originData = useMemo(() => getLocationData(origin, riskOverrides), [origin, riskOverrides]);
  const destData = useMemo(() => getLocationData(destination, riskOverrides), [destination, riskOverrides]);

  const routeMetrics = useMemo(() => {
    const distance = haversineKm(originData, destData);
    const routeRisk = Math.round(
      originData.risk * 0.3 + destData.risk * 0.4 + Math.abs(originData.risk - destData.risk) * 0.3,
    );
    return {
      distance,
      routeRisk,
      seaDays: Math.max(1, Math.round(distance / 800)),
    };
  }, [originData, destData]);

  const routeReasons = useMemo(
    () => buildRouteReasons(originData, destData, routeMetrics.routeRisk),
    [destData, originData, routeMetrics.routeRisk],
  );

  useEffect(() => {
    const interval = setInterval(() => setAnimationPhase((current) => (current + 1) % 200), 50);
    return () => clearInterval(interval);
  }, []);

  function submitRiskFeedback() {
    if (!selectedCountry || proposedRisk === null) return;

    const countryKey = normalizeKey(selectedCountry);
    const oldRisk = LOCATIONS[countryKey]?.risk || 50;
    const newFeedback = {
      id: Date.now(),
      country: selectedCountry,
      oldRisk,
      newRisk: proposedRisk,
      note: feedbackNote,
      timestamp: new Date().toISOString(),
    };

    setFeedbackHistory((current) => [newFeedback, ...current]);
    setRiskOverrides((current) => ({ ...current, [countryKey]: { risk: proposedRisk } }));
    setFeedbackNote("");
    setProposedRisk(null);
    setShowFeedbackPanel(false);
  }

  function resetRisk(country) {
    const key = normalizeKey(country);
    setRiskOverrides((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-4 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-300" />
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-300">Global Maritime Intelligence</p>
              <h2 className="text-xl font-bold">World Route Network with Feedback Loop</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFeedbackPanel((current) => !current)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 transition hover:bg-blue-500"
            >
              <Flag className="h-4 w-4" />
              Risk Feedback
              {Object.keys(riskOverrides).length > 0 ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {Object.keys(riskOverrides).length}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setShowAllRoutes((current) => !current)}
              className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600"
            >
              {showAllRoutes ? "Hide" : "Show"} All Routes
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4" style={{ minHeight: "650px" }}>
        <div className="relative overflow-hidden bg-slate-900 lg:col-span-3">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url('${WORLD_MAP_BG}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <svg viewBox="0 0 1000 500" className="relative h-full w-full" style={{ minHeight: "650px" }}>
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </pattern>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={getRiskColor(routeMetrics.routeRisk)} />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {showAllRoutes
              ? TRADE_ROUTES.map(([fromKey, toKey], index) => {
                  const from = LOCATIONS[fromKey];
                  const to = LOCATIONS[toKey];
                  if (!from || !to) return null;
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2 - (Math.abs(to.x - from.x) > 200 ? 0 : 20);
                  return (
                    <path
                      key={`${fromKey}-${toKey}-${index}`}
                      d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                      fill="none"
                      stroke="rgba(100,149,237,0.18)"
                      strokeWidth="1.5"
                      strokeDasharray="5,5"
                    />
                  );
                })
              : null}

            <g>
              <path
                d={`M ${originData.x} ${originData.y} Q ${(originData.x + destData.x) / 2} ${(originData.y + destData.y) / 2 - 30} ${destData.x} ${destData.y}`}
                fill="none"
                stroke={getRiskColor(routeMetrics.routeRisk)}
                strokeWidth="10"
                opacity="0.3"
                strokeLinecap="round"
              />
              <path
                d={`M ${originData.x} ${originData.y} Q ${(originData.x + destData.x) / 2} ${(originData.y + destData.y) / 2 - 30} ${destData.x} ${destData.y}`}
                fill="none"
                stroke={getRiskColor(routeMetrics.routeRisk)}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="10,5"
                strokeDashoffset={-animationPhase}
                markerEnd="url(#arrowhead)"
              />
              <circle r="5" fill="#ffffff" opacity="0.9">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path={`M ${originData.x} ${originData.y} Q ${(originData.x + destData.x) / 2} ${(originData.y + destData.y) / 2 - 30} ${destData.x} ${destData.y}`}
                />
              </circle>
            </g>

            {Object.entries(LOCATIONS).map(([key, location]) => {
              const displayRisk = riskOverrides[key]?.risk ?? location.risk;
              const isOverridden = key in riskOverrides;
              const label = location.label || key;
              return (
                <g
                  key={key}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCountry(label);
                    setProposedRisk(displayRisk);
                  }}
                >
                  <circle
                    cx={location.x}
                    cy={location.y}
                    r={displayRisk > 70 ? 8 : displayRisk > 40 ? 6 : 5}
                    fill={getRiskColor(displayRisk)}
                    opacity="0.85"
                    stroke={isOverridden ? "#ffffff" : "none"}
                    strokeWidth={isOverridden ? 2 : 0}
                  >
                    <animate
                      attributeName="r"
                      values={`${displayRisk > 70 ? 6 : 4};${displayRisk > 70 ? 10 : 7};${displayRisk > 70 ? 6 : 4}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {isOverridden ? (
                    <g>
                      <circle cx={location.x + 8} cy={location.y - 8} r="6" fill="#3b82f6" />
                      <text x={location.x + 8} y={location.y - 5} textAnchor="middle" fill="white" fontSize="8">M</text>
                    </g>
                  ) : null}
                  {(selectedCountry === label || displayRisk > 60) ? (
                    <g>
                      <rect x={location.x - 45} y={location.y - 40} width="90" height="28" rx="4" fill="rgba(0,0,0,0.8)" />
                      <text x={location.x} y={location.y - 28} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                        {label}
                      </text>
                      <text x={location.x} y={location.y - 18} textAnchor="middle" fill={isOverridden ? "#60a5fa" : "rgba(255,255,255,0.7)"} fontSize="8">
                        Risk: {displayRisk} {isOverridden ? "(Modified)" : ""}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}

            <g>
              <circle cx={originData.x} cy={originData.y} r="15" fill="#22c55e" stroke="white" strokeWidth="3">
                <animate attributeName="r" values="12;18;12" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text x={originData.x} y={originData.y - 25} textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">ORIGIN</text>
              <text x={originData.x} y={originData.y + 30} textAnchor="middle" fill="white" fontSize="10">{originData.name}</text>
            </g>
            <g>
              <circle cx={destData.x} cy={destData.y} r="15" fill="#ef4444" stroke="white" strokeWidth="3">
                <animate attributeName="r" values="12;18;12" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text x={destData.x} y={destData.y - 25} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">DESTINATION</text>
              <text x={destData.x} y={destData.y + 30} textAnchor="middle" fill="white" fontSize="10">{destData.name}</text>
            </g>
          </svg>

          <div className="absolute bottom-4 left-4 rounded-lg border border-slate-600 bg-slate-800/90 px-4 py-3 text-white">
            <div className="mb-1 flex items-center gap-2">
              <Ship className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Distance</span>
            </div>
            <p className="text-xl font-bold">{(routeMetrics.distance / 1000).toFixed(1)}k km</p>
            <p className="text-xs text-slate-500">{routeMetrics.seaDays} days by sea</p>
          </div>
        </div>

        <div className="flex max-h-[650px] flex-col border-l border-slate-200 bg-slate-50">
          {showFeedbackPanel ? (
            <div className="border-b border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <Edit3 className="h-4 w-4" />
                Risk Feedback System
              </h3>

              {selectedCountry ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-1 text-xs text-slate-500">Selected Country</p>
                    <p className="font-bold text-slate-900">{selectedCountry}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Current Risk:</span>
                      <span className="font-bold text-slate-900">{LOCATIONS[normalizeKey(selectedCountry)]?.risk || 50}</span>
                      {riskOverrides[normalizeKey(selectedCountry)] ? (
                        <>
                          <span className="text-xs text-slate-400">-&gt;</span>
                          <span className="font-bold text-blue-600">{riskOverrides[normalizeKey(selectedCountry)].risk}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Proposed Risk Level</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={proposedRisk || 0}
                      onChange={(event) => setProposedRisk(parseInt(event.target.value, 10))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
                    />
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>0 (Safe)</span>
                      <span className="font-bold text-slate-900">{proposedRisk}</span>
                      <span>100 (Critical)</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Feedback Note</label>
                    <textarea
                      value={feedbackNote}
                      onChange={(event) => setFeedbackNote(event.target.value)}
                      placeholder="Why are you changing this risk level?"
                      className="w-full resize-none rounded-lg border border-slate-300 p-2 text-sm"
                      rows="2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={submitRiskFeedback}
                      disabled={proposedRisk === null || proposedRisk === LOCATIONS[normalizeKey(selectedCountry)]?.risk}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save Change
                    </button>
                    {riskOverrides[normalizeKey(selectedCountry)] ? (
                      <button
                        onClick={() => resetRisk(selectedCountry)}
                        className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-300"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-slate-600">Click on any country to provide risk feedback</p>
              )}
            </div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <SideCard label="Origin" data={originData} overridden={Boolean(riskOverrides[originData.key])} />
            <SideCard label="Destination" data={destData} overridden={Boolean(riskOverrides[destData.key])} />

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-2 text-xs font-semibold text-blue-600">Overall Route Risk</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold" style={{ color: getRiskColor(routeMetrics.routeRisk) }}>
                  {routeMetrics.routeRisk}
                </span>
                <span className="text-sm text-slate-500">/100</span>
              </div>
            </div>

            {feedbackHistory.length > 0 ? (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <History className="h-4 w-4" />
                  Recent Feedback ({feedbackHistory.length})
                </h4>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {feedbackHistory.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="rounded border border-slate-200 bg-white p-2 text-xs">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{feedback.country}</span>
                        <span className="text-slate-500">
                          {feedback.oldRisk} -&gt; {feedback.newRisk}
                        </span>
                      </div>
                      {feedback.note ? <p className="truncate text-slate-600">{feedback.note}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {Object.keys(riskOverrides).length > 0 ? (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Modified Risk Levels
                </h4>
                <div className="space-y-2">
                  {Object.entries(riskOverrides).map(([country, data]) => (
                    <div key={country} className="flex items-center justify-between rounded border border-blue-200 bg-blue-50 p-2 text-xs">
                      <span className="font-semibold text-slate-900">{LOCATIONS[country]?.label || country}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 line-through">{LOCATIONS[country]?.risk}</span>
                        <span className="font-bold text-blue-600">{data.risk}</span>
                        <button onClick={() => resetRisk(country)} className="text-slate-400 hover:text-red-500">
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-slate-200 bg-slate-100 px-6 py-4 md:grid-cols-3 xl:grid-cols-6">
        <StatBox icon={BarChart3} label="Route Risk" value={`${routeMetrics.routeRisk}/100`} color={getRiskColor(routeMetrics.routeRisk)} />
        <StatBox icon={MapPin} label="Distance" value={`${(routeMetrics.distance / 1000).toFixed(1)}k km`} color="#3b82f6" />
        <StatBox icon={Clock} label="Sea Transit" value={`${routeMetrics.seaDays} days`} color="#10b981" />
        <StatBox icon={Flag} label="Countries" value={Object.keys(LOCATIONS).length} color="#f59e0b" />
        <StatBox icon={Edit3} label="Modified" value={Object.keys(riskOverrides).length} color="#8b5cf6" />
        <StatBox icon={CheckCircle} label="Feedback" value={feedbackHistory.length} color="#06b6d4" />
      </div>

      <div className="border-t border-slate-200 bg-white px-6 py-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Route Explanation</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Why this route is risky</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {routeReasons.map((reason) => (
            <div key={reason.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{reason.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{reason.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SideCard({ label, data, overridden }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
        <span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: getRiskColor(data.risk) }}>
          {data.risk}/100
        </span>
      </div>
      <p className="font-bold text-slate-900">{data.name}</p>
      <p className="text-xs text-slate-500">{data.region}</p>
      {overridden ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-blue-600">
          <Edit3 className="h-3 w-3" />
          Risk manually adjusted
        </p>
      ) : null}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
