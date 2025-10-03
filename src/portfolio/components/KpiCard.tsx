import type { KpiCardProps } from "../types/types";

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  icon,
  valueColor = "text-white",
}) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4">
    <div className="bg-gray-700 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {change && <p className="text-gray-400 text-xs">{change}</p>}
    </div>
  </div>
);

export default KpiCard;
