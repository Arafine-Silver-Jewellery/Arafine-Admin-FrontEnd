import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { DataTable, StatusDropdown } from "../../components";
import type {
  FeaturedDeal,
  CreateFeaturedDealInput,
  FlashDealProductInfo,
  FeaturedDealStats,
} from "../../types";
import "../../styles/ui-kit.css";

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "expired", label: "Expired", color: "danger" as const },
  { value: "upcoming", label: "Upcoming", color: "info" as const },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function formatDateForInput(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
}

export default function FeaturedDeal() {
  const [featuredDeals, setFeaturedDeals] = useState<FeaturedDeal[]>([]);
  const [stats, setStats] = useState<FeaturedDealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Form modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FeaturedDeal | null>(null);
  const [formData, setFormData] = useState<CreateFeaturedDealInput>({
    title: "",
    startsAt: "",
    endsAt: "",
    isPublished: true,
    productIds: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Products modal
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [productsModalDeal, setProductsModalDeal] = useState<FeaturedDeal | null>(null);
  const [availableProducts, setAvailableProducts] = useState<FlashDealProductInfo[]>([]);
  const [dealProducts, setDealProducts] = useState<FlashDealProductInfo[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch featured deals
  const fetchFeaturedDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getFeaturedDeals({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: (statusFilter || undefined) as "active" | "expired" | "upcoming" | undefined,
      });
      setFeaturedDeals(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch featured deals:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchFeaturedDeals();
  }, [fetchFeaturedDeals]);

  function openAddModal() {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);

    setEditingDeal(null);
    setFormData({
      title: "",
      startsAt: now.toISOString().slice(0, 16),
      endsAt: endDate.toISOString().slice(0, 16),
      isPublished: true,
      productIds: [],
    });
    setFormErrors({});
    setShowFormModal(true);
  }

  function openEditModal(deal: FeaturedDeal) {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      startsAt: formatDateForInput(deal.startsAt),
      endsAt: formatDateForInput(deal.endsAt),
      isPublished: deal.isPublished,
      productIds: deal.productIds,
    });
    setFormErrors({});
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
    setEditingDeal(null);
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.startsAt) {
      errors.startsAt = "Start date is required";
    }
    if (!formData.endsAt) {
      errors.endsAt = "End date is required";
    }
    if (formData.startsAt && formData.endsAt) {
      const start = new Date(formData.startsAt);
      const end = new Date(formData.endsAt);
      if (end <= start) {
        errors.endsAt = "End date must be after start date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload: CreateFeaturedDealInput = {
        ...formData,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
      };

      if (editingDeal) {
        await api.updateFeaturedDeal(editingDeal.id, payload);
      } else {
        await api.createFeaturedDeal(payload);
      }

      closeFormModal();
      fetchFeaturedDeals();
    } catch (error: any) {
      console.error("Failed to save featured deal:", error);
      setFormErrors({ submit: error.message || "Failed to save featured deal" });
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(deal: FeaturedDeal) {
    try {
      await api.toggleFeaturedDealPublish(deal.id);
      fetchFeaturedDeals();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await api.deleteFeaturedDeal(deleteId);
      setDeleteId(null);
      fetchFeaturedDeals();
    } catch (error) {
      console.error("Failed to delete featured deal:", error);
    } finally {
      setDeleting(false);
    }
  }

  // Products modal
  async function openProductsModal(deal: FeaturedDeal) {
    setProductsModalDeal(deal);
    setProductSearch("");
    setSelectedProductIds(new Set());
    setShowProductsModal(true);

    try {
      setLoadingProducts(true);
      const [dealResponse, availableResponse] = await Promise.all([
        api.getFeaturedDeal(deal.id, true),
        api.searchFeaturedDealProducts({ limit: 50 }),
      ]);
      setDealProducts(dealResponse.products || []);
      setAvailableProducts(
        availableResponse.data.filter((p) => !dealResponse.productIds.includes(p.id)),
      );
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function searchAvailableProducts(search: string) {
    if (!productsModalDeal) return;

    try {
      setLoadingProducts(true);
      const response = await api.searchFeaturedDealProducts({
        search: search || undefined,
        limit: 50,
      });
      setAvailableProducts(
        response.data.filter((p) => !productsModalDeal.productIds.includes(p.id)),
      );
    } catch (error) {
      console.error("Failed to search products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    if (showProductsModal) {
      const timer = setTimeout(() => {
        searchAvailableProducts(productSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSearch, showProductsModal]);

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  async function addSelectedProducts() {
    if (!productsModalDeal || selectedProductIds.size === 0) return;

    try {
      setLoadingProducts(true);
      const updated = await api.addFeaturedDealProducts(
        productsModalDeal.id,
        Array.from(selectedProductIds),
      );
      setDealProducts(updated.products || []);
      setProductsModalDeal({ ...productsModalDeal, productIds: updated.productIds });
      setSelectedProductIds(new Set());
      await searchAvailableProducts(productSearch);
      fetchFeaturedDeals();
    } catch (error) {
      console.error("Failed to add products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function removeProduct(productId: string) {
    if (!productsModalDeal) return;

    try {
      setLoadingProducts(true);
      const updated = await api.removeFeaturedDealProducts(productsModalDeal.id, [productId]);
      setDealProducts(updated.products || []);
      setProductsModalDeal({ ...productsModalDeal, productIds: updated.productIds });
      await searchAvailableProducts(productSearch);
      fetchFeaturedDeals();
    } catch (error) {
      console.error("Failed to remove product:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  function getStatusDisplay(status: string): { label: string; variant: string } {
    switch (status) {
      case "active":
        return { label: "Active", variant: "success" };
      case "expired":
        return { label: "Expired", variant: "danger" };
      case "upcoming":
        return { label: "Upcoming", variant: "info" };
      default:
        return { label: status, variant: "neutral" };
    }
  }

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: FeaturedDeal, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "title",
      header: "Title",
      render: (deal: FeaturedDeal) => <span className="ak-text-link" style={{ fontWeight: 600 }}>{deal.title}</span>,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (deal: FeaturedDeal) => <span className="ak-text-muted">{formatDate(deal.startsAt)}</span>,
    },
    {
      key: "endDate",
      header: "End Date",
      render: (deal: FeaturedDeal) => <span className="ak-text-muted">{formatDate(deal.endsAt)}</span>,
    },
    {
      key: "products",
      header: "Products",
      width: "100px",
      align: "center" as const,
      render: (deal: FeaturedDeal) => (
        <span className="ak-text-sm" style={{ fontWeight: 500 }}>{deal.activeProductsCount}</span>
      ),
    },
    {
      key: "activeExpired",
      header: "Active / Expired",
      render: (deal: FeaturedDeal) => {
        const status = getStatusDisplay(deal.status);
        return (
          <span className={`ak-status ak-status--${status.variant}`}>
            <span className="ak-status__dot" />
            {status.label}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "80px",
      render: (deal: FeaturedDeal) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={deal.isPublished} onChange={() => togglePublish(deal)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "180px",
      render: (deal: FeaturedDeal) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-btn ak-btn--ghost ak-btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              openProductsModal(deal);
            }}
          >
            + Add product
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(deal);
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
              setDeleteId(deal.id);
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
          <h1 className="ak-page-header__title">
            Featured Deals
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">
            {stats
              ? `${stats.activeDeals} active · ${stats.expiredDeals} expired · ${stats.totalProducts} products featured`
              : "Manage featured deal promotions"}
          </p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Featured Deal
          </button>
        </div>
      </div>

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
                  placeholder="Search by title…"
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
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={featuredDeals}
          loading={loading}
          emptyIcon="box"
          emptyTitle="No featured deals"
          emptyDescription="Create your first featured deal to highlight products."
          keyExtractor={(deal) => deal.id}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <div className="ak-modal-overlay" onClick={closeFormModal}>
          <div className="ak-modal" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">
                {editingDeal ? "Edit Featured Deal" : "Add Featured Deal"}
              </h2>
              <button type="button" className="ak-modal__close" onClick={closeFormModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ak-modal__body">
                {formErrors.submit && (
                  <div style={{ padding: "12px 16px", background: "#ffebee", color: "#c62828", borderRadius: 8, marginBottom: 16 }}>
                    {formErrors.submit}
                  </div>
                )}

                <div className="ak-form-group">
                  <label className="ak-label">Title *</label>
                  <input
                    type="text"
                    className="ak-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter featured deal title"
                  />
                  {formErrors.title && <span style={{ color: "#c62828", fontSize: "0.75rem" }}>{formErrors.title}</span>}
                </div>

                <div className="ak-form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="ak-form-group">
                    <label className="ak-label">Start Date *</label>
                    <input
                      type="datetime-local"
                      className="ak-input"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    />
                    {formErrors.startsAt && <span style={{ color: "#c62828", fontSize: "0.75rem" }}>{formErrors.startsAt}</span>}
                  </div>
                  <div className="ak-form-group">
                    <label className="ak-label">End Date *</label>
                    <input
                      type="datetime-local"
                      className="ak-input"
                      value={formData.endsAt}
                      onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    />
                    {formErrors.endsAt && <span style={{ color: "#c62828", fontSize: "0.75rem" }}>{formErrors.endsAt}</span>}
                  </div>
                </div>

                <div className="ak-form-group">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label className="ak-toggle">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      />
                      <span className="ak-toggle__slider" />
                    </label>
                    <span>Publish immediately</span>
                  </div>
                </div>

                {(editingDeal || (formData.productIds?.length ?? 0) > 0) && (
                  <div className="ak-text-sm ak-text-muted" style={{ marginTop: 8 }}>
                    Products are managed from the <strong>+ Add product</strong> button in the table.
                    {editingDeal && ` This deal currently has ${editingDeal.activeProductsCount} product(s).`}
                  </div>
                )}
              </div>
              <div className="ak-modal__footer">
                <button type="button" className="ak-btn ak-btn--ghost" onClick={closeFormModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="ak-btn ak-btn--primary" disabled={submitting}>
                  {submitting ? "Saving…" : editingDeal ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && productsModalDeal && (
        <div className="ak-modal-overlay" onClick={() => setShowProductsModal(false)}>
          <div className="ak-modal" style={{ maxWidth: "750px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Manage Products — {productsModalDeal.title}</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowProductsModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              {/* Products in this deal */}
              <div className="ak-form-group">
                <label className="ak-label">In this deal ({dealProducts.length})</label>
                {loadingProducts && dealProducts.length === 0 ? (
                  <div className="ak-text-muted ak-text-sm">Loading…</div>
                ) : dealProducts.length === 0 ? (
                  <div className="ak-text-muted ak-text-sm">No products yet — add from the list below.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {dealProducts.map((p) => (
                      <span
                        key={p.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          background: "var(--color-pearl)",
                          borderRadius: 16,
                          fontSize: "0.8rem",
                        }}
                      >
                        {p.name}
                        <button
                          type="button"
                          className="ak-icon-btn ak-icon-btn--delete"
                          title="Remove"
                          style={{ width: 20, height: 20 }}
                          onClick={() => removeProduct(p.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Search + available list */}
              <div className="ak-form-group">
                <label className="ak-label">Available products</label>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Search products by name or SKU…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                {loadingProducts ? (
                  <div className="ak-text-muted ak-text-sm">Loading…</div>
                ) : availableProducts.length === 0 ? (
                  <div className="ak-text-muted ak-text-sm">No products found.</div>
                ) : (
                  <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--border-color-light)", borderRadius: 8 }}>
                    {availableProducts.map((p) => (
                      <label
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--border-color-light)",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                        />
                        <span style={{ flex: 1 }}>{p.name}</span>
                        <span className="ak-text-muted ak-text-sm">{p.sku}</span>
                        <span className="ak-text-sm" style={{ fontWeight: 500 }}>₹{p.price}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setShowProductsModal(false)}>
                Close
              </button>
              <button
                type="button"
                className="ak-btn ak-btn--primary"
                onClick={addSelectedProducts}
                disabled={loadingProducts || selectedProductIds.size === 0}
              >
                Add selected ({selectedProductIds.size})
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
              <h2 className="ak-modal__title">Delete Featured Deal</h2>
              <button type="button" className="ak-modal__close" onClick={() => setDeleteId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>Are you sure you want to delete this featured deal? This cannot be undone.</p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
