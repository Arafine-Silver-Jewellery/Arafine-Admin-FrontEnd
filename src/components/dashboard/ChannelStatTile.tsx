// Channel-mix card: two stat tiles side-by-side, one per channel.
// Each tile carries: label, hero number, +/-% vs prior period, 30-day sparkline.
// POS is the dominant hue; Online is muted (or carries a "Quiet" status tag if zero).
// This replaces a 2-slice donut, which is a known anti-pattern when one slice is 0.

import Sparkline from "./Sparkline";

interface ChannelPoint {
  date: string;
  online?: number;
  pos?: number;
}

interface ChannelStatTileProps {
  online: number;
  pos: number;
  /** Daily series for the selected range. Optional — sparkline falls back to count only. */
  series?: ChannelPoint[];
}

interface TileConfig {
  key: "online" | "pos";
  label: string;
  value: number;
  color: string;
  sparkColor: string;
  // When value is 0, the tile is the empty state: muted ink + status tag.
  empty: boolean;
}

// Compute "+X%" by comparing the most recent half of the series to the
// prior half. Returns null if either half has zero (avoids divide-by-zero
// and "infinity%" noise on small samples).
function deltaPct(series: number[]): number | null {
  if (series.length < 4) return null;
  const mid = Math.floor(series.length / 2);
  const prior = series.slice(0, mid).reduce((s, v) => s + v, 0);
  const recent = series.slice(mid).reduce((s, v) => s + v, 0);
  if (prior === 0) {
    if (recent === 0) return 0;
    return null; // undefined jump from 0 → N is uninformative as a percent
  }
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
  const onlineSeries = (series ?? [])
    .map(p => p.online ?? 0)
    // Replace a single zero-only day with a flat zero so the sparkline still renders something.
    .map(v => Math.max(0, v));
  const posSeries = (series ?? [])
    .map(p => p.pos ?? 0)
    .map(v => Math.max(0, v));

  const tiles: TileConfig[] = [
    {
      key: "online",
      label: "Online",
      value: online,
      color: "var(--c-series-1)",
      sparkColor: "var(--c-series-1)",
      empty: online === 0,
    },
    {
      key: "pos",
      label: "POS",
      value: pos,
      color: "var(--c-series-2)",
      sparkColor: "var(--c-series-2)",
      empty: pos === 0,
    },
  ];

  return (
    <div className="channel-grid">
      {tiles.map(tile => {
        const seriesForTile = tile.key === "online" ? onlineSeries : posSeries;
        const sparkValues =
          seriesForTile.length >= 2 ? seriesForTile : Array.from({ length: 2 }, () => tile.value);
        const delta = deltaPct(seriesForTile);
        const d = formatDelta(delta);

        return (
          <div
            key={tile.key}
            className={tile.empty ? "channel-tile channel-tile--empty" : "channel-tile"}
          >
            <div className="channel-tile-head">
              <span className="channel-tile-swatch" style={{ background: tile.color }} aria-hidden="true" />
              <span className="channel-tile-label">{tile.label}</span>
              {tile.empty && <span className="channel-tile-status">Quiet</span>}
              {!tile.empty && d.tone !== "na" && (
                <span className={`channel-tile-delta channel-tile-delta--${d.tone}`}>
                  {d.tone === "up" ? "▲" : d.tone === "down" ? "▼" : "•"} {d.text}
                </span>
              )}
            </div>
            <div className="channel-tile-number">
              {tile.value.toLocaleString("en-IN")}
            </div>
            <div className="channel-tile-caption">
              {tile.empty ? "No orders this period" : "orders this period"}
            </div>
            <div className="channel-tile-spark" aria-hidden="true">
              <Sparkline
                values={sparkValues}
                width={140}
                height={36}
                color={tile.empty ? "var(--color-charcoal-muted)" : tile.sparkColor}
                fill={!tile.empty}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
