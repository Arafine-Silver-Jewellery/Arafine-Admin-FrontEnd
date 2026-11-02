import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { Order } from "../../types";
import { formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
import "../../styles/ui-kit.css";
import "./order-report.css";

type DateRange = "7d" | "30d" | "90d" | "all";

interface OrderTotals {
  totalOrders: number;
  totalRevenue: number;
  deliveredCount: number;
  pendingCount: number;
  cancelledCount: number;
  returnedCount: number;
}

const PAGE_SIZE = 20;

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
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

const DEFAULT_RANGE: DateRange = "30d";

const EMPTY_TOTALS: OrderTotals = {
  totalOrders: 0,
  totalRevenue: 0,
  deliveredCount: 0,
  pendingCount: 0,
  cancelledCount: 0,
  returnedCount: 0,
};

/**
 * Converts a date range preset into ISO date strings for the backend.
 */
function resolveDateRange(preset: DateRange): { dateFrom: string | undefined; dateTo: string | undefined } {
  if (preset === "all") {
    return { dateFrom: undefined, dateTo: undefined };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = preset === "7d" ? 6 : preset === "30d" ? 29 : 89;

  const from = new Date(startOfDay);
  from.setDate(from.getDate() - days);

  return {
    dateFrom: from.toISOString(),
    dateTo: now.toISOString(),
  };
}

/** Maps an order status onto the pill variant. */
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
    case "return_requested":
    case "return_approved":
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
      return "warning";
  }
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function OrderReport() {
  const navigate = useNavigate();

  // Filters
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totals, setTotals] = useState<OrderTotals>(EMPTY_TOTALS);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the date range to prevent infinite re-renders
  const dateRange = useMemo(() => resolveDateRange(range), [range]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getOrders({
        page,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        paymentState: paymentFilter !== "all" ? paymentFilter : undefined,
        orderChannel: channelFilter !== "all" ? channelFilter : undefined,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      });

      const data = response.data || [];
      setOrders(data);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);

      // Compute totals from the current page
      const revenue = data.reduce((sum, o) => sum + (o.total ?? 0), 0);
      const delivered = data.filter((o) => o.status === "delivered").length;
      const pending = data.filter(
        (o) => o.status === "pending" || o.status === "confirmed"
      ).length;
      const cancelled = data.filter((o) => o.status === "cancelled").length;
      const returned = data.filter(
        (o) =>
          o.status === "returned" ||
          o.status === "return_requested" ||
          o.status === "return_approved" ||
          o.paymentStatus === "refunded"
      ).length;

      setTotals({
        totalOrders: response.pagination?.total || 0,
        totalRevenue: revenue,
        deliveredCount: delivered,
        pendingCount: pending,
        cancelledCount: cancelled,
        returnedCount: returned,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, paymentFilter, channelFilter, dateRange]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // --- Clear filters ---
  const clearFilters = () => {
    setRange(DEFAULT_RANGE);
    setStatusFilter("all");
    setChannelFilter("all");
    setPaymentFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  // --- Export ---
  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const headers = [
      "#",
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
      (page - 1) * PAGE_SIZE + index + 1,
      order.orderNumber,
      formatDateTime(order.createdAt),
      order.shippingAddress?.fullName ?? "",
      order.shippingAddress?.phone ?? "",
      formatPrice(order.total),
      titleCase(order.status),
      titleCase(order.paymentStatus),
      order.paymentMethod ?? "",
      titleCase(order.orderChannel),
    ]);
    downloadCsv(`order-report-${stamp}`, buildCsv(headers, rows));
  };

  // --- Columns ---
  const columns = [
    {
      key: "no",
      header: "#",
      width: "56px",
      align: "center" as const,
      render: (_order: Order, index: number) => (
        <span className="or-row-no">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "orderNumber",
      header: "Order ID",
      render: (order: Order) => (
        <span
          className="or-order-id"
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          {order.orderNumber}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Order Date",
      render: (order: Order) => (
        <span className="or-secondary">{formatDateTime(order.createdAt)}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order: Order) => (
        <div className="or-customer">
          <span className="or-customer-name">
            {order.shippingAddress?.fullName ?? "—"}
          </span>
          <span className="or-customer-phone">
            {order.shippingAddress?.phone ?? ""}
          </span>
        </div>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right" as const,
      render: (order: Order) => (
        <span className="or-amount">{formatPrice(order.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Order Status",
      render: (order: Order) => (
        <span className={`or-status or-status--${orderStatusVariant(order.status)}`}>
          {titleCase(order.status)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (order: Order) => (
        <span className={`or-status or-status--${paymentStatusVariant(order.paymentStatus)}`}>
          {titleCase(order.paymentStatus)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      align: "right" as const,
      render: (order: Order) => (
        <button
          type="button"
          className="or-view-btn"
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          View
        </button>
      ),
    },
  ];

  // Dynamic table title based on status filter
  const tableTitle =
    statusFilter === "all"
      ? "All Orders"
      : (STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? "Orders") + " Orders";

  return (
    <div className="order-report">
      {/* Breadcrumb */}
      <nav className="or-breadcrumb">
        <span>Sales &amp; Transaction Report</span>
        <span className="or-breadcrumb-sep">/</span>
        <span className="or-breadcrumb-current">Order Report</span>
      </nav>

      {/* Title */}
      <h1 className="or-title">Order Report</h1>

      {/* Error */}
      {error && (
        <div className="or-error-card">
          <p>{error}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="or-stats-grid">
        <div className="or-stat-card">
          <div className="or-stat-icon or-stat-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="or-stat-body">
            <div className="or-stat-value">{totals.totalOrders.toLocaleString()}</div>
            <div className="or-stat-label">Total Orders</div>
          </div>
        </div>

        <div className="or-stat-card">
          <div className="or-stat-icon or-stat-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="or-stat-body">
            <div className="or-stat-value or-stat-value--green">
              {formatPrice(totals.totalRevenue, { compact: true })}
            </div>
            <div className="or-stat-label">Total Revenue (this page)</div>
          </div>
        </div>

        <div className="or-stat-card">
          <div className="or-stat-icon or-stat-icon--teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="or-stat-body">
            <div className="or-stat-value">{totals.deliveredCount.toLocaleString()}</div>
            <div className="or-stat-label">Delivered (this page)</div>
          </div>
        </div>

        <div className="or-stat-card">
          <div className="or-stat-icon or-stat-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="or-stat-body">
            <div className="or-stat-value">{totals.pendingCount.toLocaleString()}</div>
            <div className="or-stat-label">Pending (this page)</div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="or-stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="or-stat-card">
          <div className="or-stat-icon or-stat-icon--red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="or-stat-body">
            <div className="or-stat-value or-stat-value--red">
              {totals.cancelledCount.toLocaleString()}
            </div>
            <div className="or-stat-label">Cancelled (this page)</div>
          </div>
        </div>

        <div className="or-stat-card">
          <div className="or-stat-icon or-stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </div>
          <div className="or-stat-body">
            <div className="or-stat-value">{totals.returnedCount.toLocaleString()}</div>
            <div className="or-stat-label">Returned/Refunded (this page)</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="or-filter-card">
        <div className="or-filter-group">
          <label htmlFor="or-date">Date Range</label>
          <select
            id="or-date"
            value={range}
            onChange={(e) => {
              setRange(e.target.value as DateRange);
              setPage(1);
            }}
          >
            {DATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="or-filter-group">
          <label htmlFor="or-status">Order Status</label>
          <select
            id="or-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="or-filter-group">
          <label htmlFor="or-channel">Channel</label>
          <select
            id="or-channel"
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(1);
            }}
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="or-filter-group">
          <label htmlFor="or-payment">Payment</label>
          <select
            id="or-payment"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
          >
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="or-clear-btn" onClick={clearFilters}>
          Clear
        </button>

        <div className="or-filter-actions">
          <div className="or-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search order ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <button
            type="button"
            className="or-export-btn"
            onClick={handleExport}
            disabled={orders.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="or-table-card">
        <div className="or-table-header">
          <h2>
            {tableTitle}
            <span className="or-table-count">{totalItems.toLocaleString()}</span>
          </h2>
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
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
