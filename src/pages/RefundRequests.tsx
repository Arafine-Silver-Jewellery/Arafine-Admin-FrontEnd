import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { api } from "../api/client";
import { formatDate, formatPrice } from "../utils/format";
import type { Order, OrderStatus } from "../types";
import "../styles/orders-new.css";

interface RefundRequestsProps {
  statusFilter?: "pending" | "approved" | "refunded" | "rejected";
}

// Map the 4 UI status filters to the backend Order.status enum values they include.
const BACKEND_STATUSES_BY_FILTER: Record<RefundRequestsProps["statusFilter"] & string, OrderStatus[]> = {
  pending: ["return_requested"],
  approved: ["return_approved", "refund_initiated"],
  refunded: ["refunded"],
  rejected: ["returned"],
};

const refundStatusOptions = [
  { value: "pending", label: "Pending", path: "/refund-requests" },
  { value: "approved", label: "Approved", path: "/refund-requests/approved" },
  { value: "refunded", label: "Refunded", path: "/refund-requests/refunded" },
  { value: "rejected", label: "Rejected", path: "/refund-requests/rejected" },
] as const;

export default function RefundRequests({ statusFilter = "pending" }: RefundRequestsProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Refund modal state
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [refundAmountInr, setRefundAmountInr] = useState<string>("");

  const filterKey = (statusFilter ?? "pending") as keyof typeof BACKEND_STATUSES_BY_FILTER;
  const currentStatusLabel = refundStatusOptions.find(o => o.value === filterKey)?.label ?? "Pending";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!statusDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".status-dropdown")) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusDropdownOpen]);

  async function loadRefunds() {
    setLoading(true);
    try {
      const backendStatuses = BACKEND_STATUSES_BY_FILTER[filterKey];

      // Fetch each backend status in parallel so we can show all matching orders.
      const responses = await Promise.all(
        backendStatuses.map(s =>
          api.getOrders({ status: s, limit: 100 }),
        ),
      );
      const combined: Order[] = responses.flatMap(r => r?.data ?? []);
      setOrders(combined);
    }
    catch (error) {
      console.error("Failed to load refund requests:", error);
      toast.error("Failed to load refund requests");
      setOrders([]);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRefunds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const filteredRefunds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o.orderNumber.toLowerCase().includes(q)
      || o.userId.toLowerCase().includes(q)
      || (o.shippingAddress?.fullName ?? "").toLowerCase().includes(q),
    );
  }, [orders, searchQuery]);

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
      // Move from return_requested to return_approved by setting status directly.
      await api.updateOrderStatus(order.id, "return_approved");
      toast.success(`Refund approved for ${order.orderNumber}`);
      await loadRefunds();
    }
    catch (error) {
      console.error("Failed to approve refund:", error);
      toast.error("Failed to approve refund");
    }
    finally {
      setProcessing(null);
    }
  }

  async function rejectRefund(order: Order) {
    setProcessing(order.id);
    try {
      await api.updateOrderStatus(order.id, "returned");
      toast.success(`Refund rejected for ${order.orderNumber}`);
      await loadRefunds();
    }
    catch (error) {
      console.error("Failed to reject refund:", error);
      toast.error("Failed to reject refund");
    }
    finally {
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
    }
    catch (error) {
      console.error("Failed to process refund:", error);
      toast.error("Failed to process refund");
    }
    finally {
      setProcessing(null);
    }
  }

  return (
    <div className="orders-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Refund Requests</h1>
          <p className="page-subtitle">Manage return and refund requests from customers</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="status-dropdown">
          <button
            type="button"
            className="status-dropdown-trigger"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            <span>{currentStatusLabel}</span>
            <svg className={`chevron ${statusDropdownOpen ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
          {statusDropdownOpen && (
            <div className="status-dropdown-menu">
              {refundStatusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`status-dropdown-item ${filterKey === option.value ? "active" : ""}`}
                  onClick={() => {
                    navigate(option.path);
                    setStatusDropdownOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="search-box" style={{ flex: 1, maxWidth: "320px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by order number, customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="result-count">
          {loading ? "Loading…" : `${filteredRefunds.length} request${filteredRefunds.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">Loading refund requests…</div>
          ) : filteredRefunds.length === 0 ? (
            <div className="empty-state">
              <p>No {currentStatusLabel.toLowerCase()} refund requests.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Order ID</th>
                  <th>Order Date</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map((order, index) => {
                  const reason = order.returnReason || order.customerNote || "—";
                  const isProcessing = processing === order.id;
                  return (
                    <tr key={order.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="order-id-link" onClick={() => navigate(`/orders/${order.id}`)}>
                          {order.orderNumber}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.shippingAddress?.fullName ?? "—"}</td>
                      <td>{order.shippingAddress?.phone ?? "—"}</td>
                      <td className="reason-cell">{reason}</td>
                      <td>{formatPrice(order.totalPaise)}</td>
                      <td>
                        <span className={`refund-status-pill refund-status-${filterKey}`}>
                          {currentStatusLabel}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {filterKey === "pending" && (
                            <>
                              <button
                                className="btn-action btn-approve"
                                disabled={isProcessing}
                                onClick={() => approveRefund(order)}
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                className="btn-action btn-reject"
                                disabled={isProcessing}
                                onClick={() => rejectRefund(order)}
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {filterKey === "approved" && (
                            <button
                              className="btn-action btn-refund"
                              disabled={isProcessing}
                              onClick={() => openRefundModal(order)}
                              title="Process refund"
                            >
                              Refund
                            </button>
                          )}
                          {filterKey === "refunded" && (
                            <span className="muted-text" style={{ fontSize: "12px" }}>
                              {order.refundedAt ? `Refunded ${formatDate(order.refundedAt)}` : "—"}
                            </span>
                          )}
                          {filterKey === "rejected" && (
                            <span className="muted-text" style={{ fontSize: "12px" }}>Closed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {refundTarget && (
        <div className="modal-overlay" onClick={closeRefundModal}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Process refund</h2>
              <button className="modal-close" onClick={closeRefundModal} disabled={processing === refundTarget.id}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Process refund for order <strong>{refundTarget.orderNumber}</strong>?
                Order total is {formatPrice(refundTarget.totalPaise)}.
              </p>
              <div className="form-group">
                <label htmlFor="refund-amount">Refund amount (₹)</label>
                <input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={refundAmountInr}
                  onChange={e => setRefundAmountInr(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-reset" onClick={closeRefundModal} disabled={processing === refundTarget.id}>
                Cancel
              </button>
              <button
                className="btn-submit btn-danger"
                onClick={confirmRefund}
                disabled={processing === refundTarget.id}
              >
                {processing === refundTarget.id ? "Processing…" : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
