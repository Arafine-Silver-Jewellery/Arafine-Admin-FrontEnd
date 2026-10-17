import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPrice, formatShortDate } from "../../utils/format";
import type { TrendPoint } from "../../types";

interface RevenueTrendChartProps {
  data: TrendPoint[];
  color?: string;
}

export default function RevenueTrendChart({ data, color = "var(--c-series-1)" }: RevenueTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={v => formatPrice(v as number, { compact: true })}
          stroke="var(--c-axis-text)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-white)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--color-charcoal)",
          }}
          formatter={(value: number) => [formatPrice(value), "Revenue"]}
          labelFormatter={label => formatShortDate(label as string, { withYear: false, withMonth: true })}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#revenueFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
