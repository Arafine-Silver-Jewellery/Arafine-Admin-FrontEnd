import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { ExpenseRow, Order } from "../../types";
import { formatDate, formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ak-status` / `ak-table` live in the UI kit.
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

type TransactionTab = "order" | "expense" | "refund";
type DatePreset = "all" | "today" | "7d" | "30d" | "90d" | "year";

const PAGE_SIZE = 20;

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
];

const PAYMENT_METHODS = ["All Methods", "upi", "card", "cash", "wallet"];

const EXPENSE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "salary", label: "Salary" },
  { value: "marketing", label: "Marketing" },
  { value: "packaging", label: "Packaging" },
  { value: "shipping", label: "Shipping" },
  { value: "maintenance", label: "Maintenance" },
  { value: "software", label: "Software" },
  { value: "other", label: "Other" },
];

const EXPENSE_STATUSES = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
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

function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function paymentMethodIcon(method?: string | null): string {
  switch ((method ?? "").toLowerCase()) {
    case "upi":
      return "📱";
    case "card":
      return "💳";
    case "cash":
      return "💵";
    case "wallet":
      return "👛";
    default:
      return "🧾";
  }
}

export default function TransactionReport() {
  const [activeTab, setActiveTab] = useState<TransactionTab>("order");
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [paymentMethod, setPaymentMethod] = useState("All Methods");
  const [expenseCategory, setExpenseCategory] = useState("all");
  const [expenseStatus, setExpenseStatus] = useState("all");
  const [refundStatus, setRefundStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseTotals, setExpenseTotals] = useState({
    count: 0,
    totalAmountPaise: 0,
    paidAmountPaise: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => resolveDateRange(datePreset), [datePreset]);

  // --- Order tab ---------------------------------------------------------
  // Payment method is not a backend filter, so the request pulls the page
  // unfiltered and the method narrows it client-side.
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getOrders({
        page,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    }
    finally {
      setLoading(false);
    }
  }, [page, searchQuery, range.dateFrom, range.dateTo]);

  // --- Expense tab -------------------------------------------------------
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getExpensesReport({
        page,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        category: expenseCategory !== "all" ? expenseCategory : undefined,
        status: expenseStatus !== "all" ? expenseStatus : undefined,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });
      setExpenses(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
      setExpenseTotals(
        response.totals ?? { count: 0, totalAmountPaise: 0, paidAmountPaise: 0 },
      );
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    }
    finally {
      setLoading(false);
    }
  }, [page, searchQuery, expenseCategory, expenseStatus, range.dateFrom, range.dateTo]);

  // --- Refund tab --------------------------------------------------------
  // Refunds are orders whose stored payment status is `refunded` or
  // `partially_refunded`. The raw `paymentStatus` filter is used rather than
  // `paymentState` because `paymentState` doesn't expose
  // `partially_refunded` — and `paymentState` would win if both were sent.
  //
  // The backend filters on one status at a time, so "All Status" issues both
  // requests and merges the two lists. Each request asks for the full page
  // size; the merged list is then paginated client-side.
  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseParams = {
        page: 1,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      };

      if (refundStatus === "all") {
        // The merged list is paginated client-side, so every matching row has
        // to be in hand before slicing out the current page — fetching only
        // one page per status would empty out page 2 and beyond while the
        // total still claimed rows existed. The backend caps `limit` at 200,
        // so each status is pulled in 200-row chunks.
        const fetchAllByStatus = async (status: "refunded" | "partially_refunded") => {
          const first = await api.getOrders({
            ...baseParams,
            limit: 200,
            paymentStatus: status,
          });
          const total = first.pagination?.total || 0;
          const rows = [...(first.data || [])];
          const totalPages = Math.max(1, Math.ceil(total / 200));
          for (let p = 2; p <= totalPages; p++) {
            const next = await api.getOrders({
              ...baseParams,
              limit: 200,
              page: p,
              paymentStatus: status,
            });
            rows.push(...(next.data || []));
          }
          return { rows, total };
        };

        const [refunded, partial] = await Promise.all([
          fetchAllByStatus("refunded"),
          fetchAllByStatus("partially_refunded"),
        ]);
        const merged = [...refunded.rows, ...partial.rows].sort(
          (a, b) =>
            new Date(b.refundedAt ?? b.createdAt).getTime() -
            new Date(a.refundedAt ?? a.createdAt).getTime(),
        );
        const total = refunded.total + partial.total;
        const start = (page - 1) * PAGE_SIZE;
        setOrders(merged.slice(start, start + PAGE_SIZE));
        setTotalItems(total);
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
        return;
      }

      const response = await api.getOrders({
        ...baseParams,
        page,
        paymentStatus:
          refundStatus === "pending" ? "partially_refunded" : "refunded",
      });
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load refunds");
    }
    finally {
      setLoading(false);
    }
  }, [page, searchQuery, refundStatus, range.dateFrom, range.dateTo]);

  // Only the active tab loads — switching tabs resets to page 1 so the
  // previous tab's page number doesn't leak into a differently-sized list.
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "expense") {
      loadExpenses();
    }
    else if (activeTab === "refund") {
      loadRefunds();
    }
    else {
      loadOrders();
    }
  }, [activeTab, loadOrders, loadExpenses, loadRefunds]);

  // --- Derived values ----------------------------------------------------
  const visibleOrders = useMemo(() => {
    if (activeTab !== "order" || paymentMethod === "All Methods") return orders;
    return orders.filter(
      (order) => (order.paymentMethod ?? "").toLowerCase() === paymentMethod.toLowerCase(),
    );
  }, [orders, activeTab, paymentMethod]);

  const orderStats = useMemo(() => {
    const totalAmountPaise = visibleOrders.reduce((sum, o) => sum + (o.totalPaise ?? 0), 0);
    const completed = visibleOrders.filter((o) => o.paymentStatus === "paid").length;
    const pending = visibleOrders.filter((o) => o.paymentStatus === "pending").length;
    return { totalAmountPaise, completed, pending };
  }, [visibleOrders]);

  const refundStats = useMemo(() => {
    const totalRefundPaise = orders.reduce(
      (sum, o) => sum + (o.refundAmountPaise ?? 0),
      0,
    );
    const processed = orders.filter((o) => o.paymentStatus === "refunded").length;
    const pending = orders.filter((o) => o.paymentStatus === "partially_refunded").length;
    return { totalRefundPaise, processed, pending };
  }, [orders]);

  // --- Export ------------------------------------------------------------
  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (activeTab === "expense") {
      const headers = ["SL", "Expense ID", "Category", "Description", "Date", "Status", "Amount"];
      const data = expenses.map((expense, index) => [
        (page - 1) * PAGE_SIZE + index + 1,
        expense.id,
        expense.category,
        expense.description ?? "",
        formatDate(expense.expenseDate),
        expense.status,
        formatPrice(expense.amountPaise),
      ]);
      downloadCsv(`expense-transactions-${stamp}`, buildCsv(headers, data));
      return;
    }
    if (activeTab === "refund") {
      const headers = [
        "SL",
        "Order ID",
        "Customer Name",
        "Refund Date",
        "Reason",
        "Amount",
        "Status",
      ];
      const data = orders.map((order, index) => [
        (page - 1) * PAGE_SIZE + index + 1,
        order.orderNumber,
        order.shippingAddress?.fullName ?? "",
        order.refundedAt ? formatDateTime(order.refundedAt) : "—",
        order.returnReason ?? "",
        formatPrice(order.refundAmountPaise ?? 0),
        titleCase(order.paymentStatus),
      ]);
      downloadCsv(`refund-transactions-${stamp}`, buildCsv(headers, data));
      return;
    }
    const headers = [
      "SL",
      "Order ID",
      "Customer Name",
      "Transaction Date",
      "Payment Method",
      "Amount",
      "Status",
    ];
    const data = visibleOrders.map((order, index) => [
      (page - 1) * PAGE_SIZE + index + 1,
      order.orderNumber,
      order.shippingAddress?.fullName ?? "",
      formatDateTime(order.createdAt),
      order.paymentMethod ?? "",
      formatPrice(order.totalPaise),
      titleCase(order.paymentStatus),
    ]);
    downloadCsv(`order-transactions-${stamp}`, buildCsv(headers, data));
  };

  const orderColumns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_order: Order, index: number) => (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "orderNumber",
      header: "Order ID",
      render: (order: Order) => (
        <span style={{ fontWeight: 500, color: "#0d6efd" }}>{order.orderNumber}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Name",
      render: (order: Order) => order.shippingAddress?.fullName ?? "—",
    },
    {
      key: "createdAt",
      header: "Transaction Date",
      render: (order: Order) => formatDateTime(order.createdAt),
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (order: Order) => (
        <div className="transaction-type">
          <span className="type-icon income">{paymentMethodIcon(order.paymentMethod)}</span>
          {order.paymentMethod ? titleCase(order.paymentMethod) : "—"}
        </div>
      ),
    },
    {
      key: "totalPaise",
      header: "Amount",
      align: "right" as const,
      render: (order: Order) => (
        <span className="amount-positive">{formatPrice(order.totalPaise)}</span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (order: Order) => (
        <span
          className={`ak-status ak-status--${
            order.paymentStatus === "paid"
              ? "success"
              : order.paymentStatus === "failed"
                ? "danger"
                : order.paymentStatus === "partially_refunded"
                  ? "warning"
                  : "neutral"
          }`}
        >
          <span className="ak-status__dot" />
          {titleCase(order.paymentStatus)}
        </span>
      ),
    },
  ];

  const expenseColumns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_expense: ExpenseRow, index: number) =>
        (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "id",
      header: "Expense ID",
      render: (expense: ExpenseRow) => (
        <span style={{ fontWeight: 500, color: "#0d6efd" }}>{expense.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (expense: ExpenseRow) => (
        <div className="transaction-type">
          <span className="type-icon expense">📁</span>
          {titleCase(expense.category)}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (expense: ExpenseRow) => expense.description || "—",
    },
    {
      key: "expenseDate",
      header: "Date",
      render: (expense: ExpenseRow) => formatDate(expense.expenseDate),
    },
    {
      key: "amountPaise",
      header: "Amount",
      align: "right" as const,
      render: (expense: ExpenseRow) => (
        <span className="amount-negative">-{formatPrice(expense.amountPaise)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (expense: ExpenseRow) => (
        <span
          className={`ak-status ak-status--${
            expense.status === "paid"
              ? "success"
              : expense.status === "approved"
                ? "info"
                : expense.status === "rejected"
                  ? "danger"
                  : "warning"
          }`}
        >
          <span className="ak-status__dot" />
          {titleCase(expense.status)}
        </span>
      ),
    },
  ];

  const refundColumns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_order: Order, index: number) => (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "orderNumber",
      header: "Order ID",
      render: (order: Order) => (
        <span style={{ fontWeight: 500, color: "#0d6efd" }}>{order.orderNumber}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Name",
      render: (order: Order) => order.shippingAddress?.fullName ?? "—",
    },
    {
      key: "refundedAt",
      header: "Refund Date",
      render: (order: Order) =>
        order.refundedAt ? formatDateTime(order.refundedAt) : "—",
    },
    {
      key: "returnReason",
      header: "Reason",
      render: (order: Order) => order.returnReason || "—",
    },
    {
      key: "refundAmountPaise",
      header: "Amount",
      align: "right" as const,
      render: (order: Order) => (
        <span className="amount-negative">
          -{formatPrice(order.refundAmountPaise ?? order.totalPaise)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (order: Order) => (
        <span
          className={`ak-status ak-status--${
            order.paymentStatus === "refunded"
              ? "neutral"
              : order.paymentStatus === "partially_refunded"
                ? "warning"
                : "info"
          }`}
        >
          <span className="ak-status__dot" />
          {titleCase(order.paymentStatus)}
        </span>
      ),
    },
  ];

  const activeData = activeTab === "expense" ? expenses : orders;
  const exportDisabled =
    activeTab === "expense" ? expenses.length === 0 : visibleOrders.length === 0;

  return (
    <div className="reports-container">
      <div className="report-tabs">
        <button
          className={activeTab === "order" ? "active" : ""}
          onClick={() => setActiveTab("order")}
        >
          Order Transactions
        </button>
        <button
          className={activeTab === "expense" ? "active" : ""}
          onClick={() => setActiveTab("expense")}
        >
          Expense Transactions
        </button>
        <button
          className={activeTab === "refund" ? "active" : ""}
          onClick={() => setActiveTab("refund")}
        >
          Refund Transactions
        </button>
      </div>

      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Date Range</label>
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
          </div>
          {activeTab === "order" && (
            <div className="filter-group">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPage(1);
                }}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === "All Methods" ? method : titleCase(method)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {activeTab === "expense" && (
            <>
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => {
                    setExpenseCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  {EXPENSE_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={expenseStatus}
                  onChange={(e) => {
                    setExpenseStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  {EXPENSE_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {activeTab === "refund" && (
            <div className="filter-group">
              <label>Status</label>
              <select
                value={refundStatus}
                onChange={(e) => {
                  setRefundStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="processed">Refunded</option>
                <option value="pending">Partially Refunded</option>
              </select>
            </div>
          )}
          <button
            className="btn-filter-secondary"
            onClick={() => {
              setDatePreset("30d");
              setPaymentMethod("All Methods");
              setExpenseCategory("all");
              setExpenseStatus("all");
              setRefundStatus("all");
              setSearchQuery("");
              setPage(1);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      {activeTab === "order" && (
        <>
          <div className="reports-stats-grid">
            <div className="reports-stat-card">
              <div className="reports-stat-icon green">💰</div>
              <div className="reports-stat-content">
                <h2>{formatPrice(orderStats.totalAmountPaise, { compact: true })}</h2>
                <p>Total Transaction Amount</p>
              </div>
            </div>
            <div className="reports-stat-card">
              <div className="reports-stat-icon blue">📦</div>
              <div className="reports-stat-content">
                <h2>{totalItems}</h2>
                <p>Total Transactions</p>
              </div>
            </div>
            <div className="reports-stat-card">
              <div className="reports-stat-icon teal">✅</div>
              <div className="reports-stat-content">
                <h2>{orderStats.completed}</h2>
                <p>Completed</p>
              </div>
            </div>
            <div className="reports-stat-card">
              <div className="reports-stat-icon yellow">⏳</div>
              <div className="reports-stat-content">
                <h2>{orderStats.pending}</h2>
                <p>Pending</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "expense" && (
        <div className="reports-stats-grid">
          <div className="reports-stat-card wide">
            <div className="reports-stat-icon red">💸</div>
            <div className="reports-stat-content">
              <h2>{formatPrice(expenseTotals.totalAmountPaise, { compact: true })}</h2>
              <p>Total Expenses</p>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon blue">📋</div>
            <div className="reports-stat-content">
              <h2>{expenseTotals.count}</h2>
              <p>Total Entries</p>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon green">✅</div>
            <div className="reports-stat-content">
              <h2>{formatPrice(expenseTotals.paidAmountPaise, { compact: true })}</h2>
              <p>Paid Amount</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "refund" && (
        <div className="reports-stats-grid">
          <div className="reports-stat-card">
            <div className="reports-stat-icon orange">🔄</div>
            <div className="reports-stat-content">
              <h2>{formatPrice(refundStats.totalRefundPaise, { compact: true })}</h2>
              <p>Total Refund Amount</p>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon blue">📋</div>
            <div className="reports-stat-content">
              <h2>{totalItems}</h2>
              <p>Total Refund Requests</p>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon green">✅</div>
            <div className="reports-stat-content">
              <h2>{refundStats.processed}</h2>
              <p>Processed</p>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon yellow">⏳</div>
            <div className="reports-stat-content">
              <h2>{refundStats.pending}</h2>
              <p>Pending</p>
            </div>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h3>
            {activeTab === "order" && "Order Transactions"}
            {activeTab === "expense" && "Expense Transactions"}
            {activeTab === "refund" && "Refund Transactions"}
            <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder={
                  activeTab === "expense"
                    ? "Search expenses..."
                    : activeTab === "refund"
                      ? "Search by order ID..."
                      : "Search by order ID..."
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button className="btn-export" onClick={handleExport} disabled={exportDisabled}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {activeTab === "expense" ? (
          <DataTable
            columns={expenseColumns}
            data={expenses}
            loading={loading}
            loadingText="Loading expenses…"
            emptyIcon="file"
            emptyTitle="No expenses found"
            emptyDescription="Expenses added to the ledger will appear here."
            keyExtractor={(expense) => expense.id}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : activeTab === "refund" ? (
          <DataTable
            columns={refundColumns}
            data={orders}
            loading={loading}
            loadingText="Loading refunds…"
            emptyIcon="file"
            emptyTitle="No refunds found"
            emptyDescription="Refunded orders will appear here with their refund amount and date."
            keyExtractor={(order) => order.id}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : (
          <DataTable
            columns={orderColumns}
            data={visibleOrders}
            loading={loading}
            loadingText="Loading transactions…"
            emptyIcon="cart"
            emptyTitle="No transactions found"
            emptyDescription="Try widening the date range or clearing the filters."
            keyExtractor={(order) => order.id}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
