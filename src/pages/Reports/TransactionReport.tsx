import { useState } from "react";
import "../../styles/reports.css";

type TransactionTab = "order" | "expense" | "refund";

interface OrderTransaction {
  sl: number;
  orderId: string;
  customerName: string;
  transactionDate: string;
  paymentMethod: string;
  amount: number;
  status: "completed" | "pending" | "failed";
}

interface ExpenseTransaction {
  sl: number;
  expenseId: string;
  category: string;
  description: string;
  date: string;
  amount: number;
}

interface RefundTransaction {
  sl: number;
  refundId: string;
  orderId: string;
  customerName: string;
  refundDate: string;
  reason: string;
  amount: number;
  status: "processed" | "pending" | "rejected";
}

const mockOrderTransactions: OrderTransaction[] = [
  { sl: 1, orderId: "ORD-2024-001", customerName: "Rahul Sharma", transactionDate: "2024-03-15", paymentMethod: "UPI", amount: 2450, status: "completed" },
  { sl: 2, orderId: "ORD-2024-002", customerName: "Priya Patel", transactionDate: "2024-03-15", paymentMethod: "Card", amount: 5680, status: "completed" },
  { sl: 3, orderId: "ORD-2024-003", customerName: "Amit Kumar", transactionDate: "2024-03-14", paymentMethod: "Cash", amount: 1290, status: "completed" },
  { sl: 4, orderId: "ORD-2024-004", customerName: "Sneha Gupta", transactionDate: "2024-03-14", paymentMethod: "UPI", amount: 3750, status: "pending" },
  { sl: 5, orderId: "ORD-2024-005", customerName: "Vikram Singh", transactionDate: "2024-03-13", paymentMethod: "Wallet", amount: 890, status: "completed" },
  { sl: 6, orderId: "ORD-2024-006", customerName: "Anita Reddy", transactionDate: "2024-03-13", paymentMethod: "Card", amount: 4200, status: "failed" },
  { sl: 7, orderId: "ORD-2024-007", customerName: "Rajesh Menon", transactionDate: "2024-03-12", paymentMethod: "UPI", amount: 1850, status: "completed" },
  { sl: 8, orderId: "ORD-2024-008", customerName: "Meera Nair", transactionDate: "2024-03-12", paymentMethod: "Cash", amount: 2980, status: "completed" },
];

const mockExpenseTransactions: ExpenseTransaction[] = [
  { sl: 1, expenseId: "EXP-001", category: "Delivery", description: "Delivery partner payments", date: "2024-03-15", amount: 15000 },
  { sl: 2, expenseId: "EXP-002", category: "Marketing", description: "Facebook Ads Campaign", date: "2024-03-14", amount: 25000 },
  { sl: 3, expenseId: "EXP-003", category: "Operations", description: "Warehouse rent", date: "2024-03-10", amount: 50000 },
  { sl: 4, expenseId: "EXP-004", category: "Technology", description: "Server hosting charges", date: "2024-03-08", amount: 8500 },
  { sl: 5, expenseId: "EXP-005", category: "Packaging", description: "Packaging materials", date: "2024-03-05", amount: 12000 },
];

const mockRefundTransactions: RefundTransaction[] = [
  { sl: 1, refundId: "REF-001", orderId: "ORD-2024-006", customerName: "Anita Reddy", refundDate: "2024-03-14", reason: "Product damaged", amount: 4200, status: "processed" },
  { sl: 2, refundId: "REF-002", orderId: "ORD-2024-010", customerName: "Kiran Shah", refundDate: "2024-03-13", reason: "Wrong item delivered", amount: 1560, status: "processed" },
  { sl: 3, refundId: "REF-003", orderId: "ORD-2024-015", customerName: "Pooja Verma", refundDate: "2024-03-12", reason: "Order cancelled", amount: 890, status: "pending" },
  { sl: 4, refundId: "REF-004", orderId: "ORD-2024-018", customerName: "Suresh Iyer", refundDate: "2024-03-10", reason: "Quality issue", amount: 2300, status: "rejected" },
];

export default function TransactionReport() {
  const [activeTab, setActiveTab] = useState<TransactionTab>("order");
  const [dateFilter, setDateFilter] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");

  const totalOrderAmount = mockOrderTransactions.reduce((sum, t) => sum + t.amount, 0);
  const completedOrders = mockOrderTransactions.filter(t => t.status === "completed").length;
  const totalExpense = mockExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRefund = mockRefundTransactions.reduce((sum, t) => sum + t.amount, 0);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
      case "processed":
        return "active";
      case "pending":
        return "pending";
      case "failed":
      case "rejected":
        return "inactive";
      default:
        return "";
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>
          <span className="header-icon">💳</span>
          Transaction Report
        </h1>
      </div>

      <div className="report-tabs">
        <button
          className={activeTab === "order" ? "active" : ""}
          onClick={() => setActiveTab("order")}
        >
          Order Transactions
        </button>
        <button
          className={activeTab === "expense" ? "active" : ""}
          onClick={() => setActiveTab("expense")}
        >
          Expense Transactions
        </button>
        <button
          className={activeTab === "refund" ? "active" : ""}
          onClick={() => setActiveTab("refund")}
        >
          Refund Transactions
        </button>
      </div>

      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Date Range</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          {activeTab === "order" && (
            <div className="filter-group">
              <label>Payment Method</label>
              <select>
                <option>All Methods</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Cash</option>
                <option>Wallet</option>
              </select>
            </div>
          )}
          {activeTab === "expense" && (
            <div className="filter-group">
              <label>Category</label>
              <select>
                <option>All Categories</option>
                <option>Delivery</option>
                <option>Marketing</option>
                <option>Operations</option>
                <option>Technology</option>
                <option>Packaging</option>
              </select>
            </div>
          )}
          {activeTab === "refund" && (
            <div className="filter-group">
              <label>Status</label>
              <select>
                <option>All Status</option>
                <option>Processed</option>
                <option>Pending</option>
                <option>Rejected</option>
              </select>
            </div>
          )}
          <button className="btn-filter-primary">Filter</button>
          <button className="btn-filter-secondary">Clear</button>
        </div>
      </div>

      {activeTab === "order" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">💰</div>
              <div className="stat-content">
                <h2>₹{totalOrderAmount.toLocaleString()}</h2>
                <p>Total Transaction Amount</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📦</div>
              <div className="stat-content">
                <h2>{mockOrderTransactions.length}</h2>
                <p>Total Transactions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teal">✅</div>
              <div className="stat-content">
                <h2>{completedOrders}</h2>
                <p>Completed</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">⏳</div>
              <div className="stat-content">
                <h2>{mockOrderTransactions.filter(t => t.status === "pending").length}</h2>
                <p>Pending</p>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Order Transactions <span className="count">{mockOrderTransactions.length}</span>
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="btn-export">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Transaction Date</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrderTransactions.map((txn) => (
                    <tr key={txn.sl}>
                      <td>{txn.sl}</td>
                      <td style={{ fontWeight: 500, color: "#0d6efd" }}>{txn.orderId}</td>
                      <td>{txn.customerName}</td>
                      <td>{txn.transactionDate}</td>
                      <td>
                        <div className="transaction-type">
                          <span className="type-icon income">
                            {txn.paymentMethod === "UPI" && "📱"}
                            {txn.paymentMethod === "Card" && "💳"}
                            {txn.paymentMethod === "Cash" && "💵"}
                            {txn.paymentMethod === "Wallet" && "👛"}
                          </span>
                          {txn.paymentMethod}
                        </div>
                      </td>
                      <td className="amount-positive">₹{txn.amount.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(txn.status)}`}>
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action btn-view" title="View Details">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled>&lt;</button>
              <button className="active">1</button>
              <button>2</button>
              <button>&gt;</button>
            </div>
          </div>
        </>
      )}

      {activeTab === "expense" && (
        <>
          <div className="stats-grid">
            <div className="stat-card wide">
              <div className="stat-icon red">💸</div>
              <div className="stat-content">
                <h2>₹{totalExpense.toLocaleString()}</h2>
                <p>Total Expenses</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📋</div>
              <div className="stat-content">
                <h2>{mockExpenseTransactions.length}</h2>
                <p>Total Entries</p>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Expense Transactions <span className="count">{mockExpenseTransactions.length}</span>
              </h3>
              <button className="btn-export">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Expense ID</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExpenseTransactions.map((txn) => (
                    <tr key={txn.sl}>
                      <td>{txn.sl}</td>
                      <td style={{ fontWeight: 500, color: "#0d6efd" }}>{txn.expenseId}</td>
                      <td>
                        <div className="transaction-type">
                          <span className="type-icon expense">📁</span>
                          {txn.category}
                        </div>
                      </td>
                      <td>{txn.description}</td>
                      <td>{txn.date}</td>
                      <td className="amount-negative">-₹{txn.amount.toLocaleString()}</td>
                      <td>
                        <button className="btn-action btn-view" title="View Details">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled>&lt;</button>
              <button className="active">1</button>
              <button>&gt;</button>
            </div>
          </div>
        </>
      )}

      {activeTab === "refund" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orange">🔄</div>
              <div className="stat-content">
                <h2>₹{totalRefund.toLocaleString()}</h2>
                <p>Total Refund Amount</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📋</div>
              <div className="stat-content">
                <h2>{mockRefundTransactions.length}</h2>
                <p>Total Refund Requests</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div className="stat-content">
                <h2>{mockRefundTransactions.filter(t => t.status === "processed").length}</h2>
                <p>Processed</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">⏳</div>
              <div className="stat-content">
                <h2>{mockRefundTransactions.filter(t => t.status === "pending").length}</h2>
                <p>Pending</p>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>
                Refund Transactions <span className="count">{mockRefundTransactions.length}</span>
              </h3>
              <button className="btn-export">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Refund ID</th>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Refund Date</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRefundTransactions.map((txn) => (
                    <tr key={txn.sl}>
                      <td>{txn.sl}</td>
                      <td style={{ fontWeight: 500, color: "#0d6efd" }}>{txn.refundId}</td>
                      <td>{txn.orderId}</td>
                      <td>{txn.customerName}</td>
                      <td>{txn.refundDate}</td>
                      <td>{txn.reason}</td>
                      <td className="amount-negative">-₹{txn.amount.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(txn.status)}`}>
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action btn-view" title="View Details">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled>&lt;</button>
              <button className="active">1</button>
              <button>&gt;</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
