import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/orders-new.css";

type OrderStatus = "all" | "pending" | "confirmed" | "packaging" | "out_for_delivery" | "delivered" | "returned" | "failed_to_deliver" | "canceled";

interface Order {
  id: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  store: string;
  totalAmount: number;
  paymentStatus: "paid" | "unpaid";
  orderStatus: OrderStatus;
  source: "POS" | "Online";
}

const mockOrders: Order[] = [
  { id: "1", orderId: "100087", orderDate: "11 Sep 2026, 07:37 PM", customerName: "Harshitha", customerPhone: "+919381028172", store: "Arafine Silver Jewellery", totalAmount: 7000.57, paymentStatus: "paid", orderStatus: "delivered", source: "POS" },
  { id: "2", orderId: "100086", orderDate: "01 Sep 2026, 10:11 PM", customerName: "Janaki Bharath", customerPhone: "+919885864333", store: "Arafine Silver Jewellery", totalAmount: 3621.47, paymentStatus: "paid", orderStatus: "delivered", source: "POS" },
  { id: "3", orderId: "100085", orderDate: "01 Sep 2026, 10:11 PM", customerName: "Walk-In-Customer", customerPhone: "", store: "Arafine Silver Jewellery", totalAmount: 3621.47, paymentStatus: "paid", orderStatus: "delivered", source: "POS" },
  { id: "4", orderId: "100084", orderDate: "29 Aug 2026, 10:03 PM", customerName: "Karthik Srirangam", customerPhone: "+918978447548", store: "Arafine Silver Jewellery", totalAmount: 3193.00, paymentStatus: "unpaid", orderStatus: "canceled", source: "Online" },
  { id: "5", orderId: "100083", orderDate: "29 Aug 2026, 08:38 PM", customerName: "Janaki Bharath", customerPhone: "+919885864333", store: "Arafine Silver Jewellery", totalAmount: 10.00, paymentStatus: "paid", orderStatus: "canceled", source: "Online" },
  { id: "6", orderId: "100082", orderDate: "28 Aug 2026, 03:15 PM", customerName: "Priya Sharma", customerPhone: "+919876543210", store: "Arafine Silver Jewellery", totalAmount: 5499.00, paymentStatus: "paid", orderStatus: "confirmed", source: "Online" },
  { id: "7", orderId: "100081", orderDate: "28 Aug 2026, 11:22 AM", customerName: "Rahul Kumar", customerPhone: "+919123456789", store: "Arafine Silver Jewellery", totalAmount: 2150.00, paymentStatus: "paid", orderStatus: "confirmed", source: "POS" },
  { id: "8", orderId: "100080", orderDate: "27 Aug 2026, 06:45 PM", customerName: "Sneha Reddy", customerPhone: "+918899776655", store: "Arafine Silver Jewellery", totalAmount: 8750.00, paymentStatus: "paid", orderStatus: "out_for_delivery", source: "Online" },
  { id: "9", orderId: "100079", orderDate: "27 Aug 2026, 02:30 PM", customerName: "Amit Patel", customerPhone: "+917788996655", store: "Arafine Silver Jewellery", totalAmount: 1299.00, paymentStatus: "unpaid", orderStatus: "pending", source: "Online" },
  { id: "10", orderId: "100078", orderDate: "26 Aug 2026, 09:15 AM", customerName: "Deepa Nair", customerPhone: "+916677889900", store: "Arafine Silver Jewellery", totalAmount: 4500.00, paymentStatus: "paid", orderStatus: "packaging", source: "Online" },
];

const statusCounts = {
  all: mockOrders.length,
  pending: mockOrders.filter(o => o.orderStatus === "pending").length,
  confirmed: mockOrders.filter(o => o.orderStatus === "confirmed").length,
  packaging: mockOrders.filter(o => o.orderStatus === "packaging").length,
  out_for_delivery: mockOrders.filter(o => o.orderStatus === "out_for_delivery").length,
  delivered: mockOrders.filter(o => o.orderStatus === "delivered").length,
  returned: mockOrders.filter(o => o.orderStatus === "returned").length,
  failed_to_deliver: mockOrders.filter(o => o.orderStatus === "failed_to_deliver").length,
  canceled: mockOrders.filter(o => o.orderStatus === "canceled").length,
};

