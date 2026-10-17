import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  minHeight?: number;
}

export default function ChartCard({
  title,
  subtitle,
  headerRight,
  children,
  isLoading,
  error,
  empty,
  minHeight = 280,
}: ChartCardProps) {
  return (
    <div className="card chart-card" data-loading={isLoading ? "true" : "false"}>
      <div className="card-header chart-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {headerRight && <div className="chart-card-actions">{headerRight}</div>}
      </div>
      <div className="chart-card-body" style={{ minHeight }}>
        {error ? (
          <div className="chart-error" role="alert">
            <span>⚠</span> {error}
          </div>
        ) : empty ? (
          <div className="chart-empty">
            <p>No data in this range</p>
            <span>Try a wider time window</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
