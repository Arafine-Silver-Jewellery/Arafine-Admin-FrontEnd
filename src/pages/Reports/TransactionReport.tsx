import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { ExpenseRow, Order } from "../../types";
import { formatDate, formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
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

const PAYMENT_METHODS = [
  { value: "all", label: "All Methods" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "cod", label: "COD" },
  { value: "wallet", label: "Wallet" },
];

const PAYMENT_STATUSES = [
  { value: "all", label: "All Status" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

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

const REFUND_STATUSES = [
  { value: "all", label: "All Status" },
  { value: "processed", label: "Refunded" },
  { value: "pending", label: "Partially Refunded" },
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

// SVG Icons as components for cleaner JSX
const icons = {
  dollarSign: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  receipt: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="12" y2="14" />
    </svg>
  ),
  checkCircle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  arrowDownLeft: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="17" y1="7" x2="7" y2="17" />
      <polyline points="17 17 7 17 7 7" />
    </svg>
  ),
  refreshCw: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  clipboard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  folder: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  creditCard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  smartphone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  banknotes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <line x1="6" y1="12" x2="6.01" y2="12" />
      <line x1="18" y1="12" x2="18.01" y2="12" />
    </svg>
  ),
  wallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  ),
  fileText: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

function PaymentMethodIcon({ method }: { method?: string | null }) {
  const methodLower = (method ?? "").toLowerCase();
  switch (methodLower) {
    case "upi":
      return <span className="type-icon" style={{ background: "#e3f2fd", color: "#1976d2" }}>{icons.smartphone}</span>;
    case "card":
      return <span className="type-icon" style={{ background: "#f3e5f5", color: "#7b1fa2" }}>{icons.creditCard}</span>;
    case "cash":
      return <span className="type-icon" style={{ background: "#e8f5e9", color: "#388e3c" }}>{icons.banknotes}</span>;
    case "wallet":
      return <span className="type-icon" style={{ background: "#fff3e0", color: "#f57c00" }}>{icons.wallet}</span>;
    default:
      return <span className="type-icon" style={{ background: "#f5f5f5", color: "#757575" }}>{icons.fileText}</span>;
  }
}

export default function TransactionReport() {
  const [activeTab, setActiveTab] = useState<TransactionTab>("order");
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
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
        paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
        paymentState: paymentStatus !== "all" ? paymentStatus : undefined,
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
  }, [page, searchQuery, range.dateFrom, range.dateTo, paymentMethod, paymentStatus]);

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

  // Reset page when tab changes
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
  const orderStats = useMemo(() => {
    const totalAmountPaise = orders.reduce((sum, o) => sum + (o.totalPaise ?? 0), 0);
    const completed = orders.filter((o) => o.paymentStatus === "paid").length;
    const pending = orders.filter((o) => o.paymentStatus === "pending").length;
    return { totalAmountPaise, completed, pending };
  }, [orders]);

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
    const data = orders.map((order, index) => [
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

  // --- Reset filters -----------------------------------------------------
  const handleReset = () => {
    setDatePreset("30d");
    setPaymentMethod("all");
    setPaymentStatus("all");
    setExpenseCategory("all");
    setExpenseStatus("all");
    setRefundStatus("all");
    setSearchQuery("");
    setPage(1);
  };

  // --- Table columns -----------------------------------------------------
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
          <PaymentMethodIcon method={order.paymentMethod} />
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
          <span className="type-icon" style={{ background: "#fff3e0", color: "#f57c00" }}>{icons.folder}</span>
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

  const exportDisabled =
    activeTab === "expense" ? expenses.length === 0 : orders.length === 0;

  return (
    <div className="reports-container">
      {/* Tabs and Inline Filters */}
      <div className="product-report-header">
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

        {/* Inline Filters */}
        <div className="product-report-filter-inline">
          <span className="filter-label">Filter Data</span>
          {activeTab === "order" && (
            <>
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
            </>
          )}

          {activeTab === "expense" && (
            <>
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
            </>
          )}

          {activeTab === "refund" && (
            <>
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
            </>
          )}

          <button className="btn-reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      {/* Order Transactions Stats */}
      {activeTab === "order" && (
        <div className="product-report-stats-grid">
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon green">
              {icons.dollarSign}
            </div>
            <div className="product-report-stat-content">
              <h2 style={{ fontSize: orderStats.totalAmountPaise > 10000000 ? "22px" : "28px" }}>
                {formatPrice(orderStats.totalAmountPaise, { compact: true })}
              </h2>
              <p>Total Transaction Amount</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon blue">
              {icons.receipt}
            </div>
            <div className="product-report-stat-content">
              <h2>{totalItems.toLocaleString()}</h2>
              <p>Total Transactions</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon teal">
              {icons.checkCircle}
            </div>
            <div className="product-report-stat-content">
              <h2>{orderStats.completed}</h2>
              <p>Completed</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon yellow">
              {icons.clock}
            </div>
            <div className="product-report-stat-content">
              <h2>{orderStats.pending}</h2>
              <p>Pending</p>
            </div>
          </div>
        </div>
      )}

      {/* Expense Transactions Stats */}
      {activeTab === "expense" && (
        <div className="product-report-stats-grid">
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon" style={{ background: "#ffebee", color: "#f44336" }}>
              {icons.arrowDownLeft}
            </div>
            <div className="product-report-stat-content">
              <h2 style={{ fontSize: expenseTotals.totalAmountPaise > 10000000 ? "22px" : "28px" }}>
                {formatPrice(expenseTotals.totalAmountPaise, { compact: true })}
              </h2>
              <p>Total Expenses</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon blue">
              {icons.clipboard}
            </div>
            <div className="product-report-stat-content">
              <h2>{expenseTotals.count.toLocaleString()}</h2>
              <p>Total Entries</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon green">
              {icons.checkCircle}
            </div>
            <div className="product-report-stat-content">
              <h2 style={{ fontSize: expenseTotals.paidAmountPaise > 10000000 ? "22px" : "28px" }}>
                {formatPrice(expenseTotals.paidAmountPaise, { compact: true })}
              </h2>
              <p>Paid Amount</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon yellow">
              {icons.clock}
            </div>
            <div className="product-report-stat-content">
              <h2 style={{ fontSize: (expenseTotals.totalAmountPaise - expenseTotals.paidAmountPaise) > 10000000 ? "22px" : "28px" }}>
                {formatPrice(expenseTotals.totalAmountPaise - expenseTotals.paidAmountPaise, { compact: true })}
              </h2>
              <p>Pending Amount</p>
            </div>
          </div>
        </div>
      )}

      {/* Refund Transactions Stats */}
      {activeTab === "refund" && (
        <div className="product-report-stats-grid">
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon orange">
              {icons.refreshCw}
            </div>
            <div className="product-report-stat-content">
              <h2 style={{ fontSize: refundStats.totalRefundPaise > 10000000 ? "22px" : "28px" }}>
                {formatPrice(refundStats.totalRefundPaise, { compact: true })}
              </h2>
              <p>Total Refund Amount</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon blue">
              {icons.clipboard}
            </div>
            <div className="product-report-stat-content">
              <h2>{totalItems.toLocaleString()}</h2>
              <p>Total Refund Requests</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon teal">
              {icons.checkCircle}
            </div>
            <div className="product-report-stat-content">
              <h2>{refundStats.processed}</h2>
              <p>Processed</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon yellow">
              {icons.clock}
            </div>
            <div className="product-report-stat-content">
              <h2>{refundStats.pending}</h2>
              <p>Pending</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>
            {activeTab === "order" && "Order Transactions"}
            {activeTab === "expense" && "Expense Transactions"}
            {activeTab === "refund" && "Refund Transactions"}
            <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* Filters inside table header for Order tab */}
            {activeTab === "order" && (
              <>
                <select
                  className="table-filter-select"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setPage(1);
                  }}
                >
                  {PAYMENT_METHODS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="table-filter-select"
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  {PAYMENT_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
            {/* Filters inside table header for Expense tab */}
            {activeTab === "expense" && (
              <>
                <select
                  className="table-filter-select"
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
                <select
                  className="table-filter-select"
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
              </>
            )}
            {/* Filters inside table header for Refund tab */}
            {activeTab === "refund" && (
              <select
                className="table-filter-select"
                value={refundStatus}
                onChange={(e) => {
                  setRefundStatus(e.target.value);
                  setPage(1);
                }}
              >
                {REFUND_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
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
            data={orders}
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
