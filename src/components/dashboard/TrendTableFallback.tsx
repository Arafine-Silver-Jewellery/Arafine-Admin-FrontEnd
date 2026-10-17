import { formatPrice, formatShortDate } from "../../utils/format";
import type { TrendPoint } from "../../types";

interface TrendTableFallbackProps {
  points: TrendPoint[];
  metric: "revenue" | "orders";
}

export default function TrendTableFallback({ points, metric }: TrendTableFallbackProps) {
  return (
    <table className="chart-fallback-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>{metric === "revenue" ? "Revenue" : "Orders"}</th>
        </tr>
      </thead>
      <tbody>
        {points.map(p => (
          <tr key={p.date}>
            <td>{formatShortDate(p.date, { withYear: false, withMonth: true })}</td>
            <td>{metric === "revenue" ? formatPrice(p.value) : p.value.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
