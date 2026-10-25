import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { EarningsReport, VendorEarningRow } from "../../types";
import { formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ak-status` / `ak-table` live in the UI kit.
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

type EarningTab = "admin" | "vendor";
type DatePreset = "all" | "today" | "7d" | "30d" | "90d" | "year";
type GroupBy = "month" | "week" | "day";

const PAGE_SIZE = 20;

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
];

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "month", label: "Monthly" },
  { value: "week", label: "Weekly" },
  { value: "day", label: "Daily" },
];

/** Resolves a date preset into the absolute range the backend expects. */
function resolveDateRange(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { dateFrom: startOfDay.toISOString(), dateTo: now.toISOString() };
    case "7d": {
      const from = new Date(startOfDay);
      from.setDate(from.getDate() - 6);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "30d": {
      const from = new Date(startOfDay);
      from.setDate(from.getDate() - 29);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "90d": {
      const from = new Date(startOfDay);
      from.setDate(from.getDate() - 89);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "year":
      return {
        dateFrom: new Date(now.getFullYear(), 0, 1).toISOString(),
        dateTo: now.toISOString(),
      };
    case "all":
    default:
      return {};
  }
}

/** "2026-03" → "Mar 2026"; "2026-03-15" → "15 Mar 2026". */
function formatPeriod(period: string): string {
  const parts = period.split("-");
  if (parts.length === 3) {
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  if (parts.length === 2) {
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    }
  }
  return period;
}

/**
 * Renders a money cell.
 *
 * When the backend reports a column as `computed_but_source_always_zero`,
 * the real value is 0 — but printing "₹0" would claim we measured it and it
 * was zero, which is a lie. The column's source is written to 0 by every
 * order-creation path, so "—" plus the explanation is the honest rendering.
 */
function moneyCell(
  value: number,
  capability: "computed" | "computed_but_source_always_zero" | "unavailable",
  note?: string,
) {
  if (capability !== "computed") {
    return (
      <span title={note ?? "This column has no data source in the current schema."}>—</span>
    );
  }
  return formatPrice(value);
}

export default function EarningReports() {
  const [activeTab, setActiveTab] = useState<EarningTab>("admin");
  const [datePreset, setDatePreset] = useState<DatePreset>("year");
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [search, setSearch] = useState("");

  const [report, setReport] = useState<EarningsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vendorRows, setVendorRows] = useState<VendorEarningRow[]>([]);
  const [vendorTotals, setVendorTotals] = useState({
    totalEarnedPaise: 0,
    pendingPaise: 0,
    withdrawablePaise: 0,
    withdrawnPaise: 0,
  });
  const [vendorPage, setVendorPage] = useState(1);
  const [vendorTotalPages, setVendorTotalPages] = useState(1);
  const [vendorTotal, setVendorTotal] = useState(0);
  const [vendorLoading, setVendorLoading] = useState(false);

  const range = useMemo(() => resolveDateRange(datePreset), [datePreset]);

  const loadEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEarningsReport({
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
        groupBy,
      });
      setReport(data);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earnings");
    }
    finally {
      setLoading(false);
    }
  }, [range.dateFrom, range.dateTo, groupBy]);

  const loadVendorEarnings = useCallback(async () => {
    setVendorLoading(true);
    setError(null);
    try {
      const response = await api.getVendorEarningsReport({
        page: vendorPage,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        range: "all",
      });
      setVendorRows(response.data || []);
      setVendorTotalPages(response.pagination?.totalPages || 1);
      setVendorTotal(response.pagination?.total || 0);
      setVendorTotals(
        response.totals ?? {
          totalEarnedPaise: 0,
          pendingPaise: 0,
          withdrawablePaise: 0,
          withdrawnPaise: 0,
        },
      );
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor earnings");
    }
    finally {
      setVendorLoading(false);
    }
  }, [vendorPage, search]);

  useEffect(() => {
    if (activeTab === "admin") loadEarnings();
  }, [activeTab, loadEarnings]);

  useEffect(() => {
    if (activeTab === "vendor") loadVendorEarnings();
  }, [activeTab, loadVendorEarnings]);

  // --- Derived values ----------------------------------------------------
  const capabilities = report?.capabilities;
  const notes = report?.notes;

  const paymentBreakdown = report?.paymentMethodBreakdown ?? [];
  const paymentTotal = paymentBreakdown.reduce((sum, p) => sum + p.amountPaise, 0);

  // The chart plots each period's total earning, so the y-values are the
  // same numbers the table shows.
  const earningBars = useMemo(() => {
    const rows = report?.rows ?? [];
    if (rows.length === 0) return [];
    const max = Math.max(...rows.map((r) => r.totalEarning), 1);
    return rows.map((row) => ({
      label: formatPeriod(row.period),
      value: row.totalEarning,
      height: Math.max((row.totalEarning / max) * 100, row.totalEarning > 0 ? 4 : 0),
    }));
  }, [report]);

  const vendorStats = useMemo(() => {
    const totalProducts = vendorRows.reduce((sum, v) => sum + v.totalProducts, 0);
    const approved = vendorRows.reduce((sum, v) => sum + v.approvedProducts, 0);
    const pendingApproval = vendorRows.reduce(
      (sum, v) => sum + v.pendingApprovalProducts,
      0,
    );
    return { totalProducts, approved, pendingApproval };
  }, [vendorRows]);

  // --- Export ------------------------------------------------------------
  function handleExportAdmin() {
    const rows = report?.rows ?? [];
    downloadCsv(
      `earning-reports-${new Date().toISOString().slice(0, 10)}`,
      buildCsv(
        [
          "SL",
          "Duration",
          "In-House Earning",
          "Commission Earning",
          "Earn From Shipping",
          "Discount Given",
          "VAT/TAX",
          "Refund Given",
          "Total Earning",
        ],
        rows.map((row, index) => [
          index + 1,
          formatPeriod(row.period),
          formatPrice(row.inHouseEarning),
          formatPrice(row.commissionEarning),
          formatPrice(row.shippingEarning),
          formatPrice(row.discountGiven),
          formatPrice(row.vatTax),
          formatPrice(row.refundGiven),
          formatPrice(row.totalEarning),
        ]),
      ),
    );
  }

  function handleExportVendor() {
    downloadCsv(
      `vendor-earning-reports-${new Date().toISOString().slice(0, 10)}`,
      buildCsv(
        [
          "SL",
          "Vendor",
          "Status",
          "Total Products",
          "Approved",
          "Pending Approval",
          "Total Earned",
          "Pending",
          "Withdrawable",
          "Withdrawn",
          "Wallet Balance",
        ],
        vendorRows.map((row, index) => [
          (vendorPage - 1) * PAGE_SIZE + index + 1,
          row.name,
          row.status,
          row.totalProducts,
          row.approvedProducts,
          row.pendingApprovalProducts,
          formatPrice(row.totalEarnedPaise),
          formatPrice(row.pendingPaise),
          formatPrice(row.withdrawablePaise),
          formatPrice(row.withdrawnPaise),
          formatPrice(row.walletBalancePaise),
        ]),
      ),
    );
  }

  // --- Column definitions ------------------------------------------------
  const adminColumns = [
    {
      key: "sl",
      header: "SL",
      width: "48px",
      align: "center" as const,
      render: (_row: NonNullable<EarningsReport>["rows"][number], index: number) => index + 1,
    },
    {
      key: "period",
      header: "Duration",
      render: (row: NonNullable<EarningsReport>["rows"][number]) => formatPeriod(row.period),
    },
    {
      key: "inHouseEarning",
      header: "In-House Earning",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.inHouseEarning),
    },
    {
      key: "commissionEarning",
      header: "Commission Earning",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.commissionEarning),
    },
    {
      key: "shippingEarning",
      header: "Earn From Shipping",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        moneyCell(
          row.shippingEarning,
          capabilities?.shippingEarning ?? "computed",
          notes?.shippingEarning,
        ),
    },
    // No Deliveryman Incentive column: the system has no delivery-partner
    // data source, so there is nothing to report.
    {
      key: "discountGiven",
      header: "Discount Given",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.discountGiven),
    },
    {
      key: "vatTax",
      header: "VAT/TAX",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        moneyCell(row.vatTax, capabilities?.vatTax ?? "computed", notes?.vatTax),
    },
    {
      key: "refundGiven",
      header: "Refund Given",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.refundGiven),
    },
    {
      key: "totalEarning",
      header: "Total Earning",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) => (
        <strong>{formatPrice(row.totalEarning)}</strong>
      ),
    },
  ];

  const vendorColumns = [
    {
      key: "sl",
      header: "SL",
      width: "48px",
      align: "center" as const,
      render: (_row: VendorEarningRow, index: number) =>
        (vendorPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "name",
      header: "Vendor",
      render: (row: VendorEarningRow) => (
        <div className="vendor-cell">
          <div className="vendor-avatar">🏪</div>
          <div className="vendor-info">
            <span className="vendor-name">{row.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: "totalProducts",
      header: "Products",
      align: "right" as const,
      render: (row: VendorEarningRow) => (
        <div className="vendor-info" style={{ alignItems: "flex-end" }}>
          <span>{row.totalProducts}</span>
          <span className="vendor-email">
            {row.approvedProducts} approved · {row.pendingApprovalProducts} pending
          </span>
        </div>
      ),
    },
    {
      key: "totalEarnedPaise",
      header: "Total Earned",
      align: "right" as const,
      render: (row: VendorEarningRow) => formatPrice(row.totalEarnedPaise),
    },
    {
      key: "pendingPaise",
      header: "Pending",
      align: "right" as const,
      render: (row: VendorEarningRow) => formatPrice(row.pendingPaise),
    },
    {
      key: "withdrawablePaise",
      header: "Withdrawable",
      align: "right" as const,
      render: (row: VendorEarningRow) => formatPrice(row.withdrawablePaise),
    },
    {
      key: "withdrawnPaise",
      header: "Withdrawn",
      align: "right" as const,
      render: (row: VendorEarningRow) => formatPrice(row.withdrawnPaise),
    },
    {
      key: "status",
      header: "Status",
      render: (row: VendorEarningRow) => (
        <span
          className={`ak-status ak-status--${row.status === "active" ? "success" : "neutral"}`}
        >
          <span className="ak-status__dot" />
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="reports-container">
      <div className="report-tabs">
        <button
          className={activeTab === "admin" ? "active" : ""}
          onClick={() => setActiveTab("admin")}
        >
          Admin Earning
        </button>
        <button
          className={activeTab === "vendor" ? "active" : ""}
          onClick={() => setActiveTab("vendor")}
        >
          Vendor Earning
        </button>
      </div>

      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Select Date</label>
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value as DatePreset);
              }}
            >
              {DATE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          {activeTab === "admin" && (
            <div className="filter-group">
              <label>Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                {GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {activeTab === "vendor" && (
            <div className="filter-group">
              <label>Search Vendor</label>
              <input
                type="text"
                placeholder="Vendor name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVendorPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      {activeTab === "admin" ? (
        <>
          <div className="stats-grid">
            <div className="stat-card wide">
              <div className="stat-icon blue">💰</div>
              <div className="stat-content">
                <h2>{formatPrice(report?.totals.totalEarning ?? 0, { compact: true })}</h2>
                <p>Total earnings</p>
                <div className="stat-breakdown">
                  <div className="breakdown-item red">
                    <span>{formatPrice(report?.totals.commissionEarning ?? 0)}</span>
                    <label>Commission</label>
                  </div>
                  <div className="breakdown-item blue">
                    <span>{formatPrice(report?.totals.inHouseEarning ?? 0)}</span>
                    <label>In House</label>
                  </div>
                  <div className="breakdown-item green">
                    <span>
                      {capabilities?.shippingEarning === "computed"
                        ? formatPrice(report?.totals.shippingEarning ?? 0)
                        : "—"}
                    </span>
                    <label>Shipping</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow">🏷️</div>
              <div className="stat-content">
                <h2>{formatPrice(report?.totals.discountGiven ?? 0, { compact: true })}</h2>
                <p>Discount Given</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red">🔄</div>
              <div className="stat-content">
                <h2>{formatPrice(report?.totals.refundGiven ?? 0, { compact: true })}</h2>
                <p>Refund Given</p>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="report-card">
              <h3>Earning Statistics</h3>
              <p className="chart-subtitle">
                Total earning per {groupBy} · Average{" "}
                {formatPrice(
                  (report?.rows.length ?? 0) > 0
                    ? Math.round(
                        (report?.totals.totalEarning ?? 0) / (report?.rows.length ?? 1),
                      )
                    : 0,
                )}
              </p>
              <div className="chart-placeholder">
                {earningBars.length === 0 ? (
                  <p style={{ color: "#888", textAlign: "center", paddingTop: "48px" }}>
                    No earnings recorded for this period.
                  </p>
                ) : (
                  <div className="chart-bars">
                    {earningBars.map((bar) => (
                      <div key={bar.label} className="chart-bar-group">
                        <div className="chart-bar" style={{ height: `${bar.height}%` }}></div>
                        <span>{bar.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="report-card">
              <h3>Payment Statistics</h3>
              <div className="payment-stats">
                <div className="donut-chart">
                  <div className="donut-center">
                    <span className="donut-value">
                      {formatPrice(paymentTotal, { compact: true })}
                    </span>
                    <span className="donut-label">Payments Amount</span>
                  </div>
                </div>
                <div className="payment-legend">
                  {paymentBreakdown.length === 0 ? (
                    <div className="legend-item">
                      <span className="dot gray"></span>
                      No payments recorded
                    </div>
                  ) : (
                    paymentBreakdown.map((entry, index) => (
                      <div key={entry.method} className="legend-item">
                        <span className={`dot ${LEGEND_DOTS[index % LEGEND_DOTS.length]}`}></span>
                        {entry.method.charAt(0).toUpperCase() + entry.method.slice(1)} (
                        {formatPrice(entry.amountPaise)}) · {entry.orders} orders
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {notes?.deliverymanIncentive && (
            <div
              className="report-card"
              style={{ marginBottom: "24px", borderLeft: "4px solid #ff9800" }}
            >
              <h3>Deliveryman Incentive</h3>
              <p className="chart-subtitle" style={{ margin: 0 }}>
                {notes.deliverymanIncentive}
              </p>
            </div>
          )}

          <div className="table-card">
            <div className="table-header">
              <h3>
                Total Earnings <span className="count">{report?.rows.length ?? 0}</span>
              </h3>
              <button
                className="btn-export"
                onClick={handleExportAdmin}
                disabled={(report?.rows.length ?? 0) === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>

            <DataTable
              columns={adminColumns}
              data={report?.rows ?? []}
              loading={loading}
              loadingText="Loading earnings…"
              emptyIcon="file"
              emptyTitle="No earnings recorded"
              emptyDescription="Earnings appear once paid orders exist in the selected period."
              keyExtractor={(row) => row.period}
            />
          </div>
        </>
      ) : (
        <div className="vendor-earning-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon red">🏪</div>
              <div className="stat-content">
                <h2>{vendorTotal}</h2>
                <p>Total Vendor</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow">🛒</div>
              <div className="stat-content">
                <h2>{vendorStats.totalProducts}</h2>
                <p>Total Vendor Products</p>
                <div className="stat-breakdown">
                  <div className="breakdown-item red">
                    <span>
                      {vendorStats.totalProducts -
                        vendorStats.approved -
                        vendorStats.pendingApproval}
                    </span>
                    <label>Denied</label>
                  </div>
                  <div className="breakdown-item blue">
                    <span>{vendorStats.pendingApproval}</span>
                    <label>Pending Request</label>
                  </div>
                  <div className="breakdown-item green">
                    <span>{vendorStats.approved}</span>
                    <label>Approved</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">💵</div>
              <div className="stat-content">
                <h2>{formatPrice(vendorTotals.totalEarnedPaise, { compact: true })}</h2>
                <p>Total Earning</p>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="report-card">
              <h3>Vendor Wallet Status</h3>
              <div className="wallet-stats">
                <div className="wallet-amount">
                  <span className="amount">
                    {formatPrice(vendorTotals.withdrawablePaise, { compact: true })}
                  </span>
                  <span className="label">Wallet Amount</span>
                </div>
                <div className="wallet-legend">
                  <div className="legend-item">
                    <span className="dot blue"></span>
                    Withdrawable Balance ({formatPrice(vendorTotals.withdrawablePaise)})
                  </div>
                  <div className="legend-item">
                    <span className="dot dark-blue"></span>
                    Pending Withdraws ({formatPrice(vendorTotals.pendingPaise)})
                  </div>
                  <div className="legend-item">
                    <span className="dot yellow"></span>
                    Already Withdrawn ({formatPrice(vendorTotals.withdrawnPaise)})
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Vendor Earnings <span className="count">{vendorTotal}</span>
              </h3>
              <button
                className="btn-export"
                onClick={handleExportVendor}
                disabled={vendorRows.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>

            <DataTable
              columns={vendorColumns}
              data={vendorRows}
              loading={vendorLoading}
              loadingText="Loading vendor earnings…"
              emptyIcon="users"
              emptyTitle="No vendor earnings"
              emptyDescription="Vendors appear here once they have products assigned and those products have sold."
              keyExtractor={(row) => row.vendorId}
              currentPage={vendorPage}
              totalPages={vendorTotalPages}
              totalItems={vendorTotal}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setVendorPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Dot colours cycled through for the payment-method legend. */
const LEGEND_DOTS = ["green", "blue", "yellow", "orange", "red", "purple", "teal"];
