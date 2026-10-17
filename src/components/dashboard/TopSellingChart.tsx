import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPrice } from "../../utils/format";
import type { TopSellingItem } from "../../types";

interface TopSellingChartProps {
  items: TopSellingItem[];
}

export default function TopSellingChart({ items }: TopSellingChartProps) {
  // Top selling is a single-hue emphasis chart — the value is rank, not identity.
  // Highest-selling gets the strongest saturation; rest fade slightly to push the eye
  // toward the leader. This is "emphasis", not "categorical".
  const sorted = [...items]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 8)
    .map(item => ({
      name: item.name,
      sku: item.sku,
      unitsSold: item.unitsSold,
      revenuePaise: item.revenuePaise,
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 36 + 32)}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          stroke="var(--c-axis-text)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ width: 140 }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-white)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--color-charcoal)",
          }}
          cursor={{ fill: "var(--color-ivory)" }}
          formatter={(value: number, _name, props) => {
            const revenue = (props.payload as { revenuePaise: number }).revenuePaise;
            return [`${value} units · ${formatPrice(revenue)}`, "Sold"];
          }}
        />
        <Bar dataKey="unitsSold" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {sorted.map((entry, idx) => (
            <Cell
              key={entry.sku}
              fill="var(--c-series-1)"
              fillOpacity={idx === 0 ? 1 : Math.max(0.4, 1 - idx * 0.08)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
