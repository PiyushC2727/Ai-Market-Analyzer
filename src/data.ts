import { InvestingRule } from "./types";

export const PRESET_RULES: InvestingRule[] = [
  {
    id: "kb-001",
    name: "Minimum Risk-to-Reward Ratio 1:2",
    category: "Risk Management",
    description: "Suggested targets must provide at least twice the potential return compared to the stop-loss distance from the suggested entry zone.",
    active: true
  },
  {
    id: "kb-002",
    name: "Double-Digit ROE & Capital Efficiency",
    category: "Fundamental",
    description: "The business must exhibit a Return on Equity (ROE) greater than 15% and stable or expanding operating margins.",
    active: true
  },
  {
    id: "kb-003",
    name: "Order Block Mitigation & Liquidity Sweep",
    category: "SMC/ICT",
    description: "Verify that price has swept key swing highs/lows and mitigated a higher-timeframe bullish/bearish order block before validating entry.",
    active: true
  },
  {
    id: "kb-004",
    name: "Conservative Leverage Limit",
    category: "Risk Management",
    description: "Debt-to-equity ratio should ideally be below 1.0 to protect capital against sudden macroeconomic contractions.",
    active: true
  },
  {
    id: "kb-005",
    name: "RSI Momentum Filter (Anti-FOMO)",
    category: "Technical",
    description: "Do not execute new long positions if the Daily or Weekly RSI is in extreme overbought territory (above 75).",
    active: true
  },
  {
    id: "kb-006",
    name: "Minimum 15% Margin of Safety",
    category: "Fundamental",
    description: "The current market price must be at least 15% below the calculated DCF-based intrinsic value to provide a buffer for error.",
    active: true
  },
  {
    id: "kb-007",
    name: "Wyckoff Phase C Spring Confirmation",
    category: "Technical",
    description: "Look for a clear Wyckoff Phase C Spring or shakeout on rising volume to confirm accumulation before entering a long position.",
    active: false
  },
  {
    id: "kb-008",
    name: "Macro Trend Alignment",
    category: "Psychology",
    description: "Never fight the primary market momentum or major central bank interest rate trends. Align trades with macro-economic direction.",
    active: true
  }
];
