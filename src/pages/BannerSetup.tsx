import { useEffect, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { api } from "../api/client";
import type { Banner, BannerType, BannerResourceType } from "../types";
import { DataTable, StatusDropdown } from "../components";
import "../styles/ui-kit.css";

interface CategoryOption {
  id: string;
  name: string;
}

const bannerTypeFilterOptions = [
  { value: "", label: "All Types", color: "neutral" as const },
  { value: "Carousel", label: "Carousel", color: "info" as const },
  { value: "2 X 2 Banner", label: "2 X 2 Banner", color: "success" as const },
  { value: "Custom Banner", label: "Custom Banner", color: "warning" as const },
];

const positionOptions = ["Shop The Look", "Festive Edit", "Bridal Collection", "Gold Drops", "Top Strip", "Footer Strip"];

interface FormState {
  bannerType: BannerType | "";
  resourceType: BannerResourceType | "";
  resource: string;
  categoryId: string;
  position: string;
  imageFile: File | null;
  imagePreview: string;
  imageKey: string;
  published: boolean;
}

const emptyForm: FormState = {
  bannerType: "",
  resourceType: "",
  resource: "",
  categoryId: "",
  position: "",
  imageFile: null,
  imagePreview: "",
  imageKey: "",
  published: false,
};

function formatDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BannerSetup() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load categories once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.getAllCategories();
        if (cancelled || !Array.isArray(list)) return;
        const opts: CategoryOption[] = list
          .map((c: any) => ({ id: String(c.id ?? c._id ?? ""), name: String(c.name ?? "") }))
          .filter((c) => c.id && c.name);
        setCategories(opts);
      } catch {
        // Leave categories empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load banners on search/filter change
  useEffect(() => {
    loadBanners();
  }, [debouncedSearch, filterType, currentPage]);

  async function loadBanners() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await api.getBanners({
        search: debouncedSearch || undefined,
        bannerType: filterType || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      const list = response?.data ?? [];
      setBanners(Array.isArray(list) ? list : []);
      setTotalItems(response?.pagination?.total || list.length || 0);
      setTotalPages(response?.pagination?.totalPages || Math.ceil((response?.pagination?.total || list.length || 0) / itemsPerPage));
    } catch (err) {
      setBanners([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }

  // Clean up object URL + reset form when modal closes
  useEffect(() => {
    if (showModal) return;
    if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(form.imagePreview);
    }
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setUploading(false);
    setSubmitting(false);
  }, [showModal]);

  async function togglePublished(id: string) {
    const target = banners.find((b) => b.id === id);
    if (!target) return;
    const next = !target.published;
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, published: next } : b)));
    try {
      await api.toggleBannerPublished(id, next);
      toast.success(`Banner ${next ? "published" : "unpublished"}`);
    } catch (err) {
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, published: !next } : b)));
      toast.error(err instanceof Error ? err.message : "Failed to update banner");
    }
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(banner: Banner) {
    setEditingId(banner.id);
    setForm({
      bannerType: banner.bannerType,
      resourceType: banner.resourceType,
      resource: banner.resource,
      categoryId: banner.categoryId ?? "",
      position: banner.position,
      imageFile: null,
      imagePreview: banner.imageUrl,
      imageKey: banner.imageKey ?? "",
      published: banner.published,
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleFileSelect(file: File | null) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFormError("Unsupported file type. Use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("File is larger than 5 MB. Please pick a smaller image.");
      return;
    }
    setFormError("");

    if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(form.imagePreview);
    }
    const localPreview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageFile: file, imagePreview: localPreview, imageKey: "" }));

    setUploading(true);
    try {
      const result = await api.uploadFile(file, "banners");
      setForm((prev) => ({ ...prev, imageKey: result.key, imagePreview: result.url }));
      URL.revokeObjectURL(localPreview);
    } catch (err) {
      setForm((prev) => ({ ...prev, imageFile: null, imagePreview: "", imageKey: "" }));
      setFormError(err instanceof Error ? err.message : "Upload failed");
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
    if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(form.imagePreview);
    }
    setForm((prev) => ({ ...prev, imageFile: null, imagePreview: "", imageKey: "" }));
  }

  function validate(): string {
    if (!form.bannerType) return "Please choose a banner type.";
    if (!form.resourceType) return "Please choose a resource type.";
    if (form.resourceType === "Custom") {
      if (!form.resource.trim()) return "Please enter a URL for the custom resource.";
      if (!/^https?:\/\//i.test(form.resource.trim())) return "Custom resource must start with http:// or https://";
    } else if (form.resourceType === "Category") {
      if (!form.categoryId) return "Please choose a category.";
    }
    if (!form.imagePreview) return "Please upload a banner image.";
    if (!editingId && !form.imageKey) return "Image upload is still in progress.";
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
      const payload: any = {
        bannerType: form.bannerType,
        resourceType: form.resourceType,
        position: form.position || "-",
        imageKey: form.imageKey,
        imageUrl: form.imagePreview,
        published: form.published,
      };
      if (form.resourceType === "Custom") {
        payload.resource = form.resource.trim();
      } else {
        payload.categoryId = form.categoryId;
        payload.resource = categories.find((c) => c.id === form.categoryId)?.name ?? "";
      }

      if (editingId) {
        await api.updateBanner(editingId, payload);
        toast.success("Banner updated");
      } else {
        await api.createBanner(payload);
        toast.success("Banner added");
      }
      setShowModal(false);
      await loadBanners();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save banner");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(banner: Banner) {
    setConfirmDelete(banner);
  }

  async function confirmDeleteBanner() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setDeleting(true);
    try {
      await api.deleteBanner(target.id);
      toast.success(`Banner deleted (${target.bannerType})`);
      setConfirmDelete(null);
      await loadBanners();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete banner");
    } finally {
      setDeleting(false);
    }
  }

  function isValidUrl(value: string) {
    return /^https?:\/\//i.test(value);
  }

  function getBannerTypeColor(type: string): "info" | "success" | "warning" | "neutral" {
    switch (type) {
      case "Carousel":
        return "info";
      case "2 X 2 Banner":
        return "success";
      case "Custom Banner":
        return "warning";
      default:
        return "neutral";
    }
  }

  function getResourceTypeColor(type: string): "info" | "success" | "neutral" {
    switch (type) {
      case "Custom":
        return "info";
      case "Category":
        return "success";
      default:
        return "neutral";
    }
  }

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: Banner, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "image",
      header: "Image",
      width: "100px",
      render: (banner: Banner) => (
        <img
          src={banner.imageUrl}
          alt=""
          style={{
            width: 80,
            height: 50,
            objectFit: "cover",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
          }}
        />
      ),
    },
    {
      key: "bannerType",
      header: "Banner Type",
      render: (banner: Banner) => (
        <span className={`ak-status ak-status--${getBannerTypeColor(banner.bannerType)}`}>
          <span className="ak-status__dot" />
          {banner.bannerType}
        </span>
      ),
    },
    {
      key: "position",
      header: "Position",
      render: (banner: Banner) =>
        banner.position !== "-" ? (
          <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>{banner.position}</span>
        ) : (
          <span className="ak-text-muted">—</span>
        ),
    },
    {
      key: "resourceType",
      header: "Resource Type",
      render: (banner: Banner) => (
        <span className={`ak-status ak-status--${getResourceTypeColor(banner.resourceType)}`}>
          <span className="ak-status__dot" />
          {banner.resourceType}
        </span>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      render: (banner: Banner) =>
        banner.resourceType === "Custom" ? (
          isValidUrl(banner.resource) ? (
            <a
              href={banner.resource}
              target="_blank"
              rel="noreferrer"
              className="ak-text-link"
              style={{ maxWidth: 150, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {banner.resource}
            </a>
          ) : (
            <span className="ak-text-muted">{banner.resource}</span>
          )
        ) : (
          <span style={{ fontWeight: 500 }}>{banner.resource}</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      width: "110px",
      render: (banner: Banner) => <span className="ak-text-muted">{formatDate(banner.createdAt)}</span>,
    },
    {
      key: "published",
      header: "Published",
      width: "90px",
      render: (banner: Banner) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={banner.published} onChange={() => togglePublished(banner.id)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: (banner: Banner) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(banner);
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
              handleDelete(banner);
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
            Banner Setup
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage promotional banners for your storefront</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Banner
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
                  placeholder="Search banners by type, position, resource…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown
              options={bannerTypeFilterOptions}
              value={filterType}
              onChange={setFilterType}
              placeholder="All Types"
              size="sm"
            />
          </div>
        </div>

        {/* Data Table */}
        {loadError ? (
          <div className="ak-card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--color-danger)", marginBottom: 16 }}>Could not load banners: {loadError}</p>
            <button type="button" className="ak-btn ak-btn--primary" onClick={loadBanners}>
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={banners}
            loading={loading}
            loadingText="Loading banners…"
            emptyIcon="image"
            emptyTitle="No banners yet"
            emptyDescription="Add your first banner to get started."
            emptyAction={{ label: "Add Banner", onClick: openAddModal }}
            keyExtractor={(banner) => banner.id}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="ak-modal-overlay" onClick={closeModal}>
          <div className="ak-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">{editingId ? "Edit Banner" : "Add New Banner"}</h2>
              <button type="button" className="ak-modal__close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-form-group">
                <label className="ak-label">Banner Type *</label>
                <select
                  className="ak-select"
                  value={form.bannerType}
                  onChange={(e) => setForm({ ...form, bannerType: e.target.value as BannerType })}
                >
                  <option value="">Select banner type</option>
                  <option value="Carousel">Carousel</option>
                  <option value="2 X 2 Banner">2 X 2 Banner</option>
                  <option value="Custom Banner">Custom Banner</option>
                </select>
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Resource Type *</label>
                <select
                  className="ak-select"
                  value={form.resourceType}
                  onChange={(e) =>
                    setForm({ ...form, resourceType: e.target.value as BannerResourceType, resource: "", categoryId: "" })
                  }
                >
                  <option value="">Select resource type</option>
                  <option value="Custom">Custom</option>
                  <option value="Category">Category</option>
                </select>
              </div>

              {form.resourceType === "Category" && (
                <div className="ak-form-group">
                  <label className="ak-label">Category *</label>
                  <select
                    className="ak-select"
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.resourceType === "Custom" && (
                <div className="ak-form-group">
                  <label className="ak-label">Resource URL *</label>
                  <input
                    type="text"
                    className="ak-input"
                    placeholder="https://arafine.co/collections/..."
                    value={form.resource}
                    onChange={(e) => setForm({ ...form, resource: e.target.value })}
                  />
                </div>
              )}

              <div className="ak-form-group">
                <label className="ak-label">Position</label>
                <select className="ak-select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                  <option value="">No specific position</option>
                  {positionOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ak-form-group">
                <label className="ak-label">Banner Image *</label>
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
                  {form.imagePreview ? (
                    <div className="ak-upload-area__preview">
                      <img src={form.imagePreview} alt="Preview" />
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
              </div>

              <div className="ak-form-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label className="ak-label" style={{ marginBottom: 0 }}>
                    Published
                  </label>
                  <span className="ak-text-muted ak-text-sm">{form.published ? "Live on storefront" : "Saved as draft"}</span>
                </div>
                <label className="ak-toggle">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                  <span className="ak-toggle__slider" />
                </label>
              </div>

              {formError && (
                <div className="ak-alert ak-alert--danger" style={{ marginTop: 16 }}>
                  {formError}
                </div>
              )}
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit} disabled={submitting || uploading}>
                {submitting ? "Saving…" : uploading ? "Uploading…" : editingId ? "Save Changes" : "Add Banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="ak-modal-overlay" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Banner?</h2>
              <button type="button" className="ak-modal__close" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                This will permanently remove the <strong>{confirmDelete.bannerType}</strong> banner
                {confirmDelete.position !== "-" ? ` at "${confirmDelete.position}"` : ""}. This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={confirmDeleteBanner} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
