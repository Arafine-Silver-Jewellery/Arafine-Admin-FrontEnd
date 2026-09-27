import { useState } from "react";
import "../../styles/customers.css";

interface Transaction {
  sl: number;
  transactionId: string;
  customer: string;
  credit: number;
  debit: number;
  balance: number;
  transactionType: string;
  reference: string;
  createdAt: string;
}

const mockTransactions: Transaction[] = [];

export default function LoyaltyPoints() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactionType, setTransactionType] = useState("All");
  const [customer, setCustomer] = useState("All Customer");

  const totalDebit = 0;
  const totalCredit = 0;
  const totalBalance = 0;

  return (
    <div className="customers-container">
      <div className="filter-card">
        <h3>Filter Options</h3>
        <div className="filter-grid wallet-filter">
          <div className="filter-group">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="dd-mm-yyyy"
            />
          </div>
          <div className="filter-group">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="dd-mm-yyyy"
            />
          </div>
          <div className="filter-group">
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              <option>All</option>
              <option>Earned</option>
              <option>Converted</option>
            </select>
          </div>
          <div className="filter-group">
            <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
              <option>All Customer</option>
              <option>Janaki Bharath</option>
              <option>Vedam bharathsuman</option>
              <option>Shekhar</option>
            </select>
          </div>
        </div>
        <div className="filter-actions" style={{ justifyContent: "flex-end" }}>
          <button className="btn-filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="summary-section">
        <h3>Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon debit">📤</div>
            <span className="summary-label">Debit</span>
            <span className="summary-value debit">{totalDebit}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon credit">💰</div>
            <span className="summary-label">Credit</span>
            <span className="summary-value credit">{totalCredit}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon balance">📊</div>
            <span className="summary-label">Balance</span>
            <span className="summary-value balance">{totalBalance}</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Transactions <span className="count">{mockTransactions.length}</span>
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
          <table className="customers-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Balance</th>
                <th>Transaction Type</th>
                <th>Reference</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-icon">📁</div>
                      <p>No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                mockTransactions.map((txn) => (
                  <tr key={txn.sl}>
                    <td>{txn.sl}</td>
                    <td>{txn.transactionId}</td>
                    <td>{txn.customer}</td>
                    <td className="credit-text">{txn.credit}</td>
                    <td className="debit-text">{txn.debit}</td>
                    <td>{txn.balance}</td>
                    <td>{txn.transactionType}</td>
                    <td>{txn.reference}</td>
                    <td>{txn.createdAt}</td>
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
