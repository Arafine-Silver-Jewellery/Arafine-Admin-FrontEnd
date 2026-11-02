import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { DataTable, StatusDropdown } from "../../components";
import type {
  ClearanceSaleProduct,
  ClearanceSaleStats,
  FlashDealProductInfo,
} from "../../types";
import "../../styles/ui-kit.css";

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "true", label: "Active", color: "success" as const },
  { value: "false", label: "Inactive", color: "neutral" as const },
];

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
}

export default function ClearanceSale() {
  // Settings
  const [settingsForm, setSettingsForm] = useState({
    isActive: false,
    startsAt: "",
    endsAt: "",
    discountPercent: 0,
    showOnHomepage: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  // Products list
  const [products, setProducts] = useState<ClearanceSaleProduct[]>([]);
  const [stats, setStats] = useState<ClearanceSaleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Add product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [availableProducts, setAvailableProducts] = useState<FlashDealProductInfo[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  // Edit discount modal
  const [editingRow, setEditingRow] = useState<ClearanceSaleProduct | null>(null);
  const [editPercent, setEditPercent] = useState("0");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Fetch settings once
  useEffect(() => {
    (async () => {
      try {
        const response = await api.getClearanceSettings();
        setSettingsForm({
          isActive: response.isActive,
          startsAt: formatDateForInput(response.startsAt),
          endsAt: formatDateForInput(response.endsAt),
          discountPercent: response.discountPercent,
          showOnHomepage: response.showOnHomepage,
        });
      } catch (error) {
        console.error("Failed to fetch clearance settings:", error);
      }
    })();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getClearanceProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        isActive: statusFilter ? statusFilter === "true" : undefined,
      });
      setProducts(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch clearance products:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search available products
  useEffect(() => {
    if (!showAddModal) return;
    (async () => {
      try {
        setLoadingProducts(true);
        const response = await api.searchClearanceProducts({
          search: debouncedProductSearch || undefined,
          limit: 50,
        });
        setAvailableProducts(response.data);
      } catch (error) {
        console.error("Failed to search products:", error);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [debouncedProductSearch, showAddModal]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMessage("");

    if (settingsForm.startsAt && settingsForm.endsAt) {
      const start = new Date(settingsForm.startsAt);
      const end = new Date(settingsForm.endsAt);
      if (end <= start) {
        setSettingsMessage("End date must be after start date");
        return;
      }
    }

    try {
      setSavingSettings(true);
      await api.updateClearanceSettings({
        isActive: settingsForm.isActive,
        startsAt: settingsForm.startsAt ? new Date(settingsForm.startsAt).toISOString() : null,
        endsAt: settingsForm.endsAt ? new Date(settingsForm.endsAt).toISOString() : null,
        discountPercent: Number(settingsForm.discountPercent),
        showOnHomepage: settingsForm.showOnHomepage,
      });
      setSettingsMessage("Settings saved");
      fetchProducts();
    } catch (error: any) {
      console.error("Failed to save clearance settings:", error);
      setSettingsMessage(error.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function addProduct(product: FlashDealProductInfo) {
    try {
      setAddingProduct(true);
      await api.addClearanceProduct({
        productId: product.id,
        discountPercent: settingsForm.discountPercent,
      });
      setShowAddModal(false);
      setProductSearch("");
      setCurrentPage(1);
      fetchProducts();
    } catch (error) {
      console.error("Failed to add product:", error);
    } finally {
      setAddingProduct(false);
    }
  }

  function openEditModal(row: ClearanceSaleProduct) {
    setEditingRow(row);
    setEditPercent(String(row.discountPercent));
  }

  async function saveEdit() {
    if (!editingRow) return;

    try {
      setSavingEdit(true);
      await api.updateClearanceProduct(editingRow.id, { discountPercent: Number(editPercent) });
      setEditingRow(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to update clearance product:", error);
    } finally {
      setSavingEdit(false);
    }
  }

  async function toggleActive(row: ClearanceSaleProduct) {
    try {
      await api.updateClearanceProduct(row.id, { isActive: !row.isActive });
      fetchProducts();
    } catch (error) {
      console.error("Failed to toggle clearance product:", error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await api.deleteClearanceProduct(deleteId);
      setDeleteId(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete clearance product:", error);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: ClearanceSaleProduct, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "product",
      header: "Product",
      render: (product: ClearanceSaleProduct) => (
        <div className="ak-product-cell">
          {product.productImageUrl ? (
            <img
              src={product.productImageUrl}
              alt={product.productName}
              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-color-light)" }}
            />
          ) : (
            <div className="ak-product-cell__placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
          <div>
            <span className="ak-product-cell__name">{product.productName}</span>
            <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>{product.productSku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "originalPrice",
      header: "Original Price",
      width: "120px",
      render: (product: ClearanceSaleProduct) => (
        <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>₹{product.originalPrice.toLocaleString()}</span>
      ),
    },
    {
      key: "discountPrice",
      header: "Discount Price",
      width: "120px",
      render: (product: ClearanceSaleProduct) => (
        <span style={{ fontWeight: 600, color: "var(--color-success)" }}>₹{product.discountPrice.toLocaleString()}</span>
      ),
    },
    {
      key: "discountPercent",
      header: "Discount %",
      width: "100px",
      render: (product: ClearanceSaleProduct) => (
        <span className="ak-status ak-status--success">
          <span className="ak-status__dot" />
          {product.discountPercent}% OFF
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      width: "80px",
      align: "center" as const,
      render: (product: ClearanceSaleProduct) => <span>{product.stock}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "80px",
      render: (product: ClearanceSaleProduct) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={product.isActive} onChange={() => toggleActive(product)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: (product: ClearanceSaleProduct) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit discount"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(product);
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
            title="Remove"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(product.id);
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
      {/* Page Header */}
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">Clearance Sale</h1>
          <p className="ak-page-header__subtitle">Manage clearance sale offers and discounts</p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="ak-card" style={{ margin: "0 24px", marginBottom: 24 }}>
        <div className="ak-card__body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active clearance sale offer?</h3>
              <p className="ak-text-muted ak-text-sm" style={{ margin: "4px 0 0" }}>
                Show your offer on the customer website and apps
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ak-text-sm">Active Offer</span>
              <label className="ak-toggle">
                <input
                  type="checkbox"
                  checked={settingsForm.isActive}
                  onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })}
                />
                <span className="ak-toggle__slider" />
              </label>
            </div>
          </div>

          <form onSubmit={saveSettings}>
            <div className="ak-form-grid ak-form-grid--2">
              <div className="ak-form-group">
                <label className="ak-label">Start Date</label>
                <input
                  type="datetime-local"
                  className="ak-input"
                  value={settingsForm.startsAt}
                  onChange={(e) => setSettingsForm({ ...settingsForm, startsAt: e.target.value })}
                />
              </div>
              <div className="ak-form-group">
                <label className="ak-label">End Date</label>
                <input
                  type="datetime-local"
                  className="ak-input"
                  value={settingsForm.endsAt}
                  onChange={(e) => setSettingsForm({ ...settingsForm, endsAt: e.target.value })}
                />
              </div>
            </div>

            <div className="ak-form-grid ak-form-grid--2">
              <div className="ak-form-group">
                <label className="ak-label">Flat Discount (%)*</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="ak-input"
                    value={settingsForm.discountPercent}
                    onChange={(e) => setSettingsForm({ ...settingsForm, discountPercent: Number(e.target.value) })}
                    style={{ paddingRight: 40 }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>%</span>
                </div>
                <span className="ak-text-muted ak-text-sm" style={{ display: "block", marginTop: 4 }}>
                  Applied by default when a product is added; editable per product in the table.
                </span>
              </div>
              <div className="ak-form-group">
                <label className="ak-label">Visibility</label>
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.showOnHomepage}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showOnHomepage: e.target.checked })}
                    />
                    <span>Also show on home page</span>
                  </label>
                </div>
              </div>
            </div>

            {settingsMessage && (
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  marginBottom: 12,
                  background: settingsMessage === "Settings saved" ? "#e8f5e9" : "#ffebee",
                  color: settingsMessage === "Settings saved" ? "#2e7d32" : "#c62828",
                }}
              >
                {settingsMessage}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="submit" className="ak-btn ak-btn--primary" disabled={savingSettings}>
                {savingSettings ? "Saving…" : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="ak-stats-grid" style={{ margin: "0 24px", marginBottom: 24 }}>
          <div className="ak-stat-card">
            <div className="ak-stat-card__icon ak-stat-card__icon--success">🏷️</div>
            <div className="ak-stat-card__content">
              <h2 className="ak-stat-card__value">{stats.totalProducts}</h2>
              <p className="ak-stat-card__label">Total Products</p>
            </div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-card__icon ak-stat-card__icon--info">✅</div>
            <div className="ak-stat-card__content">
              <h2 className="ak-stat-card__value">{stats.activeProducts}</h2>
              <p className="ak-stat-card__label">Active Products</p>
            </div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-card__icon ak-stat-card__icon--warning">💰</div>
            <div className="ak-stat-card__content">
              <h2 className="ak-stat-card__value">₹{stats.potentialSavings.toLocaleString()}</h2>
              <p className="ak-stat-card__label">Potential Savings</p>
            </div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-card__icon ak-stat-card__icon--primary">📊</div>
            <div className="ak-stat-card__content">
              <h2 className="ak-stat-card__value">{stats.flatDiscountPercent}%</h2>
              <p className="ak-stat-card__label">Flat Discount</p>
            </div>
          </div>
        </div>
      )}

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
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
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              placeholder="All Status"
              size="sm"
            />
            <button type="button" className="ak-btn ak-btn--primary ak-btn--sm" onClick={() => setShowAddModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          emptyIcon="box"
          emptyTitle="No products in clearance sale"
          emptyDescription="Add products to your clearance sale to offer discounts."
          keyExtractor={(product) => product.id}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="ak-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="ak-modal" style={{ maxWidth: "650px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Add Product to Clearance Sale</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <input
                type="text"
                className="ak-input"
                placeholder="Search products by name or SKU…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              {loadingProducts ? (
                <div className="ak-text-muted ak-text-sm">Loading…</div>
              ) : availableProducts.length === 0 ? (
                <div className="ak-text-muted ak-text-sm">No products found (products already in the sale are excluded).</div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border-color-light)", borderRadius: 8 }}>
                  {availableProducts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--border-color-light)",
                      }}
                    >
                      <span style={{ flex: 1 }}>{p.name}</span>
                      <span className="ak-text-muted ak-text-sm">{p.sku}</span>
                      <span className="ak-text-sm" style={{ fontWeight: 500 }}>₹{p.price}</span>
                      <button
                        type="button"
                        className="ak-btn ak-btn--ghost ak-btn--sm"
                        disabled={addingProduct}
                        onClick={() => addProduct(p)}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="ak-text-sm ak-text-muted" style={{ marginTop: 8 }}>
                New products start with the flat discount of {settingsForm.discountPercent}%. Edit per-product from the table.
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setShowAddModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Discount Modal */}
      {editingRow && (
        <div className="ak-modal-overlay" onClick={() => setEditingRow(null)}>
          <div className="ak-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Edit Discount — {editingRow.productName}</h2>
              <button type="button" className="ak-modal__close" onClick={() => setEditingRow(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-form-group">
                <label className="ak-label">Discount (%)*</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="ak-input"
                    value={editPercent}
                    onChange={(e) => setEditPercent(e.target.value)}
                    style={{ paddingRight: 40 }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>%</span>
                </div>
                <div className="ak-text-sm ak-text-muted" style={{ marginTop: 8 }}>
                  Original: ₹{editingRow.originalPrice.toLocaleString()} → New price: ₹{(Math.round(editingRow.originalPrice * (1 - Number(editPercent || 0) / 100) * 100) / 100).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setEditingRow(null)} disabled={savingEdit}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="ak-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Remove from Clearance Sale</h2>
              <button type="button" className="ak-modal__close" onClick={() => setDeleteId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>Remove this product from the clearance sale? The product itself is not deleted.</p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
