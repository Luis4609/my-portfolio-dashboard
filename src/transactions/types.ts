// --- Transaction Types ---
export interface Transaction {
    ticker: string;
    shares: number;
    price: number;
    type: 'buy' | 'sell';
}
