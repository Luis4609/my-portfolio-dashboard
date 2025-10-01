import React, { useState } from 'react';
import type { Transaction } from '../types';

// --- Transaction Components ---
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
                    <div className="mb-4"><label className="block text-gray-400 text-sm font-bold mb-2">Ticker</label><input className="w-full bg-gray-700 text-white rounded py-2 px-3" type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required /></div>
                    <div className="mb-4"><label className="block text-gray-400 text-sm font-bold mb-2">Shares</label><input className="w-full bg-gray-700 text-white rounded py-2 px-3" type="number" value={shares} onChange={(e) => setShares(e.target.value)} required /></div>
                    <div className="mb-4"><label className="block text-gray-400 text-sm font-bold mb-2">Price per Share</label><input className="w-full bg-gray-700 text-white rounded py-2 px-3" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                    <div className="mb-6">
                        <div className="flex">
                            <button type="button" onClick={() => setType('buy')} className={`flex-1 py-2 ${type === 'buy' ? 'bg-emerald-500' : 'bg-gray-700'}`}>Buy</button>
                            <button type="button" onClick={() => setType('sell')} className={`flex-1 py-2 ${type === 'sell' ? 'bg-red-500' : 'bg-gray-700'}`}>Sell</button>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4"><button onClick={onClose} type="button">Cancel</button><button type="submit" className="bg-emerald-500 py-2 px-4 rounded">Add</button></div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;