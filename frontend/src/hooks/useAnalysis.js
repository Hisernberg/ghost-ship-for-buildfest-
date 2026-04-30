import { useState, useCallback } from "react";
import { apiFetch } from "../utils/api";

// Voice alert helper
const announceRisk = (score, status) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  const text = score > 70 
    ? `High risk alert! Score ${score}. Full inspection required.`
    : score > 40 
    ? `Medium risk detected. Score ${score}. Secondary inspection recommended.`
    : `Low risk. Score ${score}. Clear for processing.`;
  
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.9;
  msg.pitch = score > 70 ? 1.1 : 1;
  window.speechSynthesis.speak(msg);
};

const defaultAnalysis = {
  riskScore: 0,
  confidenceScore: null,
  status: "LOW",
  recommendedAction: "Upload a document set to begin analysis",
  explanation:
    "Upload invoice, packing list, and bill of lading files or a shipment manifest to start the review.",
  shipmentDetails: {
    shipmentId: "Pending",
    containerId: "Pending",
    company: "Unknown",
    commodity: "Awaiting documents",
    origin: "Unknown",
    destination: "Unknown",
    quantity: "Unknown",
    declaredValue: "Unknown",
    weight: "Unknown",
    volume: "Unknown",
    temperature: "Unknown",
  },
  engineBreakdown: {
    Physics: 0.22,
    Document: 0.58,
    Behavior: 0.1,
    Network: 0.05,
  },
  riskFactors: [
    "Upload invoice, packing list, and bill of lading to begin review.",
  ],
  riskTags: ["DOCUMENT ANALYSIS READY"],
  operationalImpact: {
    riskValue: "No active declaration under review",
    inspectionRequirement: "Awaiting shipment documents",
  },
  comparisonInsight: {
    declared: "Unknown",
    expected: "Upload documents to compare declared and expected ranges",
  },
};

const defaultResults = [
  {
    shipment_id: "Pending",
    classification: "LOW",
    risk_score: 0,
    action: "Awaiting document upload",
    explanation: defaultAnalysis.explanation,
    details: {},
  },
];

export function useAnalysis() {
  const [analysis, setAnalysis] = useState(defaultAnalysis);
  const [results, setResults] = useState(defaultResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetAnalysis = useCallback(() => {
    setAnalysis(defaultAnalysis);
    setResults(defaultResults);
    setError("");
  }, []);

  // Demo mode - loads sample high-risk scenario
  const loadDemo = useCallback(() => {
    const demoAnalysis = {
      riskScore: 87,
      confidenceScore: 92,
      status: "HIGH",
      recommendedAction: "Full inspection required",
      explanation: "Multiple anomalies detected: quantity mismatch of 45%, origin fraud (declared Vietnam, actual North Korea), and linked to 3 prior fraud cases.",
      shipmentDetails: {
        shipmentId: "DEMO-HIGH-001",
        containerId: "MSCU-458221-7",
        company: "Suspicious Logistics Ltd",
        commodity: "Consumer Electronics",
        origin: "North Korea",
        destination: "Singapore",
        quantity: "2,847 units",
        declaredValue: "USD 456,000",
        weight: "18,420 KG",
        volume: "31.8 CBM",
        temperature: "Controlled ambient",
      },
      engineBreakdown: {
        Physics: 0.27,
        Document: 0.93,
        Behavior: 0.75,
        Network: 0.88,
      },
      riskFactors: [
        "Quantity mismatch: 45% deviation across documents",
        "Origin fraud: Declared Vietnam, actual North Korea",
        "Linked to 3 prior fraud cases",
        "New account with high-value shipment",
      ],
      riskTags: ["DOCUMENT FRAUD", "ORIGIN FRAUD", "NETWORK ALERT"],
      operationalImpact: {
        riskValue: "USD 456,000 under customs review",
        inspectionRequirement: "Full inspection required",
      },
      comparisonInsight: {
        declared: "USD 456,000",
        expected: "USD 556,000 - USD 720,000",
      },
    };

    const demoResults = [
      {
        shipment_id: "DEMO-HIGH-001",
        classification: "HIGH",
        risk_score: 87,
        action: "Full inspection",
        explanation: demoAnalysis.explanation,
        engine_scores: demoAnalysis.engineBreakdown,
        engineBadges: ["DOC", "VERIFY", "ENTITY", "REL"],
        details: {
          document: { quantity_mismatch: "45% deviation" },
          network: { linked_fraud: "3 prior cases" },
        },
      },
      {
        shipment_id: "DEMO-MED-002",
        classification: "MEDIUM",
        risk_score: 58,
        action: "Secondary inspection",
        explanation: "Document inconsistencies detected",
        engineBadges: ["DOC"],
      },
      {
        shipment_id: "DEMO-LOW-003",
        classification: "LOW",
        risk_score: 12,
        action: "Direct clearance",
        explanation: "No anomalies detected",
        engineBadges: ["DOC"],
      },
    ];

    setAnalysis(demoAnalysis);
    setResults(demoResults);
    
    // Announce the risk
    announceRisk(87, "HIGH");
  }, []);

  const analyzeDocuments = useCallback(async (documents) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      Object.entries(documents).forEach(([key, file]) => {
        formData.append(key, file);
      });

      const response = await apiFetch("/api/analyze-documents", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Analysis failed");
      }

      // Announce risk level
      announceRisk(payload.top_result?.risk_score || 0, payload.top_result?.status || "LOW");

      return payload;
    } catch (err) {
      setError(err.message || "Analysis failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeCSV = useCallback(async (csvFile, settings) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("settings", JSON.stringify(settings));

      const response = await apiFetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Analysis failed");
      }

      // Announce risk level
      announceRisk(payload.top_result?.risk_score || 0, payload.top_result?.status || "LOW");

      return payload;
    } catch (err) {
      setError(err.message || "Analysis failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analysis,
    setAnalysis,
    results,
    setResults,
    loading,
    error,
    setError,
    resetAnalysis,
    loadDemo,
    analyzeDocuments,
    analyzeCSV,
  };
}
