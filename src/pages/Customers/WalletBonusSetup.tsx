import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import type { WalletBonus, WalletBonusType, CreateWalletBonusInput } from "../../types";
import "../../styles/customers.css";

const initialFormState = {
  title: "",
  description: "",
  bonusType: "percentage" as WalletBonusType,
  bonusValue: "",
  minAddAmount: "",
  maxBonus: "",
  startsAt: "",
  endsAt: "",
};

export default function WalletBonusSetup() {
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bonuses, setBonuses] = useState<WalletBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBonuses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getWalletBonuses({ limit: 100 });
      setBonuses(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load wallet bonuses");
      console.error("Error fetching bonuses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Bonus title is required");
      return;
    }
    if (!form.startsAt || !form.endsAt) {
      setError("Start and end dates are required");
      return;
    }
    if (!form.minAddAmount || Number(form.minAddAmount) <= 0) {
      setError("Minimum add amount must be greater than 0");
      return;
    }
    if (!form.bonusValue || Number(form.bonusValue) <= 0) {
      setError("Bonus amount must be greater than 0");
      return;
    }

    const payload: CreateWalletBonusInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      bonusType: form.bonusType,
      bonusValue: Number(form.bonusValue),
      minAddAmount: Number(form.minAddAmount),
      maxBonus: form.maxBonus ? Number(form.maxBonus) : null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };

    try {
      setSubmitting(true);
      setError(null);

      if (editingId) {
        await api.updateWalletBonus(editingId, payload);
      } else {
        await api.createWalletBonus(payload);
      }

      handleReset();
      fetchBonuses();
    } catch (err) {
      setError(editingId ? "Failed to update bonus" : "Failed to create bonus");
      console.error("Error saving bonus:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (bonus: WalletBonus) => {
    setForm({
      title: bonus.title,
      description: bonus.description || "",
      bonusType: bonus.bonusType,
      bonusValue: bonus.bonusValue.toString(),
      minAddAmount: bonus.minAddAmount.toString(),
      maxBonus: bonus.maxBonus?.toString() || "",
      startsAt: bonus.startsAt.split("T")[0],
      endsAt: bonus.endsAt.split("T")[0],
    });
    setEditingId(bonus.id);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bonus?")) return;

    try {
      await api.deleteWalletBonus(id);
      fetchBonuses();
    } catch (err) {
      setError("Failed to delete bonus");
      console.error("Error deleting bonus:", err);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.toggleWalletBonus(id);
      fetchBonuses();
    } catch (err) {
      setError("Failed to update bonus status");
      console.error("Error toggling bonus:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatBonusInfo = (bonus: WalletBonus) => {
    const bonusText =
      bonus.bonusType === "percentage"
        ? `${bonus.bonusValue}% bonus`
        : `₹${bonus.bonusValue} bonus`;
    const minText = `on min ₹${bonus.minAddAmount}`;
    const maxText = bonus.maxBonus ? ` (max ₹${bonus.maxBonus})` : "";
    return `${bonusText} ${minText}${maxText}`;
  };

  const filteredBonuses = bonuses.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="customers-container">
      <div className="form-card">
        <h3 className="form-title">
          {editingId ? "Edit Wallet Bonus" : "Add Wallet Bonus"}
        </h3>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Bonus Title*</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Enter bonus title"
              />
            </div>
            <div className="form-group">
              <label>Short Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Enter short description"
              />
            </div>
            <div className="form-group">
              <label>Bonus Type</label>
              <select
                name="bonusType"
                value={form.bonusType}
                onChange={handleInputChange}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Bonus Amount{" "}
                {form.bonusType === "percentage" ? "(%)" : "(₹)"}*
              </label>
              <input
                type="number"
                name="bonusValue"
                value={form.bonusValue}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step={form.bonusType === "percentage" ? "0.1" : "1"}
              />
            </div>
            <div className="form-group">
              <label>Minimum Add Amount (₹)*</label>
              <input
                type="number"
                name="minAddAmount"
                value={form.minAddAmount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Maximum Bonus (₹)</label>
              <input
                type="number"
                name="maxBonus"
                value={form.maxBonus}
                onChange={handleInputChange}
                placeholder="0 (no limit)"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Start Date*</label>
              <input
                type="date"
                name="startsAt"
                value={form.startsAt}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>End Date*</label>
              <input
                type="date"
                name="endsAt"
                value={form.endsAt}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
              disabled={submitting}
            >
              {editingId ? "Cancel" : "Reset"}
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingId
                  ? "Update"
                  : "Submit"}
            </button>
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            Wallet Bonus Table{" "}
            <span className="count">{filteredBonuses.length}</span>
          </h3>
          <div className="search-box">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by bonus title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Bonus Title</th>
                <th>Bonus Info</th>
                <th>Bonus Amount</th>
                <th>Started On</th>
                <th>Expires On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <p>Loading bonuses...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBonuses.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-icon">📁</div>
                      <p>No bonus data found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBonuses.map((bonus, idx) => (
                  <tr key={bonus.id}>
                    <td>{idx + 1}</td>
                    <td>{bonus.title}</td>
                    <td>{formatBonusInfo(bonus)}</td>
                    <td>
                      {bonus.bonusType === "percentage"
                        ? `${bonus.bonusValue}%`
                        : `₹${bonus.bonusValue.toFixed(2)}`}
                    </td>
                    <td>{formatDate(bonus.startsAt)}</td>
                    <td>{formatDate(bonus.endsAt)}</td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={bonus.isActive}
                          onChange={() => toggleStatus(bonus.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          title="Edit"
                          onClick={() => handleEdit(bonus)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          title="Delete"
                          onClick={() => handleDelete(bonus.id)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
