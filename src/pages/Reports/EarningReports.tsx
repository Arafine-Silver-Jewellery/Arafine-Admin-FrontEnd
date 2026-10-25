import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { EarningsReport, VendorEarningRow } from "../../types";
import { formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
import "../../styles/ui-kit.css";
import "./earning-reports.css";

type EarningTab = "admin" | "vendor";
type DatePreset = "this_year" | "last_year" | "this_month" | "custom";
type GroupBy = "month" | "week" | "day";

const PAGE_SIZE = 20;

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "this_month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "month", label: "Monthly" },
  { value: "week", label: "Weekly" },
  { value: "day", label: "Daily" },
];

/** Resolves a date preset into the absolute range the backend expects. */
function resolveDateRange(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  const now = new Date();

  switch (preset) {
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "last_year": {
      const from = new Date(now.getFullYear() - 1, 0, 1);
      const to = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
    }
    case "this_year":
    default:
      return {
        dateFrom: new Date(now.getFullYear(), 0, 1).toISOString(),
        dateTo: now.toISOString(),
      };
  }
}

/** Format date range for display */
function formatDateRange(preset: DatePreset): string {
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  switch (preset) {
    case "this_month":
      return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    case "last_year":
      return `Jan – Dec ${now.getFullYear() - 1}`;
    case "this_year":
    default: {
      const startMonth = "Dec";
      const startYear = now.getFullYear() - 1;
      const endMonth = monthNames[now.getMonth()];
      const endYear = now.getFullYear();
      return `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
    }
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

/** Calculate percentage change */
function calculatePercentageChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
}

export default function EarningReports() {
  const [activeTab, setActiveTab] = useState<EarningTab>("admin");
  const [datePreset, setDatePreset] = useState<DatePreset>("this_year");
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

  // Calculate percentage changes (mock - comparing to previous period)
  const percentageChange = useMemo(() => {
    const total = report?.totals.totalEarning ?? 0;
    // Mock previous period calculation - in real app, this would come from API
    return calculatePercentageChange(total, total * 0.75);
  }, [report]);

  // Count months with data
  const monthsWithData = useMemo(() => {
    const rows = report?.rows ?? [];
    return rows.filter(r => r.discountGiven > 0).length;
  }, [report]);

  // The chart plots each period's total earning
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

  // Donut chart segments for payment methods
  const donutSegments = useMemo(() => {
    if (paymentBreakdown.length === 0) return [];
    const total = paymentTotal;
    if (total === 0) return [];
    
    let currentAngle = 0;
    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
    
    return paymentBreakdown.map((entry, index) => {
      const percentage = (entry.amountPaise / total) * 100;
      const angle = (percentage / 100) * 360;
      const segment = {
        method: entry.method,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: colors[index % colors.length],
        amount: entry.amountPaise,
        orders: entry.orders,
      };
      currentAngle += angle;
      return segment;
    });
  }, [paymentBreakdown, paymentTotal]);

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
          "Commission",
          "Shipping",
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
      width: "60px",
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
      header: "In-house earning",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.inHouseEarning),
    },
    {
      key: "commissionEarning",
      header: "Commission",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.commissionEarning),
    },
    {
      key: "shippingEarning",
      header: "Shipping",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        moneyCell(
          row.shippingEarning,
          capabilities?.shippingEarning ?? "computed",
          notes?.shippingEarning,
        ),
    },
    {
      key: "discountGiven",
      header: "Discount given",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.discountGiven),
    },
    {
      key: "vatTax",
      header: "VAT / tax",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        moneyCell(row.vatTax, capabilities?.vatTax ?? "computed", notes?.vatTax),
    },
    {
      key: "refundGiven",
      header: "Refund given",
      align: "right" as const,
      render: (row: NonNullable<EarningsReport>["rows"][number]) =>
        formatPrice(row.refundGiven),
    },
    {
      key: "totalEarning",
      header: "Total earning",
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
      width: "60px",
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

  // Generate conic gradient for donut chart
  const conicGradient = useMemo(() => {
    if (donutSegments.length === 0) return "conic-gradient(#e5e7eb 0deg 360deg)";
    const stops = donutSegments.map(seg => 
      `${seg.color} ${seg.startAngle}deg ${seg.endAngle}deg`
    ).join(", ");
    return `conic-gradient(${stops})`;
  }, [donutSegments]);

  return (
    <div className="earning-reports">
      {/* Page Header */}
      <div className="er-page-header">
        <div className="er-breadcrumb">
          <span>Reports</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>Sales & transactions</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="er-breadcrumb-current">Earning reports</span>
        </div>
        <div className="er-header-row">
          <div className="er-title-section">
            <h1>Earning reports</h1>
            <p className="er-subtitle">Admin earnings, {formatDateRange(datePreset)}</p>
          </div>
          <div className="er-header-controls">
            <div className="er-dropdown-group">
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                className="er-select"
              >
                {DATE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="er-select"
              >
                {GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="er-export-btn" onClick={activeTab === "admin" ? handleExportAdmin : handleExportVendor}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="er-tabs">
        <button
          className={`er-tab ${activeTab === "admin" ? "er-tab--active" : ""}`}
          onClick={() => setActiveTab("admin")}
        >
          Admin earning
        </button>
        <button
          className={`er-tab ${activeTab === "vendor" ? "er-tab--active" : ""}`}
          onClick={() => setActiveTab("vendor")}
        >
          Vendor earning
        </button>
      </div>

      {error && (
        <div className="er-error-card">
          <p>{error}</p>
        </div>
      )}

      {activeTab === "admin" ? (
        <>
          {/* Summary Cards */}
          <div className="er-summary-grid">
            <div className="er-summary-card er-summary-card--primary">
              <div className="er-summary-label">Total earnings</div>
              <div className="er-summary-value">
                {formatPrice(report?.totals.totalEarning ?? 0, { compact: true })}
              </div>
              <div className={`er-summary-change ${percentageChange.isPositive ? "er-summary-change--positive" : "er-summary-change--negative"}`}>
                <span className="er-change-arrow">{percentageChange.isPositive ? "▲" : "▼"}</span>
                {percentageChange.value.toFixed(1)}% Oct vs Sept 2026
              </div>
            </div>

            <div className="er-summary-card">
              <div className="er-summary-icon er-summary-icon--blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="er-summary-label">In-house earning</div>
              <div className="er-summary-value">
                {formatPrice(report?.totals.inHouseEarning ?? 0, { compact: true })}
              </div>
              <div className="er-summary-detail">
                {formatPrice(report?.totals.inHouseEarning ?? 0)}
              </div>
            </div>

            <div className="er-summary-card">
              <div className="er-summary-icon er-summary-icon--purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <div className="er-summary-label">Commission</div>
              <div className="er-summary-value">
                {formatPrice(report?.totals.commissionEarning ?? 0, { compact: true })}
              </div>
              <div className="er-summary-detail">
                Shipping: {capabilities?.shippingEarning === "computed" 
                  ? formatPrice(report?.totals.shippingEarning ?? 0) 
                  : "—"}
              </div>
            </div>

            <div className="er-summary-card">
              <div className="er-summary-icon er-summary-icon--yellow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div className="er-summary-label">Discount given</div>
              <div className="er-summary-value">
                {formatPrice(report?.totals.discountGiven ?? 0, { compact: true })}
              </div>
              <div className="er-summary-detail">
                {monthsWithData} of {report?.rows.length ?? 0} months
              </div>
            </div>

            <div className="er-summary-card">
              <div className="er-summary-icon er-summary-icon--red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </div>
              <div className="er-summary-label">Refund given</div>
              <div className="er-summary-value">
                {formatPrice(report?.totals.refundGiven ?? 0, { compact: true })}
              </div>
              <div className="er-summary-detail">
                {(report?.totals.refundGiven ?? 0) === 0 ? "No refunds this year" : "This year"}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="er-charts-row">
            <div className="er-chart-card">
              <div className="er-chart-header">
                <h3>Earning statistics</h3>
                <p>Total earning per month</p>
              </div>
              <div className="er-bar-chart">
                {earningBars.length === 0 ? (
                  <p className="er-chart-empty">No earnings recorded for this period.</p>
                ) : (
                  <div className="er-bar-chart-container">
                    {earningBars.map((bar) => (
                      <div key={bar.label} className="er-bar-group">
                        <div 
                          className="er-bar" 
                          style={{ height: `${bar.height}%` }}
                          title={formatPrice(bar.value)}
                        />
                        <span className="er-bar-label">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="er-chart-card">
              <div className="er-chart-header">
                <h3>Payment statistics</h3>
                <p>Share of payments by method</p>
              </div>
              <div className="er-payment-chart">
                <div className="er-donut-container">
                  <div 
                    className="er-donut" 
                    style={{ background: conicGradient }}
                  >
                    <div className="er-donut-center">
                      <span className="er-donut-value">
                        {formatPrice(paymentTotal, { compact: true })}
                      </span>
                      <span className="er-donut-label">Payments</span>
                    </div>
                  </div>
                </div>
                <div className="er-payment-legend">
                  {donutSegments.length === 0 ? (
                    <div className="er-legend-item">
                      <span className="er-legend-dot" style={{ background: "#9ca3af" }} />
                      No payments recorded
                    </div>
                  ) : (
                    donutSegments.map((seg) => (
                      <div key={seg.method} className="er-legend-item">
                        <span className="er-legend-dot" style={{ background: seg.color }} />
                        <span className="er-legend-text">
                          {seg.method.charAt(0).toUpperCase() + seg.method.slice(1)} ({seg.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deliveryman Notice */}
          {notes?.deliverymanIncentive && (
            <div className="er-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>
                <strong>Deliveryman incentive isn't available.</strong> {notes.deliverymanIncentive}
              </p>
            </div>
          )}

          {/* Data Table */}
          <div className="er-table-card">
            <div className="er-table-header">
              <h3>
                Total earnings
                <span className="er-table-count">{report?.rows.length ?? 0}</span>
              </h3>
            </div>

            <DataTable
              columns={adminColumns}
              data={report?.rows ?? []}
              loading={loading}
              loadingText="Loading earnings…"
              emptyIcon="file"
              emptyTitle="No months match your filter."
              emptyDescription=""
              keyExtractor={(row) => row.period}
            />
          </div>
        </>
      ) : (
        <div className="vendor-earning-content">
          <div className="er-summary-grid">
            <div className="er-summary-card">
              <div className="er-summary-icon er-summary-icon--red">🏪</div>
              <div className="er-summary-label">Total Vendor</div>
              <div className="er-summary-value">{vendorTotal}</div>
            </div>

            <div className="er-summary-card">
              <div className="er-summary-icon er-summary-icon--yellow">🛒</div>
              <div className="er-summary-label">Total Vendor Products</div>
              <div className="er-summary-value">{vendorStats.totalProducts}</div>
              <div className="er-summary-breakdown">
                <span className="er-breakdown-item er-breakdown-item--red">
                  {vendorStats.totalProducts - vendorStats.approved - vendorStats.pendingApproval} Denied
                </span>
                <span className="er-breakdown-item er-breakdown-item--blue">
                  {vendorStats.pendingApproval} Pending
                </span>
                <span className="er-breakdown-item er-breakdown-item--green">
                  {vendorStats.approved} Approved
                </span>
              </div>
            </div>

            <div className="er-summary-card">
              <div className="er-summary-icon er-summary-icon--green">💵</div>
              <div className="er-summary-label">Total Earning</div>
              <div className="er-summary-value">
                {formatPrice(vendorTotals.totalEarnedPaise, { compact: true })}
              </div>
            </div>
          </div>

          <div className="er-charts-row">
            <div className="er-chart-card">
              <div className="er-chart-header">
                <h3>Vendor Wallet Status</h3>
              </div>
              <div className="er-wallet-stats">
                <div className="er-wallet-amount">
                  <span className="er-wallet-value">
                    {formatPrice(vendorTotals.withdrawablePaise, { compact: true })}
                  </span>
                  <span className="er-wallet-label">Wallet Amount</span>
                </div>
                <div className="er-payment-legend">
                  <div className="er-legend-item">
                    <span className="er-legend-dot" style={{ background: "#3b82f6" }} />
                    Withdrawable Balance ({formatPrice(vendorTotals.withdrawablePaise)})
                  </div>
                  <div className="er-legend-item">
                    <span className="er-legend-dot" style={{ background: "#1e40af" }} />
                    Pending Withdraws ({formatPrice(vendorTotals.pendingPaise)})
                  </div>
                  <div className="er-legend-item">
                    <span className="er-legend-dot" style={{ background: "#fbbf24" }} />
                    Already Withdrawn ({formatPrice(vendorTotals.withdrawnPaise)})
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="er-table-card">
            <div className="er-table-header">
              <h3>
                Vendor Earnings
                <span className="er-table-count">{vendorTotal}</span>
              </h3>
              <div className="er-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search vendor..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVendorPage(1);
                  }}
                />
              </div>
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
