import type { Chart, ChartData } from "chart.js";
import React, { useEffect, useRef } from "react";

interface DoughnutChartProps {
  title: string;
  data: ChartData<"doughnut">;
}
// const DoughnutChart: React.FC<DoughnutChartProps> = ({ title, data }) => {
//   const chartRef = useRef<HTMLCanvasElement>(null);
//   const chartInstance = useRef<Chart<"doughnut"> | null>(null);

//   useEffect(() => {
//     chartInstance.current?.destroy();
//     if (chartRef.current && data && window.Chart) {
//       const ctx = chartRef.current.getContext("2d");
//       if (ctx) {
//         chartInstance.current = new window.Chart(ctx, {
//           type: "doughnut",
//           data,
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             cutout: "70%",
//             plugins: {
//               legend: { position: "bottom", labels: { color: "#9CA3AF" } },
//             },
//           },
//         }) as Chart<"doughnut">;
//       }
//     }
//     return () => chartInstance.current?.destroy();
//   }, [data]);

//   return (
//     <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center h-full">
//       <h3 className="text-white font-semibold mb-2">{title}</h3>
//       <div className="relative w-full h-48">
//         <canvas ref={chartRef}></canvas>
//       </div>
//     </div>
//   );
// };

const DoughnutChart: React.FC<DoughnutChartProps> = ({ title, data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (chartRef.current && data && window.Chart) {
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        // Use 'as any' to avoid type errors with global Chart constructor
        chartInstance.current = new (window.Chart as any)(ctx, {
          type: "doughnut",
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
              legend: { position: "bottom", labels: { color: "#9CA3AF" } },
            },
          },
        });
      }
    }
    return () => chartInstance.current?.destroy();
  }, [data]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center h-full">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <div className="relative w-full h-48">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default DoughnutChart;
