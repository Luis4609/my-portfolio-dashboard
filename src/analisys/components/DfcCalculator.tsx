import React, { useState } from 'react';
import { fetchEpsAPI } from '../api';
import Spinner from '../../shared/components/Spinner';

export const DcfCalculator: React.FC = () => {
    const [ticker, setTicker] = useState('');
    const [currentEps, setCurrentEps] = useState<number | null>(null);
    const [growthRate, setGrowthRate] = useState('15'); // 5-year growth rate
    const [terminalGrowthRate, setTerminalGrowthRate] = useState('3'); // Perpetual growth rate
    const [discountRate, setDiscountRate] = useState('8.5'); // WACC
    const [intrinsicValue, setIntrinsicValue] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCalculate = async () => {
        setIsLoading(true);
        setError('');
        setIntrinsicValue(null);
        
        const eps = await fetchEpsAPI(ticker);
        if (eps === null) {
            setError('No se pudo obtener el EPS. Verifica el ticker.');
            setIsLoading(false);
            return;
        }
        setCurrentEps(eps);

        // --- DCF Logic ---
        const g = parseFloat(growthRate) / 100;
        const tg = parseFloat(terminalGrowthRate) / 100;
        const d = parseFloat(discountRate) / 100;

        if (isNaN(g) || isNaN(tg) || isNaN(d)) {
            setError('Por favor, introduce valores numéricos válidos.');
            setIsLoading(false);
            return;
        }

        let futureEps = eps;
        let discountedFutureEpsSum = 0;

        // Project and discount EPS for the next 10 years
        for (let i = 1; i <= 10; i++) {
            futureEps *= (1 + g);
            discountedFutureEpsSum += futureEps / Math.pow(1 + d, i);
        }

        // Calculate terminal value and discount it
        const terminalValue = (futureEps * (1 + tg)) / (d - tg);
        const discountedTerminalValue = terminalValue / Math.pow(1 + d, 10);
        
        const calculatedValue = discountedFutureEpsSum + discountedTerminalValue;
        
        setIntrinsicValue(calculatedValue);
        setIsLoading(false);
    };

    return (
        <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Calculadora DCF (Valor Intrínseco)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Inputs */}
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Ticker</label>
                    <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="w-full bg-gray-700 text-white rounded py-2 px-3" placeholder="Ej: AAPL" />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Tasa Crecimiento (5-10 años, %)</label>
                    <input type="number" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} className="w-full bg-gray-700 text-white rounded py-2 px-3" />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Tasa Crecimiento Terminal (%)</label>
                    <input type="number" value={terminalGrowthRate} onChange={(e) => setTerminalGrowthRate(e.target.value)} className="w-full bg-gray-700 text-white rounded py-2 px-3" />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Tasa de Descuento (WACC, %)</label>
                    <input type="number" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} className="w-full bg-gray-700 text-white rounded py-2 px-3" />
                </div>
            </div>
            <div className="mt-4">
                <button onClick={handleCalculate} disabled={isLoading || !ticker} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2">
                    {isLoading && <Spinner />}
                    Calcular Valor Intrínseco
                </button>
            </div>
            {error && <p className="text-red-400 mt-4">{error}</p>}
            {currentEps !== null && (
                <p className="text-gray-300 mt-4">EPS (TTM) actual obtenido para {ticker}: <strong>${currentEps.toFixed(2)}</strong></p>
            )}
            {intrinsicValue !== null && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                    <h3 className="text-lg font-bold text-white">Valor Intrínseco Estimado por Acción:</h3>
                    <p className="text-3xl font-bold text-emerald-400">${intrinsicValue.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};