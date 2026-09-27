import { useState } from "react";
import "../styles/orders-new.css";

type RefundStatus = "pending" | "approved" | "refunded" | "rejected";

interface RefundRequest {
  id: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  reason: string;
  amount: number;
  status: RefundStatus;
  requestDate: string;
}

const mockRefunds: RefundRequest[] = [
  { id: "1", orderId: "100084", orderDate: "29 Aug 2026", customerName: "Karthik Srirangam", customerPhone: "+918978447548", reason: "Product damaged", amount: 3193.00, status: "pending", requestDate: "30 Aug 2026" },
  { id: "2", orderId: "100075", orderDate: "25 Aug 2026", customerName: "Priya Sharma", customerPhone: "+919876543210", reason: "Wrong item received", amount: 2499.00, status: "approved", requestDate: "26 Aug 2026" },
  { id: "3", orderId: "100068", orderDate: "20 Aug 2026", customerName: "Rahul Kumar", customerPhone: "+919123456789", reason: "Size doesn't fit", amount: 1850.00, status: "refunded", requestDate: "21 Aug 2026" },
  { id: "4", orderId: "100055", orderDate: "15 Aug 2026", customerName: "Sneha Reddy", customerPhone: "+918899776655", reason: "Changed mind", amount: 4500.00, status: "rejected", requestDate: "16 Aug 2026" },
];

interface RefundRequestsProps {
  statusFilter?: RefundStatus;
}

export default function RefundRequests({ statusFilter = "pending" }: RefundRequestsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRefunds = mockRefunds.filter(refund => {
    const matchesStatus = refund.status === statusFilter;
    const matchesSearch = refund.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  function getStatusLabel(status: RefundStatus): string {
    const labels: Record<RefundStatus, string> = {
      pending: "Pending",
      approved: "Approved",
      refunded: "Refunded",
      rejected: "Rejected",
    };
    return labels[status];
  }

  function getStatusColor(status: RefundStatus): string {
    const colors: Record<RefundStatus, string> = {
      pending: "#f59e0b",
      approved: "#22c55e",
      refunded: "#3b82f6",
      rejected: "#ef4444",
    };
    return colors[status];
  }

  return (
    <div className="orders-new-container">
      <div className="orders-list-section">
        <div className="orders-list-header">
          <div className="orders-actions">
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
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">No refund requests found</td>
                </tr>
              ) : (
                filteredRefunds.map((refund, index) => (
                  <tr key={refund.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="order-id">{refund.orderId}</span>
                    </td>
                    <td>{refund.orderDate}</td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{refund.customerName}</span>
                        <span className="customer-phone">{refund.customerPhone}</span>
                      </div>
                    </td>
                    <td>{refund.reason}</td>
                    <td>
                      <span className="amount">₹{refund.amount.toLocaleString()}</span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ color: getStatusColor(refund.status) }}
                      >
                        {getStatusLabel(refund.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-icon-view" title="View">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
