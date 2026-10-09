import { useEffect, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { api } from "../api/client";
import type { Banner, BannerType, BannerResourceType } from "../types";
import "../styles/banner-setup.css";

interface CategoryOption {
  id: string;
  name: string;
}

const bannerTypeOptions: { value: "all" | BannerType; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "Carousel", label: "Carousel" },
  { value: "2 X 2 Banner", label: "2 X 2 Banner" },
  { value: "Custom Banner", label: "Custom Banner" },
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
  /** server-side key returned from upload, used on submit */
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
  if (!value) return "-";
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
  const [filterType, setFilterType] = useState<"all" | BannerType>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

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

  const currentTypeLabel = bannerTypeOptions.find(o => o.value === filterType)?.label ?? "All Types";

  // Debounce search so we don't spam the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
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
          .filter(c => c.id && c.name);
        setCategories(opts);
      } catch {
        // Leave categories empty; the form will require loading them before submit.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Initial load + reload on search/filter change
  useEffect(() => {
    loadBanners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterType]);

  async function loadBanners() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await api.getBanners({
        search: debouncedSearch || undefined,
        bannerType: filterType !== "all" ? filterType : undefined,
        limit: 100,
      });
      const list = response?.data ?? [];
      setBanners(Array.isArray(list) ? list : []);
    } catch (err) {
      setBanners([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }

  // The server already filters by search + bannerType, so the table just renders the API response.
  const filteredBanners = banners;

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!filterDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".status-dropdown")) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterDropdownOpen]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  async function togglePublished(id: string) {
    const target = banners.find(b => b.id === id);
    if (!target) return;
    const next = !target.published;
    // Optimistic update
    setBanners(prev => prev.map(b => b.id === id ? { ...b, published: next } : b));
    try {
      await api.toggleBannerPublished(id, next);
      toast.success(`Banner ${next ? "published" : "unpublished"}`);
    } catch (err) {
      // Revert
      setBanners(prev => prev.map(b => b.id === id ? { ...b, published: !next } : b));
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
    setForm(prev => ({ ...prev, imageFile: file, imagePreview: localPreview, imageKey: "" }));

    // Upload to the storage provider and replace the local blob with the server URL.
    setUploading(true);
    try {
      const result = await api.uploadFile(file, "banners");
      setForm(prev => ({ ...prev, imageKey: result.key, imagePreview: result.url }));
      URL.revokeObjectURL(localPreview);
    } catch (err) {
      setForm(prev => ({ ...prev, imageFile: null, imagePreview: "", imageKey: "" }));
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
    setForm(prev => ({ ...prev, imageFile: null, imagePreview: "", imageKey: "" }));
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
        payload.resource = categories.find(c => c.id === form.categoryId)?.name ?? "";
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

  return (
    <div className="banner-setup-container">
      <div className="banner-card">
        <div className="banner-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search banners by type, position, resource…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <div className="status-dropdown">
              <button
                type="button"
                className="status-dropdown-trigger"
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              >
                <span>{currentTypeLabel}</span>
                <svg className={`chevron ${filterDropdownOpen ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>
              {filterDropdownOpen && (
                <div className="status-dropdown-menu">
                  {bannerTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`status-dropdown-item ${filterType === option.value ? "active" : ""}`}
                      onClick={() => {
                        setFilterType(option.value);
                        setFilterDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-add" onClick={openAddModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Banner
            </button>
          </div>
        </div>

        <div className="banner-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading banners…</p>
            </div>
          ) : loadError ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p>Could not load banners: {loadError}</p>
              <button
                type="button"
                className="btn-add"
                onClick={loadBanners}
                style={{ marginTop: "12px" }}
              >
                Retry
              </button>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </div>
              <p>No banners yet. Add your first banner to get started.</p>
            </div>
          ) : (
          <table className="banner-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Image</th>
                <th>Banner Type</th>
                <th>Position</th>
                <th>Resource Type</th>
                <th>Resource</th>
                <th>Created</th>
                <th>Published</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.map((banner, index) => (
                <tr key={banner.id}>
                  <td>{index + 1}</td>
                  <td>
                    <img src={banner.imageUrl} alt="" className="banner-thumb" />
                  </td>
                  <td>
                    <span className={`banner-type-pill banner-type-${banner.bannerType.replace(/\s+/g, "-").toLowerCase()}`}>
                      {banner.bannerType}
                    </span>
                  </td>
                  <td>
                    {banner.position !== "-" ? (
                      <span className="position-link">{banner.position}</span>
                    ) : (
                      <span className="muted-text">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`resource-type-pill resource-${banner.resourceType.toLowerCase()}`}>
                      {banner.resourceType}
                    </span>
                  </td>
                  <td>
                    {banner.resourceType === "Custom" ? (
                      isValidUrl(banner.resource) ? (
                        <a
                          href={banner.resource}
                          target="_blank"
                          rel="noreferrer"
                          className="resource-link"
                        >
                          {banner.resource}
                        </a>
                      ) : (
                        <span className="resource-link">{banner.resource}</span>
                      )
                    ) : (
                      <span className="resource-category">{banner.resource}</span>
                    )}
                  </td>
                  <td>
                    <span className="muted-text">{formatDate(banner.createdAt)}</span>
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={banner.published}
                        onChange={() => togglePublished(banner.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-edit"
                        title="Edit"
                        onClick={() => openEditModal(banner)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        title="Delete"
                        onClick={() => handleDelete(banner)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Edit Banner" : "Add New Banner"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Banner Type *</label>
                <select
                  value={form.bannerType}
                  onChange={(e) => setForm({ ...form, bannerType: e.target.value as BannerType })}
                >
                  <option value="">Select banner type</option>
                  <option value="Carousel">Carousel</option>
                  <option value="2 X 2 Banner">2 X 2 Banner</option>
                  <option value="Custom Banner">Custom Banner</option>
                </select>
              </div>
              <div className="form-group">
                <label>Resource Type *</label>
                <select
                  value={form.resourceType}
                  onChange={(e) => setForm({ ...form, resourceType: e.target.value as BannerResourceType, resource: "", categoryId: "" })}
                >
                  <option value="">Select resource type</option>
                  <option value="Custom">Custom</option>
                  <option value="Category">Category</option>
                </select>
              </div>
              {form.resourceType === "Category" && (
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.resourceType === "Custom" && (
                <div className="form-group">
                  <label>Resource URL *</label>
                  <input
                    type="text"
                    placeholder="https://arafine.co/collections/..."
                    value={form.resource}
                    onChange={(e) => setForm({ ...form, resource: e.target.value })}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Position</label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                >
                  <option value="">No specific position</option>
                  {positionOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Banner Image *</label>
                <div
                  className={`upload-area ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {form.imagePreview ? (
                    <div className="upload-preview">
                      <img src={form.imagePreview} alt="Preview" />
                      {!uploading && (
                        <button
                          type="button"
                          className="upload-replace"
                          onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        >
                          Remove
                        </button>
                      )}
                      {uploading && (
                        <div className="upload-overlay">
                          <div className="spinner small" />
                          <span>Uploading…</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                      <p>Click to upload or drag and drop</p>
                      <p className="upload-hint">JPG, PNG, or WEBP — up to 5 MB</p>
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
              <div className="form-group form-group-row">
                <label htmlFor="banner-published-toggle">
                  Published
                  <span className="muted-text" style={{ marginLeft: 6, fontWeight: 400 }}>
                    {form.published ? "Live on storefront" : "Saved as draft"}
                  </span>
                </label>
                <label className="toggle-switch">
                  <input
                    id="banner-published-toggle"
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {formError && <div className="form-error">{formError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-reset" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button className="btn-submit" onClick={handleSubmit} disabled={submitting || uploading}>
                {submitting ? "Saving…" : uploading ? "Uploading…" : (editingId ? "Save Changes" : "Add Banner")}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete banner?</h2>
              <button className="modal-close" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                This will permanently remove the <strong>{confirmDelete.bannerType}</strong> banner
                {confirmDelete.position !== "-" ? ` at "${confirmDelete.position}"` : ""}.
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-reset" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</button>
              <button className="btn-submit btn-danger" onClick={confirmDeleteBanner} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
