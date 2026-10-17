// Single 100% stacked bar for the "Sales by category" card.
// Direct labels live INSIDE a segment when the share is wide enough to
// fit (>=12%); otherwise they live OUTSIDE the bar, just past the segment
// end. Total sits above the bar in muted ink. No swatch-grid legend —
// the bar carries identity through its labels.

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

// Threshold below which the label goes OUTSIDE the segment, not inside.
// Below this width the label won't fit and would clip.
const INLINE_LABEL_MIN_PCT = 12;

export default function CategoryBars({ items, totalLabel, totalValue }: CategoryBarsProps) {
  // Fold the tail past 6 into "Other" so the chart never seats a 7th hue.
  let display = items;
  if (items.length > 6) {
    const head = items.slice(0, 5);
    const otherTotal = items.slice(5).reduce((s, i) => s + i.value, 0);
    display = [...head, { label: "Other", value: otherTotal }];
  }

  const total = totalValue ?? items.reduce((s, i) => s + i.value, 0);

  return (
    <div className="cat-wrap">
      {/* Total above the bar — answers "how big is the pie" before the eye reaches segments. */}
      <div className="cat-headline">
        <span className="cat-headline-total">
          {formatPrice(total, { compact: total >= 100000 })}
        </span>
        {totalLabel && <span className="cat-headline-label">{totalLabel}</span>}
      </div>

      {/* 100% stacked bar with direct labels */}
      <div className="cat-stack" role="img" aria-label="Category revenue share">
        {display.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          const color = SLOTS[idx % SLOTS.length];
          const inline = pct >= INLINE_LABEL_MIN_PCT;
          return (
            <div
              key={item.label}
              className={inline ? "cat-seg cat-seg--inline" : "cat-seg"}
              style={{ width: `${pct}%`, background: color }}
              title={`${item.label} · ${pct.toFixed(0)}%`}
            >
              <span className="cat-seg-label">{item.label}</span>
              <span className="cat-seg-pct">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      {/* Compact swatch-key under the bar: only for segments whose label
          lives outside (so the user can identify which color = which name). */}
      <ul className="cat-key">
        {display
          .map((item, idx) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return { item, pct, idx };
          })
          .filter(({ pct }) => pct < INLINE_LABEL_MIN_PCT)
          .map(({ item, pct, idx }) => (
            <li key={item.label} className="cat-key-item">
              <span className="cat-key-swatch" style={{ background: SLOTS[idx % SLOTS.length] }} />
              <span className="cat-key-name">{item.label}</span>
              <span className="cat-key-pct">{pct.toFixed(0)}%</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
