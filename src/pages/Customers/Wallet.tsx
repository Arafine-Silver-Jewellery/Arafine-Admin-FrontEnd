import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import type { WalletTransaction, WalletWithUser } from "../../types";
import "../../styles/customers.css";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TRANSACTION_TYPES = [
  { value: "", label: "All Types" },
  { value: "credit", label: "Credit" },
  { value: "debit", label: "Debit" },
  { value: "refund", label: "Refund" },
  { value: "bonus", label: "Bonus" },
  { value: "adjustment", label: "Adjustment" },
];

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Summary {
  totalCredit: number;
  totalDebit: number;
}

export default function Wallet() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [wallets, setWallets] = useState<WalletWithUser[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<Summary>({ totalCredit: 0, totalDebit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [walletsLoading, setWalletsLoading] = useState(true);

  // Fetch wallets for dropdown
  const fetchWallets = useCallback(async () => {
    try {
      setWalletsLoading(true);
      const response = await api.getWallets({ limit: 100 });
      setWallets(response.data);
    } catch (err) {
      console.error("Error fetching wallets:", err);
    } finally {
      setWalletsLoading(false);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getWalletTransactions({
        page,
        limit: 20,
        type: transactionType || undefined,
        userId: selectedUserId || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setTransactions(response.data);
      setPagination(response.pagination || null);
      setSummary(response.summary || { totalCredit: 0, totalDebit: 0 });
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, transactionType, selectedUserId, startDate, endDate]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilter = () => {
    setPage(1);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setTransactionType("");
    setSelectedUserId("");
    setPage(1);
  };

  return (
    <div className="customers-container">
      <div className="filter-card">
        <h3>Filter Options</h3>
        <div className="filter-grid wallet-filter">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Transaction Type</label>
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Customer</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={walletsLoading}
            >
              <option value="">All Customers</option>
              {wallets.map((w) => (
                <option key={w.userId} value={w.userId}>
                  {w.user.firstName} {w.user.lastName} ({formatPrice(w.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-actions" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
          <button className="btn-reset" onClick={handleReset}>Reset</button>
          <button className="btn-filter" onClick={handleFilter}>Filter</button>
        </div>
      </div>

      <div className="summary-section">
        <h3>Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon debit">📤</div>
            <span className="summary-label">Total Debit</span>
            <span className="summary-value debit">{formatPrice(summary.totalDebit)}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon credit">💰</div>
            <span className="summary-label">Total Credit</span>
            <span className="summary-value credit">{formatPrice(summary.totalCredit)}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon balance">📊</div>
            <span className="summary-label">Net Balance</span>
            <span className="summary-value balance">{formatPrice(summary.totalCredit - summary.totalDebit)}</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Transactions <span className="count">{pagination?.total || 0}</span>
          </h3>
        </div>

        <div className="table-container">
          {isLoading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Credit</th>
                  <th>Debit</th>
                  <th>Balance After</th>
                  <th>Description</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-icon">📁</div>
                        <p>No transactions found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const isCredit = ["credit", "refund", "bonus"].includes(txn.type);
                    return (
                      <tr key={txn.id}>
                        <td>
                          <code style={{ fontSize: "0.75rem" }}>{txn.transactionId}</code>
                        </td>
                        <td>
                          {txn.wallet?.user ? (
                            <span>{txn.wallet.user.firstName} {txn.wallet.user.lastName}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge--${txn.type}`}>
                            {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                          </span>
                        </td>
                        <td className="credit-text">
                          {isCredit ? formatPrice(txn.amount) : "—"}
                        </td>
                        <td className="debit-text">
                          {!isCredit ? formatPrice(txn.amount) : "—"}
                        </td>
                        <td>{formatPrice(txn.balanceAfter)}</td>
                        <td>
                          <span className="text-ellipsis" title={txn.description || ""}>
                            {txn.description || "—"}
                          </span>
                        </td>
                        <td>{formatDateTime(txn.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>Page {page} of {pagination.totalPages}</span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
