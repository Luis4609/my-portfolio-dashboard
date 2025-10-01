import React, { useEffect, useRef } from "react";

interface PerformanceChartProps {
  portfolio: { date: string; value: number }[];
  sp500: { date: string; value: number }[];
}
const PerformanceChart: React.FC<PerformanceChartProps> = ({
  portfolio,
  sp500,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    chartInstance.current?.destroy();
    if (chartRef.current && (window as any).Chart) {
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new (window as any).Chart(ctx, {
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
                tension: 0.4,
              },
              {
                label: "S&P 500",
                data: sp500.map((d) => d.value),
                borderColor: "#6B7280",
                backgroundColor: "rgba(107, 114, 128, 0.1)",
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { ticks: { color: "#9CA3AF" } },
              x: { ticks: { color: "#9CA3AF" } },
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
      <h3 className="text-white font-semibold mb-4">Historic performance</h3>
      <div className="h-80">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default PerformanceChart;
