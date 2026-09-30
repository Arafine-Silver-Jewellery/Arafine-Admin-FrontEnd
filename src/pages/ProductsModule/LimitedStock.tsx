import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import "../../styles/products-module.css";

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
  pricePaise: number;
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Add stock modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addStockQuantity, setAddStockQuantity] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  // Debounce search input
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
    } finally {
      setLoading(false);
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  async function toggleStatus(product: Product) {
    try {
      const newStatus = product.status === "active" ? "inactive" : "active";
      await api.updateProduct(product.id, { status: newStatus });
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p)
      );
    } catch (error) {
      console.error("Failed to update product status:", error);
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
      
      // Reload products - item might be removed from list if stock > threshold
      await loadProducts();
      closeAddStockModal();
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast.error("Failed to update stock");
    } finally {
      setUpdating(false);
    }
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  return (
    <div className="products-module-container">
      <div className="products-card">
        <div className="products-toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Product Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div className="toolbar-actions">
            <select 
              className="sort-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        <div className="products-table-container">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>Loading products...</div>
          ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Product Name</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Threshold</th>
                <th>Active Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id}>
                  <td>{startIndex + index + 1}</td>
                  <td>
                    <div className="product-name-cell">
                      {product.images && product.images[0] ? (
                        <img src={product.images[0].url} alt="" className="product-thumb" />
                      ) : (
                        <div className="product-thumb-placeholder" />
                      )}
                      <div className="product-info">
                        <span className="name link">{product.name}</span>
                        <span className="id">SKU: {product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td>{formatPrice(product.pricePaise)}</td>
                  <td>
                    <span className="quantity-badge">
                      <span className={`stock-value ${product.stockQuantity === 0 ? "out-of-stock" : "low-stock"}`}>
                        {product.stockQuantity}
                      </span>
                      <button 
                        className="btn-add-qty"
                        onClick={() => openAddStockModal(product)}
                        title="Add Stock"
                      >
                        +
                      </button>
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "#f59e0b", fontWeight: 500 }}>
                      {product.lowStockThreshold}
                    </span>
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={product.status === "active"}
                        onChange={() => toggleStatus(product)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-action btn-icon-barcode" 
                        title="Barcode"
                        onClick={() => navigate(`/products-module/barcode/${product.id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="2" height="16" fill="#6b7280"/>
                          <rect x="7" y="4" width="1" height="16" fill="#6b7280"/>
                          <rect x="10" y="4" width="3" height="16" fill="#6b7280"/>
                          <rect x="15" y="4" width="1" height="16" fill="#6b7280"/>
                          <rect x="18" y="4" width="2" height="16" fill="#6b7280"/>
                          <rect x="22" y="4" width="1" height="16" fill="#6b7280"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action btn-icon-view" 
                        title="View"
                        onClick={() => navigate(`/products-module/view/${product.id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action btn-icon-edit" 
                        title="Edit"
                        onClick={() => navigate(`/products-module/edit/${product.id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    {debouncedSearch 
                      ? "No products found" 
                      : "No products with limited stock. All products have sufficient inventory!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="pagination-container" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}>
            <div className="pagination-info" style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              fontSize: "0.875rem",
              color: "#64748b",
            }}>
              <span>Showing {startIndex + 1} to {endIndex} of {totalItems} entries</span>
            </div>

            <div className="pagination-buttons" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: currentPage === 1 ? "#f1f5f9" : "#fff",
                  color: currentPage === 1 ? "#94a3b8" : "#374151",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: currentPage === 1 ? "#f1f5f9" : "#fff",
                  color: currentPage === 1 ? "#94a3b8" : "#374151",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    style={{
                      padding: "0.5rem 0.875rem",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: currentPage === pageNum ? "#3b82f6" : "#e2e8f0",
                      background: currentPage === pageNum ? "#3b82f6" : "#fff",
                      color: currentPage === pageNum ? "#fff" : "#374151",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: currentPage === pageNum ? 600 : 400,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: currentPage === totalPages ? "#f1f5f9" : "#fff",
                  color: currentPage === totalPages ? "#94a3b8" : "#374151",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: currentPage === totalPages ? "#f1f5f9" : "#fff",
                  color: currentPage === totalPages ? "#94a3b8" : "#374151",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeAddStockModal}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Add Stock</h3>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>
              {selectedProduct.name}
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
              Current Stock: <strong>{selectedProduct.stockQuantity}</strong>
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Quantity to Add
              </label>
              <input
                type="number"
                min="1"
                value={addStockQuantity || ""}
                onChange={(e) => setAddStockQuantity(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
                placeholder="Enter quantity"
                autoFocus
              />
              {addStockQuantity > 0 && (
                <p style={{ fontSize: "0.875rem", color: "#22c55e", marginTop: "0.5rem" }}>
                  New stock will be: <strong>{selectedProduct.stockQuantity + addStockQuantity}</strong>
                </p>
              )}
            </div>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={closeAddStockModal} disabled={updating}>
                Cancel
              </button>
              <button 
                className="btn-delete" 
                onClick={handleAddStock} 
                disabled={updating || addStockQuantity <= 0}
                style={{ 
                  background: "#22c55e",
                  opacity: addStockQuantity <= 0 ? 0.5 : 1,
                }}
              >
                {updating ? "Updating..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
