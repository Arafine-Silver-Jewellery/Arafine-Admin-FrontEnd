import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { api } from "../api/client";
import { formatDate } from "../utils/format";
import { DataTable, StatusDropdown } from "../components";
import type { Order, OrderStatus } from "../types";
import "../styles/ui-kit.css";

interface ExchangeRequestsProps {
  statusFilter?: "all" | "pending" | "approved" | "exchanged" | "rejected";
}

const BACKEND_STATUSES_BY_FILTER: Record<ExchangeRequestsProps["statusFilter"] & string, OrderStatus[]> = {
  all: ["return_requested", "return_approved", "refund_initiated", "refunded", "exchange_rejected"],
  pending: ["return_requested"],
  approved: ["return_approved", "refund_initiated"],
  exchanged: ["refunded"],
  rejected: ["exchange_rejected"],
};

const exchangeStatusOptions = [
  { value: "all", label: "All Status", color: "neutral" as const, path: "/exchange-requests" },
  { value: "pending", label: "Pending", color: "warning" as const, path: "/exchange-requests/pending" },
  { value: "approved", label: "Approved", color: "info" as const, path: "/exchange-requests/approved" },
  { value: "exchanged", label: "Exchanged", color: "success" as const, path: "/exchange-requests/exchanged" },
  { value: "rejected", label: "Rejected", color: "danger" as const, path: "/exchange-requests/rejected" },
];

const REJECTION_REASONS = [
  "Product is not eligible for exchange",
  "Exchange window has expired",
  "Product shows signs of misuse",
  "Product tags/packaging removed",
  "Item is non-returnable",
  "Other",
];

/**
 * The exchange bucket a backend order status falls into.
 */
function exchangeBucketOf(status: string): "pending" | "approved" | "exchanged" | "rejected" {
  if (status === "return_requested") return "pending";
  if (status === "return_approved" || status === "refund_initiated") return "approved";
  if (status === "refunded") return "exchanged";
  if (status === "exchange_rejected") return "rejected";
  return "rejected";
}

/* ─────────────────────────────────────────────────────────────────────────────
   Rejection Modal Component
   ───────────────────────────────────────────────────────────────────────────── */
