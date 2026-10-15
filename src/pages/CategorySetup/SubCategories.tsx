import { useState, useRef, useEffect } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { DataTable, StatusDropdown } from "../../components";
import * as XLSX from "xlsx";
import "../../styles/ui-kit.css";

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

interface SubCategoryFormData {
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

const initialFormData: SubCategoryFormData = {
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

const statusFilterOptions = [
  { value: "", label: "All Status", color: "neutral" as const },
  { value: "active", label: "Active", color: "success" as const },
  { value: "inactive", label: "Inactive", color: "neutral" as const },
];

export default function SubCategories() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<SubCategoryFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSubCategory, setDeletingSubCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load parent categories for dropdown
  useEffect(() => {
    loadParentCategories();
  }, []);

  // Load sub categories with pagination
  useEffect(() => {
    loadSubCategories();
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  async function loadParentCategories() {
    try {
      const categories = await api.getAllCategories();
      setParentCategories(categories);
    } catch (error) {
      console.error("Failed to load parent categories:", error);
    }
  }

  async function loadSubCategories() {
    setLoading(true);
    try {
      const response = await api.getSubCategories({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
      });
      let data = response.data || [];

      // Apply status filter
      if (statusFilter === "active") {
        data = data.filter((c: Category) => c.isActive);
      } else if (statusFilter === "inactive") {
        data = data.filter((c: Category) => !c.isActive);
      }

      setSubCategories(data);
      setTotalItems(response.pagination?.total || data.length);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to load sub categories:", error);
      toast.error("Failed to load sub categories");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id: string) {
    const subCategory = subCategories.find((c) => c.id === id);
    if (!subCategory) return;
    try {
      await api.updateCategory(id, { isActive: !subCategory.isActive });
      setSubCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, isActive: !cat.isActive } : cat)));
      toast.success(`Sub category ${!subCategory.isActive ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Failed to update sub category status:", error);
      toast.error("Failed to update status");
    }
  }

  function openAddModal(subCategory?: Category) {
    if (subCategory) {
      setEditingSubCategory(subCategory);
      setFormData({
        status: subCategory.isActive,
        nameEN: subCategory.name,
        parentId: subCategory.parentId || "",
        priority: subCategory.sortOrder.toString(),
        logo: null,
        logoPreview: "",
        logoUrl: subCategory.imageUrl || "",
        metaTitle: subCategory.metaTitle || "",
        metaDescription: subCategory.description || "",
        metaImage: null,
        metaImagePreview: "",
        metaImageUrl: subCategory.metaImageUrl || "",
      });
    } else {
      setEditingSubCategory(null);
      setFormData(initialFormData);
    }
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setEditingSubCategory(null);
    setFormData(initialFormData);
  }

  function handleInputChange(field: keyof SubCategoryFormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileUpload(field: "logo" | "metaImage", file: File | null) {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [field]: file,
          [`${field}Preview`]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  function removeFile(field: "logo" | "metaImage") {
    setFormData((prev) => ({
      ...prev,
      [field]: null,
      [`${field}Preview`]: "",
      [`${field}Url`]: "",
    }));
  }

  async function handleSubmit() {
    if (!formData.nameEN.trim()) {
      toast.warning("Sub category name is required");
      return;
    }
    if (!formData.parentId) {
      toast.warning("Please select a main category");
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

      const slug = formData.nameEN.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const subCategoryData = {
        name: formData.nameEN,
        slug: editingSubCategory?.slug || slug,
        description: formData.metaDescription || null,
        imageUrl: imageUrl || null,
        metaImageUrl: metaImageUrl || null,
        metaTitle: formData.metaTitle || null,
        parentId: formData.parentId,
        sortOrder: parseInt(formData.priority) || 0,
        isActive: formData.status,
      };

      if (editingSubCategory) {
        await api.updateCategory(editingSubCategory.id, subCategoryData);
        toast.success("Sub category updated successfully");
      } else {
        await api.createCategory(subCategoryData);
        toast.success("Sub category created successfully");
      }

      await loadSubCategories();
      closeAddModal();
    } catch (error: unknown) {
      console.error("Failed to save sub category:", error);
      toast.error((error as Error).message || "Failed to save sub category");
    } finally {
      setSubmitting(false);
    }
  }

  function openDeleteModal(subCategory: Category) {
    setDeletingSubCategory(subCategory);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingSubCategory(null);
  }

  async function handleConfirmDelete() {
    if (!deletingSubCategory) return;
    setDeleting(true);
    try {
      await api.deleteCategory(deletingSubCategory.id);
      toast.success("Sub category deleted successfully");
      await loadSubCategories();
      closeDeleteModal();
    } catch (error: unknown) {
      console.error("Failed to delete sub category:", error);
      toast.error((error as Error).message || "Failed to delete sub category");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    try {
      const allSubCategories = await api.getAllSubCategories();
      const exportData = allSubCategories.map((cat: Category, index: number) => ({
        SL: index + 1,
        "Sub Category Name": cat.name,
        "Main Category": cat.parent?.name || "",
        Slug: cat.slug,
        Description: cat.description || "",
        Priority: cat.sortOrder,
        Status: cat.isActive ? "Active" : "Inactive",
        "Meta Title": cat.metaTitle || "",
        "Created At": new Date(cat.createdAt).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sub Categories");
      XLSX.writeFile(workbook, `sub-categories-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Export completed");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export sub categories");
    }
  }

