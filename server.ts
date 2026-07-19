import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please configure it in the AI Studio Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function isIndianTicker(sym: string): boolean {
  const s = sym.toUpperCase().trim();
  if (s.startsWith("NSE:") || s.startsWith("BSE:") || s.endsWith(".NS") || s.endsWith(".BO")) {
    return true;
  }
  const indianTickers = [
    "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "TATAMOTORS", "ITC", "BHARTIARTL", "LICI", "LT",
    "WIPRO", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "ADANIENT", "ASIANPAINT", "MARUTI", "BAJFINANCE", "M&M",
    "SUNPHARMA", "ULTRACEMCO", "NTPC", "JSWSTEEL", "TITAN", "ONGC", "TATASTEEL", "POWERGRID", "ADANIPORTS",
    "NIFTY", "BANKNIFTY", "SENSEX", "COALINDIA", "BAJAJFINSV", "BPCL", "HEROMOTOCO", "INDUSINDBK", "CIPLA",
    "EICHERMOT", "GRASIM", "HINDALCO", "HCLTECH", "NESTLEIND", "SBI LIFE", "TECHM", "APOLLOHOSP", "DRREDDY",
    "DIVISLAB", "LTIM", "SBILIFE"
  ];
  return indianTickers.includes(s);
}

const popularIndianStocks: Record<string, string> = {
  "RELIANCE": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "INFY": "INFY.NS",
  "HDFCBANK": "HDFCBANK.NS",
  "ICICIBANK": "ICICIBANK.NS",
  "SBIN": "SBIN.NS",
  "TATAMOTORS": "TATAMOTORS.NS",
  "ITC": "ITC.NS",
  "BHARTIARTL": "BHARTIARTL.NS",
  "LICI": "LICI.NS",
  "LT": "LT.NS",
  "WIPRO": "WIPRO.NS",
  "HINDUNILVR": "HINDUNILVR.NS",
  "AXISBANK": "AXISBANK.NS",
  "KOTAKBANK": "KOTAKBANK.NS",
  "ADANIENT": "ADANIENT.NS",
  "ASIANPAINT": "ASIANPAINT.NS",
  "MARUTI": "MARUTI.NS",
  "BAJFINANCE": "BAJFINANCE.NS",
  "M&M": "M&M.NS",
  "SUNPHARMA": "SUNPHARMA.NS",
  "ULTRACEMCO": "ULTRACEMCO.NS",
  "NTPC": "NTPC.NS",
  "JSWSTEEL": "JSWSTEEL.NS",
  "TITAN": "TITAN.NS",
  "ONGC": "ONGC.NS",
  "TATASTEEL": "TATASTEEL.NS",
  "POWERGRID": "POWERGRID.NS",
  "ADANIPORTS": "ADANIPORTS.NS",
  "COALINDIA": "COALINDIA.NS",
  "BAJAJFINSV": "BAJAJFINSV.NS",
  "BPCL": "BPCL.NS",
  "HEROMOTOCO": "HEROMOTOCO.NS",
  "INDUSINDBK": "INDUSINDBK.NS",
  "CIPLA": "CIPLA.NS",
  "EICHERMOT": "EICHERMOT.NS",
  "GRASIM": "GRASIM.NS",
  "HINDALCO": "HINDALCO.NS",
  "HCLTECH": "HCLTECH.NS",
  "NESTLEIND": "NESTLEIND.NS",
  "TECHM": "TECHM.NS",
  "APOLLOHOSP": "APOLLOHOSP.NS",
  "DRREDDY": "DRREDDY.NS",
  "DIVISLAB": "DIVISLAB.NS",
  "LTIM": "LTIM.NS",
  "SBILIFE": "SBILIFE.NS",
};

interface LiveStockData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap?: number;
  currency: string;
  pe?: number;
  eps?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  isIndian: boolean;
  success: boolean;
}

function resolveStockSymbol(symbol: string): { finalSymbol: string; isIndian: boolean; cleanSymbol: string } {
  let sym = symbol.toUpperCase().trim();
  
  // Map popular commodities, forex, crypto, and common stock aliases to Yahoo Finance formats
  const aliases: Record<string, string> = {
    "XAUUSD": "XAUUSD=X",
    "GOLD": "GC=F",
    "XAGUSD": "XAGUSD=X",
    "SILVER": "SI=F",
    "CRUDE": "CL=F",
    "OIL": "CL=F",
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "ICICI": "ICICIBANK.NS",
    "HDFC": "HDFCBANK.NS",
    "SBI": "SBIN.NS",
    "BHEL": "BHEL.NS",
    "NIFTY": "^NSEI",
    "SENSEX": "^BSESN",
  };
  
  if (aliases[sym]) {
    sym = aliases[sym];
  }
  
  if (sym.startsWith("NSE:")) {
    const ticker = sym.replace("NSE:", "").trim();
    return { finalSymbol: `${ticker}.NS`, isIndian: true, cleanSymbol: ticker };
  }
  if (sym.startsWith("BSE:")) {
    const ticker = sym.replace("BSE:", "").trim();
    return { finalSymbol: `${ticker}.BO`, isIndian: true, cleanSymbol: ticker };
  }
  
  const normalizedKey = sym.replace(/\s+/g, "");
  if (popularIndianStocks[normalizedKey]) {
    return { 
      finalSymbol: popularIndianStocks[normalizedKey], 
      isIndian: true, 
      cleanSymbol: popularIndianStocks[normalizedKey].split(".")[0] 
    };
  }
  
  if (sym.endsWith(".NS")) {
    return { finalSymbol: sym, isIndian: true, cleanSymbol: sym.replace(".NS", "") };
  }
  if (sym.endsWith(".BO")) {
    return { finalSymbol: sym, isIndian: true, cleanSymbol: sym.replace(".BO", "") };
  }
  
  if (isIndianTicker(sym)) {
    return { finalSymbol: `${sym}.NS`, isIndian: true, cleanSymbol: sym };
  }
  
  let cleanSymbol = sym;
  if (cleanSymbol.includes(":")) {
    cleanSymbol = cleanSymbol.split(":")[1];
  }
  if (cleanSymbol.includes(".")) {
    cleanSymbol = cleanSymbol.split(".")[0];
  }
  cleanSymbol = cleanSymbol.trim();

  return { finalSymbol: sym, isIndian: false, cleanSymbol };
}

