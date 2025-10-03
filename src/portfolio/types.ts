// --- Portfolio Types ---

export interface Position {
  id: number;
  ticker: string;
  shares: number;
  avgCost: number;
  category: string;
  sector: string;
  marketCap: string;
}

export interface PositionWithPrices extends Position {
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  pl: number;
}

export interface PortfolioTotals {
  currentValue: number;
  totalCost: number;
  totalPl: number;
  totalPlPercent: number;
}

export interface FmpQuote {
  symbol: string;
  price: number;
}

export interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  valueColor?: string;
}