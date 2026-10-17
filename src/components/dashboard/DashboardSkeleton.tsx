// Skeleton that mirrors the dashboard layout. Matches heights so the page
// doesn't jump when real data arrives.

export default function DashboardSkeleton() {
  return (
    <div className="page-content dashboard-page dashboard-skeleton" aria-busy="true" aria-label="Loading dashboard">
      {/* Toolbar */}
      <div className="dashboard-toolbar">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-picker">
          <span /><span /><span /><span />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="stats-grid">
        {[0, 1, 2, 3].map(i => (
          <div className="stat-card skeleton-card" key={i}>
            <div className="skeleton skeleton-icon" />
            <div className="stat-content">
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-value" />
              <div className="skeleton skeleton-sub" />
              <div className="skeleton skeleton-spark" />
            </div>
          </div>
        ))}
      </div>

      {/* Status tiles */}
      <div className="status-tiles">
        {[0, 1, 2, 3].map(i => (
          <div className="status-tile skeleton-card" key={i}>
            <div className="skeleton skeleton-icon" />
            <div className="status-tile-info">
              <div className="skeleton skeleton-value" style={{ width: "50%", height: 22, marginBottom: 6 }} />
              <div className="skeleton skeleton-label" style={{ width: "70%", height: 9, marginBottom: 4 }} />
              <div className="skeleton skeleton-label" style={{ width: "50%", height: 8 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Trend row */}
      <div className="chart-row chart-row-2">
        {[0, 1].map(i => (
          <div className="card chart-card" key={i}>
            <div className="card-header chart-card-header">
              <div>
                <div className="skeleton skeleton-chart-title" />
                <div className="skeleton skeleton-chart-subtitle" />
              </div>
            </div>
            <div className="chart-card-body">
              <div className="skeleton skeleton-chart-area" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="chart-row chart-row-3">
        {[0, 1, 2].map(i => (
          <div className="card chart-card" key={i}>
            <div className="card-header chart-card-header">
              <div>
                <div className="skeleton skeleton-chart-title" />
                <div className="skeleton skeleton-chart-subtitle" />
              </div>
            </div>
            <div className="chart-card-body">
              <div className="skeleton skeleton-chart-area" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
