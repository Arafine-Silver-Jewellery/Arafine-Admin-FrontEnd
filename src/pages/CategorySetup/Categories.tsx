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
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  status: boolean;
  nameEN: string;
  priority: string;
  logo1: File | null;
  logo1Preview: string;
  logo1Url: string; // Existing URL from backend
  logo2: File | null;
  logo2Preview: string;
  logo2Url: string;
  metaTitle: string;
  metaDescription: string;
  metaImage: File | null;
  metaImagePreview: string;
  metaImageUrl: string;
}

const initialFormData: CategoryFormData = {
  status: true,
  nameEN: "",
  priority: "",
  logo1: null,
  logo1Preview: "",
  logo1Url: "",
  logo2: null,
  logo2Preview: "",
  logo2Url: "",
  metaTitle: "",
  metaDescription: "",
  metaImage: null,
  metaImagePreview: "",
  metaImageUrl: "",
};

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // File input refs
  const logo1InputRef = useRef<HTMLInputElement>(null);
  const logo2InputRef = useRef<HTMLInputElement>(null);
  const metaImageInputRef = useRef<HTMLInputElement>(null);

  // Load categories from API
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function toggleHomeStatus(id: string) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    try {
      await api.updateCategory(id, { isActive: !category.isActive });
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
        )
      );
    } catch (error) {
      console.error("Failed to update category status:", error);
    }
  }

  function openAddModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setFormData({
        status: category.isActive,
        nameEN: category.name,
        priority: category.sortOrder.toString(),
        logo1: null,
        logo1Preview: "",
        logo1Url: category.imageUrl || "",
        logo2: null,
        logo2Preview: "",
        logo2Url: category.secondaryImageUrl || "",
        metaTitle: category.metaTitle || "",
        metaDescription: category.description || "",
        metaImage: null,
        metaImagePreview: "",
        metaImageUrl: category.metaImageUrl || "",
      });
    } else {
      setEditingCategory(null);
      setFormData(initialFormData);
    }
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setEditingCategory(null);
    setFormData(initialFormData);
  }

  function handleInputChange(field: keyof CategoryFormData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleFileUpload(field: 'logo1' | 'logo2' | 'metaImage', file: File | null) {
    if (file) {
      const previewField = `${field}Preview` as keyof CategoryFormData;
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

  function removeFile(field: 'logo1' | 'logo2' | 'metaImage') {
    const previewField = `${field}Preview` as keyof CategoryFormData;
    const urlField = `${field}Url` as keyof CategoryFormData;
    setFormData(prev => ({
      ...prev,
      [field]: null,
      [previewField]: "",
      [urlField]: "",
    }));
  }

  function handleReset() {
    if (editingCategory) {
      openAddModal(editingCategory);
    } else {
      setFormData(initialFormData);
    }
  }

  async function handleSubmit() {
    if (!formData.nameEN.trim()) {
      alert("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Upload images if new files were selected
      let imageUrl = formData.logo1Url;
      let secondaryImageUrl = formData.logo2Url;
      let metaImageUrl = formData.metaImageUrl;

      if (formData.logo1) {
        const result = await api.uploadFile(formData.logo1, "categories");
        imageUrl = result.url;
      }

      if (formData.logo2) {
        const result = await api.uploadFile(formData.logo2, "categories");
        secondaryImageUrl = result.url;
      }

      if (formData.metaImage) {
        const result = await api.uploadFile(formData.metaImage, "categories");
        metaImageUrl = result.url;
      }

      // Create slug from name
      const slug = formData.nameEN
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const categoryData = {
        name: formData.nameEN,
        slug: editingCategory?.slug || slug,
        description: formData.metaDescription || null,
        imageUrl: imageUrl || null,
        secondaryImageUrl: secondaryImageUrl || null,
        metaImageUrl: metaImageUrl || null,
        metaTitle: formData.metaTitle || null,
        sortOrder: parseInt(formData.priority) || 0,
        isActive: formData.status,
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryData);
      } else {
        await api.createCategory(categoryData);
      }

      await loadCategories();
      closeAddModal();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      alert(error.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  }

  function openDeleteModal(category: Category) {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingCategory(null);
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return;

    setDeleting(true);
    try {
      await api.deleteCategory(deletingCategory.id);
      await loadCategories();
      closeDeleteModal();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      alert(error.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    // Prepare data for export (without image URLs)
    const exportData = categories.map((cat, index) => ({
      "SL": index + 1,
      "Category Name": cat.name,
      "Slug": cat.slug,
      "Description": cat.description || "",
      "Priority": cat.sortOrder,
      "Status": cat.isActive ? "Active" : "Inactive",
      "Meta Title": cat.metaTitle || "",
      "Created At": new Date(cat.createdAt).toLocaleDateString(),
      "Updated At": new Date(cat.updatedAt).toLocaleDateString(),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // SL
      { wch: 25 },  // Category Name
      { wch: 25 },  // Slug
      { wch: 40 },  // Description
      { wch: 10 },  // Priority
      { wch: 10 },  // Status
      { wch: 30 },  // Meta Title
      { wch: 15 },  // Created At
      { wch: 15 },  // Updated At
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `categories-export-${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
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
                  placeholder="Search by category"
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
              <button className="btn-export" onClick={handleExport}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              <button className="btn-add" onClick={() => openAddModal()}>
                + Add Category
              </button>
            </div>
          </div>
        </div>

        <div className="category-table-container">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>Loading categories...</div>
          ) : (
          <table className="category-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Category Name</th>
                <th>Priority</th>
                <th>Home Category Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => (
                <tr key={category.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="category-name-cell">
                      <div className="category-images">
                        {category.imageUrl && (
                          <img src={category.imageUrl} alt="" className="category-thumb" />
                        )}
                      </div>
                      <div className="category-info">
                        <span className="name">{category.name}</span>
                        <span className="id">ID #{category.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={category.isActive}
                        onChange={() => toggleHomeStatus(category.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-icon-edit" title="Edit" onClick={() => openAddModal(category)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button className="btn-action btn-icon-delete" title="Delete" onClick={() => openDeleteModal(category)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                    {searchQuery ? "No categories found matching your search" : "No categories yet. Click 'Add Category' to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="add-category-modal-wide" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
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
                  <h2>{editingCategory ? "Edit Category" : "Add New Category"}</h2>
                  <p>{editingCategory ? "Update category details" : "Create a new product category for your store"}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeAddModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body-wide">
              {/* Two Column Layout */}
              <div className="form-grid-two-col">
                {/* Left Column - Basic Info */}
                <div className="form-column">
                  <div className="form-card">
                    <div className="form-card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Basic Information</span>
                    </div>
                    
                    {/* Status Toggle */}
                    <div className="form-row">
                      <div className="status-toggle-row-wide">
                        <div className="status-info">
                          <span className="status-label">Category Status</span>
                          <span className="status-hint">Enable to make visible on store</span>
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

                    {/* Category Name & Priority Row */}
                    <div className="form-row-inline">
                      <div className="form-field flex-2">
                        <label className="form-label">
                          Category Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter category name"
                          value={formData.nameEN}
                          onChange={(e) => handleInputChange('nameEN', e.target.value)}
                        />
                      </div>
                      <div className="form-field flex-1">
                        <label className="form-label">
                          Priority <span className="required">*</span>
                        </label>
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

                  {/* SEO / Meta Section */}
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
                      <div className="input-with-counter">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="SEO title for search engines"
                          maxLength={50}
                          value={formData.metaTitle}
                          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                        />
                        <span className="char-counter">{formData.metaTitle.length}/50</span>
                      </div>
                    </div>

                    <div className="form-row">
                      <label className="form-label">Meta Description</label>
                      <div className="input-with-counter">
                        <textarea
                          className="form-textarea"
                          placeholder="Brief description for search results"
                          maxLength={160}
                          rows={3}
                          value={formData.metaDescription}
                          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                        />
                        <span className="char-counter">{formData.metaDescription.length}/160</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Images */}
                <div className="form-column">
                  <div className="form-card">
                    <div className="form-card-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                      <span>Category Images</span>
                    </div>

                    <p className="image-specs">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      Recommended: JPG, PNG • Max 2MB • 500×500px (1:1)
                    </p>
                    
                    <div className="image-upload-grid">
                      {/* Primary Logo */}
                      <div className="image-upload-card">
                        <span className="upload-label">Primary Logo</span>
                        <input
                          type="file"
                          ref={logo1InputRef}
                          className="file-input-hidden"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={(e) => handleFileUpload('logo1', e.target.files?.[0] || null)}
                        />
                        {formData.logo1Preview || formData.logo1Url ? (
                          <div className="image-preview-card">
                            <img src={formData.logo1Preview || formData.logo1Url} alt="Primary Logo" />
                            <div className="image-actions">
                              <button type="button" className="btn-change" onClick={() => logo1InputRef.current?.click()}>
                                Change
                              </button>
                              <button type="button" className="btn-remove" onClick={() => removeFile('logo1')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="upload-dropzone" onClick={() => logo1InputRef.current?.click()}>
                            <div className="dropzone-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17,8 12,3 7,8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </div>
                            <span className="dropzone-text">Click to upload</span>
                            <span className="dropzone-hint">or drag and drop</span>
                          </div>
                        )}
                      </div>

                      {/* Secondary Logo */}
                      <div className="image-upload-card">
                        <span className="upload-label">Secondary Logo <span className="optional-text">(Optional)</span></span>
                        <input
                          type="file"
                          ref={logo2InputRef}
                          className="file-input-hidden"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={(e) => handleFileUpload('logo2', e.target.files?.[0] || null)}
                        />
                        {formData.logo2Preview || formData.logo2Url ? (
                          <div className="image-preview-card">
                            <img src={formData.logo2Preview || formData.logo2Url} alt="Secondary Logo" />
                            <div className="image-actions">
                              <button type="button" className="btn-change" onClick={() => logo2InputRef.current?.click()}>
                                Change
                              </button>
                              <button type="button" className="btn-remove" onClick={() => removeFile('logo2')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="upload-dropzone" onClick={() => logo2InputRef.current?.click()}>
                            <div className="dropzone-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17,8 12,3 7,8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </div>
                            <span className="dropzone-text">Click to upload</span>
                            <span className="dropzone-hint">or drag and drop</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta Image */}
                    <div className="meta-image-section">
                      <span className="upload-label">SEO Image <span className="optional-text">(Optional)</span></span>
                      <p className="image-specs small">Recommended ratio: 2:1 (1200×600px)</p>
                      <input
                        type="file"
                        ref={metaImageInputRef}
                        className="file-input-hidden"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={(e) => handleFileUpload('metaImage', e.target.files?.[0] || null)}
                      />
                      {formData.metaImagePreview || formData.metaImageUrl ? (
                        <div className="meta-image-preview-wide">
                          <img src={formData.metaImagePreview || formData.metaImageUrl} alt="Meta" />
                          <div className="image-actions">
                            <button type="button" className="btn-change" onClick={() => metaImageInputRef.current?.click()}>
                              Change
                            </button>
                            <button type="button" className="btn-remove" onClick={() => removeFile('metaImage')}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-dropzone horizontal" onClick={() => metaImageInputRef.current?.click()}>
                          <div className="dropzone-icon small">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17,8 12,3 7,8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <span className="dropzone-text">Upload SEO image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer-wide">
              <button className="btn-cancel" onClick={closeAddModal}>
                Cancel
              </button>
              <div className="footer-actions">
                <button className="btn-reset-wide" onClick={handleReset}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Reset
                </button>
                <button className="btn-submit-wide" onClick={handleSubmit} disabled={submitting}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCategory && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div 
            className="delete-confirm-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "0",
              width: "400px",
              maxWidth: "90vw",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
                  Delete Category
                </h3>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, color: "#374151", lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>"{deletingCategory.name}"</strong>? 
                This will permanently remove the category and cannot be recovered.
              </p>
            </div>

            {/* Footer */}
            <div style={{
              padding: "1rem 1.5rem",
              background: "#f9fafb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}>
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#374151",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  fontWeight: 500,
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  opacity: deleting ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {deleting ? (
                  <>
                    <span style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
