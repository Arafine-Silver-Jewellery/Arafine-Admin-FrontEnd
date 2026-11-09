import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import { formatPrice, formatDateTime } from "../utils/format";
import type { Order } from "../types";
import "../styles/order-detail.css";

// Main flow statuses in order
const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "#f59e0b", description: "Awaiting review" },
  { value: "confirmed", label: "Confirmed", color: "#8b5cf6", description: "Payment verified, stock reserved" },
  { value: "processing", label: "Processing", color: "#3b82f6", description: "Picking, packing, invoice" },
  { value: "shipped", label: "Shipped", color: "#06b6d4", description: "Handed to courier" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "#0891b2", description: "On the way" },
  { value: "delivered", label: "Delivered", color: "#22c55e", description: "Customer received" },
  { value: "return_requested", label: "Return Requested", color: "#f97316", description: "Customer requested return" },
  { value: "return_approved", label: "Return Approved", color: "#8b5cf6", description: "Return approved, awaiting pickup" },
  { value: "refund_initiated", label: "Refund Initiated", color: "#3b82f6", description: "Processing refund" },
  { value: "refunded", label: "Refunded", color: "#22c55e", description: "Refund completed" },
  { value: "returned", label: "Returned", color: "#6b7280", description: "Return completed/rejected" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444", description: "Order cancelled" },
];

const PAYMENT_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#f59e0b" },
  paid: { label: "Paid", color: "#22c55e" },
  failed: { label: "Failed", color: "#ef4444" },
  refunded: { label: "Refunded", color: "#6b7280" },
  partially_refunded: { label: "Partial Refund", color: "#f97316" },
};

