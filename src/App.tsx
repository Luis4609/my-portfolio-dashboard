import React, { useState, useEffect, useRef } from 'react';
import type { ChartData, Chart } from 'chart.js'; // Using type imports for TS

// --- TYPE DEFINITIONS ---
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

interface Transaction {
    ticker: string;
    shares: number;
    price: number;
    type: 'buy' | 'sell';
}

interface FmpQuote {
    symbol: string;
    price: number;
}

// Extend the Window interface to include libraries loaded via script tags
declare global {
    interface Window {
        Chart: typeof Chart;
        XLSX: any; // Using 'any' for XLSX as its type definitions can be complex
    }
}


// --- FAKE DATA & UTILITIES ---
const initialPositions: Position[] = [
    { id: 1, ticker: 'NVDA', shares: 10, avgCost: 450.75, category: 'Software', sector: 'Technology', marketCap: 'Large' },
    { id: 2, ticker: 'PLTR', shares: 100, avgCost: 18.50, category: 'AI infra', sector: 'Technology', marketCap: 'Mid' },
    { id: 3, ticker: 'SMCI', shares: 5, avgCost: 880.20, category: 'Hardware', sector: 'Technology', marketCap: 'Mid' },
    { id: 4, ticker: 'SOFI', shares: 200, avgCost: 7.25, category: 'FinTech', sector: 'Financials', marketCap: 'Small' },
    { id: 5, ticker: 'VRT', shares: 20, avgCost: 55.10, category: 'Industrials', sector: 'Industrials', marketCap: 'Large' },
];


// --- REAL API FOR STOCK PRICES ---
const FMP_API_KEY = "YOUR_API_KEY_HERE"; 

const fetchStockPricesAPI = async (positions: Position[]): Promise<Record<string, number>> => {
    if (!positions || positions.length === 0) {
        return {};
    }
    if (FMP_API_KEY === "YOUR_API_KEY_HERE") {
        console.warn("Using mock data. Please replace 'YOUR_API_KEY_HERE' with your Financial Modeling Prep API key to get live data.");
        await new Promise(resolve => setTimeout(resolve, 500));
        const prices: Record<string, number> = {};
        positions.forEach(pos => {
            const fluctuation = (Math.random() - 0.45) * 0.4;
            prices[pos.ticker] = pos.avgCost * (1 + fluctuation);
        });
        return prices;
    }

    const tickers = positions.map(p => p.ticker).join(',');
    const url = `https://financialmodelingprep.com/api/v3/quote-short/${tickers}?apikey=${FMP_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data: FmpQuote[] = await response.json();
        
        const prices = data.reduce((acc: Record<string, number>, stock) => {
            acc[stock.symbol] = stock.price;
            return acc;
        }, {});
        
        console.log("Live prices fetched:", prices);
        return prices;

    } catch (error) {
        console.error("Failed to fetch stock prices:", error);
        return {};
    }
};

// --- GEMINI API FOR PORTFOLIO ANALYSIS ---
const getGeminiPortfolioAnalysis = async (portfolioData: any[]): Promise<string> => {
    const apiKey = ""; // Canvas will provide this
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const systemPrompt = `Act as a professional financial analyst...`; // Same prompt as before

    const userQuery = `Please analyze this portfolio: ${JSON.stringify(portfolioData, null, 2)}`;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [{ "google_search": {} }],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Gemini API call failed: ${response.status}`);
        }

        const result = await response.json();
        const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!analysisText) {
            throw new Error("No content received from Gemini API.");
        }
        return analysisText;
    } catch (error) {
        console.error("Failed to get portfolio analysis:", error);
        return "Lo sentimos, no se pudo generar el análisis en este momento.";
    }
};

