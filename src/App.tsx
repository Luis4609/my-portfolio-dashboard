import type { ChartData } from "chart.js"; // Using type imports for TS
import React, { useEffect, useRef, useState } from "react";
import { getGeminiPortfolioAnalysis } from "./analisys/api";
import GeminiAnalysisModal from "./analisys/components/GeminiAnalysisModal";
import { fetchStockPricesAPI } from "./portfolio/api";
import DoughnutChart from "./portfolio/components/DoughnutChart";
import Header from "./portfolio/components/Header";
import KpiCard, { type KpiCardProps } from "./portfolio/components/KpiCard";
import PerformanceChart from "./portfolio/components/PerformanceChart";
import Notification from "./shared/components/Notification";
import Spinner from "./shared/components/Spinner";
import TransactionModal from "./transactions/components/TransactionModal";

import type { Transaction } from "./transactions/types";

import { DcfCalculator } from "./analisys/components/DfcCalculator";
import type {
  PortfolioTotals,
  Position,
  PositionWithPrices,
} from "./portfolio/types";

// Declare XLSX on the window object for TypeScript
declare global {
  interface Window {
    XLSX: any;
  }
}

// --- Initial Data / Mocks ---
const initialPositions: Position[] = [
  {
    id: 1,
    ticker: "NVDA",
    shares: 10,
    avgCost: 450.75,
    category: "Software",
    sector: "Technology",
    marketCap: "Large",
  },
  {
    id: 2,
    ticker: "PLTR",
    shares: 100,
    avgCost: 18.5,
    category: "AI infra",
    sector: "Technology",
    marketCap: "Mid",
  },
  {
    id: 3,
    ticker: "SMCI",
    shares: 5,
    avgCost: 880.2,
    category: "Hardware",
    sector: "Technology",
    marketCap: "Mid",
  },
  {
    id: 4,
    ticker: "SOFI",
    shares: 200,
    avgCost: 7.25,
    category: "FinTech",
    sector: "Financials",
    marketCap: "Small",
  },
  {
    id: 5,
    ticker: "VRT",
    shares: 20,
    avgCost: 55.1,
    category: "Industrials",
    sector: "Industrials",
    marketCap: "Large",
  },
];

const generateMockPerformance = (): { date: string; value: number }[] => {
  const data = [];
  let value = 100;
  for (let i = 0; i < 36; i++) {
    const date = new Date(2023, 0, 1);
    date.setMonth(date.getMonth() + i);
    value *= 1 + (Math.random() - 0.45) * 0.1;
    data.push({
      date: date.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "short",
      }),
      value,
    });
  }
  return data;
};
const mockPortfolioData = generateMockPerformance();
const mockSP500Data = generateMockPerformance();

