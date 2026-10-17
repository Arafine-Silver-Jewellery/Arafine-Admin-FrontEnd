import { formatPrice } from "../../utils/format";
import type { BreakdownItem } from "../../types";

interface BreakdownTableFallbackProps {
  items: BreakdownItem[];
  valueLabel?: string;
  asCount?: boolean;
}

export default function BreakdownTableFallback({ items, valueLabel, asCount }: BreakdownTableFallbackProps) {
  return (
    <table className="chart-fallback-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>{valueLabel ?? (asCount ? "Orders" : "Value")}</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.label}>
            <td>{item.label}</td>
            <td>{asCount ? item.value.toLocaleString() : formatPrice(item.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
