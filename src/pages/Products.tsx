import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { formatPrice, getProductStatusColor } from "../utils/format";
import type { Product, Category } from "../types";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    }
    catch (error) {
      console.error("Failed to load products:", error);
    }
    finally {
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
      }
      catch (error) {
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await api.deleteProduct(id);
      loadProducts();
    }
    catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Products</h1>
        <Link to="/products/new" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </Link>
      </header>
      <div className="page-content">
        {/* Filters */}
        <div className="search-filters">
          <form onSubmit={handleSearch} className="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="loading">Loading...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">No products found</td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#f3f4f6",
                                borderRadius: "4px",
                              }}
                            />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>{product.category?.name || "-"}</td>
                      <td>
                        <div>
                          <div>{formatPrice(product.pricePaise)}</div>
                          {product.compareAtPricePaise && (
                            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textDecoration: "line-through" }}>
                              {formatPrice(product.compareAtPricePaise)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            color: product.stockQuantity <= product.lowStockThreshold ? "#ef4444" : "inherit",
                            fontWeight: product.stockQuantity <= product.lowStockThreshold ? 600 : 400,
                          }}
                        >
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${getProductStatusColor(product.status)}20`,
                            color: getProductStatusColor(product.status),
                          }}
                        >
                          {product.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Link to={`/products/${product.id}`} className="btn btn-secondary btn-sm">
                            Edit
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  className={page === pageNum ? "active" : ""}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