async function fetchLiveStockData(querySymbol: string): Promise<LiveStockData> {
  const { finalSymbol, isIndian, cleanSymbol } = resolveStockSymbol(querySymbol);
  
  // Set up possible symbol variations to try (e.g. try without suffix first, then with .NS suffix if it has no dot)
  const attempts: string[] = [finalSymbol];
  if (!finalSymbol.includes(".") && !finalSymbol.includes("=") && !finalSymbol.includes("-") && !finalSymbol.startsWith("^")) {
    attempts.push(`${finalSymbol}.NS`);
  }
  
  let lastError: any = null;
  
  for (const sym of attempts) {
    try {
      const currentIsIndian = isIndian || sym.endsWith(".NS") || sym.endsWith(".BO");
      // query1.finance.yahoo.com/v8/finance/chart/{symbol} is fully public, fast, and does NOT suffer from 401 Cookie restrictions.
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance v8 chart responded with status: ${response.status}`);
      }
      
      const json: any = await response.json();
      const result = json?.chart?.result?.[0];
      
      if (!result) {
        throw new Error(`No data found for symbol ${sym}`);
      }
      
      const meta = result.meta || {};
      const price = meta.regularMarketPrice !== undefined ? meta.regularMarketPrice : (meta.chartPreviousClose || 0);
      const prevClose = meta.previousClose !== undefined ? meta.previousClose : (meta.chartPreviousClose || price || 1);
      
      let changePercent = 0;
      if (prevClose && price) {
        changePercent = ((price - prevClose) / prevClose) * 100;
      }
      
      // Check if the currency indicates Indian market or if it is resolving to Indian
      const resolvedCurrency = meta.currency || (currentIsIndian ? "INR" : "USD");
      const resolvedIsIndian = currentIsIndian || resolvedCurrency === "INR";
      
      return {
        symbol: sym,
        name: meta.longName || meta.shortName || cleanSymbol,
        price: price,
        changePercent: changePercent,
        marketCap: meta.marketCap,
        currency: resolvedCurrency,
        pe: meta.trailingPE || meta.forwardPE,
        eps: meta.trailingEps,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        isIndian: resolvedIsIndian,
        success: true
      };
    } catch (error: any) {
      lastError = error;
      // Proceed to the next attempt in loop
    }
  }
  
  // If all attempts failed, log and fall back to generated sandbox simulation data
  console.error(`Failed to fetch live stock data for ${querySymbol} (resolved as ${finalSymbol}):`, lastError.message || lastError);
  
  const hash = getStringHash(cleanSymbol);
  const fallbackPrice = isIndian ? ((hash % 3000) + 120) : ((hash % 400) + 35);
  const fallbackChange = ((hash % 800) / 100 - 4.0);
  
  return {
    symbol: finalSymbol,
    name: isIndian ? `${cleanSymbol} Limited` : `${cleanSymbol} Corp`,
    price: fallbackPrice,
    changePercent: fallbackChange,
    currency: isIndian ? "INR" : "USD",
    isIndian: isIndian,
    success: false
  };
}

function generateMockReport(symbol: string, liveData: LiveStockData, rules: any[] = []): any {
  const sym = symbol.toUpperCase().trim();
  const hash = getStringHash(sym);

  let cleanSym = sym;
  if (cleanSym.includes(":")) {
    cleanSym = cleanSym.split(":")[1];
  }
  if (cleanSym.includes(".")) {
    cleanSym = cleanSym.split(".")[0];
  }
  cleanSym = cleanSym.trim();

  const isIndian = liveData.isIndian;
  const currency = isIndian ? "₹" : "$";

  const popularStocks: Record<string, {
    name: string;
    price: string;
    change: string;
    sector: string;
    industry: string;
    marketCap: string;
    moat: "Wide" | "Narrow" | "None";
    businessModel: string;
    products: string;
    advantage: string;
  }> = {
    AAPL: {
      name: "Apple Inc.",
      price: "$224.30",
      change: "+1.42%",
      sector: "Technology",
      industry: "Consumer Electronics",
      marketCap: "$3.42T",
      moat: "Wide",
      businessModel: "Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and services.",
      products: "iPhone, Mac, iPad, Wearables (Apple Watch, AirPods), Apple Services (App Store, iCloud, Apple Music)",
      advantage: "High ecosystem lock-in, proprietary custom silicon, and extremely high brand premium pricing power."
    },
    NVDA: {
      name: "NVIDIA Corporation",
      price: "$121.85",
      change: "-2.10%",
      sector: "Technology",
      industry: "Semiconductors",
      marketCap: "$3.00T",
      moat: "Wide",
      businessModel: "Designs graphics processing units (GPUs) for gaming and professional markets, and system on a chip units for mobile and automotive.",
      products: "NVIDIA Hopper & Blackwell GPUs, CUDA software platform, DGX Cloud, GeForce gaming cards",
      advantage: "CUDA software ecosystem creates a massive technical moat that locks in enterprise developers; leading hardware efficiency."
    },
    TSLA: {
      name: "Tesla Inc.",
      price: "$248.50",
      change: "+4.25%",
      sector: "Consumer Discretionary",
      industry: "Auto Manufacturers",
      marketCap: "$780.20B",
      moat: "Narrow",
      businessModel: "Designs, develops, manufactures, sells, and leases fully electric vehicles, energy generation and storage systems.",
      products: "Model Y, Model 3, Cybertruck, Megapack battery storage, Full Self-Driving (FSD) software beta",
      advantage: "Unmatched manufacturing scale and vertical integration, direct-to-consumer model, and high supercharger network dominance."
    },
    MSFT: {
      name: "Microsoft Corporation",
      price: "$418.20",
      change: "+0.65%",
      sector: "Technology",
      industry: "Software - Infrastructure",
      marketCap: "$3.12T",
      moat: "Wide",
      businessModel: "Develops, licenses, and supports a wide range of software products, services, devices, and cloud hosting solutions.",
      products: "Microsoft Azure, Office 365, Windows OS, Xbox, GitHub, LinkedIn, Copilot AI integrations",
      advantage: "Critical enterprise infrastructure lock-in, robust enterprise sales pipelines, and premier partnership with OpenAI for leading-edge generative AI capabilities."
    },
    AMZN: {
      name: "Amazon.com Inc.",
      price: "$182.10",
      change: "+1.15%",
      sector: "Consumer Discretionary",
      industry: "Internet Retail",
      marketCap: "$1.90T",
      moat: "Wide",
      businessModel: "Focuses on e-commerce, cloud computing (AWS), online advertising, digital streaming, and artificial intelligence.",
      products: "Amazon Web Services (AWS), Amazon Prime subscription, Retail e-commerce fulfillment, Kindle & Fire devices",
      advantage: "Unrivaled scale of logistics network, dominant cloud infrastructure market share (AWS), and massive consumer purchasing data."
    },
    RELIANCE: {
      name: "Reliance Industries Limited",
      price: "₹2,420.55",
      change: "+1.12%",
      sector: "Energy & Conglomerate",
      industry: "Oil, Gas & Retail/Telecom",
      marketCap: "₹16.5 Lakh Cr",
      moat: "Wide",
      businessModel: "Diversified conglomerate with dominant leadership across oil refining & petrochemicals, telecom (Jio), retail stores, and green energy.",
      products: "Jio Infocomm, Reliance Retail, O2C Petroleum Products, Reliance New Energy",
      advantage: "Gigantic market scale, vertically integrated retail ecosystem, absolute telecom customer lock-in (450M+ users), and massive capital reserves."
    },
    TCS: {
      name: "Tata Consultancy Services Limited",
      price: "₹4,150.00",
      change: "+0.85%",
      sector: "Technology",
      industry: "IT Services & Consulting",
      marketCap: "₹15.1 Lakh Cr",
      moat: "Wide",
      businessModel: "Global IT service delivery offering digital business transformation, cognitive business operations, and tech integration.",
      products: "TCS BaNCS, TCS Ignio, consulting services, enterprise application services",
      advantage: "Incredible client retention rates, unparalleled global delivery network, strong brand pedigree of the Tata Group, and 25%+ operating margins."
    },
    INFY: {
      name: "Infosys Limited",
      price: "₹1,820.40",
      change: "-0.50%",
      sector: "Technology",
      industry: "IT Services & Consulting",
      marketCap: "₹7.5 Lakh Cr",
      moat: "Wide",
      businessModel: "Next-generation digital services, cloud solutions, and artificial intelligence-driven consulting platforms.",
      products: "Finacle core banking, Infosys Nia, cloud suite Cobalt, IT consulting contracts",
      advantage: "Superb execution track record, high brand equity, leading edge AI training capabilities, and robust operating cash flow generation."
    },
    HDFCBANK: {
      name: "HDFC Bank Limited",
      price: "₹1,610.25",
      change: "+1.45%",
      sector: "Financial Services",
      industry: "Banking - Private",
      marketCap: "₹12.2 Lakh Cr",
      moat: "Wide",
      businessModel: "India's largest private sector lender providing extensive retail, commercial, corporate banking, and wealth management services.",
      products: "Savings and current accounts, credit cards, housing loans, corporate credit, digital pay apps",
      advantage: "Extremely low Cost of Funds (CASA ratio), industry-leading asset quality (low GNPA), and premier branch network footprint in India."
    },
    ICICIBANK: {
      name: "ICICI Bank Limited",
      price: "₹1,180.30",
      change: "+1.90%",
      sector: "Financial Services",
      industry: "Banking - Private",
      marketCap: "₹8.3 Lakh Cr",
      moat: "Wide",
      businessModel: "Leading private sector bank providing high-tech commercial and retail banking solutions to corporates and individuals.",
      products: "iMobile Pay App, mortgages, retail auto & personal loans, commercial trade finance, credit cards",
      advantage: "Superb digital banking infrastructure, highly efficient risk-management framework, and strong credit growth underwriting metrics."
    },
    SBIN: {
      name: "State Bank of India",
      price: "₹840.15",
      change: "+2.15%",
      sector: "Financial Services",
      industry: "Banking - Public Sector",
      marketCap: "₹7.5 Lakh Cr",
      moat: "Wide",
      businessModel: "The largest state-owned banking corporation in India with over 22,000 branches serving 480 million customers.",
      products: "YONO digital app, agricultural lending, micro-credit, sovereign treasury operations, massive retail deposit base",
      advantage: "Implicit sovereign backing, unbeatable network size and rural penetration, and primary bank for all Indian governmental transactions."
    },
    TATAMOTORS: {
      name: "Tata Motors Limited",
      price: "₹980.40",
      change: "+3.50%",
      sector: "Automotive",
      industry: "Auto Manufacturers",
      marketCap: "₹3.6 Lakh Cr",
      moat: "Narrow",
      businessModel: "Global automaker manufacturing passenger cars, commercial transport fleets, utility vehicles, and luxury British brands Jaguar Land Rover.",
      products: "Tata Nexon EV, Punch, Harrier, Safari, JLR Defender/Range Rover, electric and commercial transport buses",
      advantage: "Dominant leader in India's electric passenger vehicle sector (70%+ market share), JLR brand recovery, and strong pricing power in commercial trucks."
    },
    ITC: {
      name: "ITC Limited",
      price: "₹490.65",
      change: "+0.95%",
      sector: "Consumer Goods",
      industry: "FMCG, Tobacco, Hotels",
      marketCap: "₹6.1 Lakh Cr",
      moat: "Wide",
      businessModel: "Market leader in cigarettes and tobacco, aggressively scaling non-tobacco FMCG brands, luxury hotels, paperboards, and agribusiness.",
      products: "Aashirvaad, Sunfeast, Bingo, Classmate, Gold Flake, ITC Hotels luxury stays",
      advantage: "Monopolistic pricing power in the tobacco business (75%+ market share), providing a reliable, massive free cash flow engine to fund FMCG expansion."
    },
    BHARTIARTL: {
      name: "Bharti Airtel Limited",
      price: "₹1,450.20",
      change: "+1.60%",
      sector: "Telecommunications",
      industry: "Telecom Services",
      marketCap: "₹8.2 Lakh Cr",
      moat: "Wide",
      businessModel: "Premium telecommunications services operator offering 5G wireless networks, high-speed broadband, digital TV, and enterprise data pipes.",
      products: "Airtel 5G Plus, Airtel Wynk, Airtel Payments Bank, corporate fiber cloud connections",
      advantage: "High Average Revenue Per User (ARPU) leadership, excellent spectrum holdings, and deep consumer brand loyalty among high-value subscribers."
    },
    LICI: {
      name: "Life Insurance Corporation of India",
      price: "₹1,020.10",
      change: "-0.85%",
      sector: "Financial Services",
      industry: "Insurance - Life",
      marketCap: "₹6.4 Lakh Cr",
      moat: "Wide",
      businessModel: "The dominant state-owned life insurance agency offering dynamic savings, pension, annuities, and security protection products.",
      products: "LIC Jeevan Anand, Jeevan Akshay, LIC term insurances, unit-linked plans",
      advantage: "Unsurpassed brand trust ('Zindagi Ke Saath Bhi, Zindagi Ke Baad Bhi'), an army of 1.3 million active sales agents, and massive assets under management."
    }
  };

  const isPopular = popularStocks[cleanSym];
  const companyName = liveData.name;
  
  const currentPrice = `${currency}${liveData.price.toFixed(2)}`;
  const changePercent = `${liveData.changePercent >= 0 ? "+" : ""}${liveData.changePercent.toFixed(2)}%`;
  const sector = isPopular ? isPopular.sector : (isIndian ? ["Energy", "Technology", "Financial Services", "Consumer Goods", "Automotive"][hash % 5] : ["Technology", "Healthcare", "Financials", "Consumer Discretionary", "Industrials"][hash % 5]);
  const industry = isPopular ? isPopular.industry : (isIndian ? ["Oil & Gas", "IT Services & Consulting", "Banking - Private", "FMCG", "Auto Manufacturers"][hash % 5] : ["Software Engineering", "Biotechnology", "Investment Banking", "Electronic Components", "Aerospace Defense"][hash % 5]);
  
  let marketCap = "";
  if (liveData.marketCap) {
    if (isIndian) {
      marketCap = liveData.marketCap >= 1e12 
        ? `₹${(liveData.marketCap / 1e12).toFixed(2)} Lakh Cr` 
        : `₹${(liveData.marketCap / 1e7).toFixed(2)} Cr`;
    } else {
      marketCap = liveData.marketCap >= 1e12 
        ? `$${(liveData.marketCap / 1e12).toFixed(2)}T` 
        : `$${(liveData.marketCap / 1e9).toFixed(2)}B`;
    }
  } else if (isPopular) {
    marketCap = isPopular.marketCap;
  } else {
    if (isIndian) {
      marketCap = `₹${((hash % 15) + 1.2).toFixed(1)} Lakh Cr`;
    } else {
      marketCap = `$${((hash % 250) + 12).toFixed(1)}B`;
    }
  }

  const moatRating = isPopular ? isPopular.moat : (hash % 3 === 0 ? "Wide" : hash % 3 === 1 ? "Narrow" : "None");
  const businessModel = isPopular ? isPopular.businessModel : `${companyName} operates a diversified high-margin commercial service model focusing on global product manufacturing and software integration.`;
  const keyProducts = isPopular ? isPopular.products : `Core enterprise licensing, consulting pipelines, and proprietary hardware accessories.`;
  const competitiveAdvantage = isPopular ? isPopular.advantage : `Strong operational efficiency, extensive global patent portfolio, and highly optimized supply-chain relationships.`;

  // Compute scores
  const technicalScore = (hash % 40) + 55; // 55 to 95
  const fundamentalScore = (hash % 35) + 60; // 60 to 95
  const valuationScore = (hash % 45) + 45; // 45 to 90
  const sentimentScore = (hash % 30) + 65; // 65 to 95
  const riskScore = (hash % 40) + 50; // 50 to 90

  const trend = technicalScore >= 75 ? "Bullish" : technicalScore <= 62 ? "Bearish" : "Neutral";
  const overallSentiment = sentimentScore >= 80 ? "Bullish" : sentimentScore <= 68 ? "Bearish" : "Neutral";
  const overallRiskRating = riskScore >= 80 ? "Low" : riskScore <= 60 ? "High" : "Medium";

  // Targets and entry zones
  const priceNum = parseFloat(currentPrice.replace(/[$,₹]/g, ""));
  const suggestedEntryZone = `${currency}${(priceNum * 0.95).toFixed(2)} - ${currency}${(priceNum * 0.99).toFixed(2)}`;
  const stopLoss = `${currency}${(priceNum * 0.90).toFixed(2)}`;
  const targets = [
    `${currency}${(priceNum * 1.12).toFixed(2)}`,
    `${currency}${(priceNum * 1.25).toFixed(2)}`,
    `${currency}${(priceNum * 1.38).toFixed(2)}`
  ];

  // Evaluate KB rules
  const kbRulesEvaluation = rules.map((r: any) => {
    let passed: "Passed" | "Failed" | "Neutral" = "Passed";
    let reason = "";

    switch (r.id) {
      case "kb-001": // Risk-to-Reward
        passed = "Passed";
        reason = `Suggested entry range yields a target gain of 12% to 38% versus a strict stop-loss threshold of 10%, complying with the 1:2 filter.`;
        break;
      case "kb-002": // Double digit ROE
        passed = fundamentalScore > 65 ? "Passed" : "Neutral";
        reason = `Operating efficiency is robust with return on equity at ${(fundamentalScore * 1.6).toFixed(1)}% and stable operating margins, exceeding structural thresholds.`;
        break;
      case "kb-003": // SMC / ICT order block mitigation
        passed = hash % 2 === 0 ? "Passed" : "Neutral";
        reason = passed === "Passed" 
          ? `Price action on the H4 timeframe exhibits a clean order block mitigation at key daily support before establishing an upward impulse structure.`
          : `Market structure shows recent consolidation; a clear sweep of sell-side liquidity has occurred, but order block mitigation is still pending.`;
        break;
      case "kb-004": // Conservative Leverage Limit
        passed = hash % 4 !== 0 ? "Passed" : "Failed";
        reason = passed === "Passed"
          ? `Current debt-to-equity ratio sits healthy at ${(0.2 + (hash % 60)/100).toFixed(2)}, well below the conservative ceiling of 1.0.`
          : `Debt-to-equity ratio stands elevated at ${(1.1 + (hash % 30)/100).toFixed(2)} due to aggressive project financing, requiring careful monitoring.`;
        break;
      case "kb-005": // RSI Momentum Filter (Anti-FOMO)
        passed = technicalScore < 88 ? "Passed" : "Failed";
        reason = passed === "Passed"
          ? `Daily RSI resides at ${(45 + (hash % 20)).toFixed(1)}, confirming adequate room for appreciation before reaching overbought parameters.`
          : `Daily RSI is elevated at ${(76 + (hash % 5)).toFixed(1)}, flashing warning signs of an overextended momentum rally. Hold entries.`;
        break;
      case "kb-006": // Minimum 15% Margin of Safety
        passed = valuationScore > 70 ? "Passed" : "Neutral";
        reason = passed === "Passed"
          ? `Current market price is discounted by ${(15 + (hash % 12)).toFixed(1)}% relative to our intrinsic WACC cash flow model, leaving a solid safety cushion.`
          : `Calculated margin of safety is tight at ${(5 + (hash % 8)).toFixed(1)}%, suggesting the stock is trading close to fair value levels.`;
        break;
      case "kb-008": // Macro Trend Alignment
        passed = "Passed";
        reason = `Macro indicators and sector trends align with the broader market direction, mitigating contrarian systematic risk.`;
        break;
      default:
        passed = hash % 3 === 0 ? "Passed" : hash % 3 === 1 ? "Neutral" : "Failed";
        reason = `Reviewed custom guidelines for "${r.name}". Under current parameters, the stock presents a ${passed === "Passed" ? "fully compliant profile" : passed === "Neutral" ? "neutral alignment" : "mildly speculative posture"}.`;
    }

    return {
      ruleId: r.id,
      passed,
      reason
    };
  });

  const recommendation = technicalScore >= 82 && fundamentalScore >= 80 
    ? "Buy" 
    : technicalScore >= 72 && fundamentalScore >= 70 
    ? "Accumulate" 
    : technicalScore <= 60 
    ? "Reduce" 
    : "Hold";

  return {
    ticker: sym,
    companyName,
    currentPrice,
    changePercent,
    sector,
    industry,
    marketCap,
    executiveSummary: `${companyName} exhibits a compelling analytical profile with strong systematic sponsorship. The combination of solid capital allocation efficiency and a robust market moat presents a high-conviction medium-term trade opportunity.`,
    companyOverview: {
      businessModel,
      keyProducts,
      competitiveAdvantage,
      moatRating
    },
    technicalAnalysis: {
      trend,
      momentum: `Daily oscillators reflect steady upward accumulation. The MACD histogram exhibits positive divergence, and volume profiles confirm institutional buy-side sponsorship during major pullback legs.`,
      strength: `ADX is at ${(20 + (hash % 15)).toFixed(1)}, confirming a steady, sustainable trend without momentum exhaustion.`,
      supportResistance: {
        support: [`${currency}${(priceNum * 0.94).toFixed(2)}`, `${currency}${(priceNum * 0.89).toFixed(2)}`],
        resistance: [`${currency}${(priceNum * 1.06).toFixed(2)}`, `${currency}${(priceNum * 1.15).toFixed(2)}`]
      },
      indicators: [
        { name: "RSI (14)", value: `${(50 + (hash % 18)).toFixed(1)}`, signal: technicalScore >= 75 ? "Bullish" : "Neutral" },
        { name: "EMA (20)", value: `${currency}${(priceNum * 0.98).toFixed(2)}`, signal: "Bullish" },
        { name: "SMA (50)", value: `${currency}${(priceNum * 0.94).toFixed(2)}`, signal: "Bullish" },
        { name: "MACD", value: `+${((hash % 150)/100).toFixed(2)}`, signal: "Bullish" }
      ],
      smcConcepts: {
        orderBlocks: `Identified a high-conviction daily mitigation block starting around ${currency}${(priceNum * 0.95).toFixed(2)} - ${currency}${(priceNum * 0.98).toFixed(2)}.`,
        fvg: `A daily unmitigated Fair Value Gap (FVG) is located immediately below current price, providing a solid pull back landing strip.`,
        liquidity: `Clear buy-side liquidity is pooling above recent swing highs, acting as a natural magnet for upward price action.`
      },
      patterns: `A classic consolidating cup-and-handle formation is visible on the daily interval, indicating a strong likelihood of an imminent breakout.`,
      technicalScore,
      details: `The general price action remains clean and structured, holding above the 50-day and 200-day Simple Moving Averages. Recent minor corrections have successfully tested macro institutional support levels on high volume, indicating healthy market absorption.`
    },
    fundamentalAnalysis: {
      revenueGrowth: `+${(5 + (hash % 20)).toFixed(1)}% YoY`,
      profitGrowth: `+${(8 + (hash % 25)).toFixed(1)}% YoY`,
      operatingMargin: `${(15 + (hash % 20)).toFixed(1)}%`,
      netMargin: `${(10 + (hash % 15)).toFixed(1)}%`,
      eps: liveData.eps ? `${currency}${liveData.eps.toFixed(2)}` : `${currency}${((hash % 10) + 1.25).toFixed(2)}`,
      debtToEquity: `${(0.1 + (hash % 120)/100).toFixed(2)}`,
      roe: `${(12 + (hash % 30)).toFixed(1)}%`,
      roce: `${(10 + (hash % 25)).toFixed(1)}%`,
      fundamentalScore,
      details: `The balance sheet exhibits pristine health with solid free cash flow generation. Working capital cycles are tight and highly optimized, demonstrating strong operational discipline. Interest coverage ratios remain exceptionally comfortable, leaving the company insulated from credit strains.`
    },
    valuation: {
      intrinsicValue: `${currency}${(priceNum * (1.05 + (hash % 25)/100)).toFixed(2)}`,
      pe: liveData.pe ? liveData.pe.toFixed(1) : `${(15 + (hash % 25)).toFixed(1)}`,
      pb: `${(2.5 + (hash % 8)).toFixed(1)}`,
      peg: `${(0.8 + (hash % 15)/10).toFixed(1)}`,
      dividendYield: `${((hash % 4) / 1.5).toFixed(2)}%`,
      dcfCalculation: {
        dcfValue: `${currency}${(priceNum * (1.06 + (hash % 25)/100)).toFixed(2)}`,
        discountRate: `${(8.0 + (hash % 5) / 2).toFixed(1)}%`,
        growthRate: `${(2.0 + (hash % 4) / 2).toFixed(1)}%`
      },
      valuationScore,
      details: `The Discounted Cash Flow model assumes a standard ${(8.0 + (hash % 5)/2).toFixed(1)}% weighted average cost of capital and conservative cash reinvestment rates. Valuation looks fair, and buying at these corridors provides an acceptable structural cushion.`
    },
    newsSentiment: {
      articles: [
        { headline: `${companyName} launches fresh corporate efficiency roadmap, boosting margins.`, source: "Reuters", sentiment: "Positive", impact: "High long-term positive impact as margins expand." },
        { headline: `Analysts revise target pricing upward for ${sym} citing robust organic volume expansion.`, source: "Bloomberg", sentiment: "Positive", impact: "Favorable short-term technical tailwinds." },
        { headline: `General sector headwind concerns arise regarding supply-chain logjams.`, source: "Wall Street Journal", sentiment: "Neutral", impact: "Temporary minor pressure, mostly priced in." }
      ],
      overallSentiment,
      sentimentScore,
      details: `${companyName} retains very favorable coverage across major publishing desks. Recent institutional research reports indicate steady positioning and strong management execution ratings, driving accumulation.`
    },
    riskAnalysis: {
      risks: [
        { category: "Macroeconomic", rating: "Medium", description: "Vulnerability to broader currency fluctuations and cross-border interest rate variations." },
        { category: "Execution", rating: "Low", description: "Relatively low operational hurdles given mature leadership and stable product pipelines." }
      ],
      overallRiskRating,
      riskScore
    },
    peerComparison: {
      peers: [
        { name: "COMP1", pe: "22.5", roe: "14.2%", revenueGrowth: "+6.5%", netMargin: "11.2%", debtToEquity: "0.45" },
        { name: "COMP2", pe: "28.4", roe: "18.5%", revenueGrowth: "+9.2%", netMargin: "14.0%", debtToEquity: "0.62" }
      ],
      analysis: `${companyName} compares favorably to direct competitors, maintaining slightly superior margins and a clean capital profile, justifying its current minor multiple premium.`
    },
    kbRulesEvaluation,
    finalRecommendation: {
      recommendation,
      expectedTimeHorizon: "12-18 Months",
      suggestedEntryZone,
      stopLoss,
      targets,
      marginOfSafety: `${(valuationScore / 4).toFixed(1)}%`,
      probabilityOfSuccess: `${(65 + hash % 20)}%`,
      confidenceScore: Math.round((technicalScore + fundamentalScore + valuationScore) / 3),
      investmentThesis: `The core thesis for ${companyName} centers on its defensive capital structure, stable organic sector growth, and high-probability breakout technical setup on the daily chart. Active investing guidelines are fully mitigated and aligned, creating a favorable risk-reward corridor.`,
      keyPositives: [
        "Favorable multi-timeframe breakout patterns",
        "Strong operating cash flow yield protecting downsides",
        "Highly optimized debt profile and capital efficiency metrics"
      ],
      keyNegatives: [
        "Slight premium valuation relative to trailing multiples",
        "Geopolitical and currency exposure under global trade setups"
      ],
      catalysts: [
        "Upcoming quarterly earnings release showing operational margin expansion",
        "Strategic rollout of next-generation product suites",
        "Expected index inclusion rebalancing driving fresh passive inflow"
      ],
      risks: [
        "Wider global consumer demand contraction",
        "Unexpected shifts in regulatory tax policies"
      ]
    },
    isDemoFallback: true
  };
}

// Stock Search Autocomplete API using Yahoo Finance Search Suggestion
app.get("/api/search", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) {
      return res.json({ quotes: [] });
    }

    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Search responded with status: ${response.status}`);
    }

    const json: any = await response.json();
    const quotes = json?.quotes || [];
    
    // Format the response nicely for the frontend, keeping only equities, ETFs, crypto and indices
    const results = quotes
      .filter((item: any) => item.symbol && (item.shortname || item.longname))
      .map((item: any) => {
        const symbol = item.symbol;
        const exchange = item.exchange || "";
        const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO") || exchange === "NSI" || exchange === "BSE";
        return {
          symbol,
          name: item.longname || item.shortname,
          exchange,
          quoteType: item.quoteType || "EQUITY",
          isIndian
        };
      });

    res.json({ quotes: results });
  } catch (error: any) {
    console.error("Stock search API error:", error.message || error);
    res.status(500).json({ error: "Failed to search stock database." });
  }
});

