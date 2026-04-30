import { useEffect, useMemo, useState } from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import {
  Navbar,
  AuthPortal,
  UploadBox,
  RiskGauge,
  HeroMetric,
  AlertFeed,
  ShipmentDetails,
  SystemStatus,
  QuickActions,
  MetricsDashboard,
  AnomalyTable,
  IntelligencePanel,
  DocumentInsights,
  MonitoringTable,
  AuditQueue,
  SanctionsWatchlist,
  OfficerProfilePanel,
  DocumentVision,
  PDFReportGenerator,
  RouteIntelligence,
  AnomalyFeedbackPanel,
  InspectionQueue,
  ShipperPortal,
  OfficerInbox,
} from "./components";
import { useAnalysis } from "./hooks/useAnalysis";
import { useOfficer } from "./hooks/useOfficer";
import { apiFetch } from "./utils/api";
import {
  mapBreakdown,
  deriveConfidence,
  deriveExpectedRange,
  deriveRiskTags,
  engineLabelFromCategory,
  formatAuditTimestamp,
  formatCurrency,
  formatLooseValue,
  formatMetric,
  classifyRiskScore,
  actionForStatus,
} from "./utils/formatters";

const documentFields = [
  { key: "invoice", label: "Commercial Invoice" },
  { key: "packing_list", label: "Packing List" },
  { key: "bill_of_lading", label: "Bill of Lading" },
];

const defaultCsvSettings = {
  low_risk_max: 30,
  medium_risk_max: 70,
  quantity_mismatch_threshold: 0.05,
  value_mismatch_threshold: 0.05,
  density_threshold: 2000,
  banana_temperature_floor: 10,
};

const defaultHeroMetric = {
  eyebrow: "Operations Overview",
  title: "Port risk and inspection activity in one view",
  description: "Monitor flagged cargo, open inspections, and declaration issues from a single operations dashboard.",
  trend: "+12.4%",
  direction: "up",
  updated: "Updated 4 min ago",
  sparkline: [28, 31, 34, 33, 37, 41, 45, 48, 52],
  highlights: [
    { label: "High-Risk Cases", value: "14 active" },
    { label: "Audit Escalations", value: "6 queued" },
    { label: "Compliance Watchlist", value: "12 entities" },
  ],
};

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

const defaultAnomalyRows = [
  { type: "Quantity variance: 9.1% below expected", severity: "MEDIUM", status: "Open", timestamp: "2 min ago", engine: "DOC" },
  { type: "Value discrepancy: USD 456K under declared range", severity: "MEDIUM", status: "Review", timestamp: "3 min ago", engine: "DOC" },
  { type: "Entity linked to 2 prior anomalies", severity: "MEDIUM", status: "Open", timestamp: "4 min ago", engine: "REL" },
];

const demoDocumentTemplates = {
  invoice: `COMMERCIAL INVOICE
Invoice No: INV-GS-2401
Container ID: MSCU4582217
Shipment ID: DOC-DEMO-001
Commodity: Consumer electronics
Origin: Hong Kong
Destination: Dubai
Quantity: 1240 units
Declared Value: USD 482000
Weight: 8420 kg`,
  packing_list: `PACKING LIST
Container Number: MSCU4582217
Booking No: DOC-DEMO-001
Product Description: Consumer electronics
Quantity: 1185 units
Gross Weight: 8420 kg
Volume: 28.4 cbm
Port of Loading: Hong Kong
Port of Discharge: Dubai`,
  bill_of_lading: `BILL OF LADING
Container No: MSCU4582217
Reference No: DOC-DEMO-001
Cargo Description: Consumer electronics
Country of Origin: Hong Kong
Final Destination: Dubai
Number of Packages: 1240
Declared Value: USD 482000
Temperature: 24 C`,
};

