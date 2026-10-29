import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate, formatPrice } from "../utils/format";
import type { Promotion } from "../types";

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    type: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
    scope: "all" | "category" | "product" | "cart";
    value: string;
    minCartValue: string;
    maxDiscount: string;
    startsAt: string;
    endsAt: string;
    maxUses: string;
    isActive: boolean;
  }>({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    scope: "all",
    value: "",
    minCartValue: "",
    maxDiscount: "",
    startsAt: "",
    endsAt: "",
    maxUses: "",
    isActive: true,
  });

  async function loadPromotions() {
    setLoading(true);
    try {
      const response = await api.getPromotions({ page: 1, limit: 100 });
      setPromotions(response.data || []);
    }
    catch (error) {
      console.error("Failed to load promotions:", error);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  function openModal(promotion?: Promotion) {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        code: promotion.code,
        name: promotion.name,
        description: promotion.description || "",
        type: promotion.type,
        scope: promotion.scope,
        value: promotion.value.toString(),
        minCartValue: promotion.minCartValueRupees
          ? promotion.minCartValueRupees.toString()
          : "",
        maxDiscount: promotion.maxDiscountRupees
          ? promotion.maxDiscountRupees.toString()
          : "",
        startsAt: promotion.startsAt.slice(0, 16),
        endsAt: promotion.endsAt.slice(0, 16),
        maxUses: promotion.maxUses?.toString() || "",
        isActive: promotion.isActive,
      });
    }
    else {
      setEditingPromotion(null);
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setFormData({
        code: "",
        name: "",
        description: "",
        type: "percentage",
        scope: "all",
        value: "",
        minCartValue: "",
        maxDiscount: "",
        startsAt: now.toISOString().slice(0, 16),
        endsAt: endDate.toISOString().slice(0, 16),
        maxUses: "",
        isActive: true,
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPromotion(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      scope: formData.scope,
      value: parseFloat(formData.value),
      minCartValueRupees: formData.minCartValue
        ? parseFloat(formData.minCartValue)
        : null,
      maxDiscountRupees: formData.maxDiscount
        ? parseFloat(formData.maxDiscount)
        : null,
      startsAt: formData.startsAt,
      endsAt: formData.endsAt,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      isActive: formData.isActive,
    };

    try {
      if (editingPromotion) {
        await api.updatePromotion(editingPromotion.id, data);
      }
      else {
        await api.createPromotion(data);
      }
      closeModal();
      loadPromotions();
    }
    catch (error) {
      console.error("Failed to save promotion:", error);
      alert("Failed to save promotion");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deletePromotion(id);
      loadPromotions();
    }
    catch (error) {
      console.error("Failed to delete promotion:", error);
      alert("Failed to delete promotion");
    }
  }

  async function handleToggle(id: string) {
    try {
      await api.togglePromotion(id);
      loadPromotions();
    }
    catch (error) {
      console.error("Failed to toggle promotion:", error);
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "percentage":
        return "Percentage";
      case "fixed_amount":
        return "Fixed Amount";
      case "buy_x_get_y":
        return "Buy X Get Y";
      case "free_shipping":
        return "Free Shipping";
      default:
        return type;
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Promotions</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Promotion
        </button>
      </header>
      <div className="page-content">
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Uses</th>
                  <th>Valid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="loading">Loading...</td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">No promotions found</td>
                  </tr>
                ) : (
                  promotions.map(promo => (
                    <tr key={promo.id}>
                      <td>
                        <code style={{ background: "#f3f4f6", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                          {promo.code}
                        </code>
                      </td>
                      <td>{promo.name}</td>
                      <td>{getTypeLabel(promo.type)}</td>
                      <td>
                        {promo.type === "percentage"
                          ? `${promo.value}%`
                          : promo.type === "fixed_amount"
                            ? formatPrice(promo.value)
                            : "-"}
                      </td>
                      <td>
                        {promo.currentUses}
                        {promo.maxUses && ` / ${promo.maxUses}`}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8125rem" }}>
                          {formatDate(promo.startsAt)} - {formatDate(promo.endsAt)}
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: promo.isActive ? "#dcfce7" : "#f3f4f6",
                            color: promo.isActive ? "#22c55e" : "#6b7280",
                            cursor: "pointer",
                          }}
                          onClick={() => handleToggle(promo.id)}
                        >
                          {promo.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openModal(promo)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(promo.id, promo.name)}
                          >
                            Delete
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPromotion ? "Edit Promotion" : "Add Promotion"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      style={{ textTransform: "uppercase" }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange} required>
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Value *</label>
                    <input
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleChange}
                      placeholder={formData.type === "percentage" ? "10" : "100"}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Min Cart Value (₹)</label>
                    <input
                      type="number"
                      name="minCartValue"
                      value={formData.minCartValue}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Discount (₹)</label>
                    <input
                      type="number"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Starts At *</label>
                    <input
                      type="datetime-local"
                      name="startsAt"
                      value={formData.startsAt}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ends At *</label>
                    <input
                      type="datetime-local"
                      name="endsAt"
                      value={formData.endsAt}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Max Uses (leave empty for unlimited)</label>
                  <input
                    type="number"
                    name="maxUses"
                    value={formData.maxUses}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPromotion ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