// Get allowed next statuses based on current status
function getAllowedTransitions(currentStatus: string): string[] {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus as typeof STATUS_FLOW[number]);
  
  // Already cancelled or delivered - no transitions allowed
  if (currentStatus === "cancelled") return [];
  if (currentStatus === "delivered") return []; // Return/refund is a separate flow
  
  const allowed: string[] = [];
  
  // Can move to next status in flow (one step forward)
  if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
    allowed.push(STATUS_FLOW[currentIndex + 1]);
  }
  
  // Can cancel only from pending, confirmed, or processing (before shipped)
  if (["pending", "confirmed", "processing"].includes(currentStatus)) {
    allowed.push("cancelled");
  }
  
  return allowed;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({
    shippingProvider: "",
    trackingNumber: "",
    trackingUrl: "",
  });
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const data = await api.getOrder(id);
        setOrder(data);
        setTracking({
          shippingProvider: data.shippingProvider || "",
          trackingNumber: data.trackingNumber || "",
          trackingUrl: data.trackingUrl || "",
        });
        setAdminNote(data.adminNote || "");
      } catch (error) {
        console.error("Failed to load order:", error);
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  async function handleStatusUpdate(newStatus: string) {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      await api.updateOrderStatus(order.id, newStatus);
      // Refetch full order to get all relations (items, etc.)
      const updated = await api.getOrder(order.id);
      setOrder(updated);
      const statusLabel = ORDER_STATUSES.find(s => s.value === newStatus)?.label || newStatus;
      toast.success(`Order ${newStatus === "cancelled" ? "cancelled" : `moved to ${statusLabel}`}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleTrackingUpdate() {
    if (!order) return;
    setUpdatingTracking(true);
    try {
      await api.updateOrderTracking(order.id, tracking);
      // Refetch full order to get all relations
      const updated = await api.getOrder(order.id);
      setOrder(updated);
      toast.success("Tracking information updated");
    } catch (error) {
      console.error("Failed to update tracking:", error);
      toast.error("Failed to update tracking");
    } finally {
      setUpdatingTracking(false);
    }
  }

  async function handleAdminNoteSave() {
    if (!order) return;
    setSavingNote(true);
    try {
      await api.updateOrderAdminNote(order.id, adminNote.trim() || null);
      // Refetch full order to get all relations
      const updated = await api.getOrder(order.id);
      setOrder(updated);
      toast.success("Note saved");
    } catch (error) {
      console.error("Failed to save admin note:", error);
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleApproveReturn() {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      await api.updateOrderStatus(order.id, "return_approved");
      const updated = await api.getOrder(order.id);
      setOrder(updated);
      toast.success("Return request approved");
    } catch (error) {
      console.error("Failed to approve return:", error);
      toast.error("Failed to approve return");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleRejectReturn() {
    if (!order) return;
    if (!confirm("Are you sure you want to reject this return request?")) return;
    setUpdatingStatus(true);
    try {
      await api.updateOrderStatus(order.id, "returned");
      const updated = await api.getOrder(order.id);
      setOrder(updated);
      toast.success("Return request rejected");
    } catch (error) {
      console.error("Failed to reject return:", error);
      toast.error("Failed to reject return");
    } finally {
      setUpdatingStatus(false);
    }
  }

  function openRefundModal() {
    if (!order) return;
    // For cancelled orders, max refund is what was paid. For returns, max is order total.
    const maxRefund = order.status === "cancelled" 
      ? Number(order.paidAmount || 0)
      : Number(order.total);
    setRefundAmount(String(maxRefund));
    setShowRefundModal(true);
  }

  async function handleProcessRefund() {
    if (!order) return;
    const amountInr = Math.round(Number.parseFloat(refundAmount));
    const maxRefund = order.status === "cancelled" 
      ? Number(order.paidAmount || 0)
      : Number(order.total);
    
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    if (amountInr > maxRefund) {
      toast.error(`Refund amount cannot exceed ${formatPrice(maxRefund)}`);
      return;
    }
    setUpdatingStatus(true);
    try {
      // Send as integer (rupees)
      await api.processOrderRefund(order.id, amountInr);
      const updated = await api.getOrder(order.id);
      setOrder(updated);
      setShowRefundModal(false);
      toast.success(`Refunded ${formatPrice(amountInr)}`);
    } catch (error) {
      console.error("Failed to process refund:", error);
      toast.error("Failed to process refund");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="od-loading">
        <div className="od-loading__spinner" />
        <span>Loading order...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="od-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2>Order not found</h2>
        <p>The order you're looking for doesn't exist or has been removed.</p>
        <button className="od-btn od-btn--primary" onClick={() => navigate("/orders")}>
          Back to Orders
        </button>
      </div>
    );
  }

  const currentStatus = ORDER_STATUSES.find(s => s.value === order.status);
  const paymentStatus = PAYMENT_STATUSES[order.paymentStatus] || { label: order.paymentStatus, color: "#6b7280" };
  const paidAmount = Number(order.paidAmount || 0);
  const balanceDue = Number(order.total) - paidAmount;
  const allowedTransitions = getAllowedTransitions(order.status);
  const nextStatus = allowedTransitions.find(s => s !== "cancelled");
  const canCancel = allowedTransitions.includes("cancelled");
  
  // Return/Refund flow states
  const isReturnRequested = order.status === "return_requested";
  const isReturnApproved = order.status === "return_approved" || order.status === "refund_initiated";
  const isRefunded = order.status === "refunded";
  const isReturnRejected = order.status === "returned" && !order.refundedAt;
  const isInReturnFlow = isReturnRequested || isReturnApproved || isRefunded || isReturnRejected;

  return (
    <div className="od">
      {/* Header */}
      <header className="od-header">
        <div className="od-header__left">
          <button className="od-back" onClick={() => navigate("/orders")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="od-header__info">
            <h1 className="od-header__title">{order.orderNumber}</h1>
            <span className="od-header__date">{formatDateTime(order.createdAt)}</span>
          </div>
        </div>
        <div className="od-header__right">
          <span className="od-channel" data-channel={order.orderChannel}>
            {order.orderChannel === "pos" ? "POS" : "Online"}
          </span>
          <span className="od-status" style={{ "--status-color": currentStatus?.color } as React.CSSProperties}>
            <span className="od-status__dot" />
            {currentStatus?.label || order.status}
          </span>
        </div>
      </header>

      {/* Cancellation/Return Reason Alert */}
      {(order.cancellationReason || order.returnReason) && (
        <div className={`od-alert ${order.status === "cancelled" ? "od-alert--danger" : "od-alert--warning"}`}>
          <div className="od-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {order.status === "cancelled" ? (
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
          </div>
          <div className="od-alert__content">
            <span className="od-alert__title">
              {order.status === "cancelled" ? "Cancellation Reason" : "Return Requested"}
            </span>
            <p className="od-alert__message">
              {order.cancellationReason || order.returnReason}
            </p>
            {order.returnRequestedAt && order.status !== "cancelled" && (
              <span className="od-alert__time">Requested on {formatDateTime(order.returnRequestedAt)}</span>
            )}
            {order.cancelledAt && (
              <span className="od-alert__time">Cancelled on {formatDateTime(order.cancelledAt)}</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="od-content">
        {/* Left Column */}
        <div className="od-main">
          {/* Order Items */}
          <section className="od-card">
            <div className="od-card__header">
              <h2 className="od-card__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Items
              </h2>
              <span className="od-card__count">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="od-items">
              {order.items.map(item => (
                <div key={item.id} className="od-item">
                  <div className="od-item__image">
                    {item.productImageUrl ? (
                      <img src={item.productImageUrl} alt={item.productName} />
                    ) : (
                      <div className="od-item__placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="od-item__details">
                    <h3 className="od-item__name">{item.productName}</h3>
                    <span className="od-item__sku">SKU: {item.productSku}</span>
                  </div>
                  <div className="od-item__qty">
                    <span className="od-item__qty-label">Qty</span>
                    <span className="od-item__qty-value">{item.quantity}</span>
                  </div>
                  <div className="od-item__price">
                    <span className="od-item__unit">{formatPrice(item.unitPrice)} × {item.quantity}</span>
                    <span className="od-item__total">{formatPrice(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Customer & Shipping */}
          <section className="od-card">
            <div className="od-card__header">
              <h2 className="od-card__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Shipping Details
              </h2>
            </div>
            <div className="od-shipping">
              <div className="od-shipping__customer">
                <div className="od-shipping__avatar">
                  {order.shippingAddress.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="od-shipping__info">
                  <h3 className="od-shipping__name">{order.shippingAddress.fullName}</h3>
                  <a href={`tel:${order.shippingAddress.phone}`} className="od-shipping__phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {order.shippingAddress.phone}
                  </a>
                </div>
              </div>
              <div className="od-shipping__address">
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.landmark && (
                  <p className="od-shipping__landmark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {order.shippingAddress.landmark}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Tracking */}
          <section className="od-card">
            <div className="od-card__header">
              <h2 className="od-card__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1M16 8V6a2 2 0 00-2-2H6" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                Shipping & Tracking
              </h2>
            </div>
            <div className="od-tracking">
              <div className="od-tracking__grid">
                <div className="od-field">
                  <label className="od-field__label">Shipping Provider</label>
                  <input
                    type="text"
                    className="od-field__input"
                    value={tracking.shippingProvider}
                    onChange={e => setTracking(prev => ({ ...prev, shippingProvider: e.target.value }))}
                    placeholder="e.g., Delhivery, BlueDart"
                  />
                </div>
                <div className="od-field">
                  <label className="od-field__label">Tracking Number</label>
                  <input
                    type="text"
                    className="od-field__input"
                    value={tracking.trackingNumber}
                    onChange={e => setTracking(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    placeholder="Enter tracking number"
                  />
                </div>
              </div>
              <div className="od-field">
                <label className="od-field__label">Tracking URL</label>
                <input
                  type="url"
                  className="od-field__input"
                  value={tracking.trackingUrl}
                  onChange={e => setTracking(prev => ({ ...prev, trackingUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <button 
                className="od-btn od-btn--primary" 
                onClick={handleTrackingUpdate}
                disabled={updatingTracking}
              >
                {updatingTracking ? (
                  <>
                    <span className="od-btn__spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Save Tracking
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="od-sidebar">
          {/* Order Summary */}
          <section className="od-card od-summary">
            <div className="od-card__header">
              <h2 className="od-card__title">Order Summary</h2>
            </div>
            <div className="od-summary__rows">
              <div className="od-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="od-summary__row od-summary__row--discount">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              {Number(order.extraDiscount) > 0 && (
                <div className="od-summary__row od-summary__row--discount">
                  <span>Extra Discount</span>
                  <span>-{formatPrice(order.extraDiscount)}</span>
                </div>
              )}
              <div className="od-summary__row">
                <span>Shipping</span>
                <span>{Number(order.shipping) > 0 ? formatPrice(order.shipping) : "Free"}</span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="od-summary__row">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              <div className="od-summary__divider" />
              <div className="od-summary__row od-summary__row--total">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="od-summary__row od-summary__row--paid">
                <span>Paid</span>
                <span>{formatPrice(paidAmount)}</span>
              </div>
              {balanceDue > 0 && (
                <div className="od-summary__row od-summary__row--balance">
                  <span>Balance Due</span>
                  <span>{formatPrice(balanceDue)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Payment & Status */}
          <section className="od-card">
            <div className="od-card__header">
              <h2 className="od-card__title">Payment & Status</h2>
            </div>
            <div className="od-status-section">
              <div className="od-status-item">
                <span className="od-status-item__label">Payment Method</span>
                <span className="od-status-item__value">{order.paymentMethod?.toUpperCase() || "N/A"}</span>
              </div>
              <div className="od-status-item">
                <span className="od-status-item__label">Payment Status</span>
                <span className="od-badge" style={{ "--badge-color": paymentStatus.color } as React.CSSProperties}>
                  <span className="od-badge__dot" />
                  {paymentStatus.label}
                </span>
              </div>
              
              {/* Status Actions */}
              <div className="od-status-actions">
                <span className="od-status-item__label">Order Actions</span>
                
                {/* Return Request - Pending Approval */}
                {order.status === "return_requested" && (
                  <div className="od-status-buttons">
                    <button
                      className="od-btn od-btn--success od-btn--block"
                      onClick={handleApproveReturn}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <>
                          <span className="od-btn__spinner" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                          Approve Return
                        </>
                      )}
                    </button>
                    <button
                      className="od-btn od-btn--danger od-btn--block"
                      onClick={handleRejectReturn}
                      disabled={updatingStatus}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject Return
                    </button>
                  </div>
                )}
                
                {/* Return Approved - Ready to Refund */}
                {(order.status === "return_approved" || order.status === "refund_initiated") && (
                  <div className="od-status-buttons">
                    <button
                      className="od-btn od-btn--primary od-btn--block"
                      onClick={openRefundModal}
                      disabled={updatingStatus}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Process Refund
                    </button>
                  </div>
                )}
                
                {/* Refunded - Completed */}
                {order.status === "refunded" && (
                  <div className="od-status-final od-status-final--success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Refund completed{order.refundedAt ? ` on ${formatDateTime(order.refundedAt)}` : ""}</span>
                  </div>
                )}
                
                {/* Return Rejected/Closed */}
                {order.status === "returned" && (
                  <div className="od-status-final">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Return request closed</span>
                  </div>
                )}
                
                {/* Normal Order Flow - only show if NOT in return/refund flow */}
                {!["return_requested", "return_approved", "refund_initiated", "refunded", "returned"].includes(order.status) && (
                  <>
                    {allowedTransitions.length === 0 ? (
                      <>
                        {/* Cancelled Order */}
                        {order.status === "cancelled" && (
                          <>
                            {paidAmount > 0 && !order.refundAmount ? (
                              // Cancelled but paid - needs refund
                              <div className="od-status-buttons">
                                <button
                                  className="od-btn od-btn--primary od-btn--block"
                                  onClick={openRefundModal}
                                  disabled={updatingStatus}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                  Process Refund · {formatPrice(paidAmount)}
                                </button>
                              </div>
                            ) : order.refundAmount ? (
                              // Already refunded
                              <div className="od-status-final od-status-final--success">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Refunded {formatPrice(order.refundAmount)}</span>
                              </div>
                            ) : (
                              // COD / Unpaid - no refund needed
                              <div className="od-status-final">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Order cancelled · No refund needed</span>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Delivered Order */}
                        {order.status === "delivered" && (
                          <div className="od-status-final od-status-final--success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Order completed successfully</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="od-status-buttons">
                        {nextStatus && (
                          <button
                            className="od-btn od-btn--primary od-btn--block"
                            onClick={() => handleStatusUpdate(nextStatus)}
                            disabled={updatingStatus}
                          >
                            {updatingStatus ? (
                              <>
                                <span className="od-btn__spinner" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Move to {ORDER_STATUSES.find(s => s.value === nextStatus)?.label}
                              </>
                            )}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            className="od-btn od-btn--danger od-btn--block"
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
                                handleStatusUpdate("cancelled");
                              }
                            }}
                            disabled={updatingStatus}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="od-card">
            <div className="od-card__header">
              <h2 className="od-card__title">Timeline</h2>
            </div>
            <div className="od-timeline">
              {/* Show full status flow */}
              {STATUS_FLOW.map((status, index) => {
                const statusInfo = ORDER_STATUSES.find(s => s.value === status);
                const isCancelled = order.status === "cancelled";
                
                // Determine if this step was completed based on available timestamps
                let wasCompleted = false;
                if (status === "pending") wasCompleted = true; // Always completed if order exists
                if (status === "shipped" && order.shippedAt) wasCompleted = true;
                if (status === "delivered" && order.deliveredAt) wasCompleted = true;
                // For intermediate statuses without timestamps, check if a later status was reached
                if (["confirmed", "processing", "packaging"].includes(status)) {
                  if (order.shippedAt || order.deliveredAt) wasCompleted = true;
                }
                if (status === "out_for_delivery" && order.deliveredAt) wasCompleted = true;
                
                // For non-cancelled orders, use the normal index-based flow
                const currentIndex = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]);
                const isDone = isCancelled ? wasCompleted : currentIndex >= index;
                const isCurrent = !isCancelled && order.status === status;
                
                // Get timestamp for this status
                let timestamp: string | null = null;
                if (status === "pending") timestamp = order.createdAt;
                else if (status === "shipped" && order.shippedAt) timestamp = order.shippedAt;
                else if (status === "delivered" && order.deliveredAt) timestamp = order.deliveredAt;
                
                // For cancelled orders, don't show uncompleted steps
                if (isCancelled && !wasCompleted) return null;
                
                // Determine if cancelled status should show after this item
                const isLastCompletedBeforeCancel = isCancelled && wasCompleted && (
                  index === STATUS_FLOW.length - 1 || // Last status in flow
                  (() => {
                    // Check if next status was NOT completed
                    const nextStatus = STATUS_FLOW[index + 1];
                    if (!nextStatus) return true;
                    if (nextStatus === "confirmed" || nextStatus === "processing" || nextStatus === "packaging") {
                      return !order.shippedAt && !order.deliveredAt;
                    }
                    if (nextStatus === "shipped") return !order.shippedAt;
                    if (nextStatus === "out_for_delivery") return !order.deliveredAt && !order.shippedAt;
                    if (nextStatus === "delivered") return !order.deliveredAt;
                    return true;
                  })()
                );
                
                return (
                  <div key={status}>
                    <div 
                      className={`od-timeline__item ${isDone ? "od-timeline__item--done" : ""} ${isCurrent ? "od-timeline__item--current" : ""}`}
                    >
                      <div className="od-timeline__dot">
                        {isDone && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="od-timeline__content">
                        <span className="od-timeline__label">{statusInfo?.label}</span>
                        {timestamp && isDone && (
                          <span className="od-timeline__time">{formatDateTime(timestamp)}</span>
                        )}
                        {!isDone && !isCancelled && (
                          <span className="od-timeline__desc">{statusInfo?.description}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Show cancelled status right after the last completed step */}
                    {isLastCompletedBeforeCancel && (
                      <div className="od-timeline__item od-timeline__item--cancelled">
                        <div className="od-timeline__dot">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="od-timeline__content">
                          <span className="od-timeline__label">Cancelled</span>
                          <span className="od-timeline__time">{formatDateTime(order.cancelledAt || order.updatedAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Show refund if applicable */}
              {order.refundedAt && (
                <div className="od-timeline__item od-timeline__item--refund">
                  <div className="od-timeline__dot">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </div>
                  <div className="od-timeline__content">
                    <span className="od-timeline__label">Refunded</span>
                    <span className="od-timeline__time">{formatDateTime(order.refundedAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Admin Note */}
          <section className="od-card">
            <div className="od-card__header">
              <h2 className="od-card__title">Admin Note</h2>
              <span className="od-card__badge">Internal</span>
            </div>
            <div className="od-note">
              <textarea
                className="od-note__input"
                rows={3}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Add a private note about this order..."
              />
              <button
                className="od-btn od-btn--secondary od-btn--sm"
                onClick={handleAdminNoteSave}
                disabled={savingNote || adminNote === (order.adminNote || "")}
              >
                {savingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </section>
        </aside>
      </div>

      {/* Refund Modal */}
      {showRefundModal && order && (
        <div className="od-modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="od-modal" onClick={e => e.stopPropagation()}>
            <div className="od-modal__header">
              <h2 className="od-modal__title">Process Refund</h2>
              <button 
                type="button" 
                className="od-modal__close" 
                onClick={() => setShowRefundModal(false)}
                disabled={updatingStatus}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="od-modal__body">
              <p>
                Process refund for order <strong>{order.orderNumber}</strong>?
              </p>
              <p className="od-modal__info">
                Order total: <strong>{formatPrice(order.total)}</strong>
              </p>
              {order.returnReason && (
                <div className="od-modal__reason">
                  <span className="od-modal__reason-label">Return Reason:</span>
                  <p>{order.returnReason}</p>
                </div>
              )}
              <div className="od-field" style={{ marginTop: "1rem" }}>
                <label className="od-field__label">Refund Amount (₹)</label>
                <input
                  type="number"
                  className="od-field__input"
                  step="0.01"
                  min="0"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="od-modal__footer">
              <button
                type="button"
                className="od-btn od-btn--secondary"
                onClick={() => setShowRefundModal(false)}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                className="od-btn od-btn--primary"
                onClick={handleProcessRefund}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <span className="od-btn__spinner" />
                    Processing...
                  </>
                ) : (
                  "Confirm Refund"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
