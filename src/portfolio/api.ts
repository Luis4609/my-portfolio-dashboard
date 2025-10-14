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

export const fetchHistoricalDataAPI = async (tickers: string[]): Promise<Record<string, { date: string, close: number }[]>> => {
    if (FMP_API_KEY === "YOUR_API_KEY_HERE" || tickers.length === 0) {
        return {};
    }

    const to = new Date().toISOString().split('T')[0];
    const from = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
    
    const requests = tickers.map(ticker =>
        fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${from}&to=${to}&apikey=${FMP_API_KEY}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed for ${ticker}`);
                return res.json();
            })
    );

    const results = await Promise.allSettled(requests);
    const historicalData: Record<string, { date: string, close: number }[]> = {};

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.symbol && result.value.historical) {
            historicalData[result.value.symbol] = result.value.historical.map((d: any) => ({
                date: d.date,
                close: d.close,
            })).reverse(); // API returns newest first
        } else {
            console.error(`Failed to fetch historical data for ${tickers[index]}:`, result.status === 'rejected' ? result.reason : 'No data');
        }
    });
    
    return historicalData;
};