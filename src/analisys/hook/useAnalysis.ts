import { useState, useCallback } from "react";
import type { PositionWithPrices } from "../../portfolio/types";
import { getGeminiPortfolioAnalysis } from "../api";

export const useAnalysis = (positionsWithPrices: PositionWithPrices[]) => {
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalysisLoading, setAnalysisLoading] = useState(false);

  const handleGetAnalysis = useCallback(async () => {
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
  }, [positionsWithPrices]);

  return {
    isAnalysisModalOpen,
    openAnalysisModal: () => setAnalysisModalOpen(true),
    closeAnalysisModal: () => setAnalysisModalOpen(false),
    analysisResult,
    isAnalysisLoading,
    handleGetAnalysis,
  };
};
