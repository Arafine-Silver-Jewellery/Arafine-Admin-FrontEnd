import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { api } from "../api/client";
import type { Banner, BannerType, BannerResourceType, Product } from "../types";
import { DataTable, StatusDropdown } from "../components";
import "../styles/ui-kit.css";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
}

const BANNER_TYPES: BannerType[] = [
  "Main Banner",
  "Popup Banner",
  "Footer Banner",
  "Main Section Banner",
  "Header Banner",
  "Sidebar Banner",
  "Top Side Banner",
  "2x2 Banner",
  "Mobile view Banner",
  "Custom Banner",
  "Carousel",
];

const RESOURCE_TYPES: BannerResourceType[] = ["Product", "Category", "Shop", "Brand", "Custom"];

const bannerTypeFilterOptions = [
  { value: "", label: "All Types", color: "neutral" as const },
  { value: "Main Banner", label: "Main Banner", color: "info" as const },
  { value: "Popup Banner", label: "Popup Banner", color: "success" as const },
  { value: "Footer Banner", label: "Footer Banner", color: "warning" as const },
  { value: "Carousel", label: "Carousel", color: "info" as const },
  { value: "Custom Banner", label: "Custom Banner", color: "warning" as const },
];

interface FormState {
  bannerType: BannerType | "";
  resourceType: BannerResourceType | "";
  resource: string;
  categoryId: string;
  productId: string;
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
  productId: "",
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

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Product Dropdown Component
// ─────────────────────────────────────────────────────────────────────────────
interface SearchableProductSelectProps {
  value: string;
  onChange: (productId: string, productName: string) => void;
  products: ProductOption[];
  loading: boolean;
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function SearchableProductSelect({
  value,
  onChange,
  products,
  loading,
  onSearch,
  placeholder = "Search and select a product...",
  disabled = false,
}: SearchableProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find((p) => p.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onSearch(val);
  };

  const handleSelect = (product: ProductOption) => {
    onChange(product.id, product.name);
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setSearch("");
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setOpen(!open);
    }
  };

