import { useState, useRef, useEffect } from "react";
import { api } from "../../api/client";
import * as XLSX from "xlsx";
import "../../styles/category-setup.css";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  secondaryImageUrl: string | null;
  metaImageUrl: string | null;
  metaTitle: string | null;
  parentId: string | null;
  parent: Category | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubSubCategoryFormData {
  status: boolean;
  nameEN: string;
  parentId: string;
  priority: string;
  logo: File | null;
  logoPreview: string;
  logoUrl: string;
  metaTitle: string;
  metaDescription: string;
  metaImage: File | null;
  metaImagePreview: string;
  metaImageUrl: string;
}

const initialFormData: SubSubCategoryFormData = {
  status: true,
  nameEN: "",
  parentId: "",
  priority: "",
  logo: null,
  logoPreview: "",
  logoUrl: "",
  metaTitle: "",
  metaDescription: "",
  metaImage: null,
  metaImagePreview: "",
  metaImageUrl: "",
};

export default function SubSubCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [subSubCategories, setSubSubCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubSubCategory, setEditingSubSubCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<SubSubCategoryFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSubSubCategory, setDeletingSubSubCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Pagination state (server-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  // Load sub categories for dropdown (parent of sub-sub)
  useEffect(() => {
    loadSubCategories();
  }, []);

  // Load sub sub categories with pagination
  useEffect(() => {
    loadSubSubCategories();
  }, [currentPage, itemsPerPage, debouncedSearch]);

  async function loadSubCategories() {
    try {
      const categories = await api.getAllSubCategories();
      setSubCategories(categories);
    } catch (error) {
      console.error("Failed to load sub categories:", error);
    }
  }

  async function loadSubSubCategories() {
    setLoading(true);
    try {
      const response = await api.getSubSubCategories({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
      });
      setSubSubCategories(response.data || []);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to load sub sub categories:", error);
    } finally {
      setLoading(false);
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  function openAddModal(subSubCategory?: Category) {
    if (subSubCategory) {
      setEditingSubSubCategory(subSubCategory);
      setFormData({
        status: subSubCategory.isActive,
        nameEN: subSubCategory.name,
        parentId: subSubCategory.parentId || "",
        priority: subSubCategory.sortOrder.toString(),
        logo: null,
        logoPreview: "",
        logoUrl: subSubCategory.imageUrl || "",
        metaTitle: subSubCategory.metaTitle || "",
        metaDescription: subSubCategory.description || "",
        metaImage: null,
        metaImagePreview: "",
        metaImageUrl: subSubCategory.metaImageUrl || "",
      });
    } else {
      setEditingSubSubCategory(null);
      setFormData(initialFormData);
    }
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setEditingSubSubCategory(null);
    setFormData(initialFormData);
  }

  function handleInputChange(field: keyof SubSubCategoryFormData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleFileUpload(field: 'logo' | 'metaImage', file: File | null) {
    if (file) {
      const previewField = `${field}Preview` as keyof SubSubCategoryFormData;
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [field]: file,
          [previewField]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  function removeFile(field: 'logo' | 'metaImage') {
    const previewField = `${field}Preview` as keyof SubSubCategoryFormData;
    const urlField = `${field}Url` as keyof SubSubCategoryFormData;
    setFormData(prev => ({
      ...prev,
      [field]: null,
      [previewField]: "",
      [urlField]: "",
    }));
  }

  function handleReset() {
    if (editingSubSubCategory) {
      openAddModal(editingSubSubCategory);
    } else {
      setFormData(initialFormData);
    }
  }

  async function handleSubmit() {
    if (!formData.nameEN.trim()) {
      alert("Sub sub category name is required");
      return;
    }
    if (!formData.parentId) {
      alert("Please select a sub category");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = formData.logoUrl;
      let metaImageUrl = formData.metaImageUrl;

      if (formData.logo) {
        const result = await api.uploadFile(formData.logo, "categories");
        imageUrl = result.url;
      }

      if (formData.metaImage) {
        const result = await api.uploadFile(formData.metaImage, "categories");
        metaImageUrl = result.url;
      }

      const slug = formData.nameEN
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const subSubCategoryData = {
        name: formData.nameEN,
        slug: editingSubSubCategory?.slug || slug,
        description: formData.metaDescription || null,
        imageUrl: imageUrl || null,
        metaImageUrl: metaImageUrl || null,
        metaTitle: formData.metaTitle || null,
        parentId: formData.parentId,
        sortOrder: parseInt(formData.priority) || 0,
        isActive: formData.status,
      };

      if (editingSubSubCategory) {
        await api.updateCategory(editingSubSubCategory.id, subSubCategoryData);
      } else {
        await api.createCategory(subSubCategoryData);
      }

      await loadSubSubCategories();
      closeAddModal();
    } catch (error: any) {
      console.error("Failed to save sub sub category:", error);
      alert(error.message || "Failed to save sub sub category");
    } finally {
      setSubmitting(false);
    }
  }

  function openDeleteModal(subSubCategory: Category) {
    setDeletingSubSubCategory(subSubCategory);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingSubSubCategory(null);
  }

  async function handleConfirmDelete() {
    if (!deletingSubSubCategory) return;

    setDeleting(true);
    try {
      await api.deleteCategory(deletingSubSubCategory.id);
      await loadSubSubCategories();
      closeDeleteModal();
    } catch (error: any) {
      console.error("Failed to delete sub sub category:", error);
      alert(error.message || "Failed to delete sub sub category");
    } finally {
      setDeleting(false);
    }
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
    const exportData = subSubCategories.map((cat, index) => ({
      "SL": startIndex + index + 1,
      "Sub Sub Category Name": cat.name,
      "Sub Category": cat.parent?.name || "",
      "Slug": cat.slug,
      "Description": cat.description || "",
      "Priority": cat.sortOrder,
      "Status": cat.isActive ? "Active" : "Inactive",
      "Created At": new Date(cat.createdAt).toLocaleDateString(),
    }));
    downloadExcel(exportData, "sub-sub-categories-page");
  }

  async function handleExportAll() {
    setExporting(true);
    try {
      const allSubSubCategories = await api.getAllSubSubCategories();
      const exportData = allSubSubCategories.map((cat: Category, index: number) => ({
        "SL": index + 1,
        "Sub Sub Category Name": cat.name,
        "Sub Category": cat.parent?.name || "",
        "Slug": cat.slug,
        "Description": cat.description || "",
        "Priority": cat.sortOrder,
        "Status": cat.isActive ? "Active" : "Inactive",
        "Created At": new Date(cat.createdAt).toLocaleDateString(),
      }));
      downloadExcel(exportData, "sub-sub-categories-all");
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Failed to export sub sub categories");
    } finally {
      setExporting(false);
    }
  }

  function downloadExcel(data: any[], filenamePrefix: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sub Sub Categories");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `${filenamePrefix}-${date}.xlsx`);
  }

  return (
    <div className="category-setup-container">
      <div className="category-card">
        <div className="category-card-header">
          <div className="category-actions">
            <div className="category-actions-left">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by sub sub category name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
            </div>
            <div className="category-actions-right">
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
                      Current Page ({subSubCategories.length})
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
              <button className="btn-add" onClick={() => openAddModal()}>
                + Add Sub Sub Category
              </button>
            </div>
          </div>
        </div>

        <div className="category-table-container">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>Loading sub sub categories...</div>
          ) : (
          <table className="category-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Sub Sub Category Name</th>
                <th>Sub Category</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subSubCategories.map((subSubCat, index) => (
                <tr key={subSubCat.id}>
                  <td>{startIndex + index + 1}</td>
                  <td>
                    <div className="category-name-cell">
                      <div className="category-images">
                        {subSubCat.imageUrl && (
                          <img src={subSubCat.imageUrl} alt="" className="category-thumb" />
                        )}
                      </div>
                      <div className="category-info">
                        <span className="name">{subSubCat.name}</span>
                        <span className="id">ID #{subSubCat.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "#6366f1", fontWeight: 500 }}>
                      {subSubCat.parent?.name || "-"}
                    </span>
                  </td>
                  <td>{subSubCat.sortOrder}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-icon-edit" title="Edit" onClick={() => openAddModal(subSubCat)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button className="btn-action btn-icon-delete" title="Delete" onClick={() => openDeleteModal(subSubCat)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subSubCategories.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                    {debouncedSearch ? "No sub sub categories found" : "No sub sub categories yet. Click 'Add Sub Sub Category' to create one."}
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

      {/* Add/Edit Sub Sub Category Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="add-category-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-wide">
              <div className="modal-title-section">
                <div className="modal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h2>{editingSubSubCategory ? "Edit Sub Sub Category" : "Add New Sub Sub Category"}</h2>
                  <p>{editingSubSubCategory ? "Update sub sub category details" : "Create a new sub sub category"}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeAddModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body-wide">
              <div className="form-grid-two-col">
                <div className="form-column">
                  <div className="form-card">
                    <div className="form-card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Basic Information</span>
                    </div>
                    
                    <div className="form-row">
                      <div className="status-toggle-row-wide">
                        <div className="status-info">
                          <span className="status-label">Sub Sub Category Status</span>
                          <span className="status-hint">Enable to make visible</span>
                        </div>
                        <div className="status-toggle-wrapper">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={formData.status}
                              onChange={(e) => handleInputChange('status', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <span className={`status-badge ${formData.status ? 'active' : 'inactive'}`}>
                            {formData.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <label className="form-label">
                        Sub Category <span className="required">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.parentId}
                        onChange={(e) => handleInputChange('parentId', e.target.value)}
                      >
                        <option value="">Select sub category</option>
                        {subCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row-inline">
                      <div className="form-field flex-2">
                        <label className="form-label">
                          Sub Sub Category Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter sub sub category name"
                          value={formData.nameEN}
                          onChange={(e) => handleInputChange('nameEN', e.target.value)}
                        />
                      </div>
                      <div className="form-field flex-1">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          value={formData.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                        >
                          <option value="">Select</option>
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-card">
                    <div className="form-card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      <span>SEO Settings</span>
                      <span className="optional-badge">Optional</span>
                    </div>

                    <div className="form-row">
                      <label className="form-label">Meta Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="SEO title"
                        maxLength={50}
                        value={formData.metaTitle}
                        onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <label className="form-label">Meta Description</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Brief description"
                        maxLength={160}
                        rows={3}
                        value={formData.metaDescription}
                        onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-column">
                  <div className="form-card">
                    <div className="form-card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                      <span>Sub Sub Category Image</span>
                    </div>

                    <div className="image-upload-grid">
                      <div className="image-upload-card">
                        <span className="upload-label">Sub Sub Category Image</span>
                        <input
                          type="file"
                          ref={logoInputRef}
                          className="file-input-hidden"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)}
                        />
                        {formData.logoPreview || formData.logoUrl ? (
                          <div className="image-preview-card">
                            <img src={formData.logoPreview || formData.logoUrl} alt="Sub Sub Category" />
                            <div className="image-actions">
                              <button type="button" className="btn-change" onClick={() => logoInputRef.current?.click()}>
                                Change
                              </button>
                              <button type="button" className="btn-remove" onClick={() => removeFile('logo')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="upload-dropzone" onClick={() => logoInputRef.current?.click()}>
                            <div className="dropzone-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17,8 12,3 7,8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </div>
                            <span className="dropzone-text">Click to upload</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-wide">
              <button type="button" className="btn-reset" onClick={handleReset}>Reset</button>
              <button type="button" className="btn-cancel" onClick={closeAddModal}>Cancel</button>
              <button 
                type="button" 
                className="btn-submit" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : (editingSubSubCategory ? "Update" : "Submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingSubSubCategory && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3>Delete Sub Sub Category</h3>
            <p>Are you sure you want to delete <strong>{deletingSubSubCategory.name}</strong>?</p>
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
