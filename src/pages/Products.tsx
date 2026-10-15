import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatPrice } from "../utils/format";
import { DataTable, StatusDropdown, FilterDrawer } from "../components";
import type { Product, Category } from "../types";
import "../styles/ui-kit.css";

const statusOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "inactive", label: "Inactive", color: "neutral" as const },
  { value: "out_of_stock", label: "Out of Stock", color: "danger" as const },
  { value: "discontinued", label: "Discontinued", color: "warning" as const },
];

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Temp filters for drawer
  const [tempCategoryFilter, setTempCategoryFilter] = useState("");
  const [tempStatusFilter, setTempStatusFilter] = useState("");

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await api.getProducts({
        page,
        limit: 20,
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      setProducts(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [page, categoryFilter, statusFilter]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await api.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadProducts();
  }

  function openFilterDrawer() {
    setTempCategoryFilter(categoryFilter);
    setTempStatusFilter(statusFilter);
    setShowFilterDrawer(true);
  }

  function applyFilters() {
    setCategoryFilter(tempCategoryFilter);
    setStatusFilter(tempStatusFilter);
    setPage(1);
    setShowFilterDrawer(false);
  }

  function resetFilters() {
    setTempCategoryFilter("");
    setTempStatusFilter("");
    setCategoryFilter("");
    setStatusFilter("");
    setPage(1);
    setShowFilterDrawer(false);
  }

  const activeFilterCount = [categoryFilter, statusFilter].filter(Boolean).length;

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  }

  function getStatusVariant(status: string): string {
    const map: Record<string, string> = {
      active: "success",
      inactive: "neutral",
      out_of_stock: "danger",
      discontinued: "warning",
    };
    return map[status] || "neutral";
  }

  const categoryOptions = [
    { value: "", label: "All Categories", color: "neutral" as const },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      color: "brand" as const,
    })),
  ];

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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
          )}
          <span className="ak-product-cell__name">{product.name}</span>
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      render: (product: Product) => <code className="ak-code">{product.sku}</code>,
    },
    {
      key: "category",
      header: "Category",
      render: (product: Product) => product.category?.name || "—",
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
      render: (product: Product) => {
        const isLow = product.stockQuantity <= product.lowStockThreshold;
        return (
          <span className={`ak-stock ${isLow ? "ak-stock--low" : ""}`}>
            {product.stockQuantity}
            {isLow && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (product: Product) => (
        <span className={`ak-status ak-status--${getStatusVariant(product.status)}`}>
          <span className="ak-status__dot" />
          {product.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "120px",
      render: (product: Product) => (
        <div className="ak-row-actions">
          <Link
            to={`/products/${product.id}`}
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit"
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(product.id, product.name);
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
      {/* Page Header */}
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Products
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage your product catalog</p>
        </div>
        <div className="ak-page-header__actions">
          <Link to="/products/new" className="ak-btn ak-btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
        <div className="ak-toolbar">
          <form onSubmit={handleSearch} className="ak-toolbar__search">
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </form>

          <div className="ak-toolbar__filters">
            <StatusDropdown
              options={categoryOptions}
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
              placeholder="All Categories"
              size="sm"
              showDot={false}
            />

            <StatusDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder="All Status"
              size="sm"
            />

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="ak-btn ak-btn--ghost ak-btn--sm"
                onClick={() => {
                  setCategoryFilter("");
                  setStatusFilter("");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="ak-toolbar__actions">
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={openFilterDrawer}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <circle cx="4" cy="12" r="2" />
                <circle cx="12" cy="10" r="2" />
                <circle cx="20" cy="14" r="2" />
              </svg>
              Filters
              {activeFilterCount > 0 && <span className="ak-page-header__count">{activeFilterCount}</span>}
            </button>
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
          emptyDescription={
            search || categoryFilter || statusFilter
              ? "Try adjusting your filters or search query."
              : "Get started by adding your first product."
          }
          keyExtractor={(product) => product.id}
          onRowClick={(product) => navigate(`/products/${product.id}`)}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={setPage}
        />
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Products"
        onApply={applyFilters}
        onReset={resetFilters}
      >
        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Category</label>
          <StatusDropdown
            options={categoryOptions}
            value={tempCategoryFilter}
            onChange={setTempCategoryFilter}
            placeholder="All Categories"
            showDot={false}
          />
        </div>

        <div className="ak-filter-field">
          <label className="ak-filter-field__label">Status</label>
          <StatusDropdown
            options={statusOptions}
            value={tempStatusFilter}
            onChange={setTempStatusFilter}
            placeholder="All Status"
          />
        </div>
      </FilterDrawer>
    </div>
  );
}
