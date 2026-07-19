import React from "react";
import { ResearchSession } from "../types";
import { History, Calendar, Trash2, ArrowUpRight, Search } from "lucide-react";

interface HistoryViewProps {
  sessions: ResearchSession[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  activeSessionId?: string;
}

export default function HistoryView({
  sessions,
  onSelectSession,
  onDeleteSession,
  activeSessionId,
}: HistoryViewProps) {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getBadgeColor = (rec: string) => {
    const r = rec.toLowerCase();
    if (r.includes("strong buy")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (r.includes("buy") || r.includes("accumulate")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (r.includes("hold")) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-rose-50 text-rose-700 border-rose-100";
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-semibold text-gray-900 font-sans tracking-tight flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-600" />
          Research Archives
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Review and compare your historically run stock intelligence reports saved in local storage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const badgeClass = getBadgeColor(session.recommendation);
          return (
            <div
              key={session.id}
              className={`border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                isActive
                  ? "bg-white border-indigo-500 ring-2 ring-indigo-500/10 shadow-md"
                  : "bg-white border-gray-100 shadow-sm"
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 font-sans tracking-tight flex items-center gap-1.5 uppercase">
                      {session.symbol}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {session.report.sector}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                      {session.companyName}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border shrink-0 ${badgeClass}`}>
                    {session.recommendation}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(session.timestamp)}</span>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Confidence: <span className="font-extrabold text-slate-700">{session.confidenceScore}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded-lg"
                  >
                    Load Report
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="col-span-full text-center py-16 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Search className="h-9 w-9 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">Your Research Archives is Empty</p>
            <p className="text-xs text-gray-400 mt-1">
              Search and analyze a stock ticker in the Intelligence Hub to save analyses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