function buildDemoCsvPayload(settings) {
  return {
    ok: true,
    settings,
    summary: {
      total_shipments: 1150,
      high_risk_alerts: 47,
      medium_risk: 218,
      cleared_shipments: 885,
    },
    top_result: {
      shipment_id: "SHP00000024",
      risk_score: 91,
      status: "HIGH",
      confidence: 95,
      recommended_action: "Immediate hold and cold-chain verification",
      explanation:
        "This manifest shows a severe cargo integrity issue: bananas were declared at -18 C, which is operationally impossible for normal refrigerated produce. The temperature anomaly is reinforced by route risk and inconsistent supporting values, making this shipment a strong candidate for misdeclaration or concealment.",
      risk_tags: ["CARGO ANOMALY DETECTED", "DOCUMENT DISCREPANCY", "ROUTE RISK"],
      shipment_details: {
        shipment_id: "SHP00000024",
        container_id: "SHP00000024",
        company_name: "COMP00055",
        commodity: "bananas",
        origin: "Shanghai",
        destination: "Dubai",
        quantity: 4245,
        value: 586035.97,
        weight_kg: 4070,
        volume_cbm: 19.016,
        temperature_celsius: -18.0,
      },
      engine_breakdown: {
        Physics: 0.96,
        Document: 0.71,
        Behavior: 0.34,
        Network: 0.18,
      },
    },
    anomalies: [
      {
        type: "Cold-chain violation: bananas declared at -18 C",
        severity: "HIGH",
        status: "Open",
        timestamp: "Just now",
        category: "physics",
      },
      {
        type: "Declared route shows elevated inspection exposure into Dubai",
        severity: "MEDIUM",
        status: "Review",
        timestamp: "1 min ago",
        category: "network",
      },
      {
        type: "Manifest value falls outside expected commodity band for route and weight",
        severity: "MEDIUM",
        status: "Review",
        timestamp: "2 min ago",
        category: "document",
      },
      {
        type: "Account profile requires manual review before release",
        severity: "MEDIUM",
        status: "Open",
        timestamp: "3 min ago",
        category: "behavior",
      },
    ],
    results: [
      {
        shipment_id: "SHP00000024",
        classification: "HIGH",
        risk_score: 91,
        action: "Immediate hold",
        explanation: "Impossible cargo temperature for bananas with elevated route risk and value inconsistency.",
        engine_scores: { Physics: 0.96, Document: 0.71, Behavior: 0.34, Network: 0.18 },
        details: {
          physics: { temperature_anomaly: "Bananas listed at -18 C instead of the expected 13 to 14 C range" },
          document: { value_mismatch: "Declared value outside expected commodity band for shipment profile" },
        },
      },
      {
        shipment_id: "SHP00000017",
        classification: "HIGH",
        risk_score: 84,
        action: "Full inspection",
        explanation: "Ice cream cargo shows warm-temperature exposure inconsistent with refrigerated handling requirements.",
        engine_scores: { Physics: 0.91, Document: 0.42, Behavior: 0.19, Network: 0.11 },
        details: {
          physics: { temperature_anomaly: "Ice cream recorded at 25 C despite frozen cargo declaration" },
        },
      },
      {
        shipment_id: "SHP00000015",
        classification: "HIGH",
        risk_score: 78,
        action: "Origin verification",
        explanation: "Textile shipment shows origin mismatch and corridor risk requiring supporting document review.",
        engine_scores: { Physics: 0.12, Document: 0.67, Behavior: 0.24, Network: 0.29 },
        details: {
          document: { origin_fraud: "Declared Myanmar conflicts with shipment movement pattern and manifest indicators" },
        },
      },
      {
        shipment_id: "SHP00000005",
        classification: "MEDIUM",
        risk_score: 63,
        action: "Secondary inspection",
        explanation: "Network-linked shipment with elevated behavioral exposure and moderate declaration variance.",
        engine_scores: { Physics: 0.09, Document: 0.31, Behavior: 0.46, Network: 0.74 },
        details: {
          network: { linked_company: "Connected entity overlap with a prior anomaly cluster" },
        },
      },
      {
        shipment_id: "SHP00000006",
        classification: "LOW",
        risk_score: 18,
        action: "Direct clearance",
        explanation: "Temperature-controlled cargo remains within expected range and no material inconsistencies were detected.",
        engine_scores: { Physics: 0.08, Document: 0.14, Behavior: 0.05, Network: 0.04 },
        details: {},
      },
    ],
  };
}

