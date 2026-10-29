// Leaderboard for the "Top selling" card.
// Each row: product thumbnail, name+SKU, units bar, units + revenue.
// The bar carries the rank comparison; right column carries the values.

import { formatPrice } from "../../utils/format";
import type { TopSellingItem } from "../../types";

interface TopSellingChartProps {
  items: TopSellingItem[];
}

const MAX_ROWS = 8;
const PLACEHOLDER_THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='6' fill='%23f1f5f9'/><path d='M12 26l5-5 4 4 7-7' stroke='%2394a3b8' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/><circle cx='27' cy='14' r='3' fill='%2394a3b8'/></svg>";

export default function TopSellingChart({ items }: TopSellingChartProps) {
  const sorted = [...items]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, MAX_ROWS);

  // Bar width is relative to the leader, not the sum — "what fraction of #1 is this row?"
  const maxUnits = sorted.length > 0 ? sorted[0].unitsSold : 1;

  return (
    <ol className="tops-wrap">
      {sorted.map((item) => {
        const fillPct = maxUnits > 0 ? (item.unitsSold / maxUnits) * 100 : 0;
        return (
          <li key={item.productId} className="tops-row">
            <img
              className="tops-thumb"
              src={item.imageUrl ?? PLACEHOLDER_THUMB}
              alt=""
              loading="lazy"
            />
            <div className="tops-meta">
              <span className="tops-name" title={item.name}>{item.name}</span>
              <span className="tops-sku">{item.sku}</span>
            </div>
            <div className="tops-bar-wrap" aria-label={`${item.unitsSold} units sold`}>
              <div className="tops-bar-track">
                <div
                  className="tops-bar-fill"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
            <div className="tops-stats">
              <span className="tops-units">{item.unitsSold.toLocaleString("en-IN")} units</span>
              <span className="tops-revenue">{formatPrice(item.revenue, { compact: true })}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
