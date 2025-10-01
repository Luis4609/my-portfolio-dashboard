import type { Position, FmpQuote } from "./types";

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY as string;

export const fetchStockPricesAPI = async (
  positions: Position[]
): Promise<Record<string, number>> => {
  if (!positions || positions.length === 0) return {};

  const tickers = positions.map((p) => p.ticker).join(",");
  const url = `https://financialmodelingprep.com/api/v3/quote-short/${tickers}?apikey=${FMP_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    const data: FmpQuote[] = await response.json();
    return data.reduce((acc: Record<string, number>, stock) => {
      acc[stock.symbol] = stock.price;
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to fetch stock prices:", error);
    return {};
  }
};
