import { useState, useRef } from "react";
import "../../styles/category-setup.css";

interface Category {
  id: string;
  name: string;
  images: string[];
  priority: number;
  homeStatus: boolean;
}

interface CategoryFormData {
  status: boolean;
  nameEN: string;
  priority: string;
  logo1: File | null;
  logo1Preview: string;
  logo2: File | null;
  logo2Preview: string;
  metaTitle: string;
  metaDescription: string;
  metaImage: File | null;
  metaImagePreview: string;
}

const mockCategories: Category[] = [
  { id: "21", name: "Shop by Color", images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=60&h=60&fit=crop"], priority: 1, homeStatus: true },
  { id: "16", name: "By Pricing", images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=60&h=60&fit=crop"], priority: 0, homeStatus: true },
  { id: "13", name: "Anklets", images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=60&h=60&fit=crop"], priority: 10, homeStatus: true },
  { id: "8", name: "Bangles", images: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=60&h=60&fit=crop"], priority: 9, homeStatus: true },
  { id: "5", name: "Rings", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=60&h=60&fit=crop"], priority: 3, homeStatus: true },
  { id: "4", name: "Chains", images: ["https://images.unsplash.com/photo-1599459183200-59c3f4b13c2e?w=60&h=60&fit=crop", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop"], priority: 2, homeStatus: true },
];

const initialFormData: CategoryFormData = {
  status: true,
  nameEN: "",
  priority: "",
  logo1: null,
  logo1Preview: "",
  logo2: null,
  logo2Preview: "",
  metaTitle: "",
  metaDescription: "",
  metaImage: null,
  metaImagePreview: "",
};

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState(mockCategories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  
  // File input refs
  const logo1InputRef = useRef<HTMLInputElement>(null);
  const logo2InputRef = useRef<HTMLInputElement>(null);
  const metaImageInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function toggleHomeStatus(id: string) {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, homeStatus: !cat.homeStatus } : cat
      )
    );
  }

  function openAddModal() {
    setFormData(initialFormData);
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
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
    setFormData(prev => ({
      ...prev,
      [field]: null,
      [previewField]: ""
    }));
  }

  function handleReset() {
    setFormData(initialFormData);
  }

  function handleSubmit() {
    // Static for now - will be wired to backend later
    console.log("Form submitted:", formData);
    closeAddModal();
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
              <button className="btn-export">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              <button className="btn-add" onClick={openAddModal}>
                + Add Category
              </button>
            </div>
          </div>
        </div>

        <div className="category-table-container">
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
                        {category.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" className="category-thumb" />
                        ))}
                      </div>
                      <div className="category-info">
                        <span className="name">{category.name}</span>
                        <span className="id">ID #{category.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{category.priority}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={category.homeStatus}
                        onChange={() => toggleHomeStatus(category.id)}
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
                      <button className="btn-action btn-icon-edit" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#f59e0b" strokeWidth="2"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f59e0b" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button className="btn-action btn-icon-delete" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="#ef4444" strokeWidth="2"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <h2>Add New Category</h2>
                  <p>Create a new product category for your store</p>
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
                        {formData.logo1Preview ? (
                          <div className="image-preview-card">
                            <img src={formData.logo1Preview} alt="Primary Logo" />
                            <div className="image-actions">
                              <button className="btn-change" onClick={() => logo1InputRef.current?.click()}>
                                Change
                              </button>
                              <button className="btn-remove" onClick={() => removeFile('logo1')}>
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
                        {formData.logo2Preview ? (
                          <div className="image-preview-card">
                            <img src={formData.logo2Preview} alt="Secondary Logo" />
                            <div className="image-actions">
                              <button className="btn-change" onClick={() => logo2InputRef.current?.click()}>
                                Change
                              </button>
                              <button className="btn-remove" onClick={() => removeFile('logo2')}>
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
                      {formData.metaImagePreview ? (
                        <div className="meta-image-preview-wide">
                          <img src={formData.metaImagePreview} alt="Meta" />
                          <div className="image-actions">
                            <button className="btn-change" onClick={() => metaImageInputRef.current?.click()}>
                              Change
                            </button>
                            <button className="btn-remove" onClick={() => removeFile('metaImage')}>
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
                <button className="btn-submit-wide" onClick={handleSubmit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Create Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