function App() {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [positionsWithPrices, setPositionsWithPrices] = useState<
    PositionWithPrices[]
  >([]);
  const [portfolioTotals, setPortfolioTotals] = useState<PortfolioTotals>({
    currentValue: 0,
    totalCost: 0,
    totalPl: 0,
    totalPlPercent: 0,
  });
  const [distributionData, setDistributionData] = useState<
    Record<string, ChartData>
  >({});
  const [isTxModalOpen, setTxModalOpen] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  }>({ message: "", type: "success" });
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    const loadScript = (src: string, onLoad: () => void) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = onLoad;
      document.body.appendChild(script);
    };
    let loadedCount = 0;
    const onScriptLoad = () => {
      if (++loadedCount === 2) setScriptsLoaded(true);
    };
    loadScript("https://cdn.jsdelivr.net/npm/chart.js", onScriptLoad);
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      onScriptLoad
    );
  }, []);

  useEffect(() => {
    const updatePortfolioData = async () => {
      if (positions.length === 0 || !scriptsLoaded) return;
      setIsLoadingPrices(true);
      const prices = await fetchStockPricesAPI(positions);
      let totalCurrentValue = 0,
        totalCostBasis = 0;
      const newPositions = positions.map((pos) => {
        const currentPrice = prices[pos.ticker] || pos.avgCost;
        const currentValue = pos.shares * currentPrice;
        const costBasis = pos.shares * pos.avgCost;
        totalCurrentValue += currentValue;
        totalCostBasis += costBasis;
        return {
          ...pos,
          currentPrice,
          currentValue,
          costBasis,
          pl: currentValue - costBasis,
        };
      });
      const totalPl = totalCurrentValue - totalCostBasis;
      setPositionsWithPrices(newPositions);
      setPortfolioTotals({
        currentValue: totalCurrentValue,
        totalCost: totalCostBasis,
        totalPl,
        totalPlPercent:
          totalCostBasis > 0 ? (totalPl / totalCostBasis) * 100 : 0,
      });
      setIsLoadingPrices(false);
    };
    updatePortfolioData();
  }, [positions, scriptsLoaded]);

  useEffect(() => {
    if (positionsWithPrices.length === 0) return;
    const calculateDistribution = (
      key: keyof PositionWithPrices
    ): ChartData => {
      const dist = positionsWithPrices.reduce((acc, pos) => {
        const group = pos[key] as string;
        acc[group] = (acc[group] || 0) + pos.currentValue;
        return acc;
      }, {} as Record<string, number>);
      const labels = Object.keys(dist);
      const data = labels.map(
        (l) => (dist[l] / portfolioTotals.currentValue) * 100
      );
      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "#34D399",
              "#A78BFA",
              "#FBBF24",
              "#60A5FA",
              "#F87171",
            ],
            borderColor: "#1F2937",
          },
        ],
      };
    };
    setDistributionData({
      category: calculateDistribution("category"),
      sector: calculateDistribution("sector"),
      marketCap: calculateDistribution("marketCap"),
    });
  }, [positionsWithPrices, portfolioTotals.currentValue]);

  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "success" }), 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: "array" });
        const json = window.XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        );
        const newPositions: Position[] = json.map((row: any, i: number) => ({
          id: Date.now() + i,
          ticker: row.Ticker,
          shares: parseFloat(row.Shares),
          avgCost: parseFloat(row["Avg Cost"]),
          category: row.Category,
          sector: row.Sector,
          marketCap: row["Market Cap"],
        }));
        setPositions(newPositions);
        showNotification("Portfolio uploaded successfully!");
      } catch (error) {
        showNotification("Error reading Excel file.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleAddTransaction = (transaction: Transaction) => {
    setPositions((prev) => {
      const existing = prev.find((p) => p.ticker === transaction.ticker);
      if (transaction.type === "buy") {
        if (existing) {
          return prev.map((p) =>
            p.ticker === transaction.ticker
              ? {
                  ...p,
                  shares: p.shares + transaction.shares,
                  avgCost:
                    (p.shares * p.avgCost +
                      transaction.shares * transaction.price) /
                    (p.shares + transaction.shares),
                }
              : p
          );
        }
        return [
          ...prev,
          {
            id: Date.now(),
            ticker: transaction.ticker,
            shares: transaction.shares,
            avgCost: transaction.price,
            category: "Misc",
            sector: "Misc",
            marketCap: "Unknown",
          },
        ];
      } else {
        if (!existing || existing.shares < transaction.shares) {
          showNotification("Not enough shares to sell.", "error");
          return prev;
        }
        return prev
          .map((p) =>
            p.ticker === transaction.ticker
              ? { ...p, shares: p.shares - transaction.shares }
              : p
          )
          .filter((p) => p.shares > 0);
      }
    });
  };

  const handleGetAnalysis = async () => {
    setAnalysisModalOpen(true);
    setAnalysisLoading(true);
    const data = positionsWithPrices.map((p) => ({
      ticker: p.ticker,
      sector: p.sector,
      marketCap: p.marketCap,
      currentValue: p.currentValue.toFixed(2),
    }));
    const result = await getGeminiPortfolioAnalysis(data);
    setAnalysisResult(result);
    setAnalysisLoading(false);
  };

  const kpis: KpiCardProps[] = [
    {
      title: "Portfolio Value",
      value: `$${portfolioTotals.currentValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: "Total P/L",
      value: `$${portfolioTotals.totalPl.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: `${portfolioTotals.totalPlPercent.toFixed(2)}%`,
      valueColor:
        portfolioTotals.totalPl >= 0 ? "text-green-400" : "text-red-400",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" x2="12" y1="20" y2="4" />
          <path d="m6 14 6-6 6 6" />
        </svg>
      ),
    },
    {
      title: "Positions",
      value: positions.length,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" x2="12" y1="22.08" y2="12" />
        </svg>
      ),
    },
    {
      title: "Total Cost",
      value: `$${portfolioTotals.totalCost.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
      ),
    },
  ];

  if (!scriptsLoaded) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Header />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Upload Excel
            </button>
            <button
              onClick={() => setTxModalOpen(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Add Transaction
            </button>
            <button
              onClick={handleGetAnalysis}
              disabled={isAnalysisLoading || positions.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              ✨ Analizar Cartera con IA
            </button>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-bold text-white mb-2">
              Portfolio distribution
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DoughnutChart
                title="Category"
                data={distributionData.category || { labels: [], datasets: [] }}
              />
              <DoughnutChart
                title="Sector"
                data={distributionData.sector || { labels: [], datasets: [] }}
              />
              <DoughnutChart
                title="Market cap"
                data={
                  distributionData.marketCap || { labels: [], datasets: [] }
                }
              />
            </div>
          </div>
          <PerformanceChart
            portfolio={mockPortfolioData}
            sp500={mockSP500Data}
          />
          <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <span>Current Positions</span>
              {isLoadingPrices && <Spinner />}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-600">
                  <tr>
                    <th className="p-3">Ticker</th>
                    <th className="p-3">Shares</th>
                    <th className="p-3">Avg. Cost</th>
                    <th className="p-3">Current Price</th>
                    <th className="p-3">Current Value</th>
                    <th className="p-3">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {positionsWithPrices.map((pos) => (
                    <tr
                      key={pos.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50"
                    >
                      <td className="p-3 font-bold">{pos.ticker}</td>
                      <td className="p-3">{pos.shares.toLocaleString()}</td>
                      <td className="p-3">${pos.avgCost.toFixed(2)}</td>
                      <td className="p-3">${pos.currentPrice.toFixed(2)}</td>
                      <td className="p-3 font-semibold">
                        $
                        {pos.currentValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`p-3 font-semibold ${
                          pos.pl >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        $
                        {pos.pl.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DcfCalculator />
        </div>
      </div>

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setTxModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "success" })}
      />
      <GeminiAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        analysis={analysisResult}
        isLoading={isAnalysisLoading}
      />
    </>
  );
}

export default App;
