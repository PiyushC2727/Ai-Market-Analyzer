import React, { useState } from "react";
import { InvestingRule } from "../types";
import { Plus, Trash2, RotateCcw, ShieldCheck, HelpCircle } from "lucide-react";

interface KnowledgeBaseProps {
  rules: InvestingRule[];
  onToggleRule: (id: string) => void;
  onAddRule: (rule: Omit<InvestingRule, "id" | "active" | "isCustom">) => void;
  onDeleteRule: (id: string) => void;
  onResetRules: () => void;
}

export default function KnowledgeBase({
  rules,
  onToggleRule,
  onAddRule,
  onDeleteRule,
  onResetRules,
}: KnowledgeBaseProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<InvestingRule["category"]>("Technical");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    onAddRule({
      name: name.trim(),
      category,
      description: description.trim(),
    });

    setName("");
    setDescription("");
    setShowAddForm(false);
  };

  const categories: InvestingRule["category"][] = [
    "Technical",
    "Fundamental",
    "SMC/ICT",
    "Risk Management",
    "Psychology",
    "Other",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 font-sans tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Custom Knowledge Base
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure the custom criteria and trading philosophies the AI must apply before grading a stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetRules}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Reset rules to default institutional settings"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Rule
          </button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 animate-fade-in"
        >
          <h3 className="text-sm font-semibold text-gray-800">Create Custom Investing Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Rule Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Inside Bar breakout validation"
                className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InvestingRule["category"])}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description / Conditions</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact logic, ratios, or triggers (e.g., 'Do not purchase if debt-to-equity is > 1.2 or if free cash flow trend has declined for three successive quarters.')"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-20 text-gray-900"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Save Rule
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`border rounded-xl p-4 transition-all hover:shadow-md flex items-start gap-4 ${
              rule.active
                ? "bg-white border-indigo-100 shadow-sm"
                : "bg-gray-50/50 border-gray-200 opacity-75"
            }`}
          >
            <div className="flex items-center h-5">
              <input
                id={`rule-${rule.id}`}
                type="checkbox"
                checked={rule.active}
                onChange={() => onToggleRule(rule.id)}
                className="h-4.5 w-4.5 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  htmlFor={`rule-${rule.id}`}
                  className={`text-sm font-semibold cursor-pointer ${
                    rule.active ? "text-gray-900" : "text-gray-500 line-through"
                  }`}
                >
                  {rule.name}
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    rule.category === "Risk Management"
                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                      : rule.category === "SMC/ICT"
                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                      : rule.category === "Fundamental"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : rule.category === "Technical"
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : rule.category === "Psychology"
                      ? "bg-purple-50 text-purple-700 border border-purple-100"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {rule.category}
                </span>
                {rule.isCustom && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    Custom
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1.5 leading-relaxed ${rule.active ? "text-gray-600" : "text-gray-400"}`}>
                {rule.description}
              </p>
            </div>
            {rule.isCustom && (
              <button
                onClick={() => onDeleteRule(rule.id)}
                className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                title="Delete custom rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50">
            <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No investing rules found.</p>
            <p className="text-xs text-gray-400 mt-1">Reset defaults or add a custom rule to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
