import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { walletApi } from "../../api/wallet";
import { DataTable } from "../../components";
import { formatPrice } from "../../utils/format";
import "../../styles/customers.css";

interface WalletRow {
  id: string;
  userId: string;
  userName: string;
  userMobileNumber: string;
  balance: number;
}

export default function Wallet() {
  const toast = useToast();

  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [adjustTarget, setAdjustTarget] = useState<WalletRow | null>(null);
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await walletApi.getWallets({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
      });
      setWallets(res.data ?? []);
      setTotalItems(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    }
    catch (err) {
      setWallets([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load wallets");
    }
    finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  function openAdjust(wallet: WalletRow) {
    setAdjustTarget(wallet);
    setDirection("credit");
    setAmount("");
    setNote("");
    setFormError("");
  }

  async function submitAdjustment() {
    if (!adjustTarget) return;
    const value = Number(amount);
    if (!value || value < 1) {
      setFormError("Enter an amount of at least ₹1.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await walletApi.adjustWallet(adjustTarget.userId, value, direction, note.trim() || null);
      toast.success("Wallet updated");
      setAdjustTarget(null);
      await loadWallets();
    }
    catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update the wallet");
    }
    finally {
      setSaving(false);
    }
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (wallet: WalletRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{wallet.userName}</div>
          <div className="ak-text-muted ak-text-sm">{wallet.userMobileNumber}</div>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      width: "160px",
      align: "right" as const,
      render: (wallet: WalletRow) => formatPrice(wallet.balance),
    },
    {
      key: "actions",
      header: "Action",
      width: "140px",
      render: (wallet: WalletRow) => (
        <button
          type="button"
          className="btn-filter-secondary"
          onClick={() => openAdjust(wallet)}
        >
          Adjust balance
        </button>
      ),
    },
  ];

  return (
    <div className="customers-container">
      <div className="filter-card">
        <h3>Filter Options</h3>
        <div className="filter-grid wallet-filter">
          <div className="filter-group">
            <input
              type="search"
              value={search}
              placeholder="Search by name or mobile..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="filter-actions" style={{ justifyContent: "flex-end" }}>
          <button className="btn-filter-secondary" onClick={() => setSearch("")}>Clear</button>
        </div>
      </div>

      <div className="summary-section">
        <h3>Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon balance">📊</div>
            <span className="summary-label">Wallets</span>
            <span className="summary-value balance">{totalItems}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon credit">💰</div>
            <span className="summary-label">Balance on this page</span>
            <span className="summary-value credit">{formatPrice(totalBalance)}</span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="table-card">
          <div className="empty-state">
            <p>{loadError}</p>
            <button type="button" className="btn-filter-secondary" onClick={loadWallets}>Retry</button>
          </div>
        </div>
      )}

      {!loadError && (
        <div className="table-card">
          <div className="table-header">
            <h3>
              Customer Wallets <span className="count">{totalItems}</span>
            </h3>
          </div>
          <DataTable
            columns={columns}
            data={wallets}
            loading={loading}
            loadingText="Loading wallets…"
            emptyIcon="users"
            emptyTitle="No wallets yet"
            emptyDescription="A wallet is created the first time a customer uses it."
            keyExtractor={(wallet: WalletRow) => wallet.id}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={20}
            onPageChange={setPage}
          />
        </div>
      )}

      {adjustTarget && (
        <div className="ak-modal-overlay" onClick={() => !saving && setAdjustTarget(null)}>
          <div className="ak-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Adjust wallet</h2>
              <button type="button" className="ak-modal__close" onClick={() => setAdjustTarget(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p className="ak-text-muted ak-text-sm" style={{ marginBottom: 12 }}>
                {adjustTarget.userName} · current balance {formatPrice(adjustTarget.balance)}
              </p>

              <div className="ak-form-group">
                <label className="ak-label">Direction</label>
                <select
                  className="ak-select"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "credit" | "debit")}
                >
                  <option value="credit">Credit (add money)</option>
                  <option value="debit">Debit (take money)</option>
                </select>
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="ak-input"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Note</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Why is the balance changing?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {formError && <div className="ak-alert ak-alert--danger" style={{ marginTop: 12 }}>{formError}</div>}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setAdjustTarget(null)} disabled={saving}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={submitAdjustment} disabled={saving}>
                {saving ? "Saving…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
