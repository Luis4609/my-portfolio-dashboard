import type { ChartData } from "chart.js"; // Using type imports for TS
import { useCallback, useEffect, useRef, useState } from "react";
import GeminiAnalysisModal from "./analisys/components/GeminiAnalysisModal";

// Add global XLSX declaration for TypeScript
declare global {
  interface Window {
    XLSX: any;
  }
}
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
import { fetchHistoricalDataAPI } from "./portfolio/api";

const initialPositions: Position[] = [];

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
  const { isTxModalOpen, openTxModal, closeTxModal, handleAddTransaction } =
    useTransactions(setPositions, showNotification);
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
  const [performanceData, setPerformanceData] = useState<{
    portfolio: any[];
    sp500: any[];
  }>({ portfolio: [], sp500: [] });
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = window.XLSX.read(data, { type: "array" });

          const sheetName = workbook.SheetNames[0];
          const positionsSheet = workbook.Sheets[sheetName];
          if (!positionsSheet)
            throw new Error(`Sheet '${sheetName}' not found.`);

          const positionsJson = window.XLSX.utils.sheet_to_json(positionsSheet);
          const newPositions: Position[] = positionsJson.map(
            (row: any, i: number) => {
              const sharesValue = String(row.Shares).replace(",", ".");
              const avgCostValue = String(row["Avg Cost"])
                .replace("$", "")
                .replace(",", ".");

              return {
                id: Date.now() + i,
                ticker: row.Ticker,
                shares: parseFloat(sharesValue),
                avgCost: parseFloat(avgCostValue),
                category: row.Category,
                sector: row.Sector,
                marketCap: row["Market Cap"],
              };
            }
          );
          setPositions(newPositions);
          showNotification("Portfolio uploaded successfully!");
        } catch (error: any) {
          showNotification(
            error.message || "Error reading Excel file.",
            "error"
          );
        }
      };
      reader.readAsArrayBuffer(file);
      event.target.value = "";
    },
    [setPositions, showNotification]
  );

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

  useEffect(() => {
    const calculatePerformance = async () => {
      if (positions.length === 0) {
        setPerformanceData({ portfolio: [], sp500: [] });
        return;
      }

      setIsPerformanceLoading(true);
      const tickers = positions.map((p) => p.ticker);
      const allTickers = [...new Set([...tickers, "SPY"])];

      const historicalData = await fetchHistoricalDataAPI(allTickers);

      const spyHistory = historicalData["SPY"];
      if (!spyHistory || spyHistory.length === 0) {
        console.error("Could not fetch SPY data for benchmark.");
        setIsPerformanceLoading(false);
        setPerformanceData({ portfolio: [], sp500: [] }); // Clear data on error
        return;
      }

      const dateMap = new Map<
        string,
        { portfolioValue: number; spyValue: number }
      >();
      spyHistory.forEach((d) =>
        dateMap.set(d.date, { portfolioValue: 0, spyValue: d.close })
      );

      for (const position of positions) {
        const stockHistory = historicalData[position.ticker];
        if (stockHistory) {
          stockHistory.forEach((dayData) => {
            if (dateMap.has(dayData.date)) {
              const existing = dateMap.get(dayData.date)!;
              existing.portfolioValue += position.shares * dayData.close;
              dateMap.set(dayData.date, existing);
            }
          });
        }
      }

      const combinedHistory = Array.from(dateMap.entries())
        .map(([date, values]) => ({ date, ...values }))
        .filter((d) => d.portfolioValue > 0);

      const normalize = (data: { date: string; value: number }[]) => {
        if (data.length < 1) return [];
        const baseValue = data[0].value;
        return data.map((d) => ({
          date: new Date(d.date).toLocaleDateString("en-US", {
            year: "2-digit",
            month: "short",
          }),
          value: (d.value / baseValue) * 100,
        }));
      };

      const portfolioPerf = normalize(
        combinedHistory.map((d) => ({ date: d.date, value: d.portfolioValue }))
      );
      const sp500Perf = normalize(
        combinedHistory.map((d) => ({ date: d.date, value: d.spyValue }))
      );

      setPerformanceData({ portfolio: portfolioPerf, sp500: sp500Perf });
      setIsPerformanceLoading(false);
    };

    calculatePerformance();
  }, [positions]);

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

          {positions.length === 0 ? (
            <div className="mt-8 text-center p-10 bg-gray-800 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">
                Bienvenido a tu Portfolio Dashboard
              </h2>
              <p className="text-gray-400">
                Para empezar, utiliza el botón "Upload Excel" para cargar un
                fichero con tus posiciones.
              </p>
            </div>
          ) : (
            <>
              <KpiSection
                portfolioTotals={portfolioTotals}
                positionsCount={positions.length}
              />
              <PortfolioDistribution data={distributionData} />
              <PerformanceChart
                portfolio={performanceData.portfolio}
                sp500={performanceData.sp500}
                isLoading={isPerformanceLoading}
              />
              <PositionsTable
                positions={positionsWithPrices}
                isLoading={isLoadingPrices}
              />
              <DcfCalculator />
            </>
          )}
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
