import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import { formatPrice, formatDateTime } from "../utils/format";
import type { Order } from "../types";
import "../styles/order-detail.css";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "confirmed", label: "Confirmed", color: "#8b5cf6" },
  { value: "processing", label: "Processing", color: "#3b82f6" },
  { value: "shipped", label: "Shipped", color: "#06b6d4" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "#0891b2" },
  { value: "delivered", label: "Delivered", color: "#22c55e" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444" },
];

const PAYMENT_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#f59e0b" },
  paid: { label: "Paid", color: "#22c55e" },
  failed: { label: "Failed", color: "#ef4444" },
  refunded: { label: "Refunded", color: "#6b7280" },
  partially_refunded: { label: "Partial Refund", color: "#f97316" },
};

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
    try {
      const updated = await api.updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  }

  async function handleTrackingUpdate() {
    if (!order) return;
    setUpdatingTracking(true);
    try {
      const updated = await api.updateOrderTracking(order.id, tracking);
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
      const updated = await api.updateOrderAdminNote(order.id, adminNote.trim() || null);
      setOrder(updated);
      toast.success("Note saved");
    } catch (error) {
      console.error("Failed to save admin note:", error);
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
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
              <div className="od-status-item">
                <span className="od-status-item__label">Update Order Status</span>
                <select
                  className="od-select"
                  value={order.status}
                  onChange={e => handleStatusUpdate(e.target.value)}
                >
                  {ORDER_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="od-card">
            <div className="od-card__header">
              <h2 className="od-card__title">Timeline</h2>
            </div>
            <div className="od-timeline">
              <div className="od-timeline__item od-timeline__item--done">
                <div className="od-timeline__dot" />
                <div className="od-timeline__content">
                  <span className="od-timeline__label">Order Created</span>
                  <span className="od-timeline__time">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              {order.shippedAt && (
                <div className="od-timeline__item od-timeline__item--done">
                  <div className="od-timeline__dot" />
                  <div className="od-timeline__content">
                    <span className="od-timeline__label">Shipped</span>
                    <span className="od-timeline__time">{formatDateTime(order.shippedAt)}</span>
                  </div>
                </div>
              )}
              {order.deliveredAt && (
                <div className="od-timeline__item od-timeline__item--done">
                  <div className="od-timeline__dot" />
                  <div className="od-timeline__content">
                    <span className="od-timeline__label">Delivered</span>
                    <span className="od-timeline__time">{formatDateTime(order.deliveredAt)}</span>
                  </div>
                </div>
              )}
              {order.refundedAt && (
                <div className="od-timeline__item">
                  <div className="od-timeline__dot" />
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
    </div>
  );
}
