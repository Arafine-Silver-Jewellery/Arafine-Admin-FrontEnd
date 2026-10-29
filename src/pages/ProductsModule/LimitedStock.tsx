import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { DataTable } from "../../components";
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
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  category: Category | null;
  images: ProductImage[];
}

export default function LimitedStock() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Add stock modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addStockQuantity, setAddStockQuantity] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load products
  useEffect(() => {
    loadProducts();
  }, [currentPage, itemsPerPage, debouncedSearch]);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await api.getLimitedStockProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
      });
      setProducts(response.data || []);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
    } catch (error) {
      console.error("Failed to load limited stock products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
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

  function openAddStockModal(product: Product) {
    setSelectedProduct(product);
    setAddStockQuantity(0);
    setShowAddStockModal(true);
  }

  function closeAddStockModal() {
    setShowAddStockModal(false);
    setSelectedProduct(null);
    setAddStockQuantity(0);
  }

  async function handleAddStock() {
    if (!selectedProduct || addStockQuantity <= 0) return;

    setUpdating(true);
    try {
      const newQuantity = selectedProduct.stockQuantity + addStockQuantity;
      await api.updateProductStock(selectedProduct.id, newQuantity);
      toast.success("Stock updated successfully");
      await loadProducts();
      closeAddStockModal();
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast.error("Failed to update stock");
    } finally {
      setUpdating(false);
    }
  }

  function formatPrice(rupees: number): string {
    return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  const columns = [
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
      key: "price",
      header: "Price",
      render: (product: Product) => <span className="ak-price-cell__current">{formatPrice(product.price)}</span>,
    },
    {
      key: "quantity",
      header: "Quantity",
      width: "140px",
      render: (product: Product) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className={`ak-status ak-status--${product.stockQuantity === 0 ? "danger" : "warning"}`}>
            <span className="ak-status__dot" />
            {product.stockQuantity}
          </span>
          <button
            type="button"
            className="ak-btn ak-btn--primary ak-btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              openAddStockModal(product);
            }}
            style={{ padding: "0.25rem 0.5rem", minWidth: 0 }}
          >
            +
          </button>
        </div>
      ),
    },
    {
      key: "threshold",
      header: "Threshold",
      width: "100px",
      render: (product: Product) => (
        <span style={{ color: "var(--color-warning)", fontWeight: 500 }}>{product.lowStockThreshold}</span>
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
      width: "120px",
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
            Limited Stock
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Products running low on inventory</p>
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
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          loadingText="Loading products…"
          emptyIcon="box"
          emptyTitle="No limited stock products"
          emptyDescription="All products have sufficient inventory!"
          keyExtractor={(product) => product.id}
          onRowClick={(product) => navigate(`/products-module/view/${product.id}`)}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && selectedProduct && (
        <div className="ak-modal-overlay" onClick={closeAddStockModal}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Add Stock</h2>
              <button type="button" className="ak-modal__close" onClick={closeAddStockModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p style={{ marginBottom: "1rem" }}>
                <strong>{selectedProduct.name}</strong>
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Current Stock: <strong>{selectedProduct.stockQuantity}</strong>
              </p>
              <div className="ak-field">
                <label className="ak-field__label">Quantity to Add</label>
                <input
                  type="number"
                  className="ak-input"
                  min="1"
                  value={addStockQuantity || ""}
                  onChange={(e) => setAddStockQuantity(Number(e.target.value))}
                  placeholder="Enter quantity"
                  autoFocus
                />
                {addStockQuantity > 0 && (
                  <p style={{ fontSize: "0.875rem", color: "var(--color-success)", marginTop: "0.5rem" }}>
                    New stock will be: <strong>{selectedProduct.stockQuantity + addStockQuantity}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeAddStockModal} disabled={updating}>
                Cancel
              </button>
              <button
                type="button"
                className="ak-btn ak-btn--primary"
                onClick={handleAddStock}
                disabled={updating || addStockQuantity <= 0}
              >
                {updating ? "Updating…" : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
