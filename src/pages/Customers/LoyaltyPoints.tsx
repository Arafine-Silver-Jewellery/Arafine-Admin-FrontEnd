import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { loyaltyApi } from "../../api/loyalty";
import { DataTable } from "../../components";
import { formatPrice } from "../../utils/format";
import "../../styles/customers.css";
import "../../styles/ui-kit.css";

interface LoyaltyCustomerRow {
  userId: string;
  userName: string;
  userMobileNumber: string;
  balance: number;
  earned: number;
  redeemed: number;
  tier: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "#a16207",
  silver: "#6b7280",
  gold: "#d4af37",
  platinum: "#4b5563",
};

export default function LoyaltyPoints() {
  const toast = useToast();

  const [pointsPerRupee, setPointsPerRupee] = useState("0.1");
  const [redeemRupeesPerPoint, setRedeemRupeesPerPoint] = useState("1");
  const [expiryMonths, setExpiryMonths] = useState("12");
  const [minRedeemPoints, setMinRedeemPoints] = useState("100");
  const [savingRules, setSavingRules] = useState(false);
  const [rulesError, setRulesError] = useState("");

  const [customers, setCustomers] = useState<LoyaltyCustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rules = await loyaltyApi.getRules();
        if (cancelled) return;
        setPointsPerRupee(String(rules.pointsPerRupee));
        setRedeemRupeesPerPoint(String(rules.redeemRupeesPerPoint));
        setExpiryMonths(String(rules.expiryMonths));
        setMinRedeemPoints(String(rules.minRedeemPoints));
      }
      catch (err) {
        if (!cancelled) setRulesError(err instanceof Error ? err.message : "Could not load the rules");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loyaltyApi.getCustomers({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
      });
      setCustomers(res.data ?? []);
      setTotalItems(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    }
    catch (err) {
      setCustomers([]);
      toast.error(err instanceof Error ? err.message : "Could not load the points list");
    }
    finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  async function saveRules() {
    setSavingRules(true);
    setRulesError("");
    try {
      await loyaltyApi.saveRules({
        pointsPerRupee: Number(pointsPerRupee) || 0,
        redeemRupeesPerPoint: Number(redeemRupeesPerPoint) || 0,
        expiryMonths: Number(expiryMonths) || 0,
        minRedeemPoints: Number(minRedeemPoints) || 0,
      });
      toast.success("Points rules saved");
    }
    catch (err) {
      setRulesError(err instanceof Error ? err.message : "Could not save the rules");
    }
    finally {
      setSavingRules(false);
    }
  }

  const totalPoints = customers.reduce((sum, row) => sum + row.balance, 0);

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (row: LoyaltyCustomerRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.userName}</div>
          <div className="ak-text-muted ak-text-sm">{row.userMobileNumber}</div>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      width: "120px",
      render: (row: LoyaltyCustomerRow) => (
        <span className="ak-badge" style={{ background: `${TIER_COLORS[row.tier] ?? "#6b7280"}22`, color: TIER_COLORS[row.tier] ?? "#6b7280" }}>
          {row.tier}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      width: "120px",
      align: "right" as const,
      render: (row: LoyaltyCustomerRow) => row.balance.toLocaleString(),
    },
    {
      key: "earned",
      header: "Earned",
      width: "120px",
      align: "right" as const,
      render: (row: LoyaltyCustomerRow) => row.earned.toLocaleString(),
    },
    {
      key: "redeemed",
      header: "Redeemed",
      width: "120px",
      align: "right" as const,
      render: (row: LoyaltyCustomerRow) => row.redeemed.toLocaleString(),
    },
  ];

  return (
    <div className="customers-container">
      <div className="form-card">
        <h3 style={{ marginTop: 0 }}>Points configuration</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Points per rupee *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pointsPerRupee}
              onChange={(e) => setPointsPerRupee(e.target.value)}
            />
            <span className="form-hint">0.1 means ₹10 spent earns 1 point.</span>
          </div>
          <div className="form-group">
            <label>Rupees per point *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={redeemRupeesPerPoint}
              onChange={(e) => setRedeemRupeesPerPoint(e.target.value)}
            />
            <span className="form-hint">What one point is worth when redeemed.</span>
          </div>
          <div className="form-group">
            <label>Expiry (months) *</label>
            <input
              type="number"
              step="1"
              min="0"
              value={expiryMonths}
              onChange={(e) => setExpiryMonths(e.target.value)}
            />
            <span className="form-hint">Earned points expire after this many months.</span>
          </div>
          <div className="form-group">
            <label>Minimum redemption *</label>
            <input
              type="number"
              step="1"
              min="0"
              value={minRedeemPoints}
              onChange={(e) => setMinRedeemPoints(e.target.value)}
            />
            <span className="form-hint">Smallest number of points a customer may redeem.</span>
          </div>
        </div>

        {rulesError && <p className="form-error">{rulesError}</p>}

        <div className="form-actions">
          <button type="button" className="btn-filter" onClick={saveRules} disabled={savingRules}>
            {savingRules ? "Saving…" : "Save rules"}
          </button>
        </div>
      </div>

      <div className="summary-section">
        <h3>Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon balance">📊</div>
            <span className="summary-label">Customers with points</span>
            <span className="summary-value balance">{totalItems}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon credit">⭐</div>
            <span className="summary-label">Points on this page</span>
            <span className="summary-value credit">{totalPoints.toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <div className="summary-icon debit">💎</div>
            <span className="summary-label">Worth (this page)</span>
            <span className="summary-value debit">{formatPrice(totalPoints)}</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Customer Points <span className="count">{totalItems}</span>
          </h3>
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          loadingText="Loading points…"
          emptyIcon="users"
          emptyTitle="No points yet"
          emptyDescription="Customers appear here once they earn points on an order."
          keyExtractor={(row: LoyaltyCustomerRow) => row.userId}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
