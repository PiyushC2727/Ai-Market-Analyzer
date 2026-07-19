export interface InvestingRule {
  id: string;
  name: string;
  category: "Technical" | "Fundamental" | "SMC/ICT" | "Risk Management" | "Psychology" | "Other";
  description: string;
  active: boolean;
  isCustom?: boolean;
}

export interface RuleEvaluation {
  ruleId: string;
  passed: "Passed" | "Failed" | "Neutral";
  reason: string;
}

export interface SupportResistance {
  support: string[];
  resistance: string[];
}

export interface TechnicalIndicator {
  name: string;
  value: string;
  signal: "Bullish" | "Bearish" | "Neutral";
}

export interface SmcConcepts {
  orderBlocks: string;
  fvg: string;
  liquidity: string;
}

export interface TechnicalData {
  trend: "Bullish" | "Bearish" | "Neutral";
  momentum: string;
  strength: string;
  supportResistance: SupportResistance;
  indicators: TechnicalIndicator[];
  smcConcepts: SmcConcepts;
  patterns: string;
  technicalScore: number;
  details: string;
}

export interface FundamentalData {
  revenueGrowth: string;
  profitGrowth: string;
  operatingMargin: string;
  netMargin: string;
  eps: string;
  debtToEquity: string;
  roe: string;
  roce: string;
  fundamentalScore: number;
  details: string;
}

export interface DcfModel {
  dcfValue: string;
  discountRate: string;
  growthRate: string;
}

export interface ValuationData {
  intrinsicValue: string;
  pe: string;
  pb: string;
  peg: string;
  dividendYield: string;
  dcfCalculation: DcfModel;
  valuationScore: number;
  details: string;
}

export interface NewsArticle {
  headline: string;
  source: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  impact: string;
}

export interface NewsSentiment {
  articles: NewsArticle[];
  overallSentiment: "Bullish" | "Bearish" | "Neutral";
  sentimentScore: number;
  details: string;
}

export interface RiskFactor {
  category: string;
  rating: "Low" | "Medium" | "High" | "Extreme";
  description: string;
}

export interface RiskAnalysis {
  risks: RiskFactor[];
  overallRiskRating: "Low" | "Medium" | "High" | "Extreme";
  riskScore: number; // 0 to 100
}

export interface PeerMetrics {
  name: string;
  pe: string;
  roe: string;
  revenueGrowth: string;
  netMargin: string;
  debtToEquity: string;
}

export interface PeerComparison {
  peers: PeerMetrics[];
  analysis: string;
}

export interface FinalRecommendation {
  recommendation: "Strong Buy" | "Buy" | "Accumulate" | "Hold" | "Reduce" | "Sell" | "Strong Sell";
  expectedTimeHorizon: string;
  suggestedEntryZone: string;
  stopLoss: string;
  targets: string[]; // exactly 3 targets
  marginOfSafety: string;
  probabilityOfSuccess: string;
  confidenceScore: number;
  investmentThesis: string;
  keyPositives: string[];
  keyNegatives: string[];
  catalysts: string[];
  risks: string[];
}

export interface AnalysisReport {
  ticker: string;
  companyName: string;
  currentPrice: string;
  changePercent: string;
  sector: string;
  industry: string;
  marketCap: string;
  executiveSummary: string;
  companyOverview: {
    businessModel: string;
    keyProducts: string;
    competitiveAdvantage: string;
    moatRating: "Wide" | "Narrow" | "None";
  };
  technicalAnalysis: TechnicalData;
  fundamentalAnalysis: FundamentalData;
  valuation: ValuationData;
  newsSentiment: NewsSentiment;
  riskAnalysis: RiskAnalysis;
  peerComparison: PeerComparison;
  kbRulesEvaluation: RuleEvaluation[];
  finalRecommendation: FinalRecommendation;
  isDemoFallback?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ResearchSession {
  id: string;
  timestamp: string;
  symbol: string;
  companyName: string;
  recommendation: string;
  confidenceScore: number;
  report: AnalysisReport;
  sources: GroundingSource[];
  isDemoFallback?: boolean;
}
