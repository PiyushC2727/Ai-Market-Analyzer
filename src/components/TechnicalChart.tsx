import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Target, ShieldAlert, ArrowDownUp, LineChart, Activity } from "lucide-react";

interface TechnicalChartProps {
  trend: "Bullish" | "Bearish" | "Neutral";
  currentPrice: string;
  suggestedEntryZone: string;
  stopLoss: string;
  targets: string[];
  symbol?: string;
}

export default function TechnicalChart({
  trend,
  currentPrice,
  suggestedEntryZone,
  stopLoss,
  targets,
  symbol = "AAPL",
}: TechnicalChartProps) {
  const [chartType, setChartType] = useState<"tradingview" | "projection">("tradingview");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; index: number } | null>(null);

  const isIndian = currentPrice.includes("₹") || (symbol && (
    symbol.toUpperCase().trim().endsWith(".NS") || 
    symbol.toUpperCase().trim().endsWith(".BO") ||
    [
      "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "TATAMOTORS", "ITC", "BHARTIARTL", "LICI", "LT",
      "WIPRO", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "ADANIENT", "ASIANPAINT", "MARUTI", "BAJFINANCE", "M&M",
      "SUNPHARMA", "ULTRACEMCO", "NTPC", "JSWSTEEL", "TITAN", "ONGC", "TATASTEEL", "POWERGRID", "ADANIPORTS"
    ].includes(symbol.toUpperCase().trim())
  ));
  const currencySign = isIndian ? "₹" : "$";

  const getTvSymbol = (sym: string) => {
    const s = sym.toUpperCase().trim();
    if (s.includes(":")) return s;
    const indianTickers = [
      "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "TATAMOTORS", "ITC", "BHARTIARTL", "LICI", "LT",
      "WIPRO", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "ADANIENT", "ASIANPAINT", "MARUTI", "BAJFINANCE", "M&M",
      "SUNPHARMA", "ULTRACEMCO", "NTPC", "JSWSTEEL", "TITAN", "ONGC", "TATASTEEL", "POWERGRID", "ADANIPORTS",
      "NIFTY", "BANKNIFTY", "SENSEX", "COALINDIA", "BAJAJFINSV", "BPCL", "HEROMOTOCO", "INDUSINDBK", "CIPLA",
      "EICHERMOT", "GRASIM", "HINDALCO", "HCLTECH", "NESTLEIND", "SBI LIFE", "TECHM", "APOLLOHOSP", "DRREDDY",
      "DIVISLAB", "LTIM", "SBILIFE"
    ];
    let cleanSym = s;
    if (s.endsWith(".NS")) {
      cleanSym = s.replace(".NS", "");
      return `NSE:${cleanSym}`;
    }
    if (s.endsWith(".BO")) {
      cleanSym = s.replace(".BO", "");
      return `BSE:${cleanSym}`;
    }
    if (indianTickers.includes(s)) {
      return `NSE:${s}`;
    }
    return s;
  };

  const tvSymbol = getTvSymbol(symbol);

  // Helper to parse price numbers from string formats (e.g. "$185.40" -> 185.40)
  const parsePrice = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  };

  const parsedCurrent = parsePrice(currentPrice);
  const parsedStopLoss = parsePrice(stopLoss);
  
  // Parse entry zone (e.g. "$180 - $183" or "$180")
  let parsedEntryMin = 0;
  let parsedEntryMax = 0;
  if (suggestedEntryZone.includes("-")) {
    const parts = suggestedEntryZone.split("-");
    parsedEntryMin = parsePrice(parts[0]);
    parsedEntryMax = parsePrice(parts[1]);
  } else {
    parsedEntryMin = parsePrice(suggestedEntryZone) * 0.99;
    parsedEntryMax = parsePrice(suggestedEntryZone) * 1.01;
  }

  const parsedTargets = targets.map(t => parsePrice(t));

  // Determine pricing bounds for the chart display
  const allPrices = [
    parsedCurrent,
    parsedStopLoss,
    parsedEntryMin,
    parsedEntryMax,
    ...parsedTargets,
  ].filter(p => p > 0);

  const minPrice = Math.min(...allPrices) * 0.96;
  const maxPrice = Math.max(...allPrices) * 1.04;
  const priceRange = maxPrice - minPrice;

  // Generate simulated chart price path points (30 data points)
  const generateSimulatedData = (): number[] => {
    if (allPrices.length === 0) return Array(30).fill(100);

    const dataPoints: number[] = [];
    const baseline = parsedEntryMin > 0 ? (parsedEntryMin + parsedEntryMax) / 2 : parsedCurrent;
    
    // First 15 points represent historical consolidation around the entry zone
    for (let i = 0; i < 15; i++) {
      const noise = (Math.sin(i * 0.8) * 0.015 + Math.cos(i * 0.5) * 0.01) * baseline;
      dataPoints.push(baseline + noise);
    }

    // Next 15 points represent the primary trend movement up to current price or heading towards targets
    const startVal = dataPoints[14];
    const endVal = parsedCurrent;
    
    for (let i = 1; i <= 15; i++) {
      const t = i / 15;
      // S-curve interpolation with some minor noise
      const smoothStep = t * t * (3 - 2 * t);
      const intermediatePrice = startVal + (endVal - startVal) * smoothStep;
      const noise = Math.sin(i * 1.2) * 0.006 * baseline;
      dataPoints.push(intermediatePrice + noise);
    }

    return dataPoints;
  };

  const data = generateSimulatedData();

  // Map prices to SVG coordinate system (SVG dimensions: 600 width, 300 height)
  const width = 600;
  const height = 300;
  const paddingLeft = 50;
  const paddingRight = 95;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index / (data.length - 1)) * chartWidth;
  const getY = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return height - paddingBottom - ratio * chartHeight;
  };

  // Convert points array into SVG path string
  const pointsStr = data.map((price, idx) => `${getX(idx)},${getY(price)}`).join(" ");
  const linePath = `M ${pointsStr}`;
  
  // Create solid area gradient path
  const areaPath = `${linePath} L ${getX(data.length - 1)},${getY(minPrice)} L ${getX(0)},${getY(minPrice)} Z`;

  // Horizontal Grid Lines
  const gridLinesCount = 5;
  const gridLines = Array.from({ length: gridLinesCount }).map((_, i) => {
    const value = minPrice + (i / (gridLinesCount - 1)) * priceRange;
    return {
      y: getY(value),
      value: value.toFixed(2),
    };
  });

  // Level markers to overlay on chart
  const levels = [
    { name: "Stop Loss", price: parsedStopLoss, color: "#f43f5e", dash: "4 4", label: `SL: ${currencySign}${parsedStopLoss.toFixed(2)}` },
    { name: "Entry Min", price: parsedEntryMin, color: "#f59e0b", dash: "2 2", label: `Entry Min: ${currencySign}${parsedEntryMin.toFixed(2)}` },
    { name: "Entry Max", price: parsedEntryMax, color: "#f59e0b", dash: "2 2", label: `Entry Max: ${currencySign}${parsedEntryMax.toFixed(2)}` },
    ...parsedTargets.map((t, idx) => ({
      name: `Target ${idx + 1}`,
      price: t,
      color: "#10b981",
      dash: "4 4",
      label: `T${idx + 1}: ${currencySign}${t.toFixed(2)}`,
    })),
    { name: "Current Price", price: parsedCurrent, color: "#6366f1", dash: "none", label: `CMP: ${currencySign}${parsedCurrent.toFixed(2)}` },
  ].filter(l => l.price > 0 && l.price >= minPrice && l.price <= maxPrice);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    
    // Scale clientX back to coordinates used inside the 600px wide SVG viewBox
    const svgX = (clientX / svgRect.width) * width;
    
    if (svgX < paddingLeft || svgX > width - paddingRight) {
      setHoveredPoint(null);
      return;
    }

    // Find closest index
    const percent = (svgX - paddingLeft) / chartWidth;
    const rawIndex = percent * (data.length - 1);
    const index = Math.max(0, Math.min(data.length - 1, Math.round(rawIndex)));

    setHoveredPoint({
      x: getX(index),
      y: getY(data[index]),
      price: data[index],
      index,
    });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Title block & Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900 font-sans tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
            Live Market Visualizers: {symbol.toUpperCase()}
          </h3>
          <p className="text-xs text-gray-500">
            Real-time candle charts, indicators, and calculated risk corridors.
          </p>
        </div>
        
        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/40">
          <button
            onClick={() => setChartType("tradingview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chartType === "tradingview"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            TradingView Live OHLC
          </button>
          <button
            onClick={() => setChartType("projection")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chartType === "projection"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            AI Target Projection
          </button>
        </div>
      </div>

      {/* Render selected chart */}
      {chartType === "tradingview" ? (
        <div className="relative w-full h-[450px] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
          <iframe
            id={`tradingview_${symbol.toLowerCase()}`}
            name={`tradingview_${symbol.toLowerCase()}`}
            src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&theme=light&style=1&timezone=Etc%2FUTC&locale=en&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6`}
            title={`TradingView Chart for ${symbol.toUpperCase()}`}
            className="w-full h-[410px] border-0"
            allowFullScreen
          />
          {/* Subtle note */}
          <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400 font-medium">
            <span>Powered by TradingView API &bull; Real-time candles, indicators, & draw utilities</span>
            <span className="font-bold text-indigo-500">REAL-TIME</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full overflow-hidden bg-slate-50/50 border border-slate-100 rounded-xl">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Gradients */}
              <defs>
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="entryZoneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.06" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {gridLines.map((line, i) => (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={line.y}
                    x2={width - paddingRight}
                    y2={line.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={line.y + 4}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="end"
                  >
                    {currencySign}{parseFloat(line.value).toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Shaded Entry Zone Corridor */}
              {parsedEntryMin > 0 && parsedEntryMax > 0 && (
                <rect
                  x={paddingLeft}
                  y={getY(parsedEntryMax)}
                  width={chartWidth}
                  height={Math.abs(getY(parsedEntryMin) - getY(parsedEntryMax))}
                  fill="url(#entryZoneGradient)"
                />
              )}

              {/* Simulated price area & path */}
              <path d={areaPath} fill="url(#chartAreaGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Levels (SL, Target, CMP) lines & flags */}
              {levels.map((level, i) => {
                const yPos = getY(level.price);
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={width - paddingRight}
                      y2={yPos}
                      stroke={level.color}
                      strokeWidth={level.name === "Current Price" ? "1.5" : "1"}
                      strokeDasharray={level.dash}
                    />
                    {/* Level Tag Flag on the right margin */}
                    <rect
                      x={width - paddingRight + 5}
                      y={yPos - 7}
                      width={85}
                      height={14}
                      rx="3"
                      fill={level.color}
                      opacity="0.9"
                    />
                    <text
                      x={width - paddingRight + 10}
                      y={yPos + 3}
                      fill="#ffffff"
                      fontSize="8"
                      fontFamily="JetBrains Mono"
                      fontWeight="600"
                    >
                      {level.label}
                    </text>
                  </g>
                );
              })}

              {/* Interactive cursor line & tooltip */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingTop}
                    x2={hoveredPoint.x}
                    y2={height - paddingBottom}
                    stroke="#6366f1"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="5"
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  
                  {/* Tooltip background card */}
                  <rect
                    x={Math.max(paddingLeft + 5, Math.min(width - paddingRight - 90, hoveredPoint.x - 45))}
                    y={paddingTop + 5}
                    width={85}
                    height={30}
                    rx="4"
                    fill="#1e293b"
                    filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))"
                  />
                  <text
                    x={Math.max(paddingLeft + 10, Math.min(width - paddingRight - 85, hoveredPoint.x - 40))}
                    y={paddingTop + 16}
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="sans-serif"
                  >
                    P. Point {hoveredPoint.index + 1}
                  </text>
                  <text
                    x={Math.max(paddingLeft + 10, Math.min(width - paddingRight - 85, hoveredPoint.x - 40))}
                    y={paddingTop + 27}
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                  >
                    {currencySign}{hoveredPoint.price.toFixed(2)}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Corridor Legend Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CMP Price</div>
                <div className="text-xs font-bold text-slate-800">{currentPrice}</div>
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-2.5 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <div>
                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Entry corridor</div>
                <div className="text-xs font-bold text-amber-800">{suggestedEntryZone}</div>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-2.5 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Targets range</div>
                <div className="text-xs font-bold text-emerald-800">{targets.join(" | ")}</div>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100/50 rounded-xl p-2.5 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <div>
                <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Stop Loss Protection</div>
                <div className="text-xs font-bold text-rose-800">{stopLoss}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
