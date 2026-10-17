interface ChannelStatTileProps {
  online: number;
  pos: number;
}

export default function ChannelStatTile({ online, pos }: ChannelStatTileProps) {
  // 2-slice breakdown -> stat tile (not a donut). The bar shows the POS share
  // without inventing a second y-axis or fake correlation.
  const total = online + pos;
  const posShare = total > 0 ? (pos / total) * 100 : 0;
  const onlineShare = total > 0 ? (online / total) * 100 : 0;

  return (
    <div className="channel-stat">
      <div className="channel-stat-headline">
        <span className="channel-stat-pct">{posShare.toFixed(0)}%</span>
        <span className="channel-stat-pct-label">of orders from POS</span>
      </div>
      <div className="channel-stat-bar" aria-hidden="true">
        <div className="channel-stat-bar-online" style={{ width: `${onlineShare}%` }} />
        <div className="channel-stat-bar-pos" style={{ width: `${posShare}%` }} />
      </div>
      <div className="channel-stat-rows">
        <div className="channel-stat-row">
          <span className="channel-stat-swatch" style={{ background: "var(--c-series-1)" }} />
          <span className="channel-stat-row-label">Online</span>
          <span className="channel-stat-row-value">{online.toLocaleString()}</span>
        </div>
        <div className="channel-stat-row">
          <span className="channel-stat-swatch" style={{ background: "var(--c-series-6)" }} />
          <span className="channel-stat-row-label">POS</span>
          <span className="channel-stat-row-value">{pos.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