function buildDemoDocumentPayload() {
  return {
    ok: true,
    top_result: {
      shipment_id: "DOC-DEMO-001",
      risk_score: 88,
      status: "HIGH",
      confidence: 94,
      recommended_action: "Secondary hold and document reconciliation",
      explanation:
        "The uploaded set presents a cross-document quantity mismatch and an implausible ambient condition for sensitive electronics. The bill of lading and packing list do not align cleanly with the commercial invoice, so the shipment should be held for supporting proof and seal verification.",
      risk_tags: ["DOCUMENT FRAUD", "DECLARATION REVIEW", "CARGO VERIFICATION"],
      shipment_details: {
        shipment_id: "DOC-DEMO-001",
        container_id: "MSCU4582217",
        company_name: "Harbor Axis Trading",
        commodity: "Consumer electronics",
        origin: "Hong Kong",
        destination: "Dubai",
        quantity: 1240,
        value: 482000,
        weight_kg: 8420,
        volume_cbm: 28.4,
        temperature_celsius: 24,
      },
      engine_breakdown: {
        Physics: 0.28,
        Document: 0.94,
        Behavior: 0.39,
        Network: 0.21,
      },
    },
    anomalies: [
      {
        type: "Cross-document quantity mismatch between invoice and packing list",
        severity: "HIGH",
        status: "Open",
        timestamp: "Just now",
        category: "document",
      },
      {
        type: "Declared handling condition requires cargo verification before release",
        severity: "MEDIUM",
        status: "Review",
        timestamp: "1 min ago",
        category: "physics",
      },
      {
        type: "Value and package counts require supporting shipper clarification",
        severity: "MEDIUM",
        status: "Review",
        timestamp: "2 min ago",
        category: "document",
      },
    ],
    documents: {
      invoice: {
        file_name: "demo_invoice.txt",
        parsed_fields: {
          container_id: "MSCU4582217",
          shipment_id: "DOC-DEMO-001",
          commodity: "Consumer electronics",
          quantity: 1240,
          declared_value: 482000,
          origin: "Hong Kong",
          destination: "Dubai",
        },
        text_excerpt: "Invoice records 1,240 units of consumer electronics with declared value USD 482,000.",
      },
      packing_list: {
        file_name: "demo_packing_list.txt",
        parsed_fields: {
          container_id: "MSCU4582217",
          shipment_id: "DOC-DEMO-001",
          commodity: "Consumer electronics",
          quantity: 1185,
          weight_kg: 8420,
          volume_cbm: 28.4,
          origin: "Hong Kong",
          destination: "Dubai",
        },
        text_excerpt: "Packing list records 1,185 units, creating a variance against the invoice quantity.",
      },
      bill_of_lading: {
        file_name: "demo_bill_of_lading.txt",
        parsed_fields: {
          container_id: "MSCU4582217",
          shipment_id: "DOC-DEMO-001",
          commodity: "Consumer electronics",
          quantity: 1240,
          temperature_celsius: 24,
          origin: "Hong Kong",
          destination: "Dubai",
        },
        text_excerpt: "Bill of lading confirms route and package count but introduces handling conditions that require verification.",
      },
    },
    results: [
      {
        shipment_id: "DOC-DEMO-001",
        classification: "HIGH",
        risk_score: 88,
        action: "Hold for reconciliation",
        explanation: "Invoice, packing list, and bill of lading disagree on quantity and handling expectations.",
        engine_scores: { Physics: 0.28, Document: 0.94, Behavior: 0.39, Network: 0.21 },
        details: {
          document: {
            quantity_mismatch: "Invoice lists 1,240 units while packing list shows 1,185 units",
            value_mismatch: "Declared value requires supporting declaration review",
          },
        },
      },
      {
        shipment_id: "DOC-DEMO-002",
        classification: "MEDIUM",
        risk_score: 57,
        action: "Secondary inspection",
        explanation: "Supporting papers are mostly aligned but require origin and valuation verification.",
        engine_scores: { Physics: 0.14, Document: 0.58, Behavior: 0.22, Network: 0.19 },
        details: {
          document: { origin_fraud: "Origin and routing need manual confirmation" },
        },
      },
      {
        shipment_id: "DOC-DEMO-003",
        classification: "LOW",
        risk_score: 16,
        action: "Direct clearance",
        explanation: "Document set aligns and no material discrepancies were detected.",
        engine_scores: { Physics: 0.05, Document: 0.12, Behavior: 0.03, Network: 0.02 },
        details: {},
      },
    ],
  };
}

function titleCaseEngine(engine) {
  return engine.charAt(0).toUpperCase() + engine.slice(1).toLowerCase();
}

function deriveEngineBadges(result) {
  const badges = [];
  const engineScores = result.engine_scores || {};
  const detailKeys = Object.keys(result.details || {});
  const candidates = [
    { key: "physics", label: "VERIFY" },
    { key: "document", label: "DOC" },
    { key: "behavior", label: "ENTITY" },
    { key: "network", label: "REL" },
  ];

  candidates.forEach((candidate) => {
    const score = engineScores[candidate.key] ?? engineScores[titleCaseEngine(candidate.key)];
    if ((typeof score === "number" && score > 0.2) || detailKeys.includes(candidate.key)) {
      badges.push(candidate.label);
    }
  });

  return badges.length ? badges : ["DOC"];
}

function normalizeResult(result) {
  const score = Number(result.risk_score ?? 0);
  const status = result.classification || classifyRiskScore(score);
  const detailMessages = Object.entries(result.details || {}).flatMap(([category, group]) =>
    Object.values(group || {}).map((message) => ({ category, message })),
  );

  let summary;
  if (!detailMessages.length) {
    summary = status === "LOW"
      ? "No significant anomalies detected. Shipment appears normal."
      : `Risk Score: ${score}/100. Review required based on model and rule-based scoring signals.`;
  } else {
    const uniqueMessages = [...new Set(detailMessages.map((item) => item.message))];
    summary = `Risk Score: ${score}/100. Key concerns: ${uniqueMessages.slice(0, 3).join("; ")}`;
  }

  return {
    ...result,
    classification: status,
    action: result.action || actionForStatus(status),
    summary,
    engineBadges: deriveEngineBadges(result),
  };
}

