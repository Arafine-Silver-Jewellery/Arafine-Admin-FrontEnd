import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable, StatusDropdown } from "../../components";
import { api } from "../../api/client";
import type { FlashDeal, FlashDealProductInfo, CreateFlashDealInput } from "../../types";
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

function formatDateRange(startsAt: string, endsAt: string): string {
  return `${formatDate(startsAt)} - ${formatDate(endsAt)}`;
}

function formatDateForInput(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
}

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

type Stats = {
  totalDeals: number;
  activeDeals: number;
  expiredDeals: number;
  upcomingDeals: number;
  totalProducts: number;
};

export default function FlashDeals() {
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FlashDeal | null>(null);
  const [formData, setFormData] = useState<CreateFlashDealInput>({
    title: "",
    description: "",
    bannerImageUrl: "",
    startsAt: "",
    endsAt: "",
    isPublished: true,
    productIds: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Products modal
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [productsModalDeal, setProductsModalDeal] = useState<FlashDeal | null>(null);
  const [availableProducts, setAvailableProducts] = useState<FlashDealProductInfo[]>([]);
  const [dealProducts, setDealProducts] = useState<FlashDealProductInfo[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch flash deals
  const fetchFlashDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getFlashDeals({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter as "active" | "expired" | "upcoming" | undefined || undefined,
      });
      setFlashDeals(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch flash deals:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchFlashDeals();
  }, [fetchFlashDeals]);

  // Open form modal
  function openAddModal() {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);

    setEditingDeal(null);
    setFormData({
      title: "",
      description: "",
      bannerImageUrl: "",
      startsAt: now.toISOString().slice(0, 16),
      endsAt: endDate.toISOString().slice(0, 16),
      isPublished: true,
      productIds: [],
    });
    setImagePreview("");
    setFormErrors({});
    setShowFormModal(true);
  }

  function openEditModal(deal: FlashDeal) {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description || "",
      bannerImageUrl: deal.bannerImageUrl || "",
      startsAt: formatDateForInput(deal.startsAt),
      endsAt: formatDateForInput(deal.endsAt),
      isPublished: deal.isPublished,
      productIds: deal.productIds,
    });
    setImagePreview(deal.bannerImageUrl || "");
    setFormErrors({});
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
    setEditingDeal(null);
    // Clean up blob URL if any
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
  }

  // Image upload handlers
  async function handleFileSelect(file: File | null) {
    if (!file) return;
    
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFormErrors((prev) => ({ ...prev, image: "Unsupported file type. Use JPG, PNG, or WEBP." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((prev) => ({ ...prev, image: "File is larger than 5 MB." }));
      return;
    }
    setFormErrors((prev) => {
      const { image, ...rest } = prev;
      return rest;
    });

    // Clean up previous blob URL
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    // Upload to S3
    setUploading(true);
    try {
      const result = await api.uploadFile(file, "flash-deals");
      setFormData((prev) => ({ ...prev, bannerImageUrl: result.url }));
      setImagePreview(result.url);
      URL.revokeObjectURL(localPreview);
    } catch (err) {
      setImagePreview("");
      setFormData((prev) => ({ ...prev, bannerImageUrl: "" }));
      setFormErrors((prev) => ({ ...prev, image: err instanceof Error ? err.message : "Upload failed" }));
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelect(e.target.files?.[0] ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  }

  function clearImage() {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
    setFormData((prev) => ({ ...prev, bannerImageUrl: "" }));
  }

  // Validate form
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

  // Submit form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload: CreateFlashDealInput = {
        ...formData,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
      };

      if (editingDeal) {
        await api.updateFlashDeal(editingDeal.id, payload);
      } else {
        await api.createFlashDeal(payload);
      }

      closeFormModal();
      fetchFlashDeals();
    } catch (error: any) {
      console.error("Failed to save flash deal:", error);
      setFormErrors({ submit: error.message || "Failed to save flash deal" });
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle publish
  async function togglePublish(deal: FlashDeal) {
    try {
      await api.toggleFlashDealPublish(deal.id);
      fetchFlashDeals();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  }

  // Delete deal
  async function handleDelete(deal: FlashDeal) {
    if (!window.confirm(`Delete flash deal "${deal.title}"?`)) return;

    try {
      await api.deleteFlashDeal(deal.id);
      fetchFlashDeals();
    } catch (error) {
      console.error("Failed to delete flash deal:", error);
    }
  }

  // Products modal
  async function openProductsModal(deal: FlashDeal) {
    setProductsModalDeal(deal);
    setProductSearch("");
    setSelectedProductIds(new Set());
    setShowProductsModal(true);

    try {
      setLoadingProducts(true);
      const [dealResponse, availableResponse] = await Promise.all([
        api.getFlashDeal(deal.id, true),
        api.getAvailableFlashDealProducts(deal.id, { limit: 50 }),
      ]);
      setDealProducts(dealResponse.products || []);
      setAvailableProducts(availableResponse.data);
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
      const response = await api.getAvailableFlashDealProducts(productsModalDeal.id, {
        search: search || undefined,
        limit: 50,
      });
      setAvailableProducts(response.data);
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
      const updated = await api.addFlashDealProducts(productsModalDeal.id, Array.from(selectedProductIds));
      setDealProducts(updated.products || []);
      setSelectedProductIds(new Set());
      // Refresh available products
      const availableResponse = await api.getAvailableFlashDealProducts(productsModalDeal.id, {
        search: productSearch || undefined,
        limit: 50,
      });
      setAvailableProducts(availableResponse.data);
      fetchFlashDeals();
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
      const updated = await api.removeFlashDealProducts(productsModalDeal.id, [productId]);
      setDealProducts(updated.products || []);
      // Refresh available products
      const availableResponse = await api.getAvailableFlashDealProducts(productsModalDeal.id, {
        search: productSearch || undefined,
        limit: 50,
      });
      setAvailableProducts(availableResponse.data);
      fetchFlashDeals();
    } catch (error) {
      console.error("Failed to remove product:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: FlashDeal, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "title",
      header: "Title",
      render: (deal: FlashDeal) => (
        <span className="ak-text-link" style={{ fontWeight: 600 }}>{deal.title}</span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (deal: FlashDeal) => (
        <span className="ak-text-muted">{formatDateRange(deal.startsAt, deal.endsAt)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (deal: FlashDeal) => {
        const colorMap = {
          active: "success",
          expired: "danger",
          upcoming: "info",
        } as const;
        return (
          <span className={`ak-status ak-status--${colorMap[deal.status]}`}>
            <span className="ak-status__dot" />
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "activeProducts",
      header: "Active Products",
      width: "130px",
      align: "center" as const,
      render: (deal: FlashDeal) => (
        <span className={`ak-status ak-status--${deal.activeProductsCount > 0 ? "info" : "neutral"}`}>
          <span className="ak-status__dot" />
          {deal.activeProductsCount}
        </span>
      ),
    },
    {
      key: "publish",
      header: "Publish",
      width: "80px",
      render: (deal: FlashDeal) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={deal.isPublished}
            onChange={() => togglePublish(deal)}
          />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "180px",
      render: (deal: FlashDeal) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-btn ak-btn--ghost ak-btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              openProductsModal(deal);
            }}
          >
            + Add Product
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
              handleDelete(deal);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
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
            Flash Deals
            {stats && <span className="ak-page-header__count">{stats.totalDeals}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage time-limited flash sale deals</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Flash Deal
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="ak-stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="ak-stat-card">
            <div className="ak-stat-card__label">Total Deals</div>
            <div className="ak-stat-card__value">{stats.totalDeals}</div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-card__label">Active</div>
            <div className="ak-stat-card__value ak-text-success">{stats.activeDeals}</div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-card__label">Expired</div>
            <div className="ak-stat-card__value ak-text-danger">{stats.expiredDeals}</div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-card__label">Upcoming</div>
            <div className="ak-stat-card__value ak-text-info">{stats.upcomingDeals}</div>
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
                  placeholder="Search by Title…"
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
              onChange={setStatusFilter}
              placeholder="All Status"
              size="sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={flashDeals}
          loading={loading}
          emptyIcon="bell"
          emptyTitle="No flash deals"
          emptyDescription="Create your first flash deal to offer limited-time discounts."
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
                {editingDeal ? "Edit Flash Deal" : "Add Flash Deal"}
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
                    placeholder="Enter flash deal title"
                  />
                  {formErrors.title && <span style={{ color: "#c62828", fontSize: "0.75rem" }}>{formErrors.title}</span>}
                </div>

                <div className="ak-form-group">
                  <label className="ak-label">Description</label>
                  <textarea
                    className="ak-input ak-textarea"
                    rows={3}
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description (optional)"
                    style={{ minHeight: "80px", resize: "vertical" }}
                  />
                </div>

                <div className="ak-form-group">
                  <label className="ak-label">Banner Image</label>
                  <div
                    className={`ak-upload-area ${dragOver ? "ak-upload-area--dragover" : ""} ${uploading ? "ak-upload-area--uploading" : ""}`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="ak-upload-area__preview">
                        <img src={imagePreview} alt="Preview" />
                        {!uploading && (
                          <button
                            type="button"
                            className="ak-upload-area__remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearImage();
                            }}
                          >
                            Remove
                          </button>
                        )}
                        {uploading && (
                          <div className="ak-upload-area__overlay">
                            <span className="ak-spinner" />
                            <span>Uploading…</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ak-upload-area__placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21,15 16,10 5,21" />
                        </svg>
                        <p>Click to upload or drag and drop</p>
                        <p className="ak-text-muted ak-text-sm">JPG, PNG, or WEBP — up to 5 MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInput}
                    style={{ display: "none" }}
                  />
                  {formErrors.image && <span style={{ color: "#c62828", fontSize: "0.75rem" }}>{formErrors.image}</span>}
                </div>

                <div className="ak-form-grid ak-form-grid--2">
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

                <div className="ak-form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label className="ak-toggle" style={{ marginRight: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    <span className="ak-toggle__slider" />
                  </label>
                  <span className="ak-label" style={{ marginBottom: 0 }}>Published</span>
                </div>
              </div>
              <div className="ak-modal__footer">
                <button type="button" className="ak-btn ak-btn--ghost" onClick={closeFormModal} disabled={submitting || uploading}>
                  Cancel
                </button>
                <button type="submit" className="ak-btn ak-btn--primary" disabled={submitting || uploading}>
                  {submitting ? "Saving..." : uploading ? "Uploading..." : editingDeal ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && productsModalDeal && (
        <div className="ak-modal-overlay" onClick={() => setShowProductsModal(false)}>
          <div className="ak-modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">
                Manage Products - {productsModalDeal.title}
              </h2>
              <button
                type="button"
                className="ak-modal__close"
                onClick={() => setShowProductsModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body" style={{ maxHeight: "60vh", overflow: "auto" }}>
              {/* Current Products */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Current Products ({dealProducts.length})
                </h3>
                {dealProducts.length === 0 ? (
                  <p className="ak-text-muted">No products added yet.</p>
                ) : (
                  <div className="ak-product-list">
                    {dealProducts.map((product) => (
                      <div key={product.id} className="ak-product-item">
                        <div className="ak-product-item__image">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} />
                          ) : (
                            <div className="ak-product-item__placeholder">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ak-product-item__info">
                          <div className="ak-product-item__name">{product.name}</div>
                          <div className="ak-product-item__meta">
                            <span>SKU: {product.sku}</span>
                            <span>{formatPaise(product.pricePaise)}</span>
                            <span>Stock: {product.stockQuantity}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ak-icon-btn ak-icon-btn--delete"
                          onClick={() => removeProduct(product.id)}
                          disabled={loadingProducts}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Products */}
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Add Products
                </h3>
                <div className="ak-searchbar" style={{ marginBottom: "1rem" }}>
                  <div className="ak-searchbar__form">
                    <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      className="ak-searchbar__input"
                      placeholder="Search products by name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>

                {loadingProducts ? (
                  <div className="ak-text-muted" style={{ padding: "1rem", textAlign: "center" }}>
                    Loading...
                  </div>
                ) : availableProducts.length === 0 ? (
                  <p className="ak-text-muted">No available products found.</p>
                ) : (
                  <>
                    <div className="ak-product-list">
                      {availableProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`ak-product-item ak-product-item--selectable ${
                            selectedProductIds.has(product.id) ? "ak-product-item--selected" : ""
                          }`}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <div className="ak-product-item__checkbox">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="ak-product-item__image">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} />
                            ) : (
                              <div className="ak-product-item__placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ak-product-item__info">
                            <div className="ak-product-item__name">{product.name}</div>
                            <div className="ak-product-item__meta">
                              <span>SKU: {product.sku}</span>
                              <span>{formatPaise(product.pricePaise)}</span>
                              <span>Stock: {product.stockQuantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedProductIds.size > 0 && (
                      <div style={{ marginTop: "1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          className="ak-btn ak-btn--primary"
                          onClick={addSelectedProducts}
                          disabled={loadingProducts}
                        >
                          Add {selectedProductIds.size} Product{selectedProductIds.size > 1 ? "s" : ""}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="ak-modal__footer">
              <button
                type="button"
                className="ak-btn ak-btn--ghost"
                onClick={() => setShowProductsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ak-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .ak-stat-card {
          background: var(--ak-surface);
          border: 1px solid var(--ak-border);
          border-radius: 8px;
          padding: 1rem 1.25rem;
        }
        .ak-stat-card__label {
          font-size: 0.875rem;
          color: var(--ak-text-secondary);
          margin-bottom: 0.25rem;
        }
        .ak-stat-card__value {
          font-size: 1.5rem;
          font-weight: 600;
        }
        .ak-text-success { color: var(--ak-success); }
        .ak-text-danger { color: var(--ak-danger); }
        .ak-text-info { color: var(--ak-info); }

        .ak-product-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .ak-product-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--ak-surface);
          border: 1px solid var(--ak-border);
          border-radius: 8px;
        }
        .ak-product-item--selectable {
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .ak-product-item--selectable:hover {
          border-color: var(--ak-primary);
        }
        .ak-product-item--selected {
          border-color: var(--ak-primary);
          background: var(--ak-primary-light, rgba(59, 130, 246, 0.05));
        }
        .ak-product-item__checkbox {
          flex-shrink: 0;
        }
        .ak-product-item__image {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          background: var(--ak-bg);
        }
        .ak-product-item__image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ak-product-item__placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ak-text-secondary);
        }
        .ak-product-item__placeholder svg {
          width: 24px;
          height: 24px;
        }
        .ak-product-item__info {
          flex: 1;
          min-width: 0;
        }
        .ak-product-item__name {
          font-weight: 500;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ak-product-item__meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--ak-text-secondary);
        }

        @media (max-width: 768px) {
          .ak-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
