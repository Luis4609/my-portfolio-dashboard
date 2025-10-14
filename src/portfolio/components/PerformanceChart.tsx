import React, { useEffect, useRef } from "react";
import Spinner from "../../shared/components/Spinner";

interface PerformanceChartProps {
  portfolio: { date: string; value: number }[];
  sp500: { date: string; value: number }[];
  isLoading: boolean;
}
const PerformanceChart: React.FC<PerformanceChartProps> = ({
  portfolio,
  sp500,
  isLoading,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    chartInstance.current?.destroy();
    if (chartRef.current && window.Chart) {
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new window.Chart(ctx, {
          type: "line",
          data: {
            labels: portfolio.map((d) => d.date),
            datasets: [
              {
                label: "Portfolio",
                data: portfolio.map((d) => d.value),
                borderColor: "#34D399",
                backgroundColor: "rgba(52, 211, 153, 0.1)",
                fill: true,
              },
              {
                label: "S&P 500",
                data: sp500.map((d) => d.value),
                borderColor: "#6B7280",
                backgroundColor: "rgba(107, 114, 128, 0.1)",
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
              line: {
                tension: 0.4,
              },
            },
            scales: {
              x: {
                type: "category",
                ticks: { color: "#9CA3AF" }
              },
              y: {
                type: "linear",
                ticks: { color: "#9CA3AF" }
              },
            },
            plugins: { legend: { display: false } },
          },
        });
      }
    }
    return () => {
      chartInstance.current?.destroy();
    };
  }, [portfolio, sp500]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span>Historic performance</span>
          {isLoading && <Spinner />}
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2"></span>
            <span className="text-gray-300">Portfolio</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
            <span className="text-gray-300">S&P 500</span>
          </div>
        </div>
      </div>
      {portfolio.length === 0 && !isLoading ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <p>
            No historical data to display. Add positions to see performance.
          </p>
        </div>
      ) : (
        <div className="h-80">
          <canvas ref={chartRef}></canvas>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;
