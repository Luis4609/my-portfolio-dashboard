// --- Portfolio Types ---

interface Position {
  id: number;
  ticker: string;
  shares: number;
  avgCost: number;
  category: string;
  sector: string;
  marketCap: string;
}

interface PositionWithPrices extends Position {
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  pl: number;
}

interface PortfolioTotals {
  currentValue: number;
  totalCost: number;
  totalPl: number;
  totalPlPercent: number;
}

interface FmpQuote {
  symbol: string;
  price: number;
}
