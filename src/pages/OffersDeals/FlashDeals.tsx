import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "../../components";
import { api } from "../../api/client";
import type { FlashDeal, FlashDealProductInfo, CreateFlashDealInput } from "../../types";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

// SVG Icons
const icons = {
  flash: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  calendar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
  view: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "upcoming", label: "Upcoming" },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
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
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Fetch flash deals
  const fetchFlashDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getFlashDeals({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter as "active" | "expired" | "upcoming" : undefined,
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

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

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
  async function handleDelete() {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await api.deleteFlashDeal(deleteId);
      setDeleteId(null);
      fetchFlashDeals();
    } catch (error) {
      console.error("Failed to delete flash deal:", error);
    } finally {
      setDeleting(false);
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

  // Get status display
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

  // Table columns
  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: FlashDeal, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "deal",
      header: "Flash Deal",
      render: (deal: FlashDeal) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {deal.bannerImageUrl ? (
            <img
              src={deal.bannerImageUrl}
              alt={deal.title}
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid var(--border-color-light)",
              }}
            />
          ) : (
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                background: "var(--color-pearl)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          )}
          <div>
            <span style={{ fontWeight: 600, display: "block", color: "var(--text-strong)" }}>{deal.title}</span>
            {deal.description && (
              <span className="ak-text-muted ak-text-sm" style={{ 
                display: "block", 
                maxWidth: "200px", 
                overflow: "hidden", 
                textOverflow: "ellipsis", 
                whiteSpace: "nowrap" 
              }}>
                {deal.description}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (deal: FlashDeal) => (
        <div className="ak-text-sm">
          <div style={{ fontWeight: 500 }}>{formatDate(deal.startsAt)}</div>
          <div className="ak-text-muted">to {formatDate(deal.endsAt)}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (deal: FlashDeal) => {
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
      key: "products",
      header: "Products",
      width: "100px",
      align: "center" as const,
      render: (deal: FlashDeal) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            background: deal.activeProductsCount > 0 ? "var(--color-champagne-gold-light, #fef3e0)" : "var(--color-pearl)",
            color: deal.activeProductsCount > 0 ? "var(--color-champagne-gold)" : "var(--text-muted)",
            borderRadius: "20px",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {icons.package}
          {deal.activeProductsCount}
        </span>
      ),
    },
    {
      key: "publish",
      header: "Published",
      width: "100px",
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
      header: "Actions",
      width: "160px",
      render: (deal: FlashDeal) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn"
            title="Manage Products"
            onClick={(e) => {
              e.stopPropagation();
              openProductsModal(deal);
            }}
            style={{ background: "var(--color-champagne-gold-light, #fef3e0)", color: "var(--color-champagne-gold)" }}
          >
            {icons.package}
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
      {/* Stats Grid */}
      {stats && (
        <div className="product-report-stats-grid">
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon blue">{icons.flash}</div>
            <div className="product-report-stat-content">
              <h2>{stats.totalDeals}</h2>
              <p>Total Deals</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon green">{icons.check}</div>
            <div className="product-report-stat-content">
              <h2>{stats.activeDeals}</h2>
              <p>Active Deals</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon orange">{icons.clock}</div>
            <div className="product-report-stat-content">
              <h2>{stats.expiredDeals}</h2>
              <p>Expired Deals</p>
            </div>
          </div>
          <div className="product-report-stat-card">
            <div className="product-report-stat-icon teal">{icons.calendar}</div>
            <div className="product-report-stat-content">
              <h2>{stats.upcomingDeals}</h2>
              <p>Upcoming Deals</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="table-card">
        <div className="table-header">
          <h3>
            Flash Deals <span className="count">{totalItems}</span>
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
            <button className="btn-export" onClick={openAddModal}>
              {icons.plus}
              Add Flash Deal
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={flashDeals}
          loading={loading}
          emptyIcon="bell"
          emptyTitle="No flash deals found"
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
                {icons.close}
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

                <div className="ak-form-grid ak-form-grid--3" style={{ alignItems: "end" }}>
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
                  <div className="ak-form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "8px" }}>
                    <label className="ak-toggle">
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
          <div className="ak-modal" style={{ maxWidth: "750px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">
                Manage Products — {productsModalDeal.title}
              </h2>
              <button
                type="button"
                className="ak-modal__close"
                onClick={() => setShowProductsModal(false)}
              >
                {icons.close}
              </button>
            </div>
            <div className="ak-modal__body" style={{ maxHeight: "60vh", overflow: "auto" }}>
              {/* Current Products */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--text-strong)" }}>
                  Current Products ({dealProducts.length})
                </h3>
                {dealProducts.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", background: "var(--color-pearl)", borderRadius: "8px" }}>
                    <p className="ak-text-muted">No products added yet. Add products from below.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {dealProducts.map((product) => (
                      <div key={product.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        background: "var(--surface)",
                        border: "1px solid var(--border-color-light)",
                        borderRadius: "8px",
                      }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          flexShrink: 0,
                          borderRadius: "6px",
                          overflow: "hidden",
                          background: "var(--color-pearl)",
                        }}>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                              {icons.package}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                            <span>SKU: {product.sku}</span>
                            <span>{formatPaise(product.pricePaise)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ak-icon-btn ak-icon-btn--delete"
                          onClick={() => removeProduct(product.id)}
                          disabled={loadingProducts}
                          title="Remove"
                        >
                          {icons.close}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Products */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-strong)", margin: 0 }}>
                    Add Products
                  </h3>
                  {selectedProductIds.size > 0 && (
                    <button
                      type="button"
                      className="ak-btn ak-btn--primary"
                      onClick={addSelectedProducts}
                      disabled={loadingProducts}
                      style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                    >
                      {icons.plus}
                      Add {selectedProductIds.size} Product{selectedProductIds.size > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
                <div className="search-box" style={{ marginBottom: "12px" }}>
                  {icons.search}
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                {loadingProducts ? (
                  <div style={{ padding: "24px", textAlign: "center" }}>
                    <span className="ak-spinner" style={{ width: "24px", height: "24px" }} />
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", background: "var(--color-pearl)", borderRadius: "8px" }}>
                    <p className="ak-text-muted">No available products found.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflow: "auto" }}>
                      {availableProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => toggleProductSelection(product.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            background: selectedProductIds.has(product.id) ? "var(--color-champagne-gold-light, #fef3e0)" : "var(--surface)",
                            border: `1px solid ${selectedProductIds.has(product.id) ? "var(--color-champagne-gold)" : "var(--border-color-light)"}`,
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: "18px", height: "18px", accentColor: "var(--color-champagne-gold)" }}
                          />
                          <div style={{
                            width: "48px",
                            height: "48px",
                            flexShrink: 0,
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "var(--color-pearl)",
                          }}>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                {icons.package}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                              <span>SKU: {product.sku}</span>
                              <span>{formatPaise(product.pricePaise)}</span>
                              <span>Stock: {product.stockQuantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="ak-modal-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Flash Deal?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setDeleteId(null)} disabled={deleting}>
                {icons.close}
              </button>
            </div>
            <div className="ak-modal__body">
              <p style={{ margin: 0 }}>
                Are you sure you want to delete this flash deal? This action cannot be undone.
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
    </div>
  );
}