  return (
    <div className="product-select" ref={containerRef}>
      <div
        className={`product-select__trigger ${open ? "product-select__trigger--open" : ""} ${disabled ? "product-select__trigger--disabled" : ""}`}
        onClick={handleTriggerClick}
      >
        {selectedProduct ? (
          <div className="product-select__value">
            {selectedProduct.imageUrl && (
              <img src={selectedProduct.imageUrl} alt="" className="product-select__thumb" />
            )}
            <div className="product-select__value-text">
              <span className="product-select__name">{selectedProduct.name}</span>
              <span className="product-select__sku">{selectedProduct.sku}</span>
            </div>
            {!disabled && (
              <button type="button" className="product-select__clear" onClick={handleClear} title="Clear selection">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <span className="product-select__placeholder">{placeholder}</span>
        )}
        <svg className="product-select__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>

      {open && (
        <div className="product-select__dropdown">
          <div className="product-select__search">
            <svg className="product-select__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Type to search products..."
              className="product-select__search-input"
            />
          </div>
          <div className="product-select__list">
            {loading ? (
              <div className="product-select__status">
                <span className="ak-spinner ak-spinner--sm" />
                Searching...
              </div>
            ) : products.length === 0 ? (
              <div className="product-select__status product-select__status--empty">
                {search ? "No products found" : "Type to search products"}
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className={`product-select__item ${product.id === value ? "product-select__item--active" : ""}`}
                  onClick={() => handleSelect(product)}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="product-select__item-thumb" />
                  ) : (
                    <div className="product-select__item-thumb product-select__item-thumb--placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="product-select__item-info">
                    <span className="product-select__item-name">{product.name}</span>
                    <span className="product-select__item-sku">{product.sku}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .product-select {
          position: relative;
          width: 100%;
        }

        .product-select__trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 8px 12px;
          background: var(--bg-primary, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .product-select__trigger:hover:not(.product-select__trigger--disabled) {
          border-color: var(--color-primary, #b78d3f);
        }

        .product-select__trigger--open {
          border-color: var(--color-primary, #b78d3f);
          box-shadow: 0 0 0 3px rgba(183, 141, 63, 0.15);
        }

        .product-select__trigger--disabled {
          background: var(--bg-secondary, #f9fafb);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .product-select__placeholder {
          flex: 1;
          color: var(--text-muted, #9ca3af);
          font-size: 0.9375rem;
        }

        .product-select__value {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .product-select__thumb {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .product-select__value-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .product-select__name {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary, #1f2937);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-select__sku {
          font-size: 0.75rem;
          color: var(--text-muted, #9ca3af);
        }

        .product-select__clear {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          padding: 0;
          background: var(--bg-secondary, #f3f4f6);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          color: var(--text-muted, #6b7280);
          flex-shrink: 0;
          transition: background 150ms ease, color 150ms ease;
        }

        .product-select__clear:hover {
          background: var(--color-danger, #ef4444);
          color: white;
        }

        .product-select__chevron {
          flex-shrink: 0;
          color: var(--text-muted, #9ca3af);
          transition: transform 200ms ease;
        }

        .product-select__trigger--open .product-select__chevron {
          transform: rotate(180deg);
        }

        .product-select__dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: var(--bg-primary, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          overflow: hidden;
        }

        .product-select__search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          background: var(--bg-secondary, #f9fafb);
        }

        .product-select__search-icon {
          flex-shrink: 0;
          color: var(--text-muted, #9ca3af);
        }

        .product-select__search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.9375rem;
          color: var(--text-primary, #1f2937);
          outline: none;
        }

        .product-select__search-input::placeholder {
          color: var(--text-muted, #9ca3af);
        }

        .product-select__list {
          max-height: 280px;
          overflow-y: auto;
          padding: 6px;
        }

        .product-select__status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px 16px;
          color: var(--text-muted, #6b7280);
          font-size: 0.875rem;
        }

        .product-select__item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 150ms ease;
        }

        .product-select__item:hover {
          background: var(--bg-secondary, #f3f4f6);
        }

        .product-select__item--active {
          background: rgba(183, 141, 63, 0.1);
        }

        .product-select__item--active:hover {
          background: rgba(183, 141, 63, 0.15);
        }

        .product-select__item-thumb {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .product-select__item-thumb--placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary, #f3f4f6);
          color: var(--text-muted, #9ca3af);
        }

        .product-select__item-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .product-select__item-name {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary, #1f2937);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-select__item-sku {
          font-size: 0.75rem;
          color: var(--text-muted, #9ca3af);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
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
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

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

  // Search products with debounce
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    setProductsLoading(true);
    try {
      const response = await api.getProducts({ search: query, limit: 20, status: "active" });
      const list = response?.data ?? [];
      const opts: ProductOption[] = list.map((p: Product) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        imageUrl: p.images?.[0]?.url ?? null,
      }));
      setProducts(opts);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Debounced product search
  const productSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleProductSearch = (query: string) => {
    if (productSearchTimeout.current) {
      clearTimeout(productSearchTimeout.current);
    }
    productSearchTimeout.current = setTimeout(() => {
      searchProducts(query);
    }, 300);
  };

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
    setProducts([]);
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
    setProducts([]);
    setShowModal(true);
  }

  function openEditModal(banner: Banner) {
    setEditingId(banner.id);
    setForm({
      bannerType: banner.bannerType,
      resourceType: banner.resourceType,
      resource: banner.resource,
      categoryId: banner.categoryId ?? "",
      productId: banner.productId ?? "",
      imageFile: null,
      imagePreview: banner.imageUrl,
      imageKey: banner.imageKey ?? "",
      published: banner.published,
    });
    setFormError("");
    // If editing a product banner, load the product info
    if (banner.resourceType === "Product" && banner.productId) {
      setProducts([{
        id: banner.productId,
        name: banner.resource,
        sku: "",
        imageUrl: null,
      }]);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setFormError("");
    setProducts([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    
    if (form.resourceType === "Product") {
      if (!form.productId) return "Please select a product.";
    } else if (form.resourceType === "Category") {
      if (!form.categoryId) return "Please choose a category.";
    } else if (form.resourceType === "Custom" || form.resourceType === "Shop") {
      if (!form.resource.trim()) return `Please enter a URL for the ${form.resourceType.toLowerCase()} resource.`;
      if (!/^https?:\/\//i.test(form.resource.trim())) return "URL must start with http:// or https://";
    } else if (form.resourceType === "Brand") {
      if (!form.resource.trim()) return "Please enter a brand name.";
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
        position: "-",
        imageKey: form.imageKey,
        imageUrl: form.imagePreview,
        published: form.published,
      };

      // Set resource based on resource type
      if (form.resourceType === "Product") {
        payload.productId = form.productId;
        payload.resource = form.resource; // Product name
      } else if (form.resourceType === "Category") {
        payload.categoryId = form.categoryId;
        payload.resource = categories.find((c) => c.id === form.categoryId)?.name ?? "";
      } else if (form.resourceType === "Custom" || form.resourceType === "Shop") {
        payload.resource = form.resource.trim();
      } else if (form.resourceType === "Brand") {
        payload.resource = form.resource.trim();
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
      case "Main Banner":
      case "Carousel":
        return "info";
      case "Popup Banner":
      case "Header Banner":
        return "success";
      case "Footer Banner":
      case "Custom Banner":
        return "warning";
      default:
        return "neutral";
    }
  }

  function getResourceTypeColor(type: string): "info" | "success" | "warning" | "neutral" {
    switch (type) {
      case "Product":
        return "info";
      case "Category":
        return "success";
      case "Shop":
        return "warning";
      case "Brand":
        return "info";
      case "Custom":
        return "neutral";
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
        banner.resourceType === "Custom" || banner.resourceType === "Shop" ? (
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
                  placeholder="Search banners by type, resource…"
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
            keyExtractor={(banner) => banner.id}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Add/Edit Modal - Two Column Layout                                      */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="ak-modal-overlay" onClick={closeModal}>
          <div 
            className="ak-modal banner-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="banner-modal__header">
              <h2 className="banner-modal__title">{editingId ? "Edit Banner" : "Add New Banner"}</h2>
              <button type="button" className="banner-modal__close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="ak-modal__body">
              <div className="banner-modal__grid">
                {/* ─── Left Column: Form Fields ─── */}
                <div className="banner-modal__form">
                  <div className="ak-form-group">
                    <label className="ak-label">Banner Type *</label>
                    <select
                      className="ak-select"
                      value={form.bannerType}
                      onChange={(e) => setForm({ ...form, bannerType: e.target.value as BannerType })}
                    >
                      <option value="">Select banner type</option>
                      {BANNER_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ak-form-group">
                    <label className="ak-label">Resource Type *</label>
                    <select
                      className="ak-select"
                      value={form.resourceType}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          resourceType: e.target.value as BannerResourceType,
                          resource: "",
                          categoryId: "",
                          productId: "",
                        })
                      }
                    >
                      <option value="">Select resource type</option>
                      {RESOURCE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Resource Field */}
                  {form.resourceType === "Product" && (
                    <div className="ak-form-group">
                      <label className="ak-label">Product *</label>
                      <SearchableProductSelect
                        value={form.productId}
                        onChange={(productId, productName) => {
                          setForm({ ...form, productId, resource: productName });
                        }}
                        products={products}
                        loading={productsLoading}
                        onSearch={handleProductSearch}
                        placeholder="Search and select a product..."
                      />
                    </div>
                  )}

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
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.resourceType === "Shop" && (
                    <div className="ak-form-group">
                      <label className="ak-label">Shop URL *</label>
                      <input
                        type="text"
                        className="ak-input"
                        placeholder="https://shop.example.com/..."
                        value={form.resource}
                        onChange={(e) => setForm({ ...form, resource: e.target.value })}
                      />
                    </div>
                  )}

                  {form.resourceType === "Brand" && (
                    <div className="ak-form-group">
                      <label className="ak-label">Brand Name *</label>
                      <input
                        type="text"
                        className="ak-input"
                        placeholder="Enter brand name"
                        value={form.resource}
                        onChange={(e) => setForm({ ...form, resource: e.target.value })}
                      />
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

                  {/* Published Toggle */}
                  <div className="banner-modal__published">
                    <div className="banner-modal__published-info">
                      <span className="banner-modal__published-label">Published</span>
                      <span className="banner-modal__published-hint">
                        {form.published ? "Live on storefront" : "Saved as draft"}
                      </span>
                    </div>
                    <label className="ak-toggle">
                      <input
                        type="checkbox"
                        checked={form.published}
                        onChange={(e) => setForm({ ...form, published: e.target.checked })}
                      />
                      <span className="ak-toggle__slider" />
                    </label>
                  </div>
                </div>

                {/* ─── Right Column: Image Upload ─── */}
                <div className="banner-modal__image">
                  <div className="banner-modal__image-header">
                    <label className="ak-label">Banner Image *</label>
                    <span className="banner-modal__ratio">Ratio 3:1</span>
                  </div>
                  <div
                    className={`banner-modal__upload ${dragOver ? "banner-modal__upload--dragover" : ""} ${uploading ? "banner-modal__upload--uploading" : ""}`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {form.imagePreview ? (
                      <div className="banner-modal__preview">
                        <img src={form.imagePreview} alt="Preview" />
                        {!uploading && (
                          <button
                            type="button"
                            className="banner-modal__preview-remove"
                            onClick={(e) => { e.stopPropagation(); clearImage(); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Remove
                          </button>
                        )}
                        {uploading && (
                          <div className="banner-modal__preview-uploading">
                            <span className="ak-spinner" />
                            <span>Uploading…</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="banner-modal__upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21,15 16,10 5,21" />
                        </svg>
                        <p className="banner-modal__upload-text">Click to upload or drag and drop</p>
                        <p className="banner-modal__upload-hint">JPG, PNG, or WEBP — up to 5 MB</p>
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
              </div>

              {formError && (
                <div className="ak-alert ak-alert--danger" style={{ marginTop: 20 }}>
                  {formError}
                </div>
              )}
            </div>

            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={resetForm} disabled={submitting}>
                Reset
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="ak-btn ak-btn--ghost" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit} disabled={submitting || uploading}>
                  {submitting ? "Saving…" : uploading ? "Uploading…" : editingId ? "Save Changes" : "Save"}
                </button>
              </div>
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
                This will permanently remove the <strong>{confirmDelete.bannerType}</strong> banner. This action cannot be undone.
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

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Banner Modal Scoped Styles                                              */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <style>{`
        .banner-modal {
          max-width: 820px;
          width: 92vw;
        }

        .banner-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .banner-modal__title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
          margin: 0;
        }

        .banner-modal__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-muted, #6b7280);
          cursor: pointer;
          transition: background 150ms ease, color 150ms ease;
        }

        .banner-modal__close:hover {
          background: var(--bg-secondary, #f3f4f6);
          color: var(--text-primary, #1f2937);
        }

        .banner-modal__close svg {
          width: 20px;
          height: 20px;
        }

        .banner-modal__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        @media (max-width: 680px) {
          .banner-modal__grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        .banner-modal__form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .banner-modal__published {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-secondary, #f9fafb);
          border-radius: 10px;
          margin-top: 8px;
        }

        .banner-modal__published-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .banner-modal__published-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
        }

        .banner-modal__published-hint {
          font-size: 0.75rem;
          color: var(--text-muted, #6b7280);
        }

        .banner-modal__image {
          display: flex;
          flex-direction: column;
        }

        .banner-modal__image-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .banner-modal__ratio {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--text-muted, #6b7280);
          background: var(--bg-secondary, #f3f4f6);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .banner-modal__upload {
          flex: 1;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--border-color, #e5e7eb);
          border-radius: 12px;
          background: var(--bg-secondary, #fafafa);
          cursor: pointer;
          transition: border-color 200ms ease, background 200ms ease;
        }

        .banner-modal__upload:hover {
          border-color: var(--color-primary, #b78d3f);
          background: rgba(183, 141, 63, 0.04);
        }

        .banner-modal__upload--dragover {
          border-color: var(--color-primary, #b78d3f);
          background: rgba(183, 141, 63, 0.08);
        }

        .banner-modal__upload--uploading {
          pointer-events: none;
          opacity: 0.7;
        }

        .banner-modal__upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
          color: var(--text-muted, #9ca3af);
        }

        .banner-modal__upload-placeholder svg {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .banner-modal__upload-text {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary, #374151);
          margin: 0 0 4px;
        }

        .banner-modal__upload-hint {
          font-size: 0.8125rem;
          color: var(--text-muted, #9ca3af);
          margin: 0;
        }

        .banner-modal__preview {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }

        .banner-modal__preview img {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
        }

        .banner-modal__preview-remove {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 150ms ease;
        }

        .banner-modal__preview-remove:hover {
          background: var(--color-danger, #ef4444);
        }

        .banner-modal__preview-uploading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.85);
          border-radius: 12px;
          font-size: 0.875rem;
          color: var(--text-muted, #6b7280);
        }
      `}</style>
    </div>
  );
}