const SummaryIcon = ({ type, color }: { type: string; color: string }) => {
  const icons: Record<string, React.ReactNode> = {
    pending: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    confirmed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    packaging: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    out_for_delivery: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    delivered: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    canceled: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    returned: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    ),
    failed_to_deliver: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  };
  return icons[type] || null;
};

const summaryItems = [
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "confirmed", label: "Confirmed", color: "#22c55e" },
  { key: "packaging", label: "Packaging", color: "#8b5cf6" },
  { key: "out_for_delivery", label: "Out for Delivery", color: "#3b82f6" },
  { key: "delivered", label: "Delivered", color: "#10b981" },
  { key: "canceled", label: "Canceled", color: "#ef4444" },
  { key: "returned", label: "Returned", color: "#6b7280" },
  { key: "failed_to_deliver", label: "Failed to Deliver", color: "#dc2626" },
];

interface OrdersNewProps {
  statusFilter?: OrderStatus;
}

export default function OrdersNew({ statusFilter = "all" }: OrdersNewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStatus] = useState<OrderStatus>(statusFilter);

  const filteredOrders = mockOrders.filter(order => {
    const matchesStatus = currentStatus === "all" || order.orderStatus === currentStatus;
    const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  function getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      all: "All",
      pending: "Pending",
      confirmed: "Confirmed",
      packaging: "Packaging",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      returned: "Returned",
      failed_to_deliver: "Failed to Deliver",
      canceled: "Canceled",
    };
    return labels[status];
  }

  function getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      all: "#6b7280",
      pending: "#f59e0b",
      confirmed: "#22c55e",
      packaging: "#8b5cf6",
      out_for_delivery: "#3b82f6",
      delivered: "#10b981",
      returned: "#6b7280",
      failed_to_deliver: "#dc2626",
      canceled: "#ef4444",
    };
    return colors[status];
  }

  return (
    <div className="orders-new-container">
      {currentStatus === "all" && (
        <div className="order-summary">
          <h2>Current Order Summary</h2>
          <div className="summary-grid">
            {summaryItems.map(item => (
              <div key={item.key} className="summary-card">
                <span className="summary-icon">
                  <SummaryIcon type={item.key} color={item.color} />
                </span>
                <span className="summary-label">{item.label}</span>
                <span className="summary-count" style={{ color: item.color }}>
                  {statusCounts[item.key as keyof typeof statusCounts]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="orders-list-section">
        <div className="orders-list-header">
          <h2>Order list <span>{filteredOrders.length}</span></h2>
          <div className="orders-actions" style={{ width: 'auto' }}>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Order ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <button className="btn-export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button className="btn-filter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Customer Info</th>
                <th>Store</th>
                <th>Total Amount</th>
                <th>Order Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="order-id">{order.orderId}</span>
                    {order.source === "POS" && <span className="order-source">({order.source})</span>}
                  </td>
                  <td>{order.orderDate}</td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{order.customerName}</span>
                      {order.customerPhone && <span className="customer-phone">{order.customerPhone}</span>}
                    </div>
                  </td>
                  <td className="store-name">{order.store}</td>
                  <td>
                    <div className="amount-info">
                      <span className="amount">₹{order.totalAmount.toLocaleString()}</span>
                      <span className={`payment-status ${order.paymentStatus}`}>
                        {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ color: getStatusColor(order.orderStatus) }}
                    >
                      {getStatusLabel(order.orderStatus)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-action btn-icon-view" 
                        title="View"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action btn-icon-download" 
                        title="Download"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#22c55e" strokeWidth="2"/>
                          <polyline points="7 10 12 15 17 10" stroke="#22c55e" strokeWidth="2"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="#22c55e" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