  const columns = [
    {
      key: "name",
      header: "Sub Category",
      render: (subCat: Category) => (
        <div className="ak-product-cell">
          {subCat.imageUrl ? (
            <img src={subCat.imageUrl} alt={subCat.name} className="ak-product-cell__img" style={{ borderRadius: "8px" }} />
          ) : (
            <div className="ak-user-cell__initials">{subCat.name[0].toUpperCase()}</div>
          )}
          <div>
            <span className="ak-product-cell__name">{subCat.name}</span>
            <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>ID: {subCat.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "parent",
      header: "Main Category",
      render: (subCat: Category) => (
        <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
          {subCat.parent?.name || "-"}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (subCat: Category) => <code className="ak-code">{subCat.slug}</code>,
    },
    {
      key: "priority",
      header: "Priority",
      width: "100px",
      render: (subCat: Category) => <span className="ak-text-muted">{subCat.sortOrder}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (subCat: Category) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={subCat.isActive} onChange={() => toggleStatus(subCat.id)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "120px",
      render: (subCat: Category) => (
        <div className="ak-row-actions">
          <button type="button" className="ak-icon-btn ak-icon-btn--edit" title="Edit" onClick={(e) => { e.stopPropagation(); openAddModal(subCat); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--delete" title="Delete" onClick={(e) => { e.stopPropagation(); openDeleteModal(subCat); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
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
            Sub Categories
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Manage sub categories under main categories</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--ghost" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
          </button>
          <button type="button" className="ak-btn ak-btn--primary" onClick={() => openAddModal()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Sub Category
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
                <svg className="ak-searchbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" className="ak-searchbar__input" placeholder="Search sub categories…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown options={statusFilterOptions} value={statusFilter} onChange={setStatusFilter} placeholder="All Status" size="sm" />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={subCategories}
          loading={loading}
          loadingText="Loading sub categories…"
          emptyIcon="folder"
          emptyTitle="No sub categories found"
          emptyDescription={debouncedSearch || statusFilter ? "Try adjusting your filters." : "Create your first sub category to get started."}
          keyExtractor={(subCat) => subCat.id}
          onRowClick={(subCat) => openAddModal(subCat)}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="ak-modal-overlay" onClick={closeAddModal}>
          <div className="ak-modal" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">{editingSubCategory ? "Edit Sub Category" : "Add Sub Category"}</h2>
              <button type="button" className="ak-modal__close" onClick={closeAddModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="ak-modal__body">
              {/* Status */}
              <div className="ak-field" style={{ marginBottom: "1rem" }}>
                <label className="ak-field__label">Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <label className="ak-toggle">
                    <input type="checkbox" checked={formData.status} onChange={(e) => handleInputChange("status", e.target.checked)} />
                    <span className="ak-toggle__slider" />
                  </label>
                  <span className={`ak-status ak-status--${formData.status ? "success" : "neutral"}`}>
                    <span className="ak-status__dot" />
                    {formData.status ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Main Category */}
              <div className="ak-field" style={{ marginBottom: "1rem" }}>
                <label className="ak-field__label">Main Category *</label>
                <select className="ak-select" value={formData.parentId} onChange={(e) => handleInputChange("parentId", e.target.value)}>
                  <option value="">Select main category</option>
                  {parentCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="ak-field" style={{ marginBottom: "1rem" }}>
                <label className="ak-field__label">Sub Category Name *</label>
                <input type="text" className="ak-input" value={formData.nameEN} onChange={(e) => handleInputChange("nameEN", e.target.value)} placeholder="Enter sub category name" />
              </div>

              {/* Priority */}
              <div className="ak-field" style={{ marginBottom: "1rem" }}>
                <label className="ak-field__label">Priority</label>
                <input type="number" className="ak-input" value={formData.priority} onChange={(e) => handleInputChange("priority", e.target.value)} placeholder="0" />
              </div>

              {/* Image Upload */}
              <div className="ak-field" style={{ marginBottom: "1rem" }}>
                <label className="ak-field__label">Sub Category Image</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {(formData.logoPreview || formData.logoUrl) ? (
                    <div style={{ position: "relative" }}>
                      <img src={formData.logoPreview || formData.logoUrl} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-color)" }} />
                      <button type="button" onClick={() => removeFile("logo")} style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: "var(--color-error)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="ak-btn ak-btn--ghost" onClick={() => logoInputRef.current?.click()}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></svg>
                      Upload Image
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload("logo", e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* Meta Title */}
              <div className="ak-field" style={{ marginBottom: "1rem" }}>
                <label className="ak-field__label">Meta Title</label>
                <input type="text" className="ak-input" value={formData.metaTitle} onChange={(e) => handleInputChange("metaTitle", e.target.value)} placeholder="SEO title" />
              </div>

              {/* Description */}
              <div className="ak-field">
                <label className="ak-field__label">Description</label>
                <textarea className="ak-input" rows={3} value={formData.metaDescription} onChange={(e) => handleInputChange("metaDescription", e.target.value)} placeholder="Sub category description" style={{ minHeight: 80, resize: "vertical" }} />
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeAddModal} disabled={submitting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving…" : editingSubCategory ? "Update Sub Category" : "Create Sub Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingSubCategory && (
        <div className="ak-modal-overlay" onClick={closeDeleteModal}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Delete Sub Category</h2>
              <button type="button" className="ak-modal__close" onClick={closeDeleteModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="ak-modal__body">
              <p>Are you sure you want to delete <strong>"{deletingSubCategory.name}"</strong>? This action cannot be undone.</p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={closeDeleteModal} disabled={deleting}>Cancel</button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