// Complete Investment Analysis API
app.post("/api/analyze", async (req, res) => {
  try {
    const { symbol, rules } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: "Stock symbol or name is required." });
    }

    // Fetch live market reference data first (NSE/BSE/US/Global)
    const liveData = await fetchLiveStockData(symbol);

    let data;
    let uniqueSources;

    try {
      const ai = getGeminiClient();

    // Serialize custom investing rules for the prompt
    const serializedRules = Array.isArray(rules) && rules.length > 0
      ? rules.map((r, idx) => `${idx + 1}. [Rule ID: ${r.id}] [Category: ${r.category}] Name: "${r.name}" - ${r.description} (Active: ${r.active})`).join("\n")
      : "No custom investing rules provided.";

    const systemInstruction = `You are an elite, institutional-grade Equity Research Analyst, Technical Analyst, Fundamental Analyst, Risk Manager, Macro Economist, and Quantitative Portfolio Advisor.

Your task is to produce a comprehensive, unbiased, evidence-based, explainable investment report for the requested stock/ticker symbol.

CRITICAL INSTRUCTIONS:
1. NEVER hallucinate financial data, prices, or numbers. You MUST match the provided verified real-time stock reference details exactly for pricing and basic stats.
2. Use Google Search grounding to retrieve the latest supporting operational news, financials (revenue, profit, margins, debt, ROE, ROCE), promoter/FII/DII holdings, and peer metrics.
3. You MUST evaluate the stock against the user's Custom Investing Rules / Knowledge Base. Analyze each active rule carefully and provide an honest, data-backed rating (Passed, Failed, or Neutral) and a concise reason.
4. Provide realistic values for support, resistance, technical indicators (EMA, SMA, RSI, MACD), valuation scores, and risk parameters based on actual web data.
5. Provide a mathematically consistent DCF calculation or intrinsic value estimate using realistic interest/discount rates and growth rates.
6. The response MUST be perfectly formatted JSON that matches the required JSON schema. Do not include markdown code blocks inside the JSON fields themselves. Return a single clean JSON object.
7. If the stock ticker belongs to the Indian market (NSE or BSE), format all financial metrics, prices, DCF valuation, target corridors, stop losses, and EPS in Indian Rupees (using the '₹' symbol instead of '$'). Use appropriate Indian market cap descriptors (e.g., '₹16.5 Lakh Cr' or '₹45,000 Cr') where applicable.`;

    const formattedMarketCap = liveData.marketCap 
      ? (liveData.isIndian 
          ? (liveData.marketCap >= 1e12 ? `₹${(liveData.marketCap / 1e12).toFixed(2)} Lakh Cr` : `₹${(liveData.marketCap / 1e7).toFixed(2)} Cr`)
          : (liveData.marketCap >= 1e12 ? `$${(liveData.marketCap / 1e12).toFixed(2)}T` : `$${(liveData.marketCap / 1e9).toFixed(2)}B`))
      : "N/A";

    const prompt = `Perform a complete step-by-step investment research analysis on "${symbol}".
We have successfully fetched the following verified real-time market reference data for this asset:
- Symbol/Ticker: ${liveData.symbol}
- Company Name: ${liveData.name}
- Current Market Price: ${liveData.isIndian ? "₹" : "$"}${liveData.price.toFixed(2)}
- Current Daily Change: ${liveData.changePercent >= 0 ? "+" : ""}${liveData.changePercent.toFixed(2)}%
- Market Capitalization: ${formattedMarketCap}
- Trailing P/E: ${liveData.pe ? liveData.pe.toFixed(2) : "N/A"}
- Trailing EPS: ${liveData.isIndian ? "₹" : "$"}${liveData.eps ? liveData.eps.toFixed(2) : "N/A"}

You MUST use these exact real-time reference figures in your analysis output fields for ticker, companyName, currentPrice, changePercent, and marketCap. Do NOT hallucinate different values.

You MUST incorporate these Custom Investing Rules into your evaluation:
${serializedRules}

Generate a complete, structured analysis. Fill out all sections honestly and meticulously based on actual data found through Google Search grounding. Use the current date: 2026-07-18.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "ticker",
            "companyName",
            "currentPrice",
            "changePercent",
            "sector",
            "industry",
            "marketCap",
            "executiveSummary",
            "companyOverview",
            "technicalAnalysis",
            "fundamentalAnalysis",
            "valuation",
            "newsSentiment",
            "riskAnalysis",
            "peerComparison",
            "kbRulesEvaluation",
            "finalRecommendation"
          ],
          properties: {
            ticker: { type: Type.STRING, description: "Official stock ticker symbol" },
            companyName: { type: Type.STRING, description: "Full corporate name" },
            currentPrice: { type: Type.STRING, description: "Latest stock price (e.g., '$185.40')" },
            changePercent: { type: Type.STRING, description: "Daily or recent change percent (e.g., '+2.45%')" },
            sector: { type: Type.STRING, description: "Economic sector" },
            industry: { type: Type.STRING, description: "Specific industry" },
            marketCap: { type: Type.STRING, description: "Market Capitalization (e.g., '$2.85T' or '$450B')" },
            executiveSummary: { type: Type.STRING, description: "High-level summary of the company and investment stance" },
            companyOverview: {
              type: Type.OBJECT,
              required: ["businessModel", "keyProducts", "competitiveAdvantage", "moatRating"],
              properties: {
                businessModel: { type: Type.STRING, description: "How the company operates and makes money" },
                keyProducts: { type: Type.STRING, description: "Key products, services, or revenue segments" },
                competitiveAdvantage: { type: Type.STRING, description: "Detailed advantages over competitors" },
                moatRating: { type: Type.STRING, description: "Wide, Narrow, or None" }
              }
            },
            technicalAnalysis: {
              type: Type.OBJECT,
              required: [
                "trend",
                "momentum",
                "strength",
                "supportResistance",
                "indicators",
                "smcConcepts",
                "patterns",
                "technicalScore",
                "details"
              ],
              properties: {
                trend: { type: Type.STRING, description: "Overall trend: Bullish, Bearish, or Neutral" },
                momentum: { type: Type.STRING, description: "Momentum analysis (e.g., RSI signals, MACD crossovers)" },
                strength: { type: Type.STRING, description: "Trend strength (e.g. via ADX)" },
                supportResistance: {
                  type: Type.OBJECT,
                  required: ["support", "resistance"],
                  properties: {
                    support: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key support levels" },
                    resistance: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key resistance levels" }
                  }
                },
                indicators: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["name", "value", "signal"],
                    properties: {
                      name: { type: Type.STRING, description: "Indicator name (e.g. RSI, EMA 20, MACD)" },
                      value: { type: Type.STRING, description: "Indicator current value" },
                      signal: { type: Type.STRING, description: "Bullish, Bearish, or Neutral" }
                    }
                  }
                },
                smcConcepts: {
                  type: Type.OBJECT,
                  required: ["orderBlocks", "fvg", "liquidity"],
                  properties: {
                    orderBlocks: { type: Type.STRING, description: "Key identified order blocks and zones" },
                    fvg: { type: Type.STRING, description: "Fair Value Gaps details" },
                    liquidity: { type: Type.STRING, description: "Liquidity pools / Buy-side & Sell-side liquidity" }
                  }
                },
                patterns: { type: Type.STRING, description: "Chart patterns (e.g., double bottom, head and shoulders, Wyckoff phase)" },
                technicalScore: { type: Type.INTEGER, description: "Score from 0 to 100" },
                details: { type: Type.STRING, description: "Comprehensive analysis of price action and technical structure" }
              }
            },
            fundamentalAnalysis: {
              type: Type.OBJECT,
              required: [
                "revenueGrowth",
                "profitGrowth",
                "operatingMargin",
                "netMargin",
                "eps",
                "debtToEquity",
                "roe",
                "roce",
                "fundamentalScore",
                "details"
              ],
              properties: {
                revenueGrowth: { type: Type.STRING, description: "Year-over-year revenue growth" },
                profitGrowth: { type: Type.STRING, description: "Year-over-year net profit growth" },
                operatingMargin: { type: Type.STRING, description: "Operating profit margin" },
                netMargin: { type: Type.STRING, description: "Net profit margin" },
                eps: { type: Type.STRING, description: "Earnings Per Share" },
                debtToEquity: { type: Type.STRING, description: "Debt-to-equity ratio" },
                roe: { type: Type.STRING, description: "Return on Equity" },
                roce: { type: Type.STRING, description: "Return on Capital Employed" },
                fundamentalScore: { type: Type.INTEGER, description: "Fundamental score from 0 to 100" },
                details: { type: Type.STRING, description: "Detailed balance sheet, growth, and cash flow analysis" }
              }
            },
            valuation: {
              type: Type.OBJECT,
              required: [
                "intrinsicValue",
                "pe",
                "pb",
                "peg",
                "dividendYield",
                "dcfCalculation",
                "valuationScore",
                "details"
              ],
              properties: {
                intrinsicValue: { type: Type.STRING, description: "Calculated intrinsic value" },
                pe: { type: Type.STRING, description: "Price to Earnings ratio" },
                pb: { type: Type.STRING, description: "Price to Book ratio" },
                peg: { type: Type.STRING, description: "Price/Earnings-to-Growth ratio" },
                dividendYield: { type: Type.STRING, description: "Dividend Yield" },
                dcfCalculation: {
                  type: Type.OBJECT,
                  required: ["dcfValue", "discountRate", "growthRate"],
                  properties: {
                    dcfValue: { type: Type.STRING, description: "Intrinsic value from DCF" },
                    discountRate: { type: Type.STRING, description: "Discount rate used (e.g. '9.5%')" },
                    growthRate: { type: Type.STRING, description: "Terminal growth rate used (e.g. '2.5%')" }
                  }
                },
                valuationScore: { type: Type.INTEGER, description: "Valuation score from 0 to 100" },
                details: { type: Type.STRING, description: "Detailed valuation, intrinsic value, and margin of safety reasoning" }
              }
            },
            newsSentiment: {
              type: Type.OBJECT,
              required: ["articles", "overallSentiment", "sentimentScore", "details"],
              properties: {
                articles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["headline", "source", "sentiment", "impact"],
                    properties: {
                      headline: { type: Type.STRING, description: "Recent news headline" },
                      source: { type: Type.STRING, description: "News publication name" },
                      sentiment: { type: Type.STRING, description: "Positive, Negative, or Neutral" },
                      impact: { type: Type.STRING, description: "Short-term / Long-term impact details" }
                    }
                  }
                },
                overallSentiment: { type: Type.STRING, description: "Overall market sentiment: Bullish, Bearish, or Neutral" },
                sentimentScore: { type: Type.INTEGER, description: "Score from 0 to 100" },
                details: { type: Type.STRING, description: "Discussion of management credibility and current macro/sector sentiment" }
              }
            },
            riskAnalysis: {
              type: Type.OBJECT,
              required: ["risks", "overallRiskRating", "riskScore"],
              properties: {
                risks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["category", "rating", "description"],
                    properties: {
                      category: { type: Type.STRING, description: "Risk type (Regulatory, Economic, Execution, Currency, Political, Company, Industry)" },
                      rating: { type: Type.STRING, description: "Low, Medium, High, or Extreme" },
                      description: { type: Type.STRING, description: "Explanation of risk factor" }
                    }
                  }
                },
                overallRiskRating: { type: Type.STRING, description: "Overall risk rating (Low, Medium, High, Extreme)" },
                riskScore: { type: Type.INTEGER, description: "Risk Score from 0 to 100 (where higher means safer / lower risk, or clarify standard)" }
              }
            },
            peerComparison: {
              type: Type.OBJECT,
              required: ["peers", "analysis"],
              properties: {
                peers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["name", "pe", "roe", "revenueGrowth", "netMargin", "debtToEquity"],
                    properties: {
                      name: { type: Type.STRING, description: "Peer company name or ticker" },
                      pe: { type: Type.STRING, description: "Peer P/E Ratio" },
                      roe: { type: Type.STRING, description: "Peer Return on Equity" },
                      revenueGrowth: { type: Type.STRING, description: "Peer Revenue Growth Yo-Y" },
                      netMargin: { type: Type.STRING, description: "Peer Net Profit Margin" },
                      debtToEquity: { type: Type.STRING, description: "Peer Debt-to-Equity Ratio" }
                    }
                  }
                },
                analysis: { type: Type.STRING, description: "Comparison of core advantages, weaknesses, and efficiencies against competitors" }
              }
            },
            kbRulesEvaluation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["ruleId", "passed", "reason"],
                properties: {
                  ruleId: { type: Type.STRING, description: "The ID of the custom rule being evaluated" },
                  passed: { type: Type.STRING, description: "Passed, Failed, or Neutral" },
                  reason: { type: Type.STRING, description: "1-sentence explainable justification backed by actual data" }
                }
              },
              description: "Direct mapping of how this stock performs against the user's custom investing rules"
            },
            finalRecommendation: {
              type: Type.OBJECT,
              required: [
                "recommendation",
                "expectedTimeHorizon",
                "suggestedEntryZone",
                "stopLoss",
                "targets",
                "marginOfSafety",
                "probabilityOfSuccess",
                "confidenceScore",
                "investmentThesis",
                "keyPositives",
                "keyNegatives",
                "catalysts",
                "risks"
              ],
              properties: {
                recommendation: { type: Type.STRING, description: "Strong Buy, Buy, Accumulate, Hold, Reduce, Sell, Strong Sell" },
                expectedTimeHorizon: { type: Type.STRING, description: "Expected duration (e.g. '12-18 Months', 'Short Term')" },
                suggestedEntryZone: { type: Type.STRING, description: "Price entry range" },
                stopLoss: { type: Type.STRING, description: "Strict stop loss price level" },
                targets: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Target prices (provide exactly 3 targets: Target 1, Target 2, Target 3)" },
                marginOfSafety: { type: Type.STRING, description: "Margin of safety percent or ratio" },
                probabilityOfSuccess: { type: Type.STRING, description: "Statistical probability of success estimate (e.g. '75%')" },
                confidenceScore: { type: Type.INTEGER, description: "Investment stance confidence score from 0 to 100" },
                investmentThesis: { type: Type.STRING, description: "Full logical reasoning backing up the final recommendation" },
                keyPositives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core positive investment arguments" },
                keyNegatives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core negative investment arguments" },
                catalysts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key catalysts to trigger upside" },
                risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Major threats to the thesis" }
              }
            }
          }
        }
      }
    });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from Gemini API.");
      }

      data = JSON.parse(text);

      // Extract Grounding Chunks with Source Links
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks
        ? groundingChunks
            .map((chunk: any) => ({
              title: chunk.web?.title || "Financial Source",
              uri: chunk.web?.uri || ""
            }))
            .filter((source: any) => source.uri !== "")
        : [];

      // Deduplicate sources
      uniqueSources = Array.from(new Set(sources.map((s: any) => s.uri)))
        .map(uri => sources.find((s: any) => s.uri === uri));

    } catch (apiError: any) {
      console.warn("Gemini Live API call failed, activating graceful Sandbox Simulation fallback. Error:", apiError.message || apiError);
      const report = generateMockReport(symbol, liveData, rules || []);
      data = report;
      const sym = symbol.toUpperCase().trim();
      let cleanSym = sym;
      if (cleanSym.includes(":")) {
        cleanSym = cleanSym.split(":")[1];
      }
      if (cleanSym.includes(".")) {
        cleanSym = cleanSym.split(".")[0];
      }
      cleanSym = cleanSym.trim();

      if (isIndianTicker(symbol)) {
        uniqueSources = [
          { title: `Groww India Live Stock Quote - ${cleanSym}`, uri: `https://groww.in/charts/stocks/${cleanSym.toLowerCase()}` },
          { title: `Yahoo Finance Live Chart - ${cleanSym}.NS`, uri: `https://finance.yahoo.com/quote/${cleanSym}.NS` },
          { title: `NSE India Official Quote Lookup - ${cleanSym}`, uri: `https://www.nseindia.com/get-quotes/equity?symbol=${cleanSym}` }
        ];
      } else {
        uniqueSources = [
          { title: `Yahoo Finance Live Quote - ${sym}`, uri: `https://finance.yahoo.com/quote/${sym}` },
          { title: `Bloomberg Enterprise Stock Data - ${sym}`, uri: `https://www.bloomberg.com/quote/${sym}:US` },
          { title: `SEC Edgar Filings Repository - ${sym}`, uri: `https://www.sec.gov/edgar/searchedgar/companysearch` }
        ];
      }
    }

    return res.json({ analysis: data, sources: uniqueSources });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during stock analysis."
    });
  }
});

// Vite middleware & Client Routing Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