// --- MOCK PERFORMANCE DATA ---
const generateMockPerformance = (): { date: string; value: number }[] => {
    const data = [];
    let value = 100;
    for (let i = 0; i < 36; i++) {
        const date = new Date(2023, 0, 1);
        date.setMonth(date.getMonth() + i);
        value *= 1 + (Math.random() - 0.45) * 0.1;
        data.push({ date: date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' }), value });
    }
    return data;
};

const mockPortfolioData = generateMockPerformance();
const mockSP500Data = generateMockPerformance();


// --- COMPONENTS ---

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const Header: React.FC = () => (
    <div className="text-center p-6 bg-gray-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-center space-x-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            <span className="text-sm">INVESTMENT TRACKER</span>
        </div>
        <h1 className="text-5xl font-bold text-white mt-2">My portfolio</h1>
        <p className="text-xl text-gray-300 mt-1">At a glance</p>
    </div>
);

interface KpiCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    valueColor?: string;
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, icon, valueColor = 'text-white' }) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4">
        <div className="bg-gray-700 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
            {change && <p className="text-gray-400 text-xs">{change}</p>}
        </div>
    </div>
);

interface DoughnutChartProps {
    title: string;
    data: ChartData<'doughnut'>;
}
const DoughnutChart: React.FC<DoughnutChartProps> = ({ title, data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current && data && window.Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                // Use 'as any' to avoid type errors with global Chart constructor
                chartInstance.current = new (window.Chart as any)(ctx, {
                    type: 'doughnut',
                    data: data,
                    options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF' } } } },
                });
            }
        }
        return () => chartInstance.current?.destroy();
    }, [data]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center h-full">
            <h3 className="text-white font-semibold mb-2">{title}</h3>
            <div className="relative w-full h-48"><canvas ref={chartRef}></canvas></div>
        </div>
    );
};

interface PerformanceChartProps {
    portfolio: { date: string, value: number }[];
    sp500: { date: string, value: number }[];
}
const PerformanceChart: React.FC<PerformanceChartProps> = ({ portfolio, sp500 }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart<'line'> | null>(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current && window.Chart) {
            const ctx = chartRef.current.getContext('2d');
            if(ctx){
                chartInstance.current = new window.Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: portfolio.map(d => d.date),
                        datasets: [
                            { label: 'Portfolio', data: portfolio.map(d => d.value), borderColor: '#34D399', backgroundColor: 'rgba(52, 211, 153, 0.1)', fill: true, tension: 0.4 },
                            { label: 'S&P 500', data: sp500.map(d => d.value), borderColor: '#6B7280', backgroundColor: 'rgba(107, 114, 128, 0.1)', fill: true, tension: 0.4 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: '#9CA3AF' } }, x: { ticks: { color: '#9CA3AF' } } }, plugins: { legend: { display: false } } }
                });
            }
        }
        return () => chartInstance.current?.destroy();
    }, [portfolio, sp500]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
            <h3 className="text-white font-semibold mb-4">Historic performance</h3>
            <div className="h-80"><canvas ref={chartRef}></canvas></div>
        </div>
    );
};


interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (transaction: Transaction) => void;
}
const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onAddTransaction }) => {
    const [ticker, setTicker] = useState('');
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState<Transaction['type']>('buy');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAddTransaction({ ticker, shares: parseFloat(shares), price: parseFloat(price), type });
        setTicker(''); setShares(''); setPrice(''); setType('buy');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6">Add Transaction</h2>
                <form onSubmit={handleSubmit}>
                    {/* Form inputs remain the same */}
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="ticker">Ticker</label>
                        <input className="w-full bg-gray-700 text-white rounded py-2 px-3" id="ticker" type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required />
                    </div>
                     <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="shares">Shares</label>
                        <input className="w-full bg-gray-700 text-white rounded py-2 px-3" id="shares" type="number" value={shares} onChange={(e) => setShares(e.target.value)} required />
                    </div>
                     <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="price">Price per Share</label>
                        <input className="w-full bg-gray-700 text-white rounded py-2 px-3" id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <div className="mb-6">
                        <div className="flex">
                            <button type="button" onClick={() => setType('buy')} className={`flex-1 py-2 ${type === 'buy' ? 'bg-emerald-500' : 'bg-gray-700'}`}>Buy</button>
                            <button type="button" onClick={() => setType('sell')} className={`flex-1 py-2 ${type === 'sell' ? 'bg-red-500' : 'bg-gray-700'}`}>Sell</button>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button onClick={onClose} type="button">Cancel</button>
                        <button type="submit" className="bg-emerald-500 py-2 px-4 rounded">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}
