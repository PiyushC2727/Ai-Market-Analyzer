import React from "react";
import { Award, Zap, BarChart2, ShieldAlert, Heart, Coins } from "lucide-react";

interface ScoresSummaryProps {
  recommendation: string;
  technicalScore: number;
  fundamentalScore: number;
  valuationScore: number;
  sentimentScore: number;
  riskScore: number;
  overallConfidence: number;
}

export default function ScoresSummary({
  recommendation,
  technicalScore,
  fundamentalScore,
  valuationScore,
  sentimentScore,
  riskScore,
  overallConfidence,
}: ScoresSummaryProps) {
  
  // Custom circular progress ring SVG
  const ScoreRing = ({ score, label, icon: Icon, colorClass, strokeColor }: { 
    score: number; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    colorClass: string;
    strokeColor: string;
  }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm relative group hover:border-gray-200 transition-colors">
        <div className="relative h-18 w-18 flex items-center justify-center">
          <svg className="transform -rotate-90 w-full h-full">
            {/* Background Circle */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Active Progress Circle */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              stroke={strokeColor}
              strokeWidth="5.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Centered Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</div>
          <div className="text-lg font-extrabold text-slate-800 mt-0.5">{score}</div>
        </div>
      </div>
    );
  };

  const getRecColor = (rec: string) => {
    const r = rec.toLowerCase();
    if (r.includes("strong buy")) return { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "STRONG BUY" };
    if (r.includes("buy") || r.includes("accumulate")) return { bg: "bg-indigo-50 border-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", label: "BUY / ACCUMULATE" };
    if (r.includes("hold")) return { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "HOLD / NEUTRAL" };
    return { bg: "bg-rose-50 border-rose-100", text: "text-rose-700", dot: "bg-rose-500", label: "REDUCE / SELL" };
  };

  const recStyle = getRecColor(recommendation);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Primary recommendation banner */}
      <div className={`${recStyle.bg} border rounded-2xl p-6 flex flex-col justify-between shadow-sm lg:col-span-1`}>
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Consensus Rating
          </div>
          <h3 className={`text-2xl font-black font-sans tracking-tight leading-tight ${recStyle.text}`}>
            {recommendation}
          </h3>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              <span>Overall Confidence</span>
              <span className={recStyle.text}>{overallConfidence}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  overallConfidence > 75 ? "bg-emerald-500" : overallConfidence > 50 ? "bg-indigo-500" : "bg-amber-500"
                }`}
                style={{ width: `${overallConfidence}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Backed by evidence-based technical, fundamental, risk, and web sentiment parameters gathered in real-time.
          </p>
        </div>
      </div>

      {/* Quantitative Ring Score Dashboard */}
      <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <ScoreRing
          score={technicalScore}
          label="Technical"
          icon={Zap}
          colorClass="text-blue-500"
          strokeColor="#3b82f6"
        />
        <ScoreRing
          score={fundamentalScore}
          label="Fundamental"
          icon={BarChart2}
          colorClass="text-emerald-500"
          strokeColor="#10b981"
        />
        <ScoreRing
          score={valuationScore}
          label="Valuation"
          icon={Coins}
          colorClass="text-indigo-500"
          strokeColor="#6366f1"
        />
        <ScoreRing
          score={sentimentScore}
          label="Sentiment"
          icon={Heart}
          colorClass="text-pink-500"
          strokeColor="#ec4899"
        />
        <ScoreRing
          score={riskScore}
          label="Risk Safety"
          icon={ShieldAlert}
          colorClass={riskScore > 70 ? "text-emerald-500" : riskScore > 40 ? "text-amber-500" : "text-rose-500"}
          strokeColor={riskScore > 70 ? "#10b981" : riskScore > 40 ? "#f59e0b" : "#f43f5e"}
        />
      </div>
    </div>
  );
}
