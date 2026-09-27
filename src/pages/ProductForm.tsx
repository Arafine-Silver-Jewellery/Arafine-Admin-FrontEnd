import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { slugify } from "../utils/format";
import type { Category } from "../types";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    sku: "",
    pricePaise: "",
    compareAtPricePaise: "",
    costPricePaise: "",
    categoryId: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
    trackInventory: true,
    color: "",
    material: "",
    weightGrams: "",
    metaTitle: "",
    metaDescription: "",
    searchTags: "",
    status: "active",
    isVisible: true,
    isFeatured: false,
    sortOrder: "0",
    imageUrl: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const cats = await api.getCategories();
        setCategories(cats);

        if (isEdit && id) {
          const product = await api.getProduct(id);
          setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description || "",
            shortDescription: product.shortDescription || "",
            sku: product.sku,
            pricePaise: (product.pricePaise / 100).toString(),
            compareAtPricePaise: product.compareAtPricePaise
              ? (product.compareAtPricePaise / 100).toString()
              : "",
            costPricePaise: product.costPricePaise
              ? (product.costPricePaise / 100).toString()
              : "",
            categoryId: product.categoryId,
            stockQuantity: product.stockQuantity.toString(),
            lowStockThreshold: product.lowStockThreshold.toString(),
            trackInventory: product.trackInventory,
            color: product.color || "",
            material: product.material || "",
            weightGrams: product.weightGrams?.toString() || "",
            metaTitle: product.metaTitle || "",
            metaDescription: product.metaDescription || "",
            searchTags: product.searchTags?.join(", ") || "",
            status: product.status,
            isVisible: product.isVisible,
            isFeatured: product.isFeatured,
            sortOrder: product.sortOrder.toString(),
            imageUrl: product.images?.[0]?.url || "",
          });
        }
      }
      catch (error) {
        console.error("Failed to load data:", error);
      }
      finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Auto-generate slug from name
    if (name === "name" && !isEdit) {
      setFormData(prev => ({ ...prev, slug: slugify(value) }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        shortDescription: formData.shortDescription || null,
        sku: formData.sku,
        pricePaise: Math.round(parseFloat(formData.pricePaise) * 100),
        compareAtPricePaise: formData.compareAtPricePaise
          ? Math.round(parseFloat(formData.compareAtPricePaise) * 100)
          : null,
        costPricePaise: formData.costPricePaise
          ? Math.round(parseFloat(formData.costPricePaise) * 100)
          : null,
        categoryId: formData.categoryId,
        stockQuantity: parseInt(formData.stockQuantity),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        trackInventory: formData.trackInventory,
        color: formData.color || null,
        material: formData.material || null,
        weightGrams: formData.weightGrams ? parseFloat(formData.weightGrams) : null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        searchTags: formData.searchTags
          ? formData.searchTags.split(",").map(t => t.trim()).filter(Boolean)
          : [],
        status: formData.status,
        isVisible: formData.isVisible,
        isFeatured: formData.isFeatured,
        sortOrder: parseInt(formData.sortOrder),
        images: formData.imageUrl ? [{ url: formData.imageUrl, isPrimary: true }] : [],
      };

      if (isEdit && id) {
        await api.updateProduct(id, data);
      }
      else {
        await api.createProduct(data);
      }

      navigate("/products");
    }
    catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product");
    }
    finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <header className="page-header">
        <h1>{isEdit ? "Edit Product" : "Add Product"}</h1>
      </header>
      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Basic Information</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
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
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Short Description</label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Pricing</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="pricePaise"
                    value={formData.pricePaise}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Compare at Price (₹)</label>
                  <input
                    type="number"
                    name="compareAtPricePaise"
                    value={formData.compareAtPricePaise}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cost Price (₹)</label>
                  <input
                    type="number"
                    name="costPricePaise"
                    value={formData.costPricePaise}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Inventory</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    name="trackInventory"
                    checked={formData.trackInventory}
                    onChange={handleChange}
                  />
                  Track Inventory
                </label>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Attributes</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Material</label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Weight (grams)</label>
                  <input
                    type="number"
                    name="weightGrams"
                    value={formData.weightGrams}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Search Tags (comma separated)</label>
                  <input
                    type="text"
                    name="searchTags"
                    value={formData.searchTags}
                    onChange={handleChange}
                    placeholder="ring, silver, elegant"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Image</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginTop: "0.5rem",
                  }}
                />
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2>Status & Visibility</h2>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
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
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    name="isVisible"
                    checked={formData.isVisible}
                    onChange={handleChange}
                  />
                  Visible on Store
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                  />
                  Featured Product
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/products")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
