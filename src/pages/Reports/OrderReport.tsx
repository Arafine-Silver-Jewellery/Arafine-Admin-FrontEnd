import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import { ChartCard, OrdersTrendChart, type DashboardRange } from "../../components/dashboard";
import type { Order } from "../../types";
import { formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ChartCard` and the recharts components live in the dashboard stylesheet;
// `ak-status` / `ak-table` live in the UI kit.
import "../../styles/dashboard.css";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

type DatePreset = "all" | "today" | "7d" | "30d" | "90d" | "year";
type OrderTab = "all" | "delivered" | "pending" | "cancelled";

interface DateRange {
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Turns the preset into an absolute date range for the backend. The backend
 * takes `dateFrom`/`dateTo` as ISO strings, so the presets are resolved here
 * rather than sent as a token.
 */
function resolveDateRange(preset: DatePreset): DateRange {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return {
        dateFrom: startOfDay.toISOString(),
        dateTo: now.toISOString(),
      };
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

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

const CHANNEL_OPTIONS = [
  { value: "all", label: "All Channels" },
  { value: "online", label: "Online" },
  { value: "pos", label: "POS" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "refunded", label: "Refunded" },
];

/** Maps an order status onto the shared `ak-status` pill variants. */
function orderStatusVariant(status: string) {
  switch (status) {
    case "delivered":
      return "success";
    case "confirmed":
    case "processing":
      return "info";
    case "shipped":
    case "out_for_delivery":
      return "brand";
    case "pending":
      return "warning";
    case "cancelled":
    case "failed_to_deliver":
      return "danger";
    case "returned":
    case "refunded":
      return "neutral";
    default:
      return "neutral";
  }
}

function paymentStatusVariant(status: string) {
  switch (status) {
    case "paid":
      return "success";
    case "partially_refunded":
      return "warning";
    case "refunded":
      return "neutral";
    case "failed":
      return "danger";
    case "pending":
    default:
      return "neutral";
  }
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function OrderReport() {
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trend, setTrend] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo<DateRange>(() => resolveDateRange(datePreset), [datePreset]);

  // The trend chart is a separate, unfiltered read of the dashboard orders
  // metric. It only follows the date preset — the status/channel/payment
  // filters apply to the table below, not to the chart.
  const chartRange: DashboardRange =
    datePreset === "all" ? "all" : datePreset === "today" || datePreset === "7d" ? "7d" : datePreset === "30d" ? "30d" : "90d";

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getOrders({
        page,
        limit: 20,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        paymentState: paymentFilter !== "all" ? paymentFilter : undefined,
        orderChannel: channelFilter !== "all" ? channelFilter : undefined,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    }
    finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, paymentFilter, channelFilter, range.dateFrom, range.dateTo]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    let cancelled = false;
    setTrendLoading(true);
    api
      .getDashboardTrend({ metric: "orders", range: chartRange })
      .then((data) => {
        if (!cancelled) setTrend(data?.points ?? []);
      })
      .catch(() => {
        // The chart is supplementary — a failure here shouldn't blank the table.
        if (!cancelled) setTrend([]);
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chartRange]);

  // KPI cards are derived from the rows currently loaded. The backend's order
  // list endpoint paginates and doesn't return a status breakdown, so these
  // count the page in view rather than claiming to be site-wide totals.
  const kpis = useMemo(() => {
    const totalSalesPaise = orders.reduce((sum, o) => sum + (o.totalPaise ?? 0), 0);
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const pending = orders.filter(
      (o) => o.status === "pending" || o.status === "confirmed",
    ).length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const returned = orders.filter(
      (o) => o.status === "returned" || o.paymentStatus === "refunded",
    ).length;
    return { totalSalesPaise, delivered, pending, cancelled, returned };
  }, [orders]);

  const handleExport = () => {
    const headers = [
      "SL",
      "Order ID",
      "Order Date",
      "Customer",
      "Phone",
      "Total Amount",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Channel",
    ];
    const rows = orders.map((order, index) => [
      (page - 1) * 20 + index + 1,
      order.orderNumber,
      formatDateTime(order.createdAt),
      order.shippingAddress?.fullName ?? "",
      order.shippingAddress?.phone ?? "",
      formatPrice(order.totalPaise),
      titleCase(order.status),
      titleCase(order.paymentStatus),
      order.paymentMethod ?? "",
      titleCase(order.orderChannel),
    ]);
    downloadCsv(`order-report-${new Date().toISOString().slice(0, 10)}`, buildCsv(headers, rows));
  };

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_order: Order, index: number) => (page - 1) * 20 + index + 1,
    },
    {
      key: "orderNumber",
      header: "Order ID",
      render: (order: Order) => (
        <span style={{ fontWeight: 500, color: "#0d6efd" }}>{order.orderNumber}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Order Date",
      render: (order: Order) => formatDateTime(order.createdAt),
    },
    {
      key: "customer",
      header: "Customer Info",
      render: (order: Order) => (
        <div className="vendor-info">
          <span className="vendor-name">{order.shippingAddress?.fullName ?? "—"}</span>
          <span className="vendor-email">{order.shippingAddress?.phone ?? ""}</span>
        </div>
      ),
    },
    {
      key: "totalPaise",
      header: "Total Amount",
      align: "right" as const,
      render: (order: Order) => formatPrice(order.totalPaise),
    },
    {
      key: "status",
      header: "Order Status",
      render: (order: Order) => (
        <span className={`ak-status ak-status--${orderStatusVariant(order.status)}`}>
          <span className="ak-status__dot" />
          {titleCase(order.status)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      render: (order: Order) => (
        <span className={`ak-status ak-status--${paymentStatusVariant(order.paymentStatus)}`}>
          <span className="ak-status__dot" />
          {titleCase(order.paymentStatus)}
        </span>
      ),
    },
  ];

  return (
    <div className="reports-container">
      {/* Tabs and Filter Row */}
      <div className="product-report-header">
        <div className="report-tabs">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => {
              setActiveTab("all");
              setStatusFilter("all");
              setPage(1);
            }}
          >
            All Orders
          </button>
          <button
            className={activeTab === "delivered" ? "active" : ""}
            onClick={() => {
              setActiveTab("delivered");
              setStatusFilter("delivered");
              setPage(1);
            }}
          >
            Delivered
          </button>
          <button
            className={activeTab === "pending" ? "active" : ""}
            onClick={() => {
              setActiveTab("pending");
              setStatusFilter("pending");
              setPage(1);
            }}
          >
            Pending
          </button>
          <button
            className={activeTab === "cancelled" ? "active" : ""}
            onClick={() => {
              setActiveTab("cancelled");
              setStatusFilter("cancelled");
              setPage(1);
            }}
          >
            Cancelled
          </button>
        </div>

        {/* Inline Filters */}
        <div className="product-report-filter-inline">
          <span className="filter-label">Filter Data</span>
          <span className="filter-date-label">DATE</span>
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as DatePreset);
              setPage(1);
            }}
          >
            {DATE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <span className="filter-date-label">CHANNEL</span>
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(1);
            }}
          >
            {CHANNEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="filter-date-label">PAYMENT</span>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="btn-reset"
            onClick={() => {
              setDatePreset("all");
              setStatusFilter("all");
              setChannelFilter("all");
              setPaymentFilter("all");
              setSearchQuery("");
              setActiveTab("all");
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      {/* Stats Grid - 2x2 layout */}
      <div className="product-report-stats-grid">
        {/* Total Orders Card */}
        <div className="product-report-stat-card">
          <div className="product-report-stat-icon yellow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="product-report-stat-content">
            <h2>{totalItems.toLocaleString()}</h2>
            <p>Total Orders</p>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="product-report-stat-card">
          <div className="product-report-stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="product-report-stat-content">
            <h2 style={{ fontSize: kpis.totalSalesPaise > 10000000 ? "22px" : "28px" }}>
              {formatPrice(kpis.totalSalesPaise, { compact: true })}
            </h2>
            <p>Sales (this page)</p>
          </div>
        </div>

        {/* Delivered Card */}
        <div className="product-report-stat-card">
          <div className="product-report-stat-icon teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="product-report-stat-content">
            <h2>{kpis.delivered}</h2>
            <p>Delivered</p>
          </div>
        </div>

        {/* Pending/Confirmed Card */}
        <div className="product-report-stat-card">
          <div className="product-report-stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="product-report-stat-content">
            <h2>{kpis.pending}</h2>
            <p>Pending/Confirmed</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row - Cancelled & Returned */}
      <div className="product-report-stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "24px" }}>
        {/* Cancelled Card */}
        <div className="product-report-stat-card">
          <div className="product-report-stat-icon" style={{ background: "#ffebee", color: "#f44336" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="product-report-stat-content">
            <h2>{kpis.cancelled}</h2>
            <p>Cancelled</p>
          </div>
        </div>

        {/* Returned/Refunded Card */}
        <div className="product-report-stat-card">
          <div className="product-report-stat-icon" style={{ background: "#fff3e0", color: "#ff9800" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </div>
          <div className="product-report-stat-content">
            <h2>{kpis.returned}</h2>
            <p>Returned/Refunded</p>
          </div>
        </div>
      </div>

      {/* Order Statistics Chart */}
      <div className="product-report-cards-row" style={{ marginBottom: "24px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <ChartCard
            title="Order Statistics"
            subtitle="Orders placed over the selected period"
            isLoading={trendLoading}
            empty={!trendLoading && trend.length === 0}
          >
            <OrdersTrendChart data={trend} />
          </ChartCard>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>
            Order List <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by order ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button className="btn-export" onClick={handleExport} disabled={orders.length === 0}>
              Export
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          loadingText="Loading orders…"
          emptyIcon="cart"
          emptyTitle="No orders found"
          emptyDescription="Try widening the date range or clearing the filters."
          keyExtractor={(order) => order.id}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
