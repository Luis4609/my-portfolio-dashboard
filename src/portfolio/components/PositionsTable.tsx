import Spinner from "../../shared/components/Spinner";
import type { PositionWithPrices } from "../types";

const PositionsTable: React.FC<{
  positions: PositionWithPrices[];
  isLoading: boolean;
}> = ({ positions, isLoading }) => (
  <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6">
    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
      <span>Current Positions</span>
      {isLoading && <Spinner />}
    </h2>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-gray-600">
          <tr>
            <th className="p-3">Ticker</th>
            <th className="p-3">Shares</th>
            <th className="p-3">Avg. Cost</th>
            <th className="p-3">Current Price</th>
            <th className="p-3">Current Value</th>
            <th className="p-3">P/L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.id}
              className="border-b border-gray-700 hover:bg-gray-700/50"
            >
              <td className="p-3 font-bold">{pos.ticker}</td>
              <td className="p-3">{pos.shares.toLocaleString()}</td>
              <td className="p-3">${pos.avgCost.toFixed(2)}</td>
              <td className="p-3">${pos.currentPrice.toFixed(2)}</td>
              <td className="p-3 font-semibold">
                $
                {pos.currentValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td
                className={`p-3 font-semibold ${
                  pos.pl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                $
                {pos.pl.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default PositionsTable;
