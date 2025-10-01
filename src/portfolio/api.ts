import type { Position, FmpQuote } from "./types";

const FMP_API_KEY = "YOUR_API_KEY_HERE";

export const fetchStockPricesAPI = async (
  positions: Position[]
): Promise<Record<string, number>> => {
  if (!positions || positions.length === 0) return {};
  if (FMP_API_KEY === "YOUR_API_KEY_HERE") {
    console.warn(
      "Using mock data. Please replace 'YOUR_API_KEY_HERE' to get live data."
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    const prices: Record<string, number> = {};
    positions.forEach((pos) => {
      prices[pos.ticker] = pos.avgCost * (1 + (Math.random() - 0.45) * 0.4);
    });
    return prices;
  }

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
