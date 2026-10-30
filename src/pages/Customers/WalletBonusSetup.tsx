import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { walletApi } from "../../api/wallet";
import "../../styles/customers.css";

export default function WalletBonusSetup() {
  const toast = useToast();

  const [bonusAmount, setBonusAmount] = useState("0");
  const [minTopUpForBonus, setMinTopUpForBonus] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bonus = await walletApi.getBonus();
        if (cancelled) return;
        setBonusAmount(String(bonus.bonusAmount));
        setMinTopUpForBonus(String(bonus.minTopUpForBonus));
      }
      catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the bonus settings");
      }
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(bonusAmount);
    const minimum = Number(minTopUpForBonus);

    if (!Number.isInteger(amount) || amount < 0) {
      setError("The bonus must be a whole number of rupees (0 or more).");
      return;
    }
    if (!Number.isInteger(minimum) || minimum < 0) {
      setError("The minimum top-up must be a whole number of rupees (0 or more).");
      return;
    }
    if (amount > 0 && minimum === 0) {
      setError("Set the minimum top-up the bonus applies from.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await walletApi.saveBonus({ bonusAmount: amount, minTopUpForBonus: minimum });
      toast.success("Wallet bonus saved");
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the bonus");
    }
    finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setBonusAmount("0");
    setMinTopUpForBonus("0");
    setError("");
  }

  return (
    <div className="customers-container">
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Bonus Amount (₹)*</label>
              <input
                type="number"
                min="0"
                step="1"
                value={bonusAmount}
                disabled={loading}
                onChange={(e) => setBonusAmount(e.target.value)}
              />
              <span className="form-hint">Credited on top of a qualifying top-up. 0 disables the bonus.</span>
            </div>
            <div className="form-group">
              <label>Minimum Top-Up (₹)*</label>
              <input
                type="number"
                min="0"
                step="1"
                value={minTopUpForBonus}
                disabled={loading}
                onChange={(e) => setMinTopUpForBonus(e.target.value)}
              />
              <span className="form-hint">Top-ups from this amount earn the bonus.</span>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-filter-secondary" onClick={handleReset} disabled={saving}>
              Reset
            </button>
            <button type="submit" className="btn-filter" disabled={saving || loading}>
              {saving ? "Saving…" : "Save bonus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
