import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { api } from "../api/client";
import { formatDate, formatPrice } from "../utils/format";
import { DataTable, StatusDropdown, FilterDrawer } from "../components";
import type { Order, OrderStatus } from "../types";
import "../styles/ui-kit.css";

interface RefundRequestsProps {
  statusFilter?: "all" | "pending" | "approved" | "refunded" | "rejected";
}

const BACKEND_STATUSES_BY_FILTER: Record<RefundRequestsProps["statusFilter"] & string, OrderStatus[]> = {
  all: ["return_requested", "return_approved", "refund_initiated", "refunded", "returned"],
  pending: ["return_requested"],
  approved: ["return_approved", "refund_initiated"],
  refunded: ["refunded"],
  rejected: ["returned"],
};

const refundStatusOptions = [
  { value: "all", label: "All", color: "neutral" as const, path: "/refund-requests/all" },
  { value: "pending", label: "Pending", color: "warning" as const, path: "/refund-requests" },
  { value: "approved", label: "Approved", color: "info" as const, path: "/refund-requests/approved" },
  { value: "refunded", label: "Refunded", color: "success" as const, path: "/refund-requests/refunded" },
  { value: "rejected", label: "Rejected", color: "danger" as const, path: "/refund-requests/rejected" },
];

/**
 * The refund bucket a backend order status falls into.
 *
 * The four filters group several backend statuses each (approved covers both
 * `return_approved` and `refund_initiated`). The "All" view shows every
 * bucket side by side, so each row needs to be labelled with its own bucket
 * rather than the filter's label.
 */
function refundBucketOf(status: string): "pending" | "approved" | "refunded" | "rejected" {
  if (status === "return_requested") return "pending";
  if (status === "return_approved" || status === "refund_initiated") return "approved";
  if (status === "refunded") return "refunded";
  return "rejected"; // "returned" — the request was rejected/closed
}

