import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatPrice } from "../../utils/format";
import type { BreakdownItem } from "../../types";

interface CategoryDonutProps {
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

export default function CategoryDonut({ items, totalLabel, totalValue }: CategoryDonutProps) {
  // Fold the tail past 6 into "Other" so the chart never seats a 7th hue.
  let display = items;
  if (items.length > 6) {
    const head = items.slice(0, 5);
    const otherTotal = items.slice(5).reduce((s, i) => s + i.value, 0);
    display = [...head, { label: "Other", value: otherTotal }];
  }

  const total = totalValue ?? items.reduce((s, i) => s + i.value, 0);

  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Tooltip
            contentStyle={{
              background: "var(--color-white)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--color-charcoal)",
            }}
            formatter={(value: number) => [formatPrice(value), ""]}
          />
          <Pie
            data={display}
            dataKey="value"
            nameKey="label"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            stroke="var(--color-white)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {display.map((_, idx) => (
              <Cell key={idx} fill={SLOTS[idx % SLOTS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <span className="donut-center-value">{formatPrice(total, { compact: total >= 100000 })}</span>
        {totalLabel && <span className="donut-center-label">{totalLabel}</span>}
      </div>
      <ul className="donut-legend">
        {display.map((item, idx) => (
          <li key={item.label}>
            <span className="donut-legend-swatch" style={{ background: SLOTS[idx % SLOTS.length] }} />
            <span className="donut-legend-label">{item.label}</span>
            <span className="donut-legend-value">{formatPrice(item.value, { compact: true })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
