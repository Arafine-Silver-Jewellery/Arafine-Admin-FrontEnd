// Horizontal ranked-bar chart for the "Sales by category" card.
// Replaces the previous donut — ranked data reads more clearly as bars
// than as a circular composition, and the leader is immediately obvious
// from the longest bar.

import { formatPrice } from "../../utils/format";
import type { BreakdownItem } from "../../types";

interface CategoryBarsProps {
  items: BreakdownItem[];
  totalLabel?: string;
  totalValue?: number;
}

const SLOTS = [
  "var(--c-series-1)",
  "var(--c-series-2)",
  "var(--c-series-3)",
  "var(--c-series-4)",
  "var(--c-series-5)",
  "var(--c-series-6)",
];

export default function CategoryBars({ items, totalLabel, totalValue }: CategoryBarsProps) {
  // Fold the tail past 6 into "Other" so the chart never seats a 7th hue.
  let display = items;
  if (items.length > 6) {
    const head = items.slice(0, 5);
    const otherTotal = items.slice(5).reduce((s, i) => s + i.value, 0);
    display = [...head, { label: "Other", value: otherTotal }];
  }

  const total = totalValue ?? items.reduce((s, i) => s + i.value, 0);

  // Find the leader for the header callout and the top-row emphasis.
  const topIdx = display.length > 0
    ? display.reduce((bestIdx, item, idx, arr) => (item.value > arr[bestIdx].value ? idx : bestIdx), 0)
    : -1;
  const topItem = topIdx >= 0 ? display[topIdx] : null;
  const topPct = topItem && total > 0 ? Math.round((topItem.value / total) * 100) : 0;

  return (
    <div className="bars-wrap">
      {/* Header callout: total + leader */}
      <div className="bars-headline">
        <span className="bars-headline-total">{formatPrice(total, { compact: total >= 100000 })}</span>
        {topItem && (
          <span className="bars-headline-leader">
            <span className="bars-headline-leader-dot" style={{ background: SLOTS[topIdx % SLOTS.length] }} />
            <span className="bars-headline-leader-name">{topItem.label}</span>
            <span className="bars-headline-leader-pct">leads with {topPct}%</span>
          </span>
        )}
        {totalLabel && <span className="bars-headline-label">{totalLabel}</span>}
      </div>

      {/* Ranked bar list */}
      <ul className="bars-list">
        {display.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <li
              key={item.label}
              className="bars-row"
            >
              <div className="bars-row-meta">
                <span className="bars-swatch" style={{ background: SLOTS[idx % SLOTS.length] }} />
                <span className="bars-label" title={item.label}>{item.label}</span>
                <span className="bars-pct">{pct.toFixed(0)}%</span>
                <span className="bars-value">{formatPrice(item.value, { compact: true })}</span>
              </div>
              <div className="bars-track" aria-hidden="true">
                <span
                  className="bars-fill"
                  style={{ width: `${pct}%`, background: SLOTS[idx % SLOTS.length] }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
