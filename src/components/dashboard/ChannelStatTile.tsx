// Channel-mix card: single line chart with two series — POS (primary ink) and
// Online (muted). Replaces the two-stat-tile version; the chart form reads
// "how are these two channels moving against each other?" which is the question
// a person running a business actually has. The chart is honest when Online is
// flat at 0 for the whole period — that line still draws, it just hugs the axis.

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatShortDate } from "../../utils/format";
import type { TrendPoint } from "../../types";

interface ChannelStatTileProps {
  online: number;
  pos: number;
  /** Daily series for the selected range. Optional — chart falls back to a placeholder. */
  series?: TrendPoint[];
}

// Compare the most recent half of the series to the prior half.
// Returns null if either half is zero (avoids "infinity%" noise on small samples).
function deltaPct(values: number[]): number | null {
  if (values.length < 4) return null;
  const mid = Math.floor(values.length / 2);
  const prior = values.slice(0, mid).reduce((s, v) => s + v, 0);
  const recent = values.slice(mid).reduce((s, v) => s + v, 0);
  if (prior === 0) return null;
  return ((recent - prior) / prior) * 100;
}

function formatDelta(pct: number | null): { text: string; tone: "up" | "down" | "flat" | "na" } {
  if (pct === null) return { text: "—", tone: "na" };
  if (pct === 0) return { text: "0%", tone: "flat" };
  const rounded = Math.round(pct);
  if (rounded > 0) return { text: `+${rounded}%`, tone: "up" };
  return { text: `${rounded}%`, tone: "down" };
}

export default function ChannelStatTile({ online, pos, series }: ChannelStatTileProps) {
  // Normalize: never pass null/undefined into Recharts; always a real array.
  const data = (series ?? []).map(p => ({
    date: p.date,
    online: Math.max(0, p.online ?? 0),
    pos: Math.max(0, p.pos ?? 0),
  }));

  const onlineSeries = data.map(d => d.online);
  const posSeries = data.map(d => d.pos);

  const onlineDelta = formatDelta(deltaPct(onlineSeries));
  const posDelta = formatDelta(deltaPct(posSeries));

  return (
    <div className="channel-wrap">
      {/* Headline: totals + deltas per channel */}
      <div className="channel-headline">
        <div className="channel-headline-row">
          <span className="channel-headline-swatch" style={{ background: "var(--c-series-2)" }} aria-hidden="true" />
          <span className="channel-headline-label">POS</span>
          <span className="channel-headline-number">{pos.toLocaleString("en-IN")}</span>
          {posDelta.tone !== "na" && (
            <span className={`channel-headline-delta channel-headline-delta--${posDelta.tone}`}>
              {posDelta.tone === "up" ? "▲" : posDelta.tone === "down" ? "▼" : "•"} {posDelta.text}
            </span>
          )}
        </div>
        <div className="channel-headline-row">
          <span className="channel-headline-swatch channel-headline-swatch--muted" aria-hidden="true" />
          <span className="channel-headline-label">Online</span>
          <span className="channel-headline-number">{online.toLocaleString("en-IN")}</span>
          {onlineDelta.tone !== "na" && (
            <span className={`channel-headline-delta channel-headline-delta--${onlineDelta.tone}`}>
              {onlineDelta.tone === "up" ? "▲" : onlineDelta.tone === "down" ? "▼" : "•"} {onlineDelta.text}
            </span>
          )}
          {online === 0 && <span className="channel-headline-status">Quiet</span>}
        </div>
      </div>

      {/* Single line chart, both channels on shared y-axis */}
      <div className="channel-chart">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              cursor={{ stroke: "var(--border-color)", strokeDasharray: "3 3" }}
              labelFormatter={label => formatShortDate(label as string, { withYear: false, withMonth: true })}
              formatter={(value: number, name: string) => [value.toLocaleString("en-IN"), name]}
            />
            <Line
              type="monotone"
              dataKey="pos"
              name="POS"
              stroke="var(--c-series-2)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--color-white)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="online"
              name="Online"
              stroke="var(--c-series-1)"
              strokeOpacity={online === 0 ? 0.35 : 1}
              strokeWidth={1.75}
              strokeDasharray={online === 0 ? "3 3" : undefined}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--color-white)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