export default function RefundRequests({ statusFilter = "pending" }: RefundRequestsProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [refundAmountInr, setRefundAmountInr] = useState<string>("");

  const filterKey = (statusFilter ?? "pending") as keyof typeof BACKEND_STATUSES_BY_FILTER;
  const currentStatusOption = refundStatusOptions.find((o) => o.value === filterKey);

  async function loadRefunds() {
    setLoading(true);
    try {
      // One request for the whole filter — the backend takes a list of
      // statuses, so the "All" tab is a single round trip rather than one
      // per refund state.
      const backendStatuses = BACKEND_STATUSES_BY_FILTER[filterKey];
      const response = await api.getOrders({ statuses: backendStatuses, limit: 100 });
      setOrders(response?.data ?? []);
    } catch (error) {
      console.error("Failed to load refund requests:", error);
      toast.error("Failed to load refund requests");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRefunds();
  }, [filterKey]);

  const filteredRefunds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.userId.toLowerCase().includes(q) || (o.shippingAddress?.fullName ?? "").toLowerCase().includes(q));
  }, [orders, searchQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
  }

  function handleStatusChange(value: string) {
    const option = refundStatusOptions.find((o) => o.value === value);
    if (option) navigate(option.path);
  }

  function openRefundModal(order: Order) {
    setRefundTarget(order);
    setRefundAmountInr((order.totalPaise / 100).toFixed(2));
  }

  function closeRefundModal() {
    setRefundTarget(null);
    setRefundAmountInr("");
  }

  async function approveRefund(order: Order) {
    setProcessing(order.id);
    try {
      await api.updateOrderStatus(order.id, "return_approved");
      toast.success(`Refund approved for ${order.orderNumber}`);
      await loadRefunds();
    } catch (error) {
      console.error("Failed to approve refund:", error);
      toast.error("Failed to approve refund");
    } finally {
      setProcessing(null);
    }
  }

  async function rejectRefund(order: Order) {
    setProcessing(order.id);
    try {
      await api.updateOrderStatus(order.id, "returned");
      toast.success(`Refund rejected for ${order.orderNumber}`);
      await loadRefunds();
    } catch (error) {
      console.error("Failed to reject refund:", error);
      toast.error("Failed to reject refund");
    } finally {
      setProcessing(null);
    }
  }

  async function confirmRefund() {
    if (!refundTarget) return;
    const amountInr = Number.parseFloat(refundAmountInr);
    if (!Number.isFinite(amountInr) || amountInr < 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    setProcessing(refundTarget.id);
    try {
      await api.processOrderRefund(refundTarget.id, Math.round(amountInr * 100));
      toast.success(`Refunded ${formatPrice(Math.round(amountInr * 100))} for ${refundTarget.orderNumber}`);
      closeRefundModal();
      await loadRefunds();
    } catch (error) {
      console.error("Failed to process refund:", error);
      toast.error("Failed to process refund");
    } finally {
      setProcessing(null);
    }
  }

  const statusVariantMap: Record<string, string> = { pending: "warning", approved: "info", refunded: "success", rejected: "danger" };

  // In a single-status view every row carries the filter's label. The "All"
  // view mixes all four buckets, so each row is labelled from its own
  // backend status instead.
  function rowStatus(order: Order): { label: string; variant: string } {
    if (filterKey !== "all") {
      return { label: currentStatusOption?.label ?? "", variant: statusVariantMap[filterKey] };
    }
    const bucket = refundBucketOf(order.status);
    return {
      label: refundStatusOptions.find((o) => o.value === bucket)?.label ?? bucket,
      variant: statusVariantMap[bucket],
    };
  }

  const columns = [
    { key: "sl", header: "#", width: "50px", render: (_: Order, index: number) => <span className="ak-text-muted">{index + 1}</span> },
    { key: "orderNumber", header: "Order ID", render: (order: Order) => <span className="ak-order-id" onClick={() => navigate(`/orders/${order.id}`)}>{order.orderNumber}</span> },
    { key: "createdAt", header: "Order Date", render: (order: Order) => <div className="ak-date-cell"><span className="ak-date-cell__date">{formatDate(order.createdAt)}</span></div> },
    {
      key: "customer",
      header: "Customer",
      render: (order: Order) => (
        <div className="ak-user-cell">
          <div className="ak-user-cell__initials">{(order.shippingAddress?.fullName ?? "?")[0].toUpperCase()}</div>
          <div className="ak-user-cell__info">
            <span className="ak-user-cell__name">{order.shippingAddress?.fullName ?? "—"}</span>
            <span className="ak-user-cell__email">{order.shippingAddress?.phone ?? "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (order: Order) => {
        const reason = order.returnReason || order.customerNote || "—";
        return <span className="ak-text-truncate" title={reason} style={{ maxWidth: "180px" }}>{reason}</span>;
      },
    },
    { key: "amount", header: "Amount", align: "right" as const, render: (order: Order) => <span className="ak-amount">{formatPrice(order.totalPaise)}</span> },
    {
      key: "status",
      header: "Status",
      render: (order: Order) => {
        const { label, variant } = rowStatus(order);
        return (
          <span className={`ak-status ak-status--${variant}`}>
            <span className="ak-status__dot" />
            {label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      width: "160px",
      render: (order: Order) => {
        const isProcessing = processing === order.id;
        // In the "All" view the action follows the row's own bucket, so a
        // pending request next to a refunded one still gets the right button.
        const bucket = filterKey === "all" ? refundBucketOf(order.status) : filterKey;
        return (
          <div className="ak-row-actions">
            {bucket === "pending" && (
              <>
                <button type="button" className="ak-btn ak-btn--sm ak-btn--success" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); approveRefund(order); }}>Approve</button>
                <button type="button" className="ak-btn ak-btn--sm ak-btn--danger" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); rejectRefund(order); }}>Reject</button>
              </>
            )}
            {bucket === "approved" && <button type="button" className="ak-btn ak-btn--sm ak-btn--primary" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); openRefundModal(order); }}>Process Refund</button>}
            {bucket === "refunded" && <span className="ak-text-muted ak-text-sm">{order.refundedAt ? `Refunded ${formatDate(order.refundedAt)}` : "Completed"}</span>}
            {bucket === "rejected" && <span className="ak-text-muted ak-text-sm">Closed</span>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="ak-page">
      {/* Page Header */}
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Refund Requests
            {filteredRefunds.length > 0 && <span className="ak-page-header__count">{filteredRefunds.length}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage return and refund requests from customers</p>
        </div>
      </div>

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
        <div className="ak-toolbar">
          <form onSubmit={handleSearch} className="ak-toolbar__search">
            <div className="ak-searchbar">
              <div className="ak-searchbar__form">
                <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input type="text" className="ak-searchbar__input" placeholder="Search by order number, customer…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </form>

          <div className="ak-toolbar__filters">
            <StatusDropdown options={refundStatusOptions} value={filterKey} onChange={handleStatusChange} placeholder="Status" size="sm" />
          </div>

          <div className="ak-toolbar__actions">
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setShowFilterDrawer(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><circle cx="20" cy="14" r="2" /></svg>
              Filters
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredRefunds}
          loading={loading}
          loadingText="Loading refund requests…"
          emptyIcon="cart"
          emptyTitle={filterKey === "all" ? "No refund requests" : `No ${currentStatusOption?.label.toLowerCase()} refund requests`}
          emptyDescription="When customers request refunds, they'll appear here."
          keyExtractor={(order) => order.id}
          onRowClick={(order) => navigate(`/orders/${order.id}`)}
        />
      </div>

      {/* Filter Drawer */}
      <FilterDrawer isOpen={showFilterDrawer} onClose={() => setShowFilterDrawer(false)} title="Filter Refunds" onApply={() => setShowFilterDrawer(false)} onReset={() => setShowFilterDrawer(false)}>
        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Refund Status</label>
          <StatusDropdown options={refundStatusOptions} value={filterKey} onChange={handleStatusChange} placeholder="Status" />
        </div>
      </FilterDrawer>

      {/* Refund Modal */}
      {refundTarget && (
        <div className="ak-modal-overlay" onClick={closeRefundModal}>
          <div className="ak-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Process Refund</h2>
              <button type="button" className="ak-modal__close" onClick={closeRefundModal} disabled={processing === refundTarget.id}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
            <div className="ak-modal__body">
              <p>Process refund for order <strong>{refundTarget.orderNumber}</strong>?<br />Order total is <strong>{formatPrice(refundTarget.totalPaise)}</strong>.</p>
              <div className="ak-field" style={{ marginTop: "1rem" }}><label className="ak-field__label" htmlFor="refund-amount">Refund Amount (₹)</label><input id="refund-amount" className="ak-input" type="number" step="0.01" min="0" value={refundAmountInr} onChange={(e) => setRefundAmountInr(e.target.value)} /></div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeRefundModal} disabled={processing === refundTarget.id}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={confirmRefund} disabled={processing === refundTarget.id}>{processing === refundTarget.id ? "Processing…" : "Confirm Refund"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
