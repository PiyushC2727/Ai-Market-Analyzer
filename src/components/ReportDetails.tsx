import React, { useState } from "react";
import { AnalysisReport } from "../types";
import { 
  Building2, TrendingUp, DollarSign, AlertTriangle, 
  Users, CheckCircle2, XCircle, AlertCircle, FileText,
  ShieldCheck, ExternalLink, Activity
} from "lucide-react";

interface ReportDetailsProps {
  report: AnalysisReport;
}

export default function ReportDetails({ report }: ReportDetailsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "technical" | "fundamental" | "risks" | "peers" | "checklist">("overview");

  const tabs = [
    { id: "overview", label: "Core Outlook", icon: Building2 },
    { id: "technical", label: "Technical & SMC", icon: TrendingUp },
    { id: "fundamental", label: "Fundamentals & DCF", icon: DollarSign },
    { id: "risks", label: "Catalysts & Risks", icon: AlertTriangle },
    { id: "peers", label: "Competitors", icon: Users },
    { id: "checklist", label: "Rule Evaluation", icon: ShieldCheck },
  ] as const;

  const getPassedIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />;
      case "failed":
        return <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />;
      default:
        return <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />;
    }
  };

  const getPassedBg = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto gap-1 pb-px scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {/* TAB 1: Core Outlook */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Executive Summary</h4>
                  <p className="text-sm text-gray-700 leading-relaxed font-sans">{report.executiveSummary}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    Business Operations & Revenue Model
                  </h4>
                  <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
                    <p><strong>Business Model:</strong> {report.companyOverview.businessModel}</p>
                    <p><strong>Key Products & Sectors:</strong> {report.companyOverview.keyProducts}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900">Competitive Advantage</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{report.companyOverview.competitiveAdvantage}</p>
                  
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Economic Moat Rating</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      report.companyOverview.moatRating === "Wide" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : report.companyOverview.moatRating === "Narrow" 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}>
                      {report.companyOverview.moatRating} Moat
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Ticker Snapshot</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400">Sector</div>
                      <div className="font-semibold text-gray-700 mt-0.5">{report.sector}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Industry</div>
                      <div className="font-semibold text-gray-700 mt-0.5">{report.industry}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Market Cap</div>
                      <div className="font-semibold text-gray-700 mt-0.5">{report.marketCap}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Price</div>
                      <div className="font-bold text-indigo-600 mt-0.5">{report.currentPrice}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Technical & SMC */}
        {activeTab === "technical" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Technical Summary & Structure</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mt-3">{report.technicalAnalysis.details}</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Smart Money Concepts (SMC) & ICT Setup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
                      <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Mitigated Order Blocks</div>
                      <p className="text-xs text-gray-600 leading-relaxed font-sans">{report.technicalAnalysis.smcConcepts.orderBlocks}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
                      <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Fair Value Gaps (FVG)</div>
                      <p className="text-xs text-gray-600 leading-relaxed font-sans">{report.technicalAnalysis.smcConcepts.fvg}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
                      <div className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Liquidity Pools</div>
                      <p className="text-xs text-gray-600 leading-relaxed font-sans">{report.technicalAnalysis.smcConcepts.liquidity}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3.5">
                  <h4 className="text-sm font-semibold text-gray-900">Technical Indicators</h4>
                  <div className="divide-y divide-gray-100">
                    {report.technicalAnalysis.indicators.map((ind, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-xs">
                        <span className="font-semibold text-gray-700">{ind.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-500">{ind.value}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            ind.signal === "Bullish" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : ind.signal === "Bearish" 
                              ? "bg-rose-50 text-rose-700 border border-rose-100" 
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}>
                            {ind.signal}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Key Structural Parameters</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-gray-400">Current Trend</div>
                      <div className="font-bold text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-indigo-500" />
                        {report.technicalAnalysis.trend} ({report.technicalAnalysis.strength})
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Chart Pattern</div>
                      <div className="font-semibold text-slate-700 mt-0.5">{report.technicalAnalysis.patterns}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Fundamentals & DCF */}
        {activeTab === "fundamental" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Financial Health & Growth Trajectory</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mt-3">{report.fundamentalAnalysis.details}</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Discounted Cash Flow (DCF) Model Projections</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-center">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Intrinsic DCF Value</div>
                      <div className="text-lg font-extrabold text-indigo-600 mt-1">{report.valuation.dcfCalculation.dcfValue}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-center">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Discount Rate (WACC)</div>
                      <div className="text-lg font-bold text-slate-700 mt-1">{report.valuation.dcfCalculation.discountRate}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-center">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Terminal Growth Rate</div>
                      <div className="text-lg font-bold text-slate-700 mt-1">{report.valuation.dcfCalculation.growthRate}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{report.valuation.details}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Key Financial Ratios</h4>
                  <div className="divide-y divide-gray-100">
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Revenue Growth</span>
                      <span className="font-bold text-slate-700">{report.fundamentalAnalysis.revenueGrowth}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Profit Growth</span>
                      <span className="font-bold text-slate-700">{report.fundamentalAnalysis.profitGrowth}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Operating Margin</span>
                      <span className="font-bold text-slate-700">{report.fundamentalAnalysis.operatingMargin}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Net Margin</span>
                      <span className="font-bold text-slate-700">{report.fundamentalAnalysis.netMargin}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">EPS</span>
                      <span className="font-bold text-slate-700">{report.fundamentalAnalysis.eps}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">ROE</span>
                      <span className="font-bold text-slate-700">{report.fundamentalAnalysis.roe}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">ROCE</span>
                      <span className="font-bold text-slate-700">{report.fundamentalAnalysis.roce}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Debt to Equity</span>
                      <span className={`font-bold ${parseFloat(report.fundamentalAnalysis.debtToEquity) > 1.5 ? "text-rose-600" : "text-slate-700"}`}>
                        {report.fundamentalAnalysis.debtToEquity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Valuation Multiples</h4>
                  <div className="divide-y divide-gray-100">
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Trailing P/E Ratio</span>
                      <span className="font-mono font-bold text-indigo-600">{report.valuation.pe}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Price to Book (P/B)</span>
                      <span className="font-mono font-semibold text-slate-700">{report.valuation.pb}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">PEG Ratio</span>
                      <span className="font-mono font-semibold text-slate-700">{report.valuation.peg}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-500">Dividend Yield</span>
                      <span className="font-mono font-semibold text-slate-700">{report.valuation.dividendYield}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Catalysts & Risks */}
        {activeTab === "risks" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Identified Catalyst Timeline & News Sentiment</h4>
                  
                  <div className="mt-4 space-y-3">
                    {report.newsSentiment.articles.map((art, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5 ${
                          art.sentiment === "Positive" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : art.sentiment === "Negative" 
                            ? "bg-rose-50 text-rose-700 border border-rose-100" 
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                          {art.sentiment}
                        </span>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-800">{art.headline}</p>
                          <div className="text-[10px] text-gray-400 font-medium">Source: {art.source} | Impact: {art.impact}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-4 leading-relaxed">{report.newsSentiment.details}</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Forward-Looking Bull Catalysts</h4>
                  <ul className="list-disc list-inside space-y-2 mt-4 text-xs text-gray-600 leading-relaxed">
                    {report.finalRecommendation.catalysts.map((cat, i) => (
                      <li key={i}>{cat}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3.5">
                  <h4 className="text-sm font-semibold text-gray-900">Risk Matrix</h4>
                  <div className="space-y-3">
                    {report.riskAnalysis.risks.map((risk, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-700">{risk.category}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            risk.rating === "Low" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : risk.rating === "Medium" 
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                              : risk.rating === "High" 
                              ? "bg-amber-50 text-amber-700 border border-amber-100" 
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {risk.rating} Risk
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-sans">{risk.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
                  <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Overall Stance</div>
                  <div>
                    <div className="text-gray-400">Risk Rating</div>
                    <div className="font-bold text-slate-700 mt-0.5">{report.riskAnalysis.overallRiskRating} Risk</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Threat Matrix Mitigation</div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1 font-sans">Strict stop-loss levels are highly recommended to cap extreme volatility.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Peer Comparison */}
        {activeTab === "peers" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Industry Benchmark Comparisons</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="px-5 py-3.5 font-bold">Peer Name</th>
                      <th className="px-5 py-3.5 font-bold">P/E Ratio</th>
                      <th className="px-5 py-3.5 font-bold">ROE %</th>
                      <th className="px-5 py-3.5 font-bold">Revenue Growth</th>
                      <th className="px-5 py-3.5 font-bold">Net Margin</th>
                      <th className="px-5 py-3.5 font-bold">Debt to Equity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {/* Focus Ticker */}
                    <tr className="bg-indigo-50/20 font-medium">
                      <td className="px-5 py-3.5 text-indigo-700 font-bold">{report.companyName} ({report.ticker}) [Subject]</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{report.valuation.pe}</td>
                      <td className="px-5 py-3.5">{report.fundamentalAnalysis.roe}</td>
                      <td className="px-5 py-3.5">{report.fundamentalAnalysis.revenueGrowth}</td>
                      <td className="px-5 py-3.5">{report.fundamentalAnalysis.netMargin}</td>
                      <td className="px-5 py-3.5">{report.fundamentalAnalysis.debtToEquity}</td>
                    </tr>
                    {/* Peers */}
                    {report.peerComparison.peers.map((peer, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{peer.name}</td>
                        <td className="px-5 py-3.5 font-mono">{peer.pe}</td>
                        <td className="px-5 py-3.5">{peer.roe}</td>
                        <td className="px-5 py-3.5">{peer.revenueGrowth}</td>
                        <td className="px-5 py-3.5">{peer.netMargin}</td>
                        <td className="px-5 py-3.5">{peer.debtToEquity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                Benchmark Competitive Analysis
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">{report.peerComparison.analysis}</p>
            </div>
          </div>
        )}

        {/* TAB 6: Custom Investing Rule Checklist */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Custom Investing Rules Compliance Audit</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Evaluating how this ticker conforms to your active Custom Knowledge Base trading rules and financial frameworks.
                </p>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {report.kbRulesEvaluation.map((evaluation, i) => (
                  <div key={i} className="p-4 bg-white flex items-start gap-3 flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5">{getPassedIcon(evaluation.passed)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-800">
                            Rule {evaluation.ruleId}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getPassedBg(evaluation.passed)}`}>
                            {evaluation.passed}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                          {evaluation.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {report.kbRulesEvaluation.length === 0 && (
                  <div className="p-10 text-center text-xs text-gray-400">
                    No custom investing rules were active during this analysis run.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
