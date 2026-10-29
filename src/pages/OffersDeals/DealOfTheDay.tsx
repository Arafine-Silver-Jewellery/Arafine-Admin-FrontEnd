import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "../../components";
import { api } from "../../api/client";
import type { DealOfTheDay, DealOfTheDayProductInfo, CreateDealOfTheDayInput, DealOfTheDayStats } from "../../types";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

// SVG Icons
const icons = {
  tag: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  package: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  plus: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  search: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  edit: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  delete: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function formatRupees(rupees: number): string {
  return `₹${rupees.toFixed(2)}`;
}

export default function DealOfTheDay() {
  const [deals, setDeals] = useState<DealOfTheDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState<DealOfTheDayStats | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealOfTheDay | null>(null);
  const [formData, setFormData] = useState<CreateDealOfTheDayInput>({
    title: "",
    description: "",
    productIds: [],
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Product picker state
  const [productSearch, setProductSearch] = useState("");
  const [availableProducts, setAvailableProducts] = useState<DealOfTheDayProductInfo[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<DealOfTheDayProductInfo[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const productSearchRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Show toast
  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getDealOfTheDayList({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
      });
      setDeals(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch deals:", error);
      showToast("Failed to load deals", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Fetch available products for picker
  const fetchProducts = useCallback(async (search: string) => {
    try {
      setLoadingProducts(true);
      const response = await api.searchProductsForDealOfTheDay({
        search: search || undefined,
        limit: 50,
      });
      // Filter out already selected products
      const selectedIds = new Set(selectedProducts.map(p => p.id));
      setAvailableProducts(response.data.filter(p => !selectedIds.has(p.id)));
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedProducts]);

  // Debounce product search
  useEffect(() => {
    if (showDrawer) {
      const timer = setTimeout(() => {
        fetchProducts(productSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [productSearch, showDrawer, fetchProducts]);

  // Open drawer for adding
  function openAddDrawer() {
    setEditingDeal(null);
    setFormData({
      title: "",
      description: "",
      productIds: [],
      isActive: true,
    });
    setSelectedProducts([]);
    setProductSearch("");
    setFormErrors({});
    setShowDrawer(true);
  }

  // Open drawer for editing
  async function openEditDrawer(deal: DealOfTheDay) {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description || "",
      productIds: deal.productIds,
      isActive: deal.isActive,
    });
    setFormErrors({});
    setShowDrawer(true);

    // Fetch product details for selected products
    if (deal.productIds.length > 0) {
      try {
        const response = await api.getDealOfTheDay(deal.id, true);
        setSelectedProducts(response.products || []);
      } catch (error) {
        console.error("Failed to fetch deal products:", error);
      }
    } else {
      setSelectedProducts([]);
    }
    setProductSearch("");
  }

  // Close drawer
  function closeDrawer() {
    setShowDrawer(false);
    setEditingDeal(null);
    setSelectedProducts([]);
    setProductSearch("");
  }

  // Handle keyboard events
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!showDrawer) return;
      
      if (e.key === "Escape") {
        closeDrawer();
      } else if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
        // Don't submit on Enter in search input
        if (e.target !== productSearchRef.current) {
          e.preventDefault();
          handleSubmit();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDrawer]);

  // Add product to selection
  function addProduct(product: DealOfTheDayProductInfo) {
    setSelectedProducts(prev => [...prev, product]);
    setAvailableProducts(prev => prev.filter(p => p.id !== product.id));
  }

  // Remove product from selection
  function removeProduct(productId: string) {
    const removed = selectedProducts.find(p => p.id === productId);
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    if (removed) {
      setAvailableProducts(prev => [removed, ...prev]);
    }
  }

  // Validate form
  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Please enter a title.";
    }

    if (selectedProducts.length === 0) {
      errors.products = "Select at least one product.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Submit form
  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload: CreateDealOfTheDayInput = {
        ...formData,
        productIds: selectedProducts.map(p => p.id),
      };

      if (editingDeal) {
        await api.updateDealOfTheDay(editingDeal.id, payload);
        showToast("Deal updated successfully");
      } else {
        await api.createDealOfTheDay(payload);
        showToast("Deal added successfully");
      }

      closeDrawer();
      fetchDeals();
    } catch (error: any) {
      console.error("Failed to save deal:", error);
      setFormErrors({ submit: error.message || "Failed to save deal" });
    } finally {
      setSubmitting(false);
    }
  }

  // Reset form
  function handleReset() {
    setFormData({
      title: "",
      description: "",
      productIds: [],
      isActive: true,
    });
    setSelectedProducts([]);
    setProductSearch("");
    setFormErrors({});
  }

  // Toggle active status
  async function toggleActive(deal: DealOfTheDay) {
    try {
      await api.toggleDealOfTheDayActive(deal.id);
      fetchDeals();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      showToast("Failed to update status", "error");
    }
  }

  // Delete deal
  async function handleDelete() {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await api.deleteDealOfTheDay(deleteId);
      setDeleteId(null);
      showToast("Deal deleted successfully");
      fetchDeals();
    } catch (error) {
      console.error("Failed to delete deal:", error);
      showToast("Failed to delete deal", "error");
    } finally {
      setDeleting(false);
    }
  }

  // Table columns
  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: DealOfTheDay, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "title",
      header: "Title",
      render: (deal: DealOfTheDay) => (
        <div>
          <span style={{ fontWeight: 600, display: "block", color: "var(--text-strong)" }}>{deal.title}</span>
          {deal.description && (
            <span className="ak-text-muted ak-text-sm" style={{ 
              display: "block", 
              maxWidth: "250px", 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap" 
            }}>
              {deal.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "products",
      header: "Product Info",
      render: (deal: DealOfTheDay) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {deal.activeProductsCount > 0 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                background: "var(--color-champagne-gold-light, #fef3e0)",
                color: "var(--color-champagne-gold, #9a7326)",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: 500,
              }}
            >
              {icons.package}
              {deal.activeProductsCount} product{deal.activeProductsCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="ak-text-muted ak-text-sm">No products</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (deal: DealOfTheDay) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={deal.isActive}
            onChange={() => toggleActive(deal)}
          />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "120px",
      render: (deal: DealOfTheDay) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditDrawer(deal);
            }}
          >
            {icons.edit}
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(deal.id);
            }}
          >
            {icons.delete}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="reports-container">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            background: toast.type === "success" ? "#4caf50" : "#f44336",
            color: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            animation: "fadeIn 0.3s ease",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="product-report-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon blue">{icons.tag}</div>
            <div className="product-report-stat-content">
              <h2>{stats.totalDeals}</h2>
              <p>Total Deals</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon green">{icons.check}</div>
            <div className="product-report-stat-content">
              <h2>{stats.activeDeals}</h2>
              <p>Active Now</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon teal">{icons.package}</div>
            <div className="product-report-stat-content">
              <h2>{stats.totalProducts}</h2>
              <p>Products Featured</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="table-card">
        <div className="table-header">
          <h3>
            Deal of the Day <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select
              className="table-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="search-box">
              {icons.search}
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-export" onClick={openAddDrawer}>
              {icons.plus}
              Add Deal
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={deals}
          loading={loading}
          emptyIcon="bell"
          emptyTitle={debouncedSearch || statusFilter !== "all" ? "No matching deals" : "No deals found"}
          emptyDescription={
            debouncedSearch || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Add your first deal of the day to highlight products."
          }
          keyExtractor={(deal) => deal.id}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Slide-over Drawer */}
      {showDrawer && (
        <div className="ak-drawer-overlay" onClick={closeDrawer}>
          <div className="ak-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ak-drawer__header">
              <h2 className="ak-drawer__title">
                {editingDeal ? "Edit Deal" : "Add New Deal"}
              </h2>
              <button type="button" className="ak-drawer__close" onClick={closeDrawer}>
                {icons.close}
              </button>
            </div>

            <div className="ak-drawer__body">
              {formErrors.submit && (
                <div style={{ padding: "12px 16px", background: "#ffebee", color: "#c62828", borderRadius: 8, marginBottom: 16 }}>
                  {formErrors.submit}
                </div>
              )}

              <div className="ak-form-group">
                <label className="ak-label">Title (EN) *</label>
                <input
                  type="text"
                  className={`ak-input ${formErrors.title ? "ak-input--error" : ""}`}
                  placeholder="Enter deal title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                {formErrors.title && (
                  <span className="ak-field-error">{formErrors.title}</span>
                )}
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Description</label>
                <textarea
                  className="ak-input ak-textarea"
                  rows={2}
                  placeholder="Enter description (optional)"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ resize: "vertical", minHeight: "60px" }}
                />
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Products *</label>
                
                {/* Selected products as chips */}
                {selectedProducts.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 10px",
                          background: "var(--color-champagne-gold-light, #fef3e0)",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                        }}
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt=""
                            style={{ width: "20px", height: "20px", borderRadius: "4px", objectFit: "cover" }}
                          />
                        )}
                        <span style={{ color: "var(--text-strong)", fontWeight: 500 }}>{product.name}</span>
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "0",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "flex",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Product search */}
                <div className="search-box" style={{ marginBottom: "8px" }}>
                  {icons.search}
                  <input
                    ref={productSearchRef}
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                {/* Product list */}
                <div
                  style={{
                    maxHeight: "250px",
                    overflow: "auto",
                    border: "1px solid var(--border-color-light, #e6e8ec)",
                    borderRadius: "8px",
                  }}
                >
                  {loadingProducts ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <span className="ak-spinner" style={{ width: "20px", height: "20px" }} />
                    </div>
                  ) : availableProducts.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      {productSearch ? "No products found" : "Type to search products"}
                    </div>
                  ) : (
                    availableProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addProduct(product)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--border-color-light, #e6e8ec)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-pearl, #f5f6f8)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <input type="checkbox" checked={false} readOnly style={{ accentColor: "var(--color-champagne-gold)" }} />
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "var(--color-pearl)",
                            flexShrink: 0,
                          }}
                        >
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                              {icons.package}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            <span>SKU: {product.sku} • {formatRupees(product.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {formErrors.products && (
                  <span className="ak-field-error">{formErrors.products}</span>
                )}
              </div>
            </div>

            <div className="ak-drawer__footer">
              <button
                type="button"
                className="ak-btn ak-btn--ghost"
                onClick={handleReset}
                disabled={submitting}
              >
                Reset
              </button>
              <button
                type="button"
                className="ak-btn ak-btn--primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="ak-modal-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Deal?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setDeleteId(null)} disabled={deleting}>
                {icons.close}
              </button>
            </div>
            <div className="ak-modal__body">
              <p style={{ margin: 0 }}>
                Are you sure you want to delete this deal? This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer styles */}
      <style>{`
        .ak-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .ak-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 450px;
          max-width: 100%;
          background: white;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease;
        }

        .ak-drawer__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color-light, #e6e8ec);
        }

        .ak-drawer__title {
          font-family: "Playfair Display", serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-strong, #1f2430);
          margin: 0;
        }

        .ak-drawer__close {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-muted, #6b7280);
          border-radius: 6px;
          display: flex;
          transition: background 0.15s ease;
        }

        .ak-drawer__close:hover {
          background: var(--color-pearl, #f5f6f8);
        }

        .ak-drawer__body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .ak-drawer__footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid var(--border-color-light, #e6e8ec);
          background: var(--color-pearl, #f5f6f8);
        }

        .ak-field-error {
          display: block;
          color: #c62828;
          font-size: 0.75rem;
          margin-top: 4px;
        }

        .ak-input--error {
          border-color: #c62828 !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @media (max-width: 500px) {
          .ak-drawer {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
