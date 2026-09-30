import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import * as XLSX from "xlsx";
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
  description: string | null;
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

export default function ProductList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      if (showExportDropdown) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showExportDropdown]);

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
      const response = await api.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
      });
      setProducts(response.data || []);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
    } catch (error) {
      console.error("Failed to load products:", error);
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

  async function toggleFeatured(product: Product) {
    try {
      await api.updateProduct(product.id, { isFeatured: !product.isFeatured });
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p)
      );
    } catch (error) {
      console.error("Failed to update featured status:", error);
    }
  }

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
      await loadProducts();
      closeDeleteModal();
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      alert(error.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function handleExport(exportAll: boolean) {
    setShowExportDropdown(false);
    if (exportAll) {
      handleExportAll();
    } else {
      handleExportCurrentPage();
    }
  }

  function handleExportCurrentPage() {
    const exportData = products.map((product, index) => ({
      "SL": startIndex + index + 1,
      "Product Name": product.name,
      "SKU": product.sku,
      "Category": product.category?.name || "",
      "Unit Price": formatPrice(product.pricePaise),
      "Stock": product.stockQuantity,
      "Status": product.status,
      "Featured": product.isFeatured ? "Yes" : "No",
      "Created At": new Date(product.createdAt).toLocaleDateString(),
    }));
    downloadExcel(exportData, "products-page");
  }

  async function handleExportAll() {
    setExporting(true);
    try {
      // Fetch all products (large limit)
      const response = await api.getProducts({ page: 1, limit: 10000 });
      const allProducts = response.data || [];
      
      const exportData = allProducts.map((product: Product, index: number) => ({
        "SL": index + 1,
        "Product Name": product.name,
        "SKU": product.sku,
        "Category": product.category?.name || "",
        "Unit Price": formatPrice(product.pricePaise),
        "Stock": product.stockQuantity,
        "Status": product.status,
        "Featured": product.isFeatured ? "Yes" : "No",
        "Created At": new Date(product.createdAt).toLocaleDateString(),
      }));
      downloadExcel(exportData, "products-all");
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Failed to export products");
    } finally {
      setExporting(false);
    }
  }

  function downloadExcel(data: any[], filenamePrefix: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 35 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `${filenamePrefix}-${date}.xlsx`);
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
            <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
              <button 
                className="btn-export"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={exporting}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {exporting ? "Exporting..." : "Export"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, marginLeft: 4 }}>
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>
              {showExportDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 100,
                  minWidth: 180,
                  overflow: "hidden",
                }}>
                  <button
                    onClick={() => handleExport(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#374151",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    Current Page ({products.length})
                  </button>
                  <button
                    onClick={() => handleExport(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#374151",
                      textAlign: "left",
                      borderTop: "1px solid #e2e8f0",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    All Data ({totalItems})
                  </button>
                </div>
              )}
            </div>
            <button className="btn-add" onClick={() => navigate("/products-module/add-new")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add New Product
            </button>
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
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Status</th>
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
                        <span className="name">{product.name}</span>
                        <span className="id">SKU: {product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "#6366f1", fontWeight: 500 }}>
                      {product.category?.name || "-"}
                    </span>
                  </td>
                  <td>{formatPrice(product.pricePaise)}</td>
                  <td>
                    <span className={`stock-badge ${product.stockQuantity === 0 ? "out" : product.stockQuantity <= product.lowStockThreshold ? "low" : "in"}`}>
                      {product.stockQuantity}
                      {product.stockQuantity === 0 && <span className="stock-label">Out</span>}
                      {product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold && <span className="stock-label">Low</span>}
                    </span>
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={product.isFeatured} 
                      onChange={() => toggleFeatured(product)}
                      style={{ cursor: "pointer", width: 18, height: 18 }}
                    />
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
                      <button className="btn-action btn-icon-view" title="View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4f46e5" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="#4f46e5" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action btn-icon-edit" 
                        title="Edit"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action btn-icon-delete" 
                        title="Delete"
                        onClick={() => openDeleteModal(product)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem" }}>
                    {debouncedSearch ? "No products found" : "No products yet. Click 'Add New Product' to create one."}
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
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete <strong>{deletingProduct.name}</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
