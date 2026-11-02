import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type {
  ExpenseRow,
  TransactionOrderRow,
  TransactionRefundReport,
  TransactionTotals,
} from "../../types";
import { formatDate, formatDateTime, formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ak-table` lives in the UI kit.
import "../../styles/ui-kit.css";
import "./transaction-report.css";

type TransactionTab = "order" | "expense" | "refund";
type DatePreset = "all" | "today" | "7d" | "30d" | "90d" | "year";

const PAGE_SIZE = 20;

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const PAYMENT_METHODS = [
  { value: "all", label: "All Methods" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "cod", label: "COD" },
  { value: "wallet", label: "Wallet" },
];

/**
 * The payment filter, on the backend's `paymentState` axis.
 *
 * `paymentState` is the derived filter, not the stored `paymentStatus` enum —
 * it has no "pending" of its own: an order that has not been paid for is
 * `unpaid`, and one that is part-paid is `partial`.
 */
const PAYMENT_STATUSES = [
  { value: "all", label: "All Status" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
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
  { value: "refunded", label: "Refunded" },
  { value: "partially_refunded", label: "Partially Refunded" },
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

/** The payment-status pill colour for an order. */
function orderStatusClass(status: string): string {
  switch (status) {
    case "paid":
      return "tr-status--paid";
    case "pending":
      return "tr-status--pending";
    case "failed":
      return "tr-status--failed";
    case "partially_refunded":
      return "tr-status--partial";
    default:
      return "tr-status--refunded";
  }
}

/** The payment-status pill colour for an expense. */
function expenseStatusClass(status: string): string {
  switch (status) {
    case "paid":
      return "tr-status--paid";
    case "approved":
      return "tr-status--approved";
    case "rejected":
      return "tr-status--rejected";
    default:
      return "tr-status--pending";
  }
}

function PaymentMethodIcon({ method }: { method?: string | null }) {
  const key = (method ?? "").toLowerCase();
  const tone = key === "upi" || key === "card" || key === "cash" || key === "wallet" ? key : "other";

  return (
    <span className={`tr-method-icon tr-method-icon--${tone}`}>
      {tone === "upi" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      )}
      {tone === "card" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )}
      {tone === "cash" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      {tone === "wallet" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
        </svg>
      )}
      {tone === "other" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )}
    </span>
  );
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

  const [orders, setOrders] = useState<TransactionOrderRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [orderTotals, setOrderTotals] = useState<TransactionTotals>({
    count: 0,
    totalAmount: 0,
    collectedAmount: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [refundTotals, setRefundTotals] = useState({
    count: 0,
    totalAmount: 0,
    processedCount: 0,
    pendingCount: 0,
  });
  const [expenseTotals, setExpenseTotals] = useState({
    count: 0,
    totalAmount: 0,
    paidAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => resolveDateRange(datePreset), [datePreset]);

  // --- Order tab ---------------------------------------------------------
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getReportTransactions({
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
      setOrderTotals(response.totals);
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
      setExpenseTotals(response.totals);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    }
    finally {
      setLoading(false);
    }
  }, [page, searchQuery, expenseCategory, expenseStatus, range.dateFrom, range.dateTo]);

  // --- Refund tab --------------------------------------------------------
  // Both refunded payment statuses are filtered by the server in one query,
  // so the page is correctly paginated instead of being sliced out of a full
  // download of every refunded order.
  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: TransactionRefundReport = await api.getReportRefunds({
        page,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        refundStatus: refundStatus as "all" | "refunded" | "partially_refunded",
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
      setRefundTotals(response.totals);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load refunds");
    }
    finally {
      setLoading(false);
    }
  }, [page, searchQuery, refundStatus, range.dateFrom, range.dateTo]);

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

  // Changing a filter resets to the first page. The reset happens in the
  // change handler rather than in an effect, so the page change and the
  // filter change land in the same render — an effect would fire the loader
  // twice, once for the old page and once for the new one.
  const clearFilters = () => {
    setDatePreset("30d");
    setPaymentMethod("all");
    setPaymentStatus("all");
    setExpenseCategory("all");
    setExpenseStatus("all");
    setRefundStatus("all");
    setSearchQuery("");
    setPage(1);
  };

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);

    if (activeTab === "expense") {
      const headers = ["Rank", "Expense ID", "Category", "Description", "Date", "Status", "Amount"];
      const data = expenses.map((expense, index) => [
        (page - 1) * PAGE_SIZE + index + 1,
        expense.id.slice(0, 8),
        titleCase(expense.category),
        expense.description ?? "",
        formatDate(expense.expenseDate),
        titleCase(expense.status),
        formatPrice(expense.amount),
      ]);
      downloadCsv(`expense-transactions-${stamp}`, buildCsv(headers, data));
      return;
    }

    if (activeTab === "refund") {
      const headers = [
        "Rank",
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
        order.customerName,
        order.refundedAt ? formatDateTime(order.refundedAt) : "—",
        order.returnReason ?? "",
        formatPrice(order.refundAmount ?? 0),
        titleCase(order.paymentStatus),
      ]);
      downloadCsv(`refund-transactions-${stamp}`, buildCsv(headers, data));
      return;
    }

    const headers = [
      "Rank",
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
      order.customerName,
      formatDateTime(order.createdAt),
      order.paymentMethod ?? "",
      formatPrice(order.total),
      titleCase(order.paymentStatus),
    ]);
    downloadCsv(`order-transactions-${stamp}`, buildCsv(headers, data));
  };

  // --- Table columns -----------------------------------------------------
  const orderColumns = [
    {
      key: "no",
      header: "#",
      width: "56px",
      align: "center" as const,
      render: (_order: TransactionOrderRow, index: number) => (
        <span className="tr-row-no">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "orderNumber",
      header: "Order ID",
      render: (order: TransactionOrderRow) => (
        <div>
          <div className="tr-order-no">{order.orderNumber}</div>
          <div className="tr-secondary">{titleCase(order.orderChannel)}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (order: TransactionOrderRow) => (
        <div className="tr-customer">{order.customerName || "—"}</div>
      ),
    },
    {
      key: "createdAt",
      header: "Transaction Date",
      render: (order: TransactionOrderRow) => (
        <span className="tr-secondary">{formatDateTime(order.createdAt)}</span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (order: TransactionOrderRow) => (
        <div className="tr-method">
          <PaymentMethodIcon method={order.paymentMethod} />
          {order.paymentMethod ? titleCase(order.paymentMethod) : "—"}
        </div>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right" as const,
      render: (order: TransactionOrderRow) => (
        <div>
          <div className="tr-amount">{formatPrice(order.total)}</div>
          {order.paidAmount !== order.total && (
            <div className="tr-secondary">{formatPrice(order.paidAmount)} collected</div>
          )}
        </div>
      ),
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (order: TransactionOrderRow) => (
        <span className={`tr-status ${orderStatusClass(order.paymentStatus)}`}>
          {titleCase(order.paymentStatus)}
        </span>
      ),
    },
  ];

  const expenseColumns = [
    {
      key: "no",
      header: "#",
      width: "56px",
      align: "center" as const,
      render: (_expense: ExpenseRow, index: number) => (
        <span className="tr-row-no">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "id",
      header: "Expense ID",
      render: (expense: ExpenseRow) => (
        <span className="tr-order-no">{expense.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (expense: ExpenseRow) => (
        <div className="tr-category">
          <span className="tr-category-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          {titleCase(expense.category)}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (expense: ExpenseRow) => (
        <div className="tr-customer">{expense.description || "—"}</div>
      ),
    },
    {
      key: "expenseDate",
      header: "Date",
      render: (expense: ExpenseRow) => (
        <span className="tr-secondary">{formatDate(expense.expenseDate)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (expense: ExpenseRow) => (
        <span className="tr-amount--out">-{formatPrice(expense.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (expense: ExpenseRow) => (
        <span className={`tr-status ${expenseStatusClass(expense.status)}`}>
          {titleCase(expense.status)}
        </span>
      ),
    },
  ];

  const refundColumns = [
    {
      key: "no",
      header: "#",
      width: "56px",
      align: "center" as const,
      render: (_order: TransactionOrderRow, index: number) => (
        <span className="tr-row-no">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "orderNumber",
      header: "Order ID",
      render: (order: TransactionOrderRow) => (
        <span className="tr-order-no">{order.orderNumber}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (order: TransactionOrderRow) => (
        <div className="tr-customer">{order.customerName || "—"}</div>
      ),
    },
    {
      key: "refundedAt",
      header: "Refund Date",
      render: (order: TransactionOrderRow) => (
        <span className="tr-secondary">
          {order.refundedAt ? formatDateTime(order.refundedAt) : "—"}
        </span>
      ),
    },
    {
      key: "returnReason",
      header: "Reason",
      render: (order: TransactionOrderRow) => (
        <div className="tr-customer">{order.returnReason || "—"}</div>
      ),
    },
    {
      key: "refundAmount",
      header: "Amount",
      align: "right" as const,
      render: (order: TransactionOrderRow) => (
        <span className="tr-amount--out">-{formatPrice(order.refundAmount ?? 0)}</span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (order: TransactionOrderRow) => (
        <span className={`tr-status ${orderStatusClass(order.paymentStatus)}`}>
          {titleCase(order.paymentStatus)}
        </span>
      ),
    },
  ];

  const exportDisabled = activeTab === "expense" ? expenses.length === 0 : orders.length === 0;

  const tableTitle
    = activeTab === "order"
      ? "Order Transactions"
      : activeTab === "expense"
        ? "Expense Transactions"
        : "Refund Transactions";

  const itemLabel = activeTab === "expense" ? "expenses" : activeTab === "refund" ? "refunds" : "transactions";

  return (
    <div className="transaction-report">
      <nav className="tr-breadcrumb">
        <span>Sales &amp; Transaction Report</span>
        <span className="tr-breadcrumb-sep">/</span>
        <span className="tr-breadcrumb-current">Transaction Report</span>
      </nav>

      <h1 className="tr-title">Transaction Report</h1>

      <div className="tr-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "order"}
          className={`tr-tab ${activeTab === "order" ? "tr-tab--active" : ""}`}
          onClick={() => {
            setActiveTab("order");
            setPage(1);
          }}
        >
          Order Transactions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "expense"}
          className={`tr-tab ${activeTab === "expense" ? "tr-tab--active" : ""}`}
          onClick={() => {
            setActiveTab("expense");
            setPage(1);
          }}
        >
          Expense Transactions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "refund"}
          className={`tr-tab ${activeTab === "refund" ? "tr-tab--active" : ""}`}
          onClick={() => {
            setActiveTab("refund");
            setPage(1);
          }}
        >
          Refund Transactions
        </button>
      </div>

      {error && (
        <div className="tr-error-card">
          <p>{error}</p>
        </div>
      )}

      {/* --- Order tab ---------------------------------------------------- */}
      {activeTab === "order" && (
        <div className="tr-stats-grid">
          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 9h6M9 13h6M12 9v7" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{formatPrice(orderTotals.totalAmount, { compact: true })}</div>
              <div className="tr-stat-label">Total Transaction Amount</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{orderTotals.count.toLocaleString()}</div>
              <div className="tr-stat-label">Total Transactions</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{orderTotals.paidCount.toLocaleString()}</div>
              <div className="tr-stat-label">Completed</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{orderTotals.pendingCount.toLocaleString()}</div>
              <div className="tr-stat-label">Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* --- Expense tab -------------------------------------------------- */}
      {activeTab === "expense" && (
        <div className="tr-stats-grid">
          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 7L7 17" />
                <path d="M7 7h10v10" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value tr-stat-value--red">
                {formatPrice(expenseTotals.totalAmount, { compact: true })}
              </div>
              <div className="tr-stat-label">Total Expenses</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{expenseTotals.count.toLocaleString()}</div>
              <div className="tr-stat-label">Total Entries</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value tr-stat-value--green">
                {formatPrice(expenseTotals.paidAmount, { compact: true })}
              </div>
              <div className="tr-stat-label">Paid Amount</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">
                {formatPrice(expenseTotals.totalAmount - expenseTotals.paidAmount, { compact: true })}
              </div>
              <div className="tr-stat-label">Pending Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* --- Refund tab --------------------------------------------------- */}
      {activeTab === "refund" && (
        <div className="tr-stats-grid">
          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 7L7 17" />
                <path d="M7 7h10v10" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value tr-stat-value--red">
                {formatPrice(refundTotals.totalAmount, { compact: true })}
              </div>
              <div className="tr-stat-label">Total Refund Amount</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{refundTotals.count.toLocaleString()}</div>
              <div className="tr-stat-label">Total Refund Requests</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{refundTotals.processedCount.toLocaleString()}</div>
              <div className="tr-stat-label">Processed</div>
            </div>
          </div>

          <div className="tr-stat-card">
            <div className="tr-stat-icon tr-stat-icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
            </div>
            <div className="tr-stat-body">
              <div className="tr-stat-value">{refundTotals.pendingCount.toLocaleString()}</div>
              <div className="tr-stat-label">Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* --- Filter bar ---------------------------------------------------- */}
      <div className="tr-filter-card">
        <div className="tr-filter-group">
          <label htmlFor="tr-date">Date Range</label>
          <select
            id="tr-date"
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
          <>
            <div className="tr-filter-group">
              <label htmlFor="tr-method">Payment Method</label>
              <select
                id="tr-method"
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
            </div>

            <div className="tr-filter-group">
              <label htmlFor="tr-status">Payment Status</label>
              <select
                id="tr-status"
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
            </div>
          </>
        )}

        {activeTab === "expense" && (
          <>
            <div className="tr-filter-group">
              <label htmlFor="tr-category">Category</label>
              <select
                id="tr-category"
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

            <div className="tr-filter-group">
              <label htmlFor="tr-expense-status">Expense Status</label>
              <select
                id="tr-expense-status"
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
          <div className="tr-filter-group">
            <label htmlFor="tr-refund-status">Refund Status</label>
            <select
              id="tr-refund-status"
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
          </div>
        )}

        <button type="button" className="tr-clear-btn" onClick={clearFilters}>
          Clear
        </button>

        <div className="tr-filter-actions">
          <div className="tr-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={activeTab === "expense" ? "Search expenses..." : "Search by order ID..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <button
            type="button"
            className="tr-export-btn"
            onClick={handleExport}
            disabled={exportDisabled}
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

      {/* --- Table --------------------------------------------------------- */}
      <div className="tr-table-card">
        <div className="tr-table-header">
          <h2>
            {tableTitle}
            <span className="tr-table-count">{totalItems.toLocaleString()}</span>
          </h2>
        </div>

        {activeTab === "expense"
          ? (
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
                itemLabel={itemLabel}
              />
            )
          : (
              <DataTable
                columns={activeTab === "refund" ? refundColumns : orderColumns}
                data={orders}
                loading={loading}
                loadingText={activeTab === "refund" ? "Loading refunds…" : "Loading transactions…"}
                emptyIcon={activeTab === "refund" ? "folder" : "cart"}
                emptyTitle={activeTab === "refund" ? "No refunds found" : "No transactions found"}
                emptyDescription={
                  activeTab === "refund"
                    ? "Refunds appear here once an order has been refunded."
                    : "Transactions appear here once orders are placed."
                }
                keyExtractor={(order) => order.id}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel={itemLabel}
              />
            )}
      </div>
    </div>
  );
}
