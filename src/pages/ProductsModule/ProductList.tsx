import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { DataTable, StatusDropdown } from "../../components";
import * as XLSX from "xlsx";
import "../../styles/ui-kit.css";

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  isVisible: boolean;
  isFeatured: boolean;
  category: Category | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const, path: "/products-module" },
  { value: "active", label: "Active", color: "success" as const, path: "/products-module/active" },
  { value: "inactive", label: "Inactive", color: "neutral" as const, path: "/products-module/inactive" },
  { value: "out_of_stock", label: "Out of Stock", color: "danger" as const, path: "/products-module/out-of-stock" },
];

export default function ProductList({ filter = "" }: { filter?: "" | "active" | "inactive" | "out_of_stock" }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive" | "out_of_stock">(filter);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync filter prop -> state when route changes
  useEffect(() => {
    setStatusFilter(filter);
    setCurrentPage(1);
  }, [filter]);

  // Load products
  useEffect(() => {
    loadProducts();
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  // Clear selection on data change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  // Rows stay on screen while a refetch is in flight, so a stale response
  // landing last would be visible. This sequence number lets us drop any
  // response a newer request has already superseded.
  const requestSeq = useRef(0);

  async function loadProducts() {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const response = await api.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter === "out_of_stock" ? undefined : statusFilter || undefined,
        stock: statusFilter === "out_of_stock" ? "out" : undefined,
      });

      if (seq !== requestSeq.current) return;

      setProducts(response.data || []);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
    } catch (error) {
      if (seq !== requestSeq.current) return;
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }

  // Bulk selection functions
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(products.map((p) => p.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function isAllSelected() {
    return products.length > 0 && products.every((p) => selectedIds.has(p.id));
  }

  async function toggleStatus(product: Product) {
    try {
      const newStatus = product.status === "active" ? "inactive" : "active";
      await api.updateProduct(product.id, { status: newStatus });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)));
      toast.success(`Product ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Failed to update product status:", error);
      toast.error("Failed to update status");
    }
  }

  async function toggleFeatured(product: Product) {
    try {
      await api.updateProduct(product.id, { isFeatured: !product.isFeatured });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p)));
    } catch (error) {
      console.error("Failed to update featured status:", error);
      toast.error("Failed to update featured status");
    }
  }

  // Delete functions
  function openDeleteModal(product: Product) {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingProduct(null);
  }

  async function handleConfirmDelete() {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await api.deleteProduct(deletingProduct.id);
      toast.success("Product deleted successfully");
      await loadProducts();
      closeDeleteModal();
    } catch (error: unknown) {
      console.error("Failed to delete product:", error);
      toast.error((error as Error).message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  // Bulk delete functions
  function openBulkDeleteModal() {
    setShowBulkDeleteModal(true);
  }

  function closeBulkDeleteModal() {
    setShowBulkDeleteModal(false);
  }

  async function handleConfirmBulkDelete() {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const result = await api.bulkDeleteProducts(Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadProducts();
      closeBulkDeleteModal();
      if (result.errors && result.errors.length > 0) {
        toast.warning(`Deleted ${result.deletedCount} products. ${result.errors.length} failed.`);
      } else {
        toast.success(`Deleted ${result.deletedCount} products`);
      }
    } catch (error: unknown) {
      console.error("Failed to bulk delete products:", error);
      toast.error((error as Error).message || "Failed to delete products");
    } finally {
      setBulkDeleting(false);
    }
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  async function handleExport() {
    try {
      const response = await api.exportProducts();
      const allProducts = response.data || [];
      const exportData = allProducts.map((product: Product, index: number) => ({
        SL: index + 1,
        "Product Name": product.name,
        SKU: product.sku,
        Category: product.category?.name || "",
        "Price (₹)": (product.pricePaise / 100).toFixed(2),
        Stock: product.stockQuantity,
        Status: product.status,
        Featured: product.isFeatured ? "Yes" : "No",
        "Created At": new Date(product.createdAt).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, `products-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Export completed");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export products");
    }
  }

  const columns = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={isAllSelected()}
          onChange={() => (isAllSelected() ? deselectAll() : selectAll())}
          style={{ cursor: "pointer", width: 18, height: 18 }}
        />
      ),
      width: "50px",
      render: (product: Product) => (
        <input
          type="checkbox"
          checked={selectedIds.has(product.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelect(product.id);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: "pointer", width: 18, height: 18 }}
        />
      ),
    },
    {
      key: "product",
      header: "Product",
      render: (product: Product) => (
        <div className="ak-product-cell">
          {product.images && product.images[0] ? (
            <img src={product.images[0].url} alt={product.name} className="ak-product-cell__img" />
          ) : (
            <div className="ak-product-cell__placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
          )}
          <div>
            <span className="ak-product-cell__name">{product.name}</span>
            <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>SKU: {product.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (product: Product) => (
        <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>{product.category?.name || "—"}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (product: Product) => (
        <div className="ak-price-cell">
          <span className="ak-price-cell__current">{formatPrice(product.pricePaise)}</span>
          {product.compareAtPricePaise && (
            <span className="ak-price-cell__compare">{formatPrice(product.compareAtPricePaise)}</span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      width: "100px",
      render: (product: Product) => {
        const isLow = product.stockQuantity <= product.lowStockThreshold;
        const isOut = product.stockQuantity === 0;
        return (
          <span className={`ak-status ak-status--${isOut ? "danger" : isLow ? "warning" : "success"}`}>
            <span className="ak-status__dot" />
            {product.stockQuantity} {isOut ? "(Out)" : isLow ? "(Low)" : ""}
          </span>
        );
      },
    },
    {
      key: "featured",
      header: "Featured",
      width: "90px",
      render: (product: Product) => (
        <input
          type="checkbox"
          checked={product.isFeatured}
          onChange={(e) => {
            e.stopPropagation();
            toggleFeatured(product);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: "pointer", width: 18, height: 18 }}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product: Product) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={product.status === "active"} onChange={() => toggleStatus(product)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "150px",
      render: (product: Product) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn"
            title="Barcode"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products-module/barcode/${product.id}`);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="2" height="16" />
              <rect x="7" y="4" width="1" height="16" />
              <rect x="10" y="4" width="3" height="16" />
              <rect x="15" y="4" width="1" height="16" />
              <rect x="18" y="4" width="2" height="16" />
            </svg>
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--view"
            title="View"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products-module/view/${product.id}`);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products-module/edit/${product.id}`);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(product);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ak-page">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="ak-bulk-bar">
          <div className="ak-bulk-bar__info">
            <strong>{selectedIds.size}</strong> {selectedIds.size === 1 ? "product" : "products"} selected
          </div>
          <div className="ak-bulk-bar__actions">
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={deselectAll}>
              Clear Selection
            </button>
            <button type="button" className="ak-btn ak-btn--danger ak-btn--sm" onClick={openBulkDeleteModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Product List
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage all products in your inventory</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--ghost" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button type="button" className="ak-btn ak-btn--primary" onClick={() => navigate("/products-module/add-new")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Product
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
              onChange={(val) => {
                const opt = statusFilterOptions.find((o) => o.value === val);
                if (opt) navigate(opt.path);
              }}
              placeholder="All Status"
              size="sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          loadingText="Loading products…"
          emptyIcon="box"
          emptyTitle="No products found"
          emptyDescription={debouncedSearch || statusFilter ? "Try adjusting your filters." : "Add your first product to get started."}
          keyExtractor={(product) => product.id}
          onRowClick={(product) => navigate(`/products-module/view/${product.id}`)}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="ak-modal-overlay" onClick={closeDeleteModal}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Product</h2>
              <button type="button" className="ak-modal__close" onClick={closeDeleteModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                Are you sure you want to delete <strong>"{deletingProduct.name}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="ak-modal-overlay" onClick={closeBulkDeleteModal}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete {selectedIds.size} Products</h2>
              <button type="button" className="ak-modal__close" onClick={closeBulkDeleteModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>
                Are you sure you want to delete <strong>{selectedIds.size}</strong> selected products? This action cannot
                be undone.
              </p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeBulkDeleteModal} disabled={bulkDeleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleConfirmBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? "Deleting…" : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
