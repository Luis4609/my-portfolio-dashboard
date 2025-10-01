// --- Transaction Types ---
interface Transaction {
    ticker: string;
    shares: number;
    price: number;
    type: 'buy' | 'sell';
}
