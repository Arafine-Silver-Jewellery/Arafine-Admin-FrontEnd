// Vertical-bar chart for the "Sales by category" card.
// One bar per category, sorted biggest to smallest. Bar height carries
// share, color carries identity, and the absolute figure labels each
// bar from above so the user never has to do share × total in their head.

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

interface BarDatum {
  name: string;
  value: number;
  pct: number;
  fill: string;
  idx: number;
}

export default function CategoryBars({ items, totalLabel, totalValue }: CategoryBarsProps) {
  // Fold the tail past 6 into "Other" so the chart never seats a 7th hue.
  let display = items;
  if (items.length > 6) {
    const head = items.slice(0, 5);
    const otherTotal = items.slice(5).reduce((s, i) => s + i.value, 0);
    display = [...head, { label: "Other", value: otherTotal }];
  }

  const total = totalValue ?? items.reduce((s, i) => s + i.value, 0);

  // Build bar data with stable idx so colors map to names regardless of sort.
  const data: BarDatum[] = display
    .map((item, idx) => ({
      name: item.label,
      value: item.value,
      pct: total > 0 ? (item.value / total) * 100 : 0,
      fill: SLOTS[idx % SLOTS.length],
      idx,
    }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="cat-wrap">
      {/* Total above the chart */}
      <div className="cat-headline">
        <span className="cat-headline-total">
          {formatPrice(total, { compact: total >= 100000 })}
        </span>
        {totalLabel && <span className="cat-headline-label">{totalLabel}</span>}
      </div>

      {/* Vertical bar chart. Height: leaves the body to fill naturally;
          ResponsiveContainer just sets the minimum baseline. */}
      <div className="cat-bars-chart">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart
            data={data}
            margin={{ top: 28, right: 12, bottom: 8, left: 0 }}
            barCategoryGap="26%"
          >
            <XAxis
              dataKey="name"
              stroke="var(--c-axis-text)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 11, fill: "var(--color-charcoal)" }}
            />
            <YAxis
              hide
              domain={[0, (dataMax: number) => Math.ceil((dataMax * 1.15) / 10) * 10]}
            />
            <Tooltip
              cursor={{ fill: "var(--color-ivory)" }}
              contentStyle={{
                background: "var(--color-white)",
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                fontSize: 12,
                color: "var(--color-charcoal)",
              }}
              // XAxis labels are category names, not dates — leave the
              // default label rendering alone.
              labelFormatter={() => ""}
              formatter={(_value: number, _name, props) => {
                const d = props.payload as BarDatum;
                return [
                  `${d.pct.toFixed(0)}% · ${formatPrice(d.value, { compact: true })}`,
                  d.name,
                ];
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: number) => formatPrice(v, { compact: true })}
                fill="var(--color-charcoal)"
                fontSize={11}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