function downloadAnalysisReport({ analysis, results, anomalyRows, intakeMode }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const shipmentId = analysis.shipmentDetails.shipmentId || analysis.shipmentDetails.containerId || "shipment";
  const payload = {
    generated_at: new Date().toISOString(),
    intake_mode: intakeMode,
    summary: {
      risk_score: analysis.riskScore,
      confidence_score: analysis.confidenceScore,
      status: analysis.status,
      recommended_action: analysis.recommendedAction,
      explanation: analysis.explanation,
      risk_tags: analysis.riskTags,
    },
    shipment_details: analysis.shipmentDetails,
    engine_breakdown: analysis.engineBreakdown,
    operational_impact: analysis.operationalImpact,
    comparison_insight: analysis.comparisonInsight,
    anomalies: anomalyRows,
    results,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `GhostShip_Result_${shipmentId}_${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [activeView, setActiveView] = useState("operations");
  const [intakeMode, setIntakeMode] = useState("documents");
  const [documents, setDocuments] = useState({ invoice: null, packing_list: null, bill_of_lading: null });
  const [csvFile, setCsvFile] = useState(null);
  const [csvSettings, setCsvSettings] = useState(defaultCsvSettings);
  const [documentInsights, setDocumentInsights] = useState(defaultDocumentInsights);
  const [anomalyRows, setAnomalyRows] = useState(defaultAnomalyRows);
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [heroMetric, setHeroMetric] = useState(defaultHeroMetric);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [auditRows, setAuditRows] = useState([]);
  const [auditQueueMessage, setAuditQueueMessage] = useState("");
  const [auditQueueSaving, setAuditQueueSaving] = useState(false);
  const [demoCsvLoading, setDemoCsvLoading] = useState(false);
  const [demoCsvMessage, setDemoCsvMessage] = useState("");
  const [demoCsvSelected, setDemoCsvSelected] = useState(false);
  const [demoDocumentLoading, setDemoDocumentLoading] = useState(false);
  const [demoDocumentMessage, setDemoDocumentMessage] = useState("");
  const [demoDocumentsSelected, setDemoDocumentsSelected] = useState(false);

  const [dark, setDark] = useDarkMode();
  const { profile, form, saving, message, updateField, saveProfile } = useOfficer(authUser);
  const { analysis, setAnalysis, results, setResults, loading, error, setError, resetAnalysis, loadDemo, analyzeDocuments, analyzeCSV } = useAnalysis();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ghostship-auth-user");
      if (stored) {
        setAuthUser(JSON.parse(stored));
      }
    } catch {
      // Ignore malformed local auth cache.
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+D for demo
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        loadDemoReview();
      }
      // Ctrl+Enter to run analysis
      if (e.ctrlKey && e.key === 'Enter' && !loading) {
        e.preventDefault();
        const ready = intakeMode === "documents" 
          ? Object.values(documents).every(Boolean) 
          : Boolean(csvFile);
        if (ready) handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [intakeMode, documents, csvFile, loading]);

  useEffect(() => {
    async function loadAuditQueue() {
      try {
        const response = await apiFetch("/api/audit-queue");
        const payload = await response.json();
        if (response.ok && payload?.ok) {
          setAuditRows(payload.rows || []);
        }
      } catch {
        setAuditQueueMessage("Audit queue service unavailable.");
      }
    }

    loadAuditQueue();
  }, []);

  const alerts = useMemo(
    () => {
      if (intakeMode === "csv" && results.length && results[0]?.shipment_id !== "Pending") {
        return results
          .slice(0, 5)
          .map((result, index) => ({
            shipmentId: result.shipment_id,
            message: result.summary || result.explanation || result.action,
            timestamp: `Priority ${index + 1}`,
            severity: result.classification,
          }));
      }

      return anomalyRows.slice(0, 5).map((row, index) => ({
        shipmentId: analysis.shipmentDetails.containerId,
        message: row.type,
        origin: analysis.shipmentDetails.origin,
        destination: analysis.shipmentDetails.destination,
        timestamp: row.timestamp || `${index + 1} min ago`,
        severity: row.severity,
      }));
    },
    [analysis.shipmentDetails.containerId, analysis.shipmentDetails.destination, analysis.shipmentDetails.origin, anomalyRows, intakeMode, results],
  );

  const monitoredResults = useMemo(() => {
    const normalized = (results || []).map(normalizeResult).sort((a, b) => Number(b.risk_score ?? 0) - Number(a.risk_score ?? 0));
    if (riskFilter === "ALL") return normalized;
    return normalized.filter((result) => result.classification === riskFilter);
  }, [results, riskFilter]);

  const systemStatusItems = useMemo(
    () => [
      { label: "Document Engine", value: "Active" },
      { label: "Data Pipeline", value: loading ? "Analyzing" : "Ready" },
      { label: "Flagged shipments loaded", value: String(monitoredResults.filter((row) => row.shipment_id !== "Pending").length) },
      { label: "Open audit cases", value: String(auditRows.filter((row) => row.stage !== "Cleared").length) },
    ],
    [auditRows, loading, monitoredResults],
  );

  function handleExport() {
    downloadAnalysisReport({ analysis, results, anomalyRows, intakeMode });
  }

  function loadDemoReview() {
    // Reset state and load demo data
    setIntakeMode("documents");
    setDocuments({ invoice: null, packing_list: null, bill_of_lading: null });
    setCsvFile(null);
    setError("");
    setActiveView("analysis");
    // Load demo data with voice announcement
    loadDemo();
  }

  function updateDocument(docType, file) {
    setDocuments((current) => ({ ...current, [docType]: file || null }));
    setDemoDocumentsSelected(false);
    setDemoDocumentMessage("");
    setError("");
  }

  function updateCsv(file) {
    setCsvFile(file || null);
    setDemoCsvSelected(false);
    setDemoCsvMessage("");
    setError("");
  }

  function updateCsvSetting(key, value) {
    setCsvSettings((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function runDemoCsvFlow() {
    setIntakeMode("csv");
    setDocuments({ invoice: null, packing_list: null, bill_of_lading: null });
    setError("");
    setDemoCsvLoading(true);
    setDemoCsvSelected(true);

    try {
      setDemoCsvMessage("Loading demo manifest DATASHEET-01.csv...");
      const response = await fetch("/demo/DATASHEET-01.csv");
      if (!response.ok) {
        throw new Error("Could not load the demo CSV file.");
      }

      const blob = await response.blob();
      const demoFile = new File([blob], "DATASHEET-01.csv", { type: "text/csv" });
      setCsvFile(demoFile);
      await runTimedDemoAnalysis();
    } catch (err) {
      setDemoCsvMessage("");
      setError(err.message || "Could not run the demo CSV analysis.");
    } finally {
      setDemoCsvLoading(false);
    }
  }

  async function runDemoDocumentFlow() {
    setIntakeMode("documents");
    setCsvFile(null);
    setDemoCsvSelected(false);
    setDemoCsvMessage("");
    setDemoDocumentsSelected(true);
    setDemoDocumentLoading(true);
    setError("");

    try {
      const nextDocuments = {
        invoice: new File([demoDocumentTemplates.invoice], "demo_invoice.txt", { type: "text/plain" }),
        packing_list: new File([demoDocumentTemplates.packing_list], "demo_packing_list.txt", { type: "text/plain" }),
        bill_of_lading: new File([demoDocumentTemplates.bill_of_lading], "demo_bill_of_lading.txt", { type: "text/plain" }),
      };
      setDocuments(nextDocuments);
      await runTimedDocumentDemoAnalysis();
    } catch (err) {
      setDemoDocumentMessage("");
      setError(err.message || "Could not run the demo document analysis.");
    } finally {
      setDemoDocumentLoading(false);
    }
  }

  async function runTimedDemoAnalysis() {
    setError("");
    setDemoCsvLoading(true);

    try {
      setDemoCsvMessage("Sample manifest loaded. Initializing anomaly scan...");
      await wait(1000);

      setDemoCsvMessage("Running shipment, behavior, and document consistency checks...");
      await wait(1000);

      setDemoCsvMessage("Correlating cargo physics, route exposure, and entity patterns...");
      await wait(1000);

      setDemoCsvMessage("Generating ranked risk results for officer review...");
      await wait(1000);

      applyAnalysisPayload(buildDemoCsvPayload(csvSettings), true);
      setDemoCsvMessage("Demo analysis complete. Review the flagged shipments below.");
    } catch (err) {
      setDemoCsvMessage("");
      setError(err.message || "Could not run the demo CSV analysis.");
    } finally {
      setDemoCsvLoading(false);
    }
  }

  async function runTimedDocumentDemoAnalysis() {
    setError("");
    setDemoDocumentLoading(true);

    try {
      setDemoDocumentMessage("Loading invoice, packing list, and bill of lading...");
      await wait(1000);

      setDemoDocumentMessage("Extracting trade fields and matching shared identifiers...");
      await wait(1000);

      setDemoDocumentMessage("Reconciling quantities, value bands, and handling conditions...");
      await wait(1000);

      setDemoDocumentMessage("Generating ranked review findings for customs officers...");
      await wait(1000);

      applyAnalysisPayload(buildDemoDocumentPayload(), true);
      setDemoDocumentMessage("Demo document analysis complete. Review the flagged inconsistencies below.");
    } catch (err) {
      setDemoDocumentMessage("");
      setError(err.message || "Could not run the demo document analysis.");
    } finally {
      setDemoDocumentLoading(false);
    }
  }

  function applyAnalysisPayload(payload, isDemo = false) {
    const top = payload.top_result;
    const details = top.shipment_details;
    const engineBreakdown = mapBreakdown(top.engine_breakdown);
    const declaredValue = formatCurrency(details.value);
    const comparisonInsight = deriveExpectedRange(declaredValue);

    setAnalysis({
      riskScore: top.risk_score,
      confidenceScore: deriveConfidence(engineBreakdown, top.confidence),
      status: top.status || classifyRiskScore(top.risk_score),
      recommendedAction: top.recommended_action || actionForStatus(top.status || classifyRiskScore(top.risk_score)),
      explanation: top.explanation,
      shipmentDetails: {
        shipmentId: details.shipment_id || "Unknown",
        containerId: details.container_id || details.shipment_id || "Unknown",
        company: details.company || details.company_name || "Unknown",
        commodity: details.commodity || "Unknown",
        origin: details.origin || "Unknown",
        destination: details.destination || "Unknown",
        quantity: formatLooseValue(details.quantity),
        declaredValue,
        weight: formatMetric(details.weight_kg, "KG"),
        volume: formatMetric(details.volume_cbm, "CBM"),
        temperature: details.temperature_celsius == null ? "Unknown" : `${details.temperature_celsius} C`,
      },
      engineBreakdown,
      riskFactors: payload.anomalies?.map((a) => a.type) || ["No material anomalies detected"],
      riskTags: top.risk_tags || deriveRiskTags(engineBreakdown, payload.anomalies || []),
      operationalImpact: {
        riskValue: `${declaredValue} under customs review`,
        inspectionRequirement: actionForStatus(classifyRiskScore(top.risk_score)),
      },
      comparisonInsight,
    });

    setDocumentInsights(intakeMode === "documents" ? payload.documents || defaultDocumentInsights : defaultDocumentInsights);
    if (intakeMode === "csv" && payload.settings) {
      setCsvSettings(payload.settings);
    }
    setResults((payload.results || []).map(normalizeResult));
    setRiskFilter("ALL");
    setAnomalyRows(
      payload.anomalies?.length
        ? payload.anomalies.map((row, index) => ({
            ...row,
            engine: row.engine || engineLabelFromCategory(row.category),
            absoluteTimestamp: formatAuditTimestamp(row.timestamp, index),
          }))
        : [
            {
              type: "No material anomalies detected",
              severity: "LOW",
              status: "Closed",
              timestamp: "Just now",
              absoluteTimestamp: formatAuditTimestamp("Just now"),
              engine: "DOC",
            },
          ],
    );
    setHeroMetric({
      eyebrow: isDemo ? (intakeMode === "documents" ? "Demo document review" : "Demo manifest review") : "Current upload review",
      title: `${payload.summary.total_shipments.toLocaleString()} shipments analyzed in this intake`,
      description: `${payload.summary.high_risk_alerts.toLocaleString()} priority reviews, ${payload.summary.medium_risk.toLocaleString()} secondary checks, ${payload.summary.cleared_shipments.toLocaleString()} direct clearances.`,
      trend: `${top.risk_score}/100 top risk`,
      direction: top.risk_score > 70 ? "up" : "down",
      updated: isDemo ? "Updated after 4 sec demo run" : "Updated just now",
      sparkline: isDemo ? [19, 24, 28, 36, 41, 46, 52, 57, 61] : [22, 26, 29, 31, 35, 38, 42, 45, 49],
      highlights: [
        { label: "Priority Reviews", value: payload.summary.high_risk_alerts.toLocaleString() },
        { label: "Secondary Checks", value: payload.summary.medium_risk.toLocaleString() },
        { label: "Direct Clearances", value: payload.summary.cleared_shipments.toLocaleString() },
      ],
    });
    setActiveView("analysis");
  }

  async function handleAnalyze(overrideCsvFile = null) {
    if (intakeMode === "documents") {
      const ready = documentFields.every((field) => documents[field.key]);
      if (!ready) {
        setError("Please upload invoice, packing list, and bill of lading before analyzing.");
        return;
      }
    } else if (!(overrideCsvFile || csvFile)) {
      setError("Please upload a CSV file before analyzing.");
      return;
    }

    if (intakeMode === "csv" && demoCsvSelected && ((overrideCsvFile || csvFile)?.name === "DATASHEET-01.csv")) {
      await runTimedDemoAnalysis();
      return;
    }
    if (intakeMode === "documents" && demoDocumentsSelected) {
      await runTimedDocumentDemoAnalysis();
      return;
    }

    try {
      let payload;
      if (intakeMode === "documents") {
        payload = await analyzeDocuments(documents);
      } else {
        payload = await analyzeCSV(overrideCsvFile || csvFile, csvSettings);
      }
      applyAnalysisPayload(payload);
      setDemoCsvMessage((current) =>
        current ? `Demo complete: ${payload.summary.total_shipments.toLocaleString()} shipments scanned, ${payload.summary.high_risk_alerts.toLocaleString()} flagged as high risk.` : current,
      );
    } catch (err) {
      // Error is handled by hook
    }
  }

  function handleApplyAnomalyOverride(override) {
    // Override noted locally — backend persistence not yet implemented
    console.debug("Anomaly override applied:", override);
  }

  async function createAuditCase(row) {
    setAuditQueueSaving(true);
    setAuditQueueMessage("");
    try {
      const response = await apiFetch("/api/audit-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Could not create audit case");
      }
      setAuditRows((current) => [payload.row, ...current]);
      setAuditQueueMessage("Audit case created.");
    } catch (err) {
      setAuditQueueMessage(err.message || "Could not create audit case");
    } finally {
      setAuditQueueSaving(false);
    }
  }

  async function updateAuditCase(row) {
    setAuditQueueSaving(true);
    setAuditQueueMessage("");
    try {
      const response = await apiFetch(`/api/audit-queue/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Could not update audit case");
      }
      setAuditRows((current) => current.map((item) => (item.id === payload.row.id ? payload.row : item)));
      setAuditQueueMessage("Audit case updated.");
    } catch (err) {
      setAuditQueueMessage(err.message || "Could not update audit case");
    } finally {
      setAuditQueueSaving(false);
    }
  }

  async function deleteAuditCase(rowId) {
    setAuditQueueSaving(true);
    setAuditQueueMessage("");
    try {
      const response = await apiFetch(`/api/audit-queue/${rowId}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Could not remove audit case");
      }
      setAuditRows((current) => current.filter((item) => item.id !== rowId));
      setAuditQueueMessage("Audit case removed.");
    } catch (err) {
      setAuditQueueMessage(err.message || "Could not remove audit case");
    } finally {
      setAuditQueueSaving(false);
    }
  }

  async function handleEscalateCurrentShipment() {
    const shipmentId = analysis.shipmentDetails.shipmentId || analysis.shipmentDetails.containerId;
    if (!shipmentId || shipmentId === "Pending") {
      setAuditQueueMessage("Run an analysis first so there is a shipment to escalate.");
      return;
    }

    const existing = auditRows.find((row) => row.shipmentId === shipmentId);
    if (existing) {
      setAuditQueueMessage("This shipment is already in the audit queue.");
      setActiveView("audit");
      return;
    }

    await createAuditCase({
      shipmentId,
      stage: analysis.status === "HIGH" ? "Full Inspection" : "Secondary Inspection",
      owner: "Control Desk",
      eta: analysis.status === "HIGH" ? "Immediate" : "30 min",
      priority: analysis.status === "HIGH" ? "HIGH" : analysis.status === "MEDIUM" ? "MEDIUM" : "LOW",
      notes: `${analysis.recommendedAction}. ${analysis.explanation}`,
    });
    setActiveView("audit");
  }

  async function handleSaveProfile() {
    const savedProfile = await saveProfile(profilePhoto);
    if (authUser && savedProfile) {
      const nextAuthUser = {
        ...authUser,
        full_name: savedProfile.full_name,
        role_title: savedProfile.role_title,
        badge_id: savedProfile.badge_id,
        email: savedProfile.email,
        terminal: savedProfile.terminal,
        shift_name: savedProfile.shift_name,
        photo_url: savedProfile.photo_url || null,
      };
      setAuthUser(nextAuthUser);
      window.localStorage.setItem("ghostship-auth-user", JSON.stringify(nextAuthUser));
    }
    setProfilePhoto(null);
  }

  function handleLoginSuccess(user) {
    setAuthUser(user);
    window.localStorage.setItem("ghostship-auth-user", JSON.stringify(user));
  }

  function handleLogout() {
    setAuthUser(null);
    window.localStorage.removeItem("ghostship-auth-user");
  }

  const displayedProfile = authUser
    ? {
        full_name: authUser.full_name,
        role_title: authUser.role_title,
        badge_id: authUser.badge_id,
        email: authUser.email,
        terminal: authUser.terminal,
        shift_name: authUser.shift_name,
        photo_url: null,
      }
    : profile;

  function handleLoadSubmission({ submission, documents: submittedDocs, csvFile: submittedCsv }) {
    if (submission.intake_mode === "csv" && submittedCsv) {
      setIntakeMode("csv");
      setCsvFile(submittedCsv);
      setDocuments({ invoice: null, packing_list: null, bill_of_lading: null });
    } else {
      setIntakeMode("documents");
      setDocuments({
        invoice: submittedDocs?.invoice || null,
        packing_list: submittedDocs?.packing_list || null,
        bill_of_lading: submittedDocs?.bill_of_lading || null,
      });
      setCsvFile(null);
    }
    setError("");
    setActiveView("analysis");
  }

  if (!authUser) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} />;
  }

  // Shipper gets their own minimal portal
  if (authUser.user_type === "shipper") {
    return <ShipperPortal authUser={authUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar activeView={activeView} setActiveView={setActiveView} officerProfile={displayedProfile} onLogout={handleLogout} dark={dark} onToggleDark={() => setDark((d) => !d)} />

      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
        {activeView === "profile" && (
          <OfficerProfilePanel
            profile={profile}
            form={form}
            onChange={updateField}
            onPhotoChange={setProfilePhoto}
            onSave={handleSaveProfile}
            saving={saving}
            saveMessage={message}
          />
        )}

        {/* OPERATIONS: Command Dashboard Only */}
        {activeView === "operations" && (
          <section>
            <HeroMetric card={heroMetric} />
          </section>
        )}

        {activeView === "operations" && (
          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.12fr)_minmax(460px,0.88fr)]">
            <UploadBox
              intakeMode={intakeMode}
              setIntakeMode={setIntakeMode}
              documents={documents}
              csvFile={csvFile}
              csvSettings={csvSettings}
              onCsvSettingChange={updateCsvSetting}
              loading={loading}
              error={error}
              onFileChange={updateDocument}
              onCsvChange={updateCsv}
              onUseDemoDocuments={runDemoDocumentFlow}
              demoDocumentLoading={demoDocumentLoading}
              demoDocumentMessage={demoDocumentMessage}
              onUseDemoCsv={runDemoCsvFlow}
              demoCsvLoading={demoCsvLoading}
              demoCsvMessage={demoCsvMessage}
              handleAnalyze={handleAnalyze}
            />
            <AlertFeed alerts={alerts} />
          </section>
        )}

        {activeView === "operations" && (
          <section className="grid gap-5">
            <InspectionQueue
              loading={loading}
              analysis={analysis}
              results={results}
              intakeMode={intakeMode}
            />
          </section>
        )}

        {activeView === "operations" && (
          <section className="grid gap-5">
            <OfficerInbox onLoadSubmission={handleLoadSubmission} />
          </section>
        )}

        {activeView === "operations" && (
          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
            <SystemStatus items={systemStatusItems} />
            <QuickActions setActiveView={setActiveView} onExport={handleExport} onLaunchDemo={loadDemoReview} />
          </section>
        )}

        {activeView === "operations" && (
          <section className="grid gap-5">
            <MetricsDashboard analysis={analysis} results={results} />
          </section>
        )}

        {/* SHIPMENT ANALYSIS: Deep Dive on One Shipment */}
        {activeView === "analysis" && (
          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.12fr)_minmax(460px,0.88fr)]">
            <UploadBox
              intakeMode={intakeMode}
              setIntakeMode={setIntakeMode}
              documents={documents}
              csvFile={csvFile}
              csvSettings={csvSettings}
              onCsvSettingChange={updateCsvSetting}
              loading={loading}
              error={error}
              onFileChange={updateDocument}
              onCsvChange={updateCsv}
              onUseDemoDocuments={runDemoDocumentFlow}
              demoDocumentLoading={demoDocumentLoading}
              demoDocumentMessage={demoDocumentMessage}
              onUseDemoCsv={runDemoCsvFlow}
              demoCsvLoading={demoCsvLoading}
              demoCsvMessage={demoCsvMessage}
              handleAnalyze={handleAnalyze}
            />
            <RiskGauge
              analysis={analysis}
              onEscalate={handleEscalateCurrentShipment}
              escalatorSaving={auditQueueSaving}
              escalatorMessage={auditQueueMessage}
            />
          </section>
        )}

        {activeView === "analysis" && (
          <section className="grid gap-5">
            <ShipmentDetails details={analysis.shipmentDetails} intakeMode={intakeMode} />
          </section>
        )}

        {activeView === "analysis" && analysis.shipmentDetails.origin !== "Pending" && analysis.shipmentDetails.origin !== "Unknown" && (
          <section className="grid gap-5">
            <RouteIntelligence 
              origin={analysis.shipmentDetails.origin} 
              destination={analysis.shipmentDetails.destination}
              riskScore={analysis.riskScore}
              commodity={analysis.shipmentDetails.commodity}
            />
          </section>
        )}

        {activeView === "analysis" && (
          <section className="grid gap-5 2xl:grid-cols-[1.2fr_0.95fr]">
            <AnomalyTable rows={anomalyRows} analysis={analysis} />
            <IntelligencePanel analysis={analysis} intakeMode={intakeMode} />
          </section>
        )}

        {activeView === "analysis" && anomalyRows.length > 0 && (
          <section className="grid gap-5">
            <AnomalyFeedbackPanel
              anomalies={anomalyRows.map((row, idx) => ({ ...row, id: row.id || `anomaly-${idx}` }))}
              feedbackOverrides={{}}
              onApplyOverride={handleApplyAnomalyOverride}
              officerName={displayedProfile.full_name}
            />
          </section>
        )}

        {activeView === "analysis" && <DocumentInsights documents={documentInsights} />}

        {activeView === "analysis" && intakeMode === "documents" && (
          <section className="grid gap-5">
            <DocumentVision 
              documentType="invoice"
              documentData={documentInsights.invoice}
              riskFactors={analysis.riskFactors}
              documents={documentInsights}
            />
          </section>
        )}

        {activeView === "analysis" && (
          <section className="grid gap-5">
            <PDFReportGenerator 
              analysis={analysis}
              results={results}
              officerProfile={displayedProfile}
              documentInsights={documentInsights}
            />
          </section>
        )}

        {/* RISK MONITORING: Live Surveillance */}
        {activeView === "monitoring" && (
          <section className="grid gap-5">
            <AlertFeed alerts={alerts} />
          </section>
        )}

        {activeView === "monitoring" && (
          <section className="grid gap-5">
            <MonitoringTable results={monitoredResults} riskFilter={riskFilter} setRiskFilter={setRiskFilter} />
          </section>
        )}

        {activeView === "monitoring" && (
          <section className="grid gap-5">
            <SanctionsWatchlist />
          </section>
        )}

        {/* AUDIT QUEUE: Physical Inspection Pipeline */}
        {activeView === "audit" && (
          <section className="grid gap-5">
            <AuditQueue
              rows={auditRows}
              onCreateRow={createAuditCase}
              onUpdateRow={updateAuditCase}
              onDeleteRow={deleteAuditCase}
              saving={auditQueueSaving}
              message={auditQueueMessage}
            />
          </section>
        )}
      </main>
    </div>
  );
}
