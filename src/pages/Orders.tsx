import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { formatPrice, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from "../utils/format";
import type { Order } from "../types";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await api.getOrders({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        orderChannel: channelFilter || undefined,
      });
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    }
    catch (error) {
      console.error("Failed to load orders:", error);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, channelFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadOrders();
  }

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadOrders();
    }
    catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status");
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Orders</h1>
      </header>
      <div className="page-content">
        {/* Filters */}
        <div className="search-filters">
          <form onSubmit={handleSearch} className="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by order number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={channelFilter}
            onChange={e => { setChannelFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Channels</option>
            <option value="online">Online</option>
            <option value="pos">POS</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="loading">Loading...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">No orders found</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/orders/${order.id}`} style={{ fontWeight: 500 }}>
                          {order.orderNumber}
                        </Link>
                        {order.orderChannel === "pos" && (
                          <span
                            className="badge"
                            style={{
                              marginLeft: "0.5rem",
                              background: "#fef3c7",
                              color: "#d97706",
                              fontSize: "0.625rem",
                              padding: "0.125rem 0.375rem",
                            }}
                          >
                            POS
                          </span>
                        )}
                      </td>
                      <td>
                        <div>
                          <div>{order.shippingAddress.fullName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {order.shippingAddress.phone}
                          </div>
                        </div>
                      </td>
                      <td>{order.items?.length || 0} items</td>
                      <td>{formatPrice(order.totalPaise)}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${getPaymentStatusColor(order.paymentStatus)}20`,
                            color: getPaymentStatusColor(order.paymentStatus),
                          }}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${getOrderStatusColor(order.status)}20`,
                            color: getOrderStatusColor(order.status),
                          }}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={e => handleStatusUpdate(order.id, e.target.value)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.8125rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  className={page === pageNum ? "active" : ""}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
