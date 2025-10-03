import type { ChartData } from "chart.js"; // Using type imports for TS
import { useCallback, useEffect, useRef, useState } from "react";
import GeminiAnalysisModal from "./analisys/components/GeminiAnalysisModal";
import Header from "./portfolio/components/Header";
import PerformanceChart from "./portfolio/components/PerformanceChart";
import Notification from "./shared/components/Notification";
import TransactionModal from "./transactions/components/TransactionModal";

import { DcfCalculator } from "./analisys/components/DfcCalculator";
import { useAnalysis } from "./analisys/hook/useAnalysis";
import KpiSection from "./portfolio/components/KpiSection";
import PortfolioDistribution from "./portfolio/components/PortfolioDistribution";
import PositionsTable from "./portfolio/components/PositionsTable";
import usePortfolio from "./portfolio/hook/usePortfolio";
import type { Position, PositionWithPrices } from "./portfolio/types";
import { useTransactions } from "./transactions/hook/useTransactions";
import {
  mockPortfolioData,
  mockSP500Data,
} from "./shared/hook/useMockDataPerformance";

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

function App() {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  }>({ message: "", type: "success" });
  const showNotification = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setNotification({ message, type });
      setTimeout(() => setNotification({ message: "", type: "success" }), 3000);
    },
    []
  );

  const {
    positions,
    setPositions,
    positionsWithPrices,
    portfolioTotals,
    isLoadingPrices,
  } = usePortfolio(initialPositions, scriptsLoaded);
  const {
    isTxModalOpen,
    openTxModal,
    closeTxModal,
    handleAddTransaction,
    handleFileUpload,
  } = useTransactions(setPositions, showNotification);
  const {
    isAnalysisModalOpen,
    closeAnalysisModal,
    analysisResult,
    isAnalysisLoading,
    handleGetAnalysis,
  } = useAnalysis(positionsWithPrices);
  const [distributionData, setDistributionData] = useState<
    Record<string, ChartData>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!positionsWithPrices.length || !portfolioTotals.currentValue) return;
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
          <KpiSection
            portfolioTotals={portfolioTotals}
            positionsCount={positions.length}
          />
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
              onClick={openTxModal}
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
          <PortfolioDistribution data={distributionData} />
          <PerformanceChart
            portfolio={mockPortfolioData}
            sp500={mockSP500Data}
          />
          <PositionsTable
            positions={positionsWithPrices}
            isLoading={isLoadingPrices}
          />
          <DcfCalculator />
        </div>
      </div>

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={closeTxModal}
        onAddTransaction={handleAddTransaction}
      />
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "success" })}
      />
      <GeminiAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={closeAnalysisModal}
        analysis={analysisResult}
        isLoading={isAnalysisLoading}
      />
    </>
  );
}

export default App;
