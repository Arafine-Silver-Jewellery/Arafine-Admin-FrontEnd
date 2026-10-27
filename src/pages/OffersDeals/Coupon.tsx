import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { Coupon, CouponScope, CouponStats, CouponType, CreateCouponInput } from "../../types";
import { formatDate, formatPrice } from "../../utils/format";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

const PAGE_SIZE = 20;

const COUPON_TYPES: { value: CouponType; label: string }[] = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed_amount", label: "Fixed Amount" },
  { value: "buy_x_get_y", label: "Buy X Get Y" },
  { value: "free_shipping", label: "Free Shipping" },
];

const COUPON_SCOPES: { value: CouponScope; label: string }[] = [
  { value: "all", label: "All Products" },
  { value: "category", label: "Specific Categories" },
  { value: "product", label: "Specific Products" },
  { value: "cart", label: "Cart Total" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// SVG Icons
const icons = {
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  view: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23,4 23,10 17,10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  tag: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  percent: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  users: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

type FormMode = "create" | "edit" | "view";

interface FormData {
  code: string;
  name: string;
  description: string;
  type: CouponType;
  scope: CouponScope;
  value: string;
  minCartValuePaise: string;
  maxDiscountPaise: string;
  maxUses: string;
  maxUsesPerUser: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: "",
  name: "",
  description: "",
  type: "percentage",
  scope: "all",
  value: "",
  minCartValuePaise: "",
  maxDiscountPaise: "",
  maxUses: "",
  maxUsesPerUser: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export default function CouponPage() {
  // Data state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load coupons
  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getCoupons({
        page,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        type: typeFilter || undefined,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
      });
      setCoupons(response.data || []);
      setStats(response.stats);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Generate random code
  const handleGenerateCode = async () => {
    try {
      const response = await api.generateCouponCode(10);
      setFormData((prev) => ({ ...prev, code: response.code }));
    } catch (err) {
      console.error("Failed to generate code:", err);
    }
  };

  // Open form for create
  const handleAddNew = async () => {
    // Set default dates: start = now, end = 30 days from now
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    
    // Generate a code
    let generatedCode = "";
    try {
      const response = await api.generateCouponCode(10);
      generatedCode = response.code;
    } catch (err) {
      // Fallback to client-side generation
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (let i = 0; i < 10; i++) {
        generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    setFormData({
      ...initialFormData,
      code: generatedCode,
      startsAt: now.toISOString().slice(0, 16),
      endsAt: endDate.toISOString().slice(0, 16),
    });
    setFormMode("create");
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  // Open form for edit
  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      type: coupon.type,
      scope: coupon.scope,
      value: coupon.value.toString(),
      minCartValuePaise: coupon.minCartValuePaise ? (coupon.minCartValuePaise / 100).toString() : "",
      maxDiscountPaise: coupon.maxDiscountPaise ? (coupon.maxDiscountPaise / 100).toString() : "",
      maxUses: coupon.maxUses?.toString() || "",
      maxUsesPerUser: coupon.maxUsesPerUser?.toString() || "",
      startsAt: coupon.startsAt.slice(0, 16),
      endsAt: coupon.endsAt.slice(0, 16),
      isActive: coupon.isActive,
    });
    setFormMode("edit");
    setEditingId(coupon.id);
    setFormError(null);
    setShowForm(true);
  };

  // Open form for view
  const handleView = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      type: coupon.type,
      scope: coupon.scope,
      value: coupon.value.toString(),
      minCartValuePaise: coupon.minCartValuePaise ? (coupon.minCartValuePaise / 100).toString() : "",
      maxDiscountPaise: coupon.maxDiscountPaise ? (coupon.maxDiscountPaise / 100).toString() : "",
      maxUses: coupon.maxUses?.toString() || "",
      maxUsesPerUser: coupon.maxUsesPerUser?.toString() || "",
      startsAt: coupon.startsAt.slice(0, 16),
      endsAt: coupon.endsAt.slice(0, 16),
      isActive: coupon.isActive,
    });
    setFormMode("view");
    setEditingId(coupon.id);
    setFormError(null);
    setShowForm(true);
  };

  // Submit form
  const handleSubmit = async () => {
    setFormError(null);

    // Validate required fields
    if (!formData.code.trim()) {
      setFormError("Coupon code is required");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Coupon name is required");
      return;
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      setFormError("Discount value must be greater than 0");
      return;
    }
    if (!formData.startsAt) {
      setFormError("Start date is required");
      return;
    }
    if (!formData.endsAt) {
      setFormError("End date is required");
      return;
    }

    const startsAtDate = new Date(formData.startsAt);
    const endsAtDate = new Date(formData.endsAt);

    if (endsAtDate <= startsAtDate) {
      setFormError("End date must be after start date");
      return;
    }

    setSubmitting(true);

    try {
      const input: CreateCouponInput = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        scope: formData.scope,
        value: parseFloat(formData.value),
        minCartValuePaise: formData.minCartValuePaise ? Math.round(parseFloat(formData.minCartValuePaise) * 100) : null,
        maxDiscountPaise: formData.maxDiscountPaise ? Math.round(parseFloat(formData.maxDiscountPaise) * 100) : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        maxUsesPerUser: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : null,
        startsAt: startsAtDate.toISOString(),
        endsAt: endsAtDate.toISOString(),
        isActive: formData.isActive,
      };

      if (formMode === "edit" && editingId) {
        await api.updateCoupon(editingId, input);
      } else {
        await api.createCoupon(input);
      }

      setShowForm(false);
      setFormData(initialFormData);
      loadCoupons();
    } catch (err: any) {
      setFormError(err.message || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleCouponStatus(id);
      loadCoupons();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  // Delete coupon
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteCoupon(deleteId);
      setDeleteId(null);
      loadCoupons();
    } catch (err) {
      console.error("Failed to delete coupon:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("");
    setPage(1);
  };

  // Format coupon value for display
  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
      return `${coupon.value}%`;
    }
    if (coupon.type === "fixed_amount") {
      return formatPrice(coupon.value * 100);
    }
    if (coupon.type === "free_shipping") {
      return "Free Shipping";
    }
    return coupon.value.toString();
  };

  // Get coupon status
  const getCouponStatus = (coupon: Coupon): { label: string; variant: string } => {
    const now = new Date();
    const startsAt = new Date(coupon.startsAt);
    const endsAt = new Date(coupon.endsAt);

    if (!coupon.isActive) {
      return { label: "Inactive", variant: "neutral" };
    }
    if (now < startsAt) {
      return { label: "Scheduled", variant: "info" };
    }
    if (now > endsAt) {
      return { label: "Expired", variant: "danger" };
    }
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { label: "Exhausted", variant: "warning" };
    }
    return { label: "Active", variant: "success" };
  };

  // Table columns
  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: Coupon, index: number) => (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "coupon",
      header: "Coupon",
      render: (coupon: Coupon) => (
        <div>
          <span style={{ fontWeight: 600, display: "block", color: "#0d6efd" }}>{coupon.code}</span>
          <span className="ak-text-muted ak-text-sm">{coupon.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (coupon: Coupon) => (
        <span className="ak-status ak-status--info">
          <span className="ak-status__dot" />
          {COUPON_TYPES.find((t) => t.value === coupon.type)?.label || coupon.type}
        </span>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (coupon: Coupon) => (
        <span style={{ fontWeight: 600 }}>{formatCouponValue(coupon)}</span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (coupon: Coupon) => (
        <div className="ak-text-sm">
          <div>{formatDate(coupon.startsAt)}</div>
          <div className="ak-text-muted">to {formatDate(coupon.endsAt)}</div>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (coupon: Coupon) => (
        <span>
          {coupon.currentUses} / {coupon.maxUses ?? "∞"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (coupon: Coupon) => {
        const status = getCouponStatus(coupon);
        return (
          <span className={`ak-status ak-status--${status.variant}`}>
            <span className="ak-status__dot" />
            {status.label}
          </span>
        );
      },
    },
    {
      key: "toggle",
      header: "Active",
      width: "80px",
      render: (coupon: Coupon) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={coupon.isActive}
            onChange={() => handleToggleStatus(coupon.id)}
          />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "120px",
      render: (coupon: Coupon) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--view"
            title="View"
            onClick={() => handleView(coupon)}
          >
            {icons.view}
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={() => handleEdit(coupon)}
          >
            {icons.edit}
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={() => setDeleteId(coupon.id)}
          >
            {icons.delete}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="reports-container">
      {/* Stats Grid */}
      {stats && (
        <div className="product-report-stats-grid">
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon blue">{icons.tag}</div>
            <div className="product-report-stat-content">
              <h2>{stats.totalCoupons}</h2>
              <p>Total Coupons</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon green">{icons.check}</div>
            <div className="product-report-stat-content">
              <h2>{stats.activeCoupons}</h2>
              <p>Active Coupons</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon orange">{icons.clock}</div>
            <div className="product-report-stat-content">
              <h2>{stats.expiredCoupons}</h2>
              <p>Expired Coupons</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon teal">{icons.users}</div>
            <div className="product-report-stat-content">
              <h2>{stats.totalUsage.toLocaleString()}</h2>
              <p>Total Usage</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336", marginBottom: 16 }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="ak-card" style={{ marginBottom: 24 }}>
          <div className="ak-card__header">
            <h3 className="ak-card__title">
              {formMode === "create" ? "Add New Coupon" : formMode === "edit" ? "Edit Coupon" : "View Coupon"}
            </h3>
            <button type="button" className="ak-icon-btn" onClick={() => setShowForm(false)}>
              {icons.close}
            </button>
          </div>
          <div className="ak-card__body">
            {formError && (
              <div style={{ padding: "12px 16px", background: "#ffebee", color: "#c62828", borderRadius: 8, marginBottom: 16 }}>
                {formError}
              </div>
            )}
            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Coupon Code *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    className="ak-input"
                    placeholder="e.g., SUMMER2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    disabled={formMode === "view"}
                    style={{ flex: 1 }}
                  />
                  {formMode !== "view" && (
                    <button type="button" className="ak-btn ak-btn--ghost" onClick={handleGenerateCode}>
                      {icons.refresh}
                    </button>
                  )}
                </div>
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Coupon Name *</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="e.g., Summer Sale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={formMode === "view"}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Coupon Type *</label>
                <select
                  className="ak-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
                  disabled={formMode === "view"}
                >
                  {COUPON_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Scope *</label>
                <select
                  className="ak-select"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value as CouponScope })}
                  disabled={formMode === "view"}
                >
                  {COUPON_SCOPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="ak-form-group">
                <label className="ak-label">
                  {formData.type === "percentage" ? "Discount (%)" : "Discount Amount (₹)"} *
                </label>
                <input
                  type="number"
                  className="ak-input"
                  placeholder={formData.type === "percentage" ? "e.g., 10" : "e.g., 100"}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  disabled={formMode === "view"}
                  min="0"
                  max={formData.type === "percentage" ? "100" : undefined}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Min. Cart Value (₹)</label>
                <input
                  type="number"
                  className="ak-input"
                  placeholder="e.g., 500"
                  value={formData.minCartValuePaise}
                  onChange={(e) => setFormData({ ...formData, minCartValuePaise: e.target.value })}
                  disabled={formMode === "view"}
                  min="0"
                />
              </div>
            </div>

            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Max. Discount (₹)</label>
                <input
                  type="number"
                  className="ak-input"
                  placeholder="e.g., 200"
                  value={formData.maxDiscountPaise}
                  onChange={(e) => setFormData({ ...formData, maxDiscountPaise: e.target.value })}
                  disabled={formMode === "view"}
                  min="0"
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Total Usage Limit</label>
                <input
                  type="number"
                  className="ak-input"
                  placeholder="Unlimited"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  disabled={formMode === "view"}
                  min="1"
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Per User Limit</label>
                <input
                  type="number"
                  className="ak-input"
                  placeholder="Unlimited"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                  disabled={formMode === "view"}
                  min="1"
                />
              </div>
            </div>

            <div className="ak-form-grid ak-form-grid--3">
              <div className="ak-form-group">
                <label className="ak-label">Start Date *</label>
                <input
                  type="datetime-local"
                  className="ak-input"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  disabled={formMode === "view"}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">End Date *</label>
                <input
                  type="datetime-local"
                  className="ak-input"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  disabled={formMode === "view"}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Status</label>
                <label className="ak-toggle" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={formMode === "view"}
                  />
                  <span className="ak-toggle__slider" />
                  <span style={{ marginLeft: 12 }}>{formData.isActive ? "Active" : "Inactive"}</span>
                </label>
              </div>
            </div>

            <div className="ak-form-group">
              <label className="ak-label">Description</label>
              <textarea
                className="ak-input"
                rows={3}
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={formMode === "view"}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
          {formMode !== "view" && (
            <div className="ak-card__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="ak-btn ak-btn--primary"
                onClick={handleSubmit}
                disabled={submitting || !formData.code || !formData.name || !formData.value || !formData.startsAt || !formData.endsAt}
              >
                {submitting ? "Saving..." : formMode === "edit" ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table Card */}
      <div className="table-card">
        <div className="table-header">
          <h3>
            Coupons <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select
              className="table-filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="table-filter-select"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              {COUPON_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="search-box">
              {icons.search}
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <button className="btn-export" onClick={handleAddNew}>
              {icons.plus}
              Add Coupon
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={coupons}
          loading={loading}
          loadingText="Loading coupons…"
          emptyIcon="cart"
          emptyTitle="No coupons found"
          emptyDescription="Create your first coupon to offer discounts to customers."
          keyExtractor={(coupon) => coupon.id}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="ak-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="ak-modal ak-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h3>Delete Coupon</h3>
              <button type="button" className="ak-icon-btn" onClick={() => setDeleteId(null)}>
                {icons.close}
              </button>
            </div>
            <div className="ak-modal__body">
              <p>Are you sure you want to delete this coupon? This action cannot be undone.</p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="ak-btn ak-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
