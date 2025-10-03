import { useState, useEffect } from "react";
import { fetchStockPricesAPI } from "../api";
import type { Position, PositionWithPrices, PortfolioTotals } from "../types";

// --- Portfolio Custom Hooks ---
const usePortfolio = (initialPositions: Position[], scriptsLoaded: boolean) => {
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
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

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

  return {
    positions,
    setPositions,
    positionsWithPrices,
    portfolioTotals,
    isLoadingPrices,
  };
};

export default usePortfolio;
