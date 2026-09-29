import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Category } from "../types";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    sortOrder: "0",
    isActive: true,
  });

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await api.getAllCategories();
      setCategories(data);
    }
    catch (error) {
      console.error("Failed to load categories:", error);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        sortOrder: category.sortOrder.toString(),
        isActive: category.isActive,
      });
    }
    else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        imageUrl: "",
        sortOrder: "0",
        isActive: true,
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCategory(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "name" && !editingCategory) {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null,
      sortOrder: parseInt(formData.sortOrder),
      isActive: formData.isActive,
    };

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data);
      }
      else {
        await api.createCategory(data);
      }
      closeModal();
      loadCategories();
    }
    catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.deleteCategory(id);
      loadCategories();
    }
    catch (error: any) {
      console.error("Failed to delete category:", error);
      alert(error.message || "Failed to delete category");
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Category
        </button>
      </header>
      <div className="page-content">
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="loading">Loading...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">No categories found</td>
                  </tr>
                ) : (
                  categories.map(category => (
                    <tr key={category.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#f3f4f6",
                                borderRadius: "50%",
                              }}
                            />
                          )}
                          <span>{category.name}</span>
                        </div>
                      </td>
                      <td>{category.slug}</td>
                      <td>0</td>
                      <td>{category.sortOrder}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: category.isActive ? "#dcfce7" : "#f3f4f6",
                            color: category.isActive ? "#22c55e" : "#6b7280",
                          }}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openModal(category)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(category.id, category.name)}
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? "Edit Category" : "Add Category"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
