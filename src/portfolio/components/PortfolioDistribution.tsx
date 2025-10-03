import type { ChartData } from "chart.js";
import { useState, useEffect } from "react";
import DoughnutChart from "./DoughnutChart";

const PortfolioDistribution: React.FC<{
  data: Record<string, ChartData>;
}> = ({ data }) => {
  const [distributionData, setDistributionData] = useState<
    Record<string, ChartData>
  >({});
  useEffect(() => {
    setDistributionData(data);
  }, [data]);
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-white mb-2">
        Portfolio distribution
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DoughnutChart
          title="Category"
          data={distributionData.category || { labels: [], datasets: [] }}
        />
        <DoughnutChart
          title="Sector"
          data={distributionData.sector || { labels: [], datasets: [] }}
        />
        <DoughnutChart
          title="Market cap"
          data={distributionData.marketCap || { labels: [], datasets: [] }}
        />
      </div>
    </div>
  );
};

export default PortfolioDistribution;