const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    return (
        <div className={`fixed top-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4">&times;</button>
        </div>
    );
};

interface GeminiAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: string;
    isLoading: boolean;
}
const GeminiAnalysisModal: React.FC<GeminiAnalysisModalProps> = ({ isOpen, onClose, analysis, isLoading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Análisis de Cartera con IA</h2>
                    <button onClick={onClose} className="text-gray-400">&times;</button>
                </div>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Spinner /><p className="ml-4">Analizando...</p></div>
                ) : (
                    <div className="text-gray-300 space-y-4 whitespace-pre-wrap">
                        {analysis.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
function App() {
    const [positions, setPositions] = useState<Position[]>(initialPositions);
    const [positionsWithPrices, setPositionsWithPrices] = useState<PositionWithPrices[]>([]);
    const [portfolioTotals, setPortfolioTotals] = useState<PortfolioTotals>({ currentValue: 0, totalCost: 0, totalPl: 0, totalPlPercent: 0 });
    const [distributionData, setDistributionData] = useState<Record<string, ChartData<'doughnut'>>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' }>({ message: '', type: 'success' });
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalysisLoading, setAnalysisLoading] = useState(false);

    useEffect(() => {
        const loadScript = (src: string, onLoad: () => void) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = onLoad;
            document.body.appendChild(script);
        };
        let loadedCount = 0;
        const onScriptLoad = () => {
            loadedCount++;
            if (loadedCount === 2) setScriptsLoaded(true);
        };
        loadScript("https://cdn.jsdelivr.net/npm/chart.js", onScriptLoad);
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", onScriptLoad);
    }, []);

    useEffect(() => {
        const updatePortfolioData = async () => {
            if (positions.length === 0 || !scriptsLoaded) return;
            setIsLoadingPrices(true);
            const prices = await fetchStockPricesAPI(positions);
            let totalCurrentValue = 0, totalCostBasis = 0;

            const newPositionsWithPrices = positions.map(pos => {
                const currentPrice = prices[pos.ticker] || pos.avgCost;
                const currentValue = pos.shares * currentPrice;
                const costBasis = pos.shares * pos.avgCost;
                const pl = currentValue - costBasis;
                totalCurrentValue += currentValue;
                totalCostBasis += costBasis;
                return { ...pos, currentPrice, currentValue, costBasis, pl };
            });
            
            const totalPl = totalCurrentValue - totalCostBasis;
            const totalPlPercent = totalCostBasis > 0 ? (totalPl / totalCostBasis) * 100 : 0;

            setPositionsWithPrices(newPositionsWithPrices);
            setPortfolioTotals({ currentValue: totalCurrentValue, totalCost: totalCostBasis, totalPl, totalPlPercent });
            setIsLoadingPrices(false);
        };
        updatePortfolioData();
    }, [positions, scriptsLoaded]);

    useEffect(() => {
        const calculateDistribution = (key: keyof PositionWithPrices): ChartData<'doughnut'> => {
            const dist = positionsWithPrices.reduce((acc, pos) => {
                const group = pos[key] as string;
                acc[group] = (acc[group] || 0) + pos.currentValue;
                return acc;
            }, {} as Record<string, number>);

            const totalValue = Object.values(dist).reduce((s, v) => s + v, 0);
            const labels = Object.keys(dist);
            const data = labels.map(l => (dist[l] / totalValue) * 100);
            
            return {
                labels,
                datasets: [{ data, backgroundColor: ['#34D399', '#A78BFA', '#FBBF24', '#60A5FA', '#F87171'], borderColor: '#1F2937' }]
            };
        };
        if (positionsWithPrices.length > 0) {
            setDistributionData({
                category: calculateDistribution('category'),
                sector: calculateDistribution('sector'),
                marketCap: calculateDistribution('marketCap'),
            });
        }
    }, [positionsWithPrices]);
    
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: 'success' }), 3000);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const json = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                
                const newPositions: Position[] = json.map((row: any, index: number) => ({
                    id: Date.now() + index,
                    ticker: row.Ticker, shares: parseFloat(row.Shares), avgCost: parseFloat(row['Avg Cost']),
                    category: row.Category, sector: row.Sector, marketCap: row['Market Cap'],
                }));
                setPositions(newPositions);
                showNotification('Portfolio uploaded successfully!');
            } catch (error) {
                showNotification('Error reading Excel file.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = '';
    };
    
    const handleAddTransaction = (transaction: Transaction) => {
        const { ticker, shares, price, type } = transaction;
        setPositions(prev => {
            const existing = prev.find(p => p.ticker === ticker);
            if (type === 'buy') {
                if (existing) {
                    return prev.map(p => p.ticker === ticker ? { ...p, shares: p.shares + shares, avgCost: ((p.shares * p.avgCost) + (shares * price)) / (p.shares + shares) } : p);
                }
                return [...prev, { id: Date.now(), ticker, shares, avgCost: price, category: 'Misc', sector: 'Misc', marketCap: 'Unknown' }];
            } else { // sell
                if (!existing || existing.shares < shares) {
                    showNotification('Not enough shares to sell.', 'error');
                    return prev;
                }
                return prev.map(p => p.ticker === ticker ? { ...p, shares: p.shares - shares } : p).filter(p => p.shares > 0);
            }
        });
    };
    
    const handleGetAnalysis = async () => {
        setAnalysisModalOpen(true);
        setAnalysisLoading(true);
        const dataForAnalysis = positionsWithPrices.map(p => ({
            ticker: p.ticker, sector: p.sector,
            marketCap: p.marketCap, currentValue: p.currentValue.toFixed(2),
        }));
        const result = await getGeminiPortfolioAnalysis(dataForAnalysis);
        setAnalysisResult(result);
        setAnalysisLoading(false);
    };

    const kpis: KpiCardProps[] = [
        { title: 'Portfolio Value', value: `$${portfolioTotals.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
        { title: 'Total P/L', value: `$${portfolioTotals.totalPl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: `${portfolioTotals.totalPlPercent.toFixed(2)}%`, valueColor: portfolioTotals.totalPl >= 0 ? 'text-green-400' : 'text-red-400', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="4"/><path d="m6 14 6-6 6 6"/></svg> },
        { title: 'Positions', value: positions.length, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg> },
        { title: 'Total Cost', value: `$${portfolioTotals.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg> }
    ];

    if (!scriptsLoaded) {
        return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <>
            <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Header />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-6">
                        <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg">Upload Excel</button>
                        <button onClick={() => setIsModalOpen(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Add Transaction</button>
                        <button onClick={handleGetAnalysis} disabled={isAnalysisLoading || positions.length === 0} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">✨ Analizar Cartera con IA</button>
                    </div>
                    <div className="mt-6">
                         <h2 className="text-xl font-bold text-white mb-2">Portfolio distribution</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <DoughnutChart title="Category" data={distributionData.category || {labels:[], datasets:[]}} />
                           <DoughnutChart title="Sector" data={distributionData.sector || {labels:[], datasets:[]}} />
                           <DoughnutChart title="Market cap" data={distributionData.marketCap || {labels:[], datasets:[]}} />
                        </div>
                    </div>
                    <PerformanceChart portfolio={mockPortfolioData} sp500={mockSP500Data} />
                    <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6">
                         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                            <span>Current Positions</span>
                            {isLoadingPrices && <Spinner />}
                         </h2>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-600">
                                    <tr>
                                        <th className="p-3">Ticker</th><th className="p-3">Shares</th><th className="p-3">Avg. Cost</th>
                                        <th className="p-3">Current Price</th><th className="p-3">Current Value</th><th className="p-3">P/L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positionsWithPrices.map(pos => (
                                        <tr key={pos.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-3 font-bold">{pos.ticker}</td>
                                            <td className="p-3">{pos.shares.toLocaleString()}</td>
                                            <td className="p-3">${pos.avgCost.toFixed(2)}</td>
                                            <td className="p-3">${pos.currentPrice.toFixed(2)}</td>
                                            <td className="p-3 font-semibold">${pos.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            <td className={`p-3 font-semibold ${pos.pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ${pos.pl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            </div>
            
            <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTransaction={handleAddTransaction} />
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: 'success' })} />
            <GeminiAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setAnalysisModalOpen(false)} analysis={analysisResult} isLoading={isAnalysisLoading} />
        </>
    );
}

export default App;

