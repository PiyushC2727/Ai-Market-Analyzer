import React, { useState, useEffect } from "react";
import { 
  Search, ShieldCheck, History, TrendingUp, TrendingDown,
  LineChart, Terminal, Menu, X, HelpCircle, ExternalLink,
  ChevronRight, Compass, Settings, CheckCircle, AlertCircle, ArrowUpRight,
  FileText
} from "lucide-react";
import { PRESET_RULES } from "./data";
import { InvestingRule, AnalysisReport, ResearchSession, GroundingSource } from "./types";
import KnowledgeBase from "./components/KnowledgeBase";
import HistoryView from "./components/HistoryView";
import ScoresSummary from "./components/ScoresSummary";
import TechnicalChart from "./components/TechnicalChart";
import ReportDetails from "./components/ReportDetails";

export default function App() {
  const [activeTab, setActiveTab] = useState<"hub" | "kb" | "history">("hub");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [rules, setRules] = useState<InvestingRule[]>([]);
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<{ symbol: string; name: string; exchange: string; quoteType: string; isIndian: boolean }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggest, setIsSearchingSuggest] = useState(false);

  // Fetch real-time search suggestions when typing
  useEffect(() => {
    const query = searchSymbol.trim();
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingSuggest(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchSuggestions(data.quotes || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Error fetching stock suggestions:", err);
      } finally {
        setIsSearchingSuggest(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchSymbol]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSuggestions(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const workflowSteps = [
    "Establishing secure pipe to Grounded Google Search Index...",
    "Retrieving live OHLCV data, market capitalization, and industry ratios...",
    "Auditing technical charts, EMA crossovers, RSI, and SMC structures...",
    "Parsing balance sheets, ROCE indicators, and cash flow growth...",
    "Formulating Discounted Cash Flow models and margin of safety grids...",
    "Extracting global news tickers, sentiment ratings, and macro trends...",
    "Mitigating risks and cross-referencing Custom Knowledge Base guidelines...",
    "Compiling final recommendation parameters and target corridors..."
  ];

  // Initialize data from localStorage
  useEffect(() => {
    const storedRules = localStorage.getItem("ei_investing_rules");
    if (storedRules) {
      try {
        setRules(JSON.parse(storedRules));
      } catch {
        setRules(PRESET_RULES);
      }
    } else {
      setRules(PRESET_RULES);
    }

    const storedSessions = localStorage.getItem("ei_research_sessions");
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions) as ResearchSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSession(parsed[0]);
        }
      } catch {
        setSessions([]);
      }
    }
  }, []);

  // Save rules to localStorage
  const saveRules = (updatedRules: InvestingRule[]) => {
    setRules(updatedRules);
    localStorage.setItem("ei_investing_rules", JSON.stringify(updatedRules));
  };

  // Rule management helpers
  const handleToggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    saveRules(updated);
  };

  const handleAddRule = (newRule: Omit<InvestingRule, "id" | "active" | "isCustom">) => {
    const id = `kb-custom-${Date.now()}`;
    const fullRule: InvestingRule = {
      ...newRule,
      id,
      active: true,
      isCustom: true
    };
    saveRules([...rules, fullRule]);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    saveRules(updated);
  };

  const handleResetRules = () => {
    saveRules(PRESET_RULES);
  };

  // Session management helpers
  const handleSelectSession = (id: string) => {
    const found = sessions.find(s => s.id === id);
    if (found) {
      setActiveSession(found);
      setActiveTab("hub");
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("ei_research_sessions", JSON.stringify(updated));
    if (activeSession?.id === id) {
      setActiveSession(updated.length > 0 ? updated[0] : null);
    }
  };

  // Trigger Research Analysis
  const handleRunAnalysis = async (symbolToQuery: string) => {
    const query = symbolToQuery.trim();
    if (!query) return;

    setIsLoading(true);
    setLoadingStep(0);
    setErrorMessage(null);

    // Dynamic loading text timeline simulation to keep user reassured during deep search crawls
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < workflowSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: query,
          rules: rules.filter(r => r.active)
        })
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error(data.error || "Failed to process stock analysis.");
      }

      const report: AnalysisReport = data.analysis;
      const sources: GroundingSource[] = data.sources || [];

      // Create new session object
      const newSession: ResearchSession = {
        id: `sess-${Date.now()}`,
        timestamp: new Date().toISOString(),
        symbol: report.ticker,
        companyName: report.companyName,
        recommendation: report.finalRecommendation.recommendation,
        confidenceScore: report.finalRecommendation.confidenceScore,
        report,
        sources,
        isDemoFallback: report.isDemoFallback
      };

      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      localStorage.setItem("ei_research_sessions", JSON.stringify(updatedSessions));
      setActiveSession(newSession);
      setSearchSymbol("");
      setActiveTab("hub");

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setErrorMessage(err.message || "An error occurred while running the research pipeline.");
    } finally {
      setIsLoading(false);
    }
  };

  const trendIsBullish = activeSession?.report.technicalAnalysis.trend === "Bullish";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <LineChart className="h-5 w-5" />
          </div>
          <span className="font-sans font-black tracking-wider text-slate-800 text-sm">
            EQUITY INTELLIGENCE
          </span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar Nav */}
        <aside className={`
          fixed lg:sticky top-0 lg:top-0 bottom-0 left-0 z-50 
          w-64 bg-slate-900 text-slate-300 border-r border-slate-800 
          flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          h-[calc(100vh-4rem)] lg:h-screen
        `}>
          <div className="p-6 space-y-7">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-3 border-b border-slate-800 pb-5">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-black text-white text-sm tracking-wider font-sans">
                  EQUITY ANALYTICS
                </h1>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
                  Institutional Intelligence
                </p>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1.5">
              <button
                onClick={() => { setActiveTab("hub"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                  activeTab === "hub"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Compass className="h-4 w-4" />
                Intelligence Hub
              </button>

              <button
                onClick={() => { setActiveTab("kb"); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                  activeTab === "kb"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4" />
                  Knowledge Base
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {rules.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("history"); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                  activeTab === "history"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="h-4 w-4" />
                  Research Archives
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {sessions.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Footer State indicators */}
          <div className="p-6 border-t border-slate-800">
            <div className="bg-slate-800/30 border border-slate-800/50 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isLoading ? "Analyzing..." : "Status: Ready"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">2026 UTC</span>
            </div>
          </div>
        </aside>

        {/* Desktop Sidebar Backdrop */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/45 lg:hidden z-30 backdrop-blur-xs"
          />
        )}

        {/* Main Panel Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          
          {/* TAB 1: Intelligence Hub */}
          {activeTab === "hub" && (
            <div className="space-y-6">
              {/* Search Console */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="max-w-2xl">
                  <h2 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Run Live Equity Analysis</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Query any corporate ticker symbol or stock name. Our AI pipeline pulls up-to-the-minute grounded data across global sources, computes deep analytical models, and audits them using your active trading guidelines.
                  </p>
                </div>

                 <form 
                  onSubmit={(e) => { e.preventDefault(); handleRunAnalysis(searchSymbol); }}
                  className="flex gap-2 max-w-xl"
                >
                  <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
                    <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchSymbol}
                      onChange={(e) => setSearchSymbol(e.target.value)}
                      onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                      placeholder="e.g., TSLA, Apple, Nvidia, Reliance..."
                      className="w-full text-sm pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                      disabled={isLoading}
                    />

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-100 animate-fade-in">
                        {searchSuggestions.map((item) => (
                          <button
                            key={item.symbol}
                            type="button"
                            onClick={() => {
                              handleRunAnalysis(item.symbol);
                              setShowSuggestions(false);
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-black text-indigo-600 uppercase tracking-wide">
                                  {item.symbol}
                                </span>
                                {item.isIndian && (
                                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded uppercase">
                                    NSE/BSE
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-slate-400 font-mono">
                                  {item.exchange} • {item.quoteType}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 font-semibold truncate group-hover:text-indigo-900">
                                {item.name}
                              </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    )}

                    {isSearchingSuggest && (
                      <div className="absolute right-3 top-3 flex items-center justify-center">
                        <div className="h-4 w-4 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm tracking-wide shrink-0 transition-all cursor-pointer disabled:bg-indigo-400"
                    disabled={isLoading || !searchSymbol.trim()}
                  >
                    Generate Analysis
                  </button>
                </form>

                {/* Ticker Quick Tags */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 pt-1">
                  <span className="font-medium text-gray-400">Popular Queries:</span>
                  {["RELIANCE", "TCS", "TATAMOTORS", "INFY", "AAPL", "NVDA", "TSLA"].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleRunAnalysis(sym)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                      disabled={isLoading}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 items-start animate-fade-in">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-800">Pipeline Execution Interrupted</h4>
                    <p className="text-xs text-rose-600 mt-1 font-sans">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Loader Pipeline Animation */}
              {isLoading && (
                <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800 flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                  <div className="relative flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <Terminal className="h-6 w-6 text-indigo-400 absolute" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-lg font-black tracking-tight">Compiling Equity Intel</h3>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
                      Step {loadingStep + 1} of {workflowSteps.length}
                    </p>
                    <p className="text-sm text-slate-400 font-mono italic leading-relaxed pt-2">
                      &quot;{workflowSteps[loadingStep]}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Main Analysis Output Desk */}
              {!isLoading && activeSession && (
                <div className="space-y-6 animate-fade-in">
                  {/* Graceful Simulation Fallback Alert */}
                  {(activeSession.isDemoFallback || activeSession.report.isDemoFallback) && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 sm:p-5 flex gap-3.5 items-start text-xs text-amber-800 animate-fade-in shadow-xs">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-amber-900 tracking-tight flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          sandbox simulation active
                        </h4>
                        <p className="leading-relaxed text-amber-700 font-sans">
                          The live Gemini Search Indexing quota has been temporarily exhausted. However, <strong>real-time stock pricing, company name, change percent, and market metrics have been successfully fetched live from Yahoo Finance/NSE/BSE</strong>. To keep your research uninterrupted, the deep analysis has gracefully transitioned to a <strong>high-fidelity deterministic sandbox projection</strong> for <strong>{activeSession.symbol}</strong> using these actual live figures. All custom investing rules, chart profiles, technical indicators, and DCF metrics are fully synthesized for diagnostic review.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ticker Snapshot Card */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-black text-slate-800 font-sans tracking-tight">
                          {activeSession.report.companyName}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                          {activeSession.report.ticker}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        Sector: <span className="font-semibold text-slate-700">{activeSession.report.sector}</span> | Industry: <span className="font-semibold text-slate-700">{activeSession.report.industry}</span> | Cap: <span className="font-semibold text-slate-700">{activeSession.report.marketCap}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-800 font-mono">
                          {activeSession.report.currentPrice}
                        </div>
                        <div className={`text-xs font-bold flex items-center justify-end gap-1 ${
                          activeSession.report.changePercent.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {activeSession.report.changePercent.startsWith("+") ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {activeSession.report.changePercent}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Dials Grid */}
                  <ScoresSummary
                    recommendation={activeSession.report.finalRecommendation.recommendation}
                    technicalScore={activeSession.report.technicalAnalysis.technicalScore}
                    fundamentalScore={activeSession.report.fundamentalAnalysis.fundamentalScore}
                    valuationScore={activeSession.report.valuation.valuationScore}
                    sentimentScore={activeSession.report.newsSentiment.sentimentScore}
                    riskScore={activeSession.report.riskAnalysis.riskScore}
                    overallConfidence={activeSession.report.finalRecommendation.confidenceScore}
                  />

                  {/* Visual Projection and Key Target Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <TechnicalChart
                        trend={activeSession.report.technicalAnalysis.trend}
                        currentPrice={activeSession.report.currentPrice}
                        suggestedEntryZone={activeSession.report.finalRecommendation.suggestedEntryZone}
                        stopLoss={activeSession.report.finalRecommendation.stopLoss}
                        targets={activeSession.report.finalRecommendation.targets}
                        symbol={activeSession.symbol}
                      />
                    </div>

                    {/* Stance Dashboard Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                          Targets Corridors
                        </h3>
                        <div className="divide-y divide-gray-100 text-xs">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400 font-medium">Suggested Entry Zone</span>
                            <span className="font-bold text-slate-700 font-mono">{activeSession.report.finalRecommendation.suggestedEntryZone}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400 font-medium">Stop Loss Threshold</span>
                            <span className="font-bold text-rose-600 font-mono">{activeSession.report.finalRecommendation.stopLoss}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400 font-medium">Target 1</span>
                            <span className="font-bold text-emerald-600 font-mono">{activeSession.report.finalRecommendation.targets[0] || "N/A"}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400 font-medium">Target 2</span>
                            <span className="font-bold text-emerald-600 font-mono">{activeSession.report.finalRecommendation.targets[1] || "N/A"}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400 font-medium">Target 3</span>
                            <span className="font-bold text-emerald-600 font-mono">{activeSession.report.finalRecommendation.targets[2] || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Est. Success Odds</span>
                          <span className="font-bold text-slate-700">{activeSession.report.finalRecommendation.probabilityOfSuccess}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Time Horizon</span>
                          <span className="font-bold text-indigo-600">{activeSession.report.finalRecommendation.expectedTimeHorizon}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Margin of Safety</span>
                          <span className="font-bold text-emerald-600">{activeSession.report.finalRecommendation.marginOfSafety}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Section Tabbed Reports */}
                  <ReportDetails report={activeSession.report} />

                  {/* High-Conviction Investment Thesis */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      Investment Thesis & Argument Matrix
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
                      <div className="space-y-3">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-2">
                          <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Key Support Pillars (+)</h4>
                          <ul className="list-disc list-inside space-y-1 text-emerald-700 leading-relaxed font-sans">
                            {activeSession.report.finalRecommendation.keyPositives.map((pos, i) => (
                              <li key={i}>{pos}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-2">
                          <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">Critical Threat Pillars (-)</h4>
                          <ul className="list-disc list-inside space-y-1 text-rose-700 leading-relaxed font-sans">
                            {activeSession.report.finalRecommendation.keyNegatives.map((neg, i) => (
                              <li key={i}>{neg}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Detailed Stance reasoning</h4>
                      <p className="text-sm text-gray-700 leading-relaxed font-sans">{activeSession.report.finalRecommendation.investmentThesis}</p>
                    </div>
                  </div>

                  {/* Verification Sources Used Citations */}
                  {activeSession.sources && activeSession.sources.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                        Grounded References & Sources Used
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        To guarantee unbiased, evidence-based data points, these third-party financial publications, press registers, and filings were checked via live search indexation:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeSession.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 rounded-xl p-3 text-xs flex items-start justify-between gap-2 group transition-all"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <p className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
                                {src.title}
                              </p>
                              <span className="text-[10px] text-gray-400 truncate block font-mono max-w-[200px]">
                                {src.uri}
                              </span>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-500 shrink-0 mt-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hub Initial Landing Screen */}
              {!isLoading && !activeSession && (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center max-w-xl mx-auto py-16 space-y-4 shadow-sm">
                  <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Compass className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-800">No Active Analysis Report Loaded</h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto font-sans">
                      Start by typing a company name or ticker symbol (e.g. <strong>AAPL</strong> or <strong>NVIDIA</strong>) above, and click &quot;Generate Analysis&quot;.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Custom Knowledge Base */}
          {activeTab === "kb" && (
            <KnowledgeBase
              rules={rules}
              onToggleRule={handleToggleRule}
              onAddRule={handleAddRule}
              onDeleteRule={handleDeleteRule}
              onResetRules={handleResetRules}
            />
          )}

          {/* TAB 3: Research Archives */}
          {activeTab === "history" && (
            <HistoryView
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              activeSessionId={activeSession?.id}
            />
          )}
        </main>
      </div>
    </div>
  );
}
