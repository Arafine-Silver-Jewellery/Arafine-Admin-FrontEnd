import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatShortDate } from "../../utils/format";
import type { TrendPoint } from "../../types";

interface OrdersTrendChartProps {
  data: TrendPoint[];
  color?: string;
}

export default function OrdersTrendChart({ data, color = "var(--c-series-2)" }: OrdersTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--c-grid)" vertical={false} strokeDasharray="" />
        <XAxis
          dataKey="date"
          tickFormatter={v => formatShortDate(v as string)}
          stroke="var(--c-axis-text)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
        />
        <YAxis
          allowDecimals={false}
          stroke="var(--c-axis-text)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={36}
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
          formatter={(value: number) => [value, "Orders"]}
          labelFormatter={label => formatShortDate(label as string, { withYear: false, withMonth: true })}
        />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
