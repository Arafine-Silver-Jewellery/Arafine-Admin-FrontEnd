import { useState, type ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  tableView?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  storageKey?: string;
  minHeight?: number;
}

export default function ChartCard({
  title,
  subtitle,
  headerRight,
  children,
  tableView,
  isLoading,
  error,
  empty,
  storageKey,
  minHeight = 280,
}: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">(() => {
    if (!storageKey) return "chart";
    return (localStorage.getItem(storageKey) as "chart" | "table") ?? "chart";
  });

  const toggleView = (next: "chart" | "table") => {
    setView(next);
    if (storageKey) localStorage.setItem(storageKey, next);
  };

  return (
    <div className="card chart-card" data-loading={isLoading ? "true" : "false"}>
      <div className="card-header chart-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        <div className="chart-card-actions">
          {headerRight}
          {tableView && (
            <div className="view-toggle" role="tablist" aria-label="View mode">
              <button
                role="tab"
                aria-selected={view === "chart"}
                className={view === "chart" ? "active" : ""}
                onClick={() => toggleView("chart")}
                type="button"
              >
                Chart
              </button>
              <button
                role="tab"
                aria-selected={view === "table"}
                className={view === "table" ? "active" : ""}
                onClick={() => toggleView("table")}
                type="button"
              >
                Table
              </button>
            </div>
          )}
        </div>
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
        ) : view === "table" && tableView ? (
          tableView
        ) : (
          children
        )}
      </div>
    </div>
  );
}
