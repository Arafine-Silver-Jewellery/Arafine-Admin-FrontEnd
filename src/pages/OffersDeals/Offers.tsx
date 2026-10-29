import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { offersApi } from "../../api/offers";
import { api } from "../../api/client";
import type { Offer, OfferType, OfferDiscountType, OfferScope, OfferStats, OfferStatus } from "../../types";
import { DataTable, StatusDropdown } from "../../components";
import "../styles/ui-kit.css";

const offerTypeOptions = [
  { value: "", label: "All Types", color: "neutral" as const },
  { value: "bogo", label: "BOGO", color: "info" as const },
  { value: "bundle", label: "Bundle", color: "brand" as const },
  { value: "clearance", label: "Clearance", color: "warning" as const },
];

const statusFilterOptions = [
  { value: "", label: "All Statuses", color: "neutral" as const },
  { value: "live", label: "Live", color: "success" as const },
  { value: "scheduled", label: "Scheduled", color: "info" as const },
  { value: "expired", label: "Expired", color: "neutral" as const },
  { value: "inactive", label: "Inactive", color: "warning" as const },
];

const offerTypeLabels: Record<OfferType, string> = {
  bogo: "BOGO",
  bundle: "Bundle",
  clearance: "Clearance",
};

const statusBadge: Record<OfferStatus, string> = {
  live: "success",
  scheduled: "info",
  expired: "neutral",
  inactive: "warning",
};

interface CategoryOption { id: string; name: string; }
interface ProductOption { id: string; name: string; }

interface FormState {
  name: string;
  description: string;
  offerType: OfferType | "bogo";
  discountType: OfferDiscountType;
  discountValue: string;
  buyQuantity: string;
  getQuantity: string;
  scope: OfferScope;
  categoryIds: string[];
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  offerType: "bogo",
  discountType: "percentage",
  discountValue: "",
  buyQuantity: "1",
  getQuantity: "1",
  scope: "all",
  categoryIds: [],
  productIds: [],
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function formatDateTime(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function discountLabel(offer: Offer): string {
  const unit = offer.discountType === "percentage" ? "%" : "₹";
  if (offer.offerType === "clearance") {
    return `${offer.discountValue}${unit} off`;
  }
  const scope = offer.scope === "all" ? "entire order" : `${offer.productIds.length + offer.categoryIds.length} target(s)`;
  return `${offer.discountValue}${unit} off ${scope}`;
}

export default function Offers() {
  const toast = useToast();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    loadOffers();
  }, [debouncedSearch, filterType, filterStatus, currentPage]);

  // Categories once, for the targeting selector
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.getAllCategories();
        if (cancelled || !Array.isArray(list)) return;
        setCategories(list
          .map((c: any) => ({ id: String(c.id), name: String(c.name) }))
          .filter((c: CategoryOption) => c.id && c.name));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load up to 100 products the first time product targeting is used; the box
  // filters client-side, so no per-keystroke search endpoint is needed.
  useEffect(() => {
    if (!showModal || form.scope !== "product" || products.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getProducts({ limit: 100 });
        if (cancelled) return;
        const list = res?.data ?? [];
        setProducts(list
          .map((p: any) => ({ id: String(p.id), name: String(p.name) }))
          .filter((p: ProductOption) => p.id && p.name));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, [showModal, form.scope, products.length]);

  async function loadOffers() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await offersApi.getOffers({
        search: debouncedSearch || undefined,
        offerType: filterType || undefined,
        status: filterStatus || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      const list = response?.data ?? [];
      setOffers(Array.isArray(list) ? list : []);
      setStats(response?.stats ?? null);
      setTotalItems(response?.pagination?.total || 0);
      setTotalPages(response?.pagination?.totalPages || 0);
    } catch (err) {
      setOffers([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load offers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (showModal) return;
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setSubmitting(false);
  }, [showModal]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(offer: Offer) {
    setEditingId(offer.id);
    // Make sure selected products are labelable even if they aren't in the loaded page
    setProducts((prev) => {
      const missing = offer.products.filter((p) => !prev.some((x) => x.id === p.id));
      return missing.length ? [...offer.products, ...prev] : prev;
    });
    setForm({
      name: offer.name,
      description: offer.description ?? "",
      offerType: offer.offerType,
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      buyQuantity: String(offer.buyQuantity),
      getQuantity: String(offer.getQuantity),
      scope: offer.scope,
      categoryIds: offer.categoryIds,
      productIds: offer.productIds,
      startsAt: toLocalInput(offer.startsAt),
      endsAt: toLocalInput(offer.endsAt),
      isActive: offer.isActive,
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function toggleTarget(id: string, list: string[], field: "categoryIds" | "productIds") {
    setForm((prev) => ({
      ...prev,
      [field]: list.includes(id) ? list.filter((t) => t !== id) : [...list, id],
    }));
  }

  function validate(): string {
    if (!form.name.trim()) return "Please give the offer a name.";
    if (!form.discountValue) return "Please enter a discount value.";
    const value = Number(form.discountValue);
    if (!Number.isFinite(value) || value <= 0) return "Discount must be a number greater than 0.";
    if (form.discountType === "percentage" && value > 100) return "Percentage discount cannot exceed 100.";
    if (form.offerType === "bogo") {
      if (Number(form.buyQuantity) < 1 || Number(form.getQuantity) < 1) return "BOGO needs a buy quantity and a get quantity of at least 1.";
    }
    if (form.offerType === "bundle" && Number(form.buyQuantity) < 2) return "A bundle needs at least 2 items.";
    if (!form.startsAt || !form.endsAt) return "Please choose a start and end date.";
    if (new Date(form.endsAt) <= new Date(form.startsAt)) return "End date must be after start date.";
    if (form.scope === "category" && form.categoryIds.length === 0) return "Select at least one category.";
    if (form.scope === "product" && form.productIds.length === 0) return "Select at least one product.";
    return "";
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        offerType: form.offerType,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        buyQuantity: Number(form.buyQuantity),
        getQuantity: Number(form.getQuantity),
        scope: form.scope,
        categoryIds: form.scope === "category" ? form.categoryIds : [],
        productIds: form.scope === "product" ? form.productIds : [],
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isActive: form.isActive,
      };

      if (editingId) {
        await offersApi.updateOffer(editingId, payload);
        toast.success("Offer updated");
      } else {
        await offersApi.createOffer(payload);
        toast.success("Offer created");
      }
      setShowModal(false);
      await loadOffers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(offer: Offer) {
    const next = !offer.isActive;
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, isActive: next } : o)));
    try {
      await offersApi.setOfferActive(offer.id, next);
      toast.success(next ? "Offer activated" : "Offer deactivated");
      await loadOffers();
    } catch (err) {
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, isActive: !next } : o)));
      toast.error(err instanceof Error ? err.message : "Failed to update offer");
    }
  }

