import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatPrice, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from "../utils/format";
import type { Order } from "../types";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({
    shippingProvider: "",
    trackingNumber: "",
    trackingUrl: "",
  });

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
      }
      catch (error) {
        console.error("Failed to load order:", error);
      }
      finally {
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
    }
    catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  }

  async function handleTrackingUpdate() {
    if (!order) return;
    try {
      const updated = await api.updateOrderTracking(order.id, tracking);
      setOrder(updated);
      alert("Tracking updated successfully");
    }
    catch (error) {
      console.error("Failed to update tracking:", error);
      alert("Failed to update tracking");
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="page-content">
        <div className="empty-state">Order not found</div>
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1>Order {order.orderNumber}</h1>
        <button className="btn btn-secondary" onClick={() => navigate("/orders")}>
          Back to Orders
        </button>
      </header>
      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          {/* Left Column */}
          <div>
            {/* Order Items */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-header">
                <h2>Order Items</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {item.productImageUrl ? (
                              <img
                                src={item.productImageUrl}
                                alt={item.productName}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  background: "#f3f4f6",
                                  borderRadius: "4px",
                                }}
                              />
                            )}
                            <span>{item.productName}</span>
                          </div>
                        </td>
                        <td>{item.productSku}</td>
                        <td>{formatPrice(item.unitPricePaise)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.totalPricePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-header">
                <h2>Shipping Address</h2>
              </div>
              <div className="card-body">
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  <strong>{order.shippingAddress.fullName}</strong><br />
                  {order.shippingAddress.phone}<br />
                  {order.shippingAddress.addressLine1}<br />
                  {order.shippingAddress.addressLine2 && (
                    <>{order.shippingAddress.addressLine2}<br /></>
                  )}
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                  {order.shippingAddress.landmark && (
                    <><br />Landmark: {order.shippingAddress.landmark}</>
                  )}
                </p>
              </div>
            </div>

            {/* Tracking */}
            <div className="card">
              <div className="card-header">
                <h2>Shipping & Tracking</h2>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>Shipping Provider</label>
                  <input
                    type="text"
                    value={tracking.shippingProvider}
                    onChange={e => setTracking(prev => ({ ...prev, shippingProvider: e.target.value }))}
                    placeholder="e.g., Delhivery, BlueDart"
                  />
                </div>
                <div className="form-group">
                  <label>Tracking Number</label>
                  <input
                    type="text"
                    value={tracking.trackingNumber}
                    onChange={e => setTracking(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Tracking URL</label>
                  <input
                    type="url"
                    value={tracking.trackingUrl}
                    onChange={e => setTracking(prev => ({ ...prev, trackingUrl: e.target.value }))}
                  />
                </div>
                <button className="btn btn-primary" onClick={handleTrackingUpdate}>
                  Update Tracking
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Order Summary */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-header">
                <h2>Order Summary</h2>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotalPaise)}</span>
                </div>
                {order.discountPaise > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#22c55e" }}>
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountPaise)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Shipping</span>
                  <span>{order.shippingPaise > 0 ? formatPrice(order.shippingPaise) : "Free"}</span>
                </div>
                {order.taxPaise > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>Tax</span>
                    <span>{formatPrice(order.taxPaise)}</span>
                  </div>
                )}
                <hr style={{ margin: "1rem 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: "1.125rem" }}>
                  <span>Total</span>
                  <span>{formatPrice(order.totalPaise)}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-header">
                <h2>Status</h2>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
                    Order Status
                  </label>
                  <span
                    className="badge"
                    style={{
                      background: `${getOrderStatusColor(order.status)}20`,
                      color: getOrderStatusColor(order.status),
                    }}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
                    Payment Status
                  </label>
                  <span
                    className="badge"
                    style={{
                      background: `${getPaymentStatusColor(order.paymentStatus)}20`,
                      color: getPaymentStatusColor(order.paymentStatus),
                    }}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="form-group">
                  <label>Update Status</label>
                  <select
                    value={order.status}
                    onChange={e => handleStatusUpdate(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h2>Timeline</h2>
              </div>
              <div className="card-body">
                <div style={{ fontSize: "0.875rem" }}>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ color: "#6b7280" }}>Created</div>
                    <div>{formatDateTime(order.createdAt)}</div>
                  </div>
                  {order.shippedAt && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ color: "#6b7280" }}>Shipped</div>
                      <div>{formatDateTime(order.shippedAt)}</div>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ color: "#6b7280" }}>Delivered</div>
                      <div>{formatDateTime(order.deliveredAt)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