interface RejectModalProps {
  open: boolean;
  order: Order | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

function RejectModal({ open, order, loading, onClose, onConfirm }: RejectModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedReason("");
      setCustomReason("");
    }
  }, [open]);

  if (!open || !order) return null;

  const finalReason = selectedReason === "Other" ? customReason : selectedReason;

  return (
    <div className="ak-modal-overlay" onClick={onClose}>
      <div className="ak-modal ak-modal--sm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ak-modal__header">
          <div className="ak-modal__icon ak-modal__icon--danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h3 className="ak-modal__title">Reject Exchange Request</h3>
          <p className="ak-modal__subtitle">
            Order <strong>{order.orderNumber}</strong> · {order.shippingAddress?.fullName}
          </p>
        </div>

        {/* Body */}
        <div className="ak-modal__body">
          <label className="ak-label">Select Reason</label>
          <div className="ak-radio-group">
            {REJECTION_REASONS.map((reason) => (
              <label key={reason} className="ak-radio-item">
                <input
                  type="radio"
                  name="rejection-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                />
                <span className="ak-radio-item__checkmark" />
                <span className="ak-radio-item__label">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === "Other" && (
            <div style={{ marginTop: "12px" }}>
              <label className="ak-label">Please specify</label>
              <textarea
                className="ak-textarea"
                placeholder="Enter the reason for rejection..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ak-modal__footer">
          <button type="button" className="ak-btn ak-btn--ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="ak-btn ak-btn--danger"
            onClick={() => onConfirm(finalReason)}
            disabled={loading || !selectedReason || (selectedReason === "Other" && !customReason.trim())}
          >
            {loading ? "Rejecting..." : "Reject Exchange"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────────────────────── */
export default function ExchangeRequests({ statusFilter = "pending" }: ExchangeRequestsProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);

  const filterKey = (statusFilter ?? "pending") as keyof typeof BACKEND_STATUSES_BY_FILTER;
  const currentStatusOption = exchangeStatusOptions.find((o) => o.value === filterKey);

  async function loadExchangeRequests() {
    setLoading(true);
    try {
      const backendStatuses = BACKEND_STATUSES_BY_FILTER[filterKey];
      const response = await api.getOrders({ statuses: backendStatuses, limit: 100 });
      setOrders(response?.data ?? []);
    } catch (error) {
      console.error("Failed to load exchange requests:", error);
      toast.error("Failed to load exchange requests");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExchangeRequests();
  }, [filterKey]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.userId.toLowerCase().includes(q) || (o.shippingAddress?.fullName ?? "").toLowerCase().includes(q));
  }, [orders, searchQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
  }

  function handleStatusChange(value: string) {
    const option = exchangeStatusOptions.find((o) => o.value === value);
    if (option) navigate(option.path);
  }

  async function approveExchange(order: Order) {
    setProcessing(order.id);
    try {
      const result = await api.approveExchange(order.id);
      toast.success(`Exchange approved for ${order.orderNumber}. Replacement order #${result.replacementOrder.orderNumber} created.`);
      await loadExchangeRequests();
    } catch (error) {
      console.error("Failed to approve exchange:", error);
      toast.error("Failed to approve exchange");
    } finally {
      setProcessing(null);
    }
  }

  function openRejectModal(order: Order) {
    setRejectingOrder(order);
    setRejectModalOpen(true);
  }

  async function handleRejectConfirm(_reason: string) {
    if (!rejectingOrder) return;
    
    setProcessing(rejectingOrder.id);
    try {
      await api.updateOrderStatus(rejectingOrder.id, "exchange_rejected");
      toast.success(`Exchange rejected for ${rejectingOrder.orderNumber}`);
      setRejectModalOpen(false);
      setRejectingOrder(null);
      await loadExchangeRequests();
    } catch (error) {
      console.error("Failed to reject exchange:", error);
      toast.error("Failed to reject exchange");
    } finally {
      setProcessing(null);
    }
  }

  const statusVariantMap: Record<string, string> = { pending: "warning", approved: "info", exchanged: "success", rejected: "danger" };

  function rowStatus(order: Order): { label: string; variant: string } {
    if (filterKey !== "all") {
      return { label: currentStatusOption?.label ?? "", variant: statusVariantMap[filterKey] };
    }
    const bucket = exchangeBucketOf(order.status);
    return {
      label: exchangeStatusOptions.find((o) => o.value === bucket)?.label ?? bucket,
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
      key: "product",
      header: "Product",
      render: (order: Order) => {
        const firstItem = order.items?.[0];
        const itemCount = order.items?.length ?? 0;
        if (!firstItem) return <span className="ak-text-muted">—</span>;
        return (
          <div className="ak-product-cell">
            <span className="ak-product-cell__name">{firstItem.productName}</span>
            {itemCount > 1 && <span className="ak-text-muted ak-text-sm">+{itemCount - 1} more</span>}
          </div>
        );
      },
    },
    {
      key: "reason",
      header: "Reason",
      render: (order: Order) => {
        const reason = order.returnReason || order.customerNote || "—";
        return <span className="ak-text-truncate" title={reason} style={{ maxWidth: "180px" }}>{reason}</span>;
      },
    },
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
      width: "220px",
      render: (order: Order) => {
        const isProcessing = processing === order.id;
        const bucket = filterKey === "all" ? exchangeBucketOf(order.status) : filterKey;
        return (
          <div className="ak-row-actions">
            {bucket === "pending" && (
              <>
                <button type="button" className="ak-btn ak-btn--sm ak-btn--success" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); approveExchange(order); }}>Approve</button>
                <button type="button" className="ak-btn ak-btn--sm ak-btn--danger" disabled={isProcessing} onClick={(e) => { e.stopPropagation(); openRejectModal(order); }}>Reject</button>
              </>
            )}
            {bucket === "approved" && order.replacementOrderId && (
              <button type="button" className="ak-btn ak-btn--sm ak-btn--primary" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.replacementOrderId}`); }}>View Replacement</button>
            )}
            {bucket === "approved" && !order.replacementOrderId && (
              <span className="ak-text-muted ak-text-sm">Processing...</span>
            )}
            {bucket === "exchanged" && <span className="ak-text-muted ak-text-sm">{order.refundedAt ? `Exchanged ${formatDate(order.refundedAt)}` : "Completed"}</span>}
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
            Exchange Requests
            {filteredRequests.length > 0 && <span className="ak-page-header__count">{filteredRequests.length}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage product exchange requests from customers</p>
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

          <div className="ak-toolbar__actions">
            <StatusDropdown options={exchangeStatusOptions} value={filterKey} onChange={handleStatusChange} placeholder="Status" size="sm" />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredRequests}
          loading={loading}
          loadingText="Loading exchange requests…"
          emptyIcon="cart"
          emptyTitle={filterKey === "all" ? "No exchange requests" : `No ${currentStatusOption?.label.toLowerCase()} exchange requests`}
          emptyDescription="When customers request product exchanges, they'll appear here."
          keyExtractor={(order) => order.id}
          onRowClick={(order) => navigate(`/orders/${order.id}`)}
        />
      </div>

      {/* Reject Modal */}
      <RejectModal
        open={rejectModalOpen}
        order={rejectingOrder}
        loading={processing === rejectingOrder?.id}
        onClose={() => { setRejectModalOpen(false); setRejectingOrder(null); }}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