  async function confirmDeleteOffer() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await offersApi.deleteOffer(confirmDelete.id);
      toast.success("Offer deleted");
      setConfirmDelete(null);
      await loadOffers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete offer");
    } finally {
      setDeleting(false);
    }
  }

  function getTypeColor(type: string): "info" | "success" | "warning" | "brand" {
    switch (type) {
      case "bogo": return "info";
      case "bundle": return "brand";
      case "clearance": return "warning";
      default: return "info";
    }
  }

  const columns = [
    {
      key: "name",
      header: "Offer",
      render: (offer: Offer) => (
        <div>
          <div style={{ fontWeight: 600 }}>{offer.name}</div>
          {offer.description && <div className="ak-text-muted ak-text-sm">{offer.description}</div>}
        </div>
      ),
    },
    {
      key: "offerType",
      header: "Type",
      width: "110px",
      render: (offer: Offer) => (
        <span className={`ak-status ak-status--${getTypeColor(offer.offerType)}`}>
          <span className="ak-status__dot" />
          {offerTypeLabels[offer.offerType]}
        </span>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (offer: Offer) => discountLabel(offer),
    },
    {
      key: "schedule",
      header: "Schedule",
      width: "230px",
      render: (offer: Offer) => (
        <span className="ak-text-sm">
          {formatDateTime(offer.startsAt)} → {formatDateTime(offer.endsAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (offer: Offer) => (
        <span className={`ak-status ak-status--${statusBadge[offer.status]}`}>
          <span className="ak-status__dot" />
          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
        </span>
      ),
    },
    {
      key: "active",
      header: "Active",
      width: "90px",
      render: (offer: Offer) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={offer.isActive} onChange={() => toggleActive(offer)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: (offer: Offer) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(offer);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(offer);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ak-page">
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Offers
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">
            {stats
              ? `${stats.live} live · ${stats.scheduled} scheduled · ${stats.expired} expired · ${stats.inactive} inactive`
              : "BOGO, bundle and clearance offers"}
          </p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Offer
          </button>
        </div>
      </div>

      <div className="ak-page-body">
        <div className="ak-toolbar">
          <div className="ak-toolbar__search">
            <div className="ak-searchbar">
              <div className="ak-searchbar__form">
                <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="ak-searchbar__input"
                  placeholder="Search offers by name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown options={offerTypeOptions} value={filterType} onChange={setFilterType} placeholder="All Types" size="sm" />
            <StatusDropdown options={statusFilterOptions} value={filterStatus} onChange={setFilterStatus} placeholder="All Statuses" size="sm" />
          </div>
        </div>

        {loadError ? (
          <div className="ak-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--color-danger)", marginBottom: 16 }}>Could not load offers: {loadError}</p>
            <button type="button" className="ak-btn ak-btn--primary" onClick={loadOffers}>Retry</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={offers}
            loading={loading}
            loadingText="Loading offers…"
            emptyIcon="file"
            emptyTitle="No offers yet"
            emptyDescription="Create a BOGO, bundle or clearance offer to get started."
            emptyAction={{ label: "Add Offer", onClick: openAddModal }}
            keyExtractor={(offer) => offer.id}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {showModal && (
        <div className="ak-modal-overlay" onClick={closeModal}>
          <div className="ak-modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">{editingId ? "Edit Offer" : "Add New Offer"}</h2>
              <button type="button" className="ak-modal__close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-form-group">
                <label className="ak-label">Offer Name *</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="e.g. Buy 1 pendant, get earrings 50% off"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Description</label>
                <textarea
                  className="ak-input"
                  rows={2}
                  placeholder="Shown to customers on the storefront (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Offer Type *</label>
                  <select
                    className="ak-select"
                    value={form.offerType}
                    onChange={(e) => setForm({ ...form, offerType: e.target.value as OfferType })}
                  >
                    <option value="bogo">BOGO</option>
                    <option value="bundle">Bundle</option>
                    <option value="clearance">Clearance</option>
                  </select>
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Discount Type *</label>
                  <select
                    className="ak-select"
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as OfferDiscountType })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Discount Value *</label>
                <input
                  type="number"
                  className="ak-input"
                  min="0"
                  step="0.01"
                  placeholder={form.discountType === "percentage" ? "e.g. 15" : "e.g. 500"}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                />
              </div>

              {form.offerType !== "clearance" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="ak-form-group">
                    <label className="ak-label">{form.offerType === "bogo" ? "Buy Quantity *" : "Items in Bundle *"}</label>
                    <input
                      type="number"
                      className="ak-input"
                      min={form.offerType === "bundle" ? 2 : 1}
                      value={form.buyQuantity}
                      onChange={(e) => setForm({ ...form, buyQuantity: e.target.value })}
                    />
                  </div>
                  {form.offerType === "bogo" && (
                    <div className="ak-form-group">
                      <label className="ak-label">Get Quantity *</label>
                      <input
                        type="number"
                        className="ak-input"
                        min="1"
                        value={form.getQuantity}
                        onChange={(e) => setForm({ ...form, getQuantity: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="ak-form-group">
                <label className="ak-label">Applies To</label>
                <select
                  className="ak-select"
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value as OfferScope })}
                >
                  <option value="all">Entire order</option>
                  <option value="category">Selected categories</option>
                  <option value="product">Selected products</option>
                </select>
              </div>

              {form.scope === "category" && (
                <div className="ak-form-group">
                  <label className="ak-label">Categories * ({form.categoryIds.length} selected)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 8, border: "1px solid var(--border-color)", borderRadius: 6, maxHeight: 140, overflowY: "auto" }}>
                    {categories.length === 0 && <span className="ak-text-muted">No categories loaded</span>}
                    {categories.map((c) => (
                      <label key={c.id} className="ak-badge" style={{ cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(c.id)}
                          onChange={() => toggleTarget(c.id, form.categoryIds, "categoryIds")}
                          style={{ marginRight: 6 }}
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {form.scope === "product" && (
                <div className="ak-form-group">
                  <label className="ak-label">Products * ({form.productIds.length} selected)</label>
                  {editingId && form.productIds.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      {form.productIds.map((id) => {
                        const p = products.find((x) => x.id === id);
                        return (
                          <span key={id} className="ak-badge ak-badge--brand">
                            {p?.name ?? id}
                            <button type="button" style={{ marginLeft: 4, background: "none", border: "none", cursor: "pointer", color: "inherit" }} onClick={() => toggleTarget(id, form.productIds, "productIds")}>×</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <input
                    type="text"
                    className="ak-input"
                    placeholder="Search products by name…"
                    style={{ marginBottom: 8 }}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 8, border: "1px solid var(--border-color)", borderRadius: 6, maxHeight: 160, overflowY: "auto" }}>
                    {products.length === 0 && <span className="ak-text-muted">No products loaded</span>}
                    {products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((p) => (                      <label key={p.id} className="ak-badge" style={{ cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(p.id)}
                          onChange={() => toggleTarget(p.id, form.productIds, "productIds")}
                          style={{ marginRight: 6 }}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ak-form-group">
                  <label className="ak-label">Starts At *</label>
                  <input
                    type="datetime-local"
                    className="ak-input"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  />
                </div>
                <div className="ak-form-group">
                  <label className="ak-label">Ends At *</label>
                  <input
                    type="datetime-local"
                    className="ak-input"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="ak-form-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label className="ak-label" style={{ marginBottom: 0 }}>Active</label>
                  <span className="ak-text-muted ak-text-sm">
                    {form.isActive ? "Automatically live when the schedule starts" : "Saved but never live"}
                  </span>
                </div>
                <label className="ak-toggle">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <span className="ak-toggle__slider" />
                </label>
              </div>

              {formError && (
                <div className="ak-alert ak-alert--danger" style={{ marginTop: 16 }}>{formError}</div>
              )}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="ak-modal-overlay" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Offer?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                This will permanently remove <strong>{confirmDelete.name}</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={confirmDeleteOffer} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
