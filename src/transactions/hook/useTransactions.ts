import { useState, useCallback } from "react";
import type { Position } from "../../portfolio/types";
import type { Transaction } from "../types";

export const useTransactions = (
  setPositions: React.Dispatch<React.SetStateAction<Position[]>>,
  showNotification: (message: string, type?: "success" | "error") => void
) => {
  const [isTxModalOpen, setTxModalOpen] = useState(false);

  const handleAddTransaction = useCallback(
    (transaction: Transaction) => {
      setPositions((prev) => {
        const existing = prev.find((p) => p.ticker === transaction.ticker);
        if (transaction.type === "buy") {
          if (existing) {
            return prev.map((p) =>
              p.ticker === transaction.ticker
                ? {
                    ...p,
                    shares: p.shares + transaction.shares,
                    avgCost:
                      (p.shares * p.avgCost +
                        transaction.shares * transaction.price) /
                      (p.shares + transaction.shares),
                  }
                : p
            );
          }
          return [
            ...prev,
            {
              id: Date.now(),
              ticker: transaction.ticker,
              shares: transaction.shares,
              avgCost: transaction.price,
              category: "Misc",
              sector: "Misc",
              marketCap: "Unknown",
            },
          ];
        } else {
          // sell
          if (!existing || existing.shares < transaction.shares) {
            showNotification("Not enough shares to sell.", "error");
            return prev;
          }
          return prev
            .map((p) =>
              p.ticker === transaction.ticker
                ? { ...p, shares: p.shares - transaction.shares }
                : p
            )
            .filter((p) => p.shares > 0);
        }
      });
    },
    [setPositions, showNotification]
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = window.XLSX.read(data, { type: "array" });
          const json = window.XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]]
          );
          const newPositions: Position[] = json.map((row: any, i: number) => ({
            id: Date.now() + i,
            ticker: row.Ticker,
            shares: parseFloat(row.Shares),
            avgCost: parseFloat(row["Avg Cost"]),
            category: row.Category,
            sector: row.Sector,
            marketCap: row["Market Cap"],
          }));
          setPositions(newPositions);
          showNotification("Portfolio uploaded successfully!");
        } catch (error) {
          showNotification("Error reading Excel file.", "error");
        }
      };
      reader.readAsArrayBuffer(file);
      event.target.value = "";
    },
    [setPositions, showNotification]
  );

  return {
    isTxModalOpen,
    openTxModal: () => setTxModalOpen(true),
    closeTxModal: () => setTxModalOpen(false),
    handleAddTransaction,
    handleFileUpload,
  };
};
