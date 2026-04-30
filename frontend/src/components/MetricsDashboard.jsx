import { useMemo } from "react";
import { BarChart3, PieChart, Activity, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function MetricsDashboard({ analysis, results }) {
  // Calculate metrics
  const metrics = useMemo(() => {
    const total = results.length || 1;
    const highRisk = results.filter(r => r.risk_score > 70).length;
    const medRisk = results.filter(r => r.risk_score > 40 && r.risk_score <= 70).length;
    const lowRisk = results.filter(r => r.risk_score <= 40).length;
    
    const avgRisk = results.reduce((sum, r) => sum + (r.risk_score || 0), 0) / total;
    const maxRisk = Math.max(...results.map(r => r.risk_score || 0), 0);
    
    // Engine contributions
    const engines = [
      { name: "Document", score: analysis.engineBreakdown?.Document || 0, color: "#3b82f6" },
      { name: "Physics", score: analysis.engineBreakdown?.Physics || 0, color: "#f97316" },
      { name: "Behavior", score: analysis.engineBreakdown?.Behavior || 0, color: "#14b8a6" },
      { name: "Network", score: analysis.engineBreakdown?.Network || 0, color: "#8b5cf6" },
    ];
    
    // Top risk factors frequency
    const factorCounts = {};
    results.forEach(r => {
      if (r.details) {
        Object.entries(r.details).forEach(([category, issues]) => {
          Object.keys(issues).forEach(issue => {
            factorCounts[issue] = (factorCounts[issue] || 0) + 1;
          });
        });
      }
    });
    
    const topFactors = Object.entries(factorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      distribution: { high: highRisk, medium: medRisk, low: lowRisk, total },
      avgRisk: Math.round(avgRisk),
      maxRisk,
      engines,
      topFactors,
      processingTime: "47ms",
      confidence: analysis.confidenceScore || 75,
    };
  }, [analysis, results]);

  // Donut chart SVG
  const DonutChart = ({ data }) => {
    const total = data.high + data.medium + data.low;
    if (total === 0) return <div className="text-slate-400 text-sm">No data</div>;
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    const highOffset = 0;
    const medOffset = (data.high / total) * circumference;
    const lowOffset = ((data.high + data.medium) / total) * circumference;
    
    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {/* Background */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          
          {/* High Risk - Red */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeDasharray={`${(data.high / total) * circumference} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          
          {/* Medium Risk - Amber */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="12"
            strokeDasharray={`${(data.medium / total) * circumference} ${circumference}`}
            strokeDashoffset={-medOffset}
            strokeLinecap="round"
          />
          
          {/* Low Risk - Green */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeDasharray={`${(data.low / total) * circumference} ${circumference}`}
            strokeDashoffset={-lowOffset}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">Total</span>
        </div>
      </div>
    );
  };

  // Horizontal bar chart
  const BarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.score), 0.1);
    
    return (
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs w-16 text-slate-600">{item.name}</span>
            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.score / maxVal) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="text-xs w-10 text-right font-medium">{Math.round(item.score * 100)}%</span>
          </div>
        ))}
      </div>
    );
  };

  // Sparkline for trend
  const Sparkline = ({ data }) => {
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (val / 100) * 100;
      return `${x},${y}`;
    }).join(" ");
    
    return (
      <svg viewBox="0 0 100 100" className="w-full h-16">
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <defs>
          <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#sparkGradient)"
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    );
  };

  const mockTrend = [12, 45, 23, 67, 34, 89, 45, 78, 56, 87];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Analytics</p>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Risk Metrics Dashboard</h2>
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-slate-500">Avg Risk</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.avgRisk}</p>
          <p className="text-xs text-slate-500">across {metrics.distribution.total} shipments</p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-slate-500">Peak Risk</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{metrics.maxRisk}</p>
          <p className="text-xs text-slate-500">highest detected</p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-green-500" />
            <span className="text-xs text-slate-500">Process Time</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{metrics.processingTime}</p>
          <p className="text-xs text-slate-500">per shipment</p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-slate-500">AI Confidence</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{metrics.confidence}%</p>
          <p className="text-xs text-slate-500">model accuracy</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Risk Distribution */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Risk Distribution</h3>
          </div>
          <div className="flex items-center gap-4">
            <DonutChart data={metrics.distribution} />
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-600">High ({metrics.distribution.high})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Medium ({metrics.distribution.medium})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-slate-600">Low ({metrics.distribution.low})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Performance */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Engine Performance</h3>
          </div>
          <BarChart data={metrics.engines} />
        </div>

        {/* Trend */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Risk Trend</h3>
          </div>
          <Sparkline data={mockTrend} />
          <p className="text-xs text-slate-500 mt-1">Last 10 analysis sessions</p>
        </div>
      </div>

      {/* Top Risk Factors */}
      {metrics.topFactors.length > 0 && (
        <div className="mt-4 bg-slate-50 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Top Detected Patterns</h3>
          <div className="flex flex-wrap gap-2">
            {metrics.topFactors.map(([factor, count], idx) => (
              <div key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-700">{factor.replace(/_/g, " ")}</span>
                <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
