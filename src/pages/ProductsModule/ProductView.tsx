import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import "../../styles/product-view.css";

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
  shortDescription: string | null;
  sku: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  costPricePaise: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  isVisible: boolean;
  isFeatured: boolean;
  category: Category | null;
  images: ProductImage[];
  color: string | null;
  material: string | null;
  weightGrams: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaImageUrl: string | null;
  searchTags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullSpecification, setShowFullSpecification] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  async function loadProduct(productId: string) {
    setLoading(true);
    try {
      const data = await api.getProduct(productId);
      setProduct(data);
    } catch (err: any) {
      console.error("Failed to load product:", err);
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    if (!product || !id) return;
    try {
      const newStatus = product.status === "active" ? "inactive" : "active";
      await api.updateProduct(id, { status: newStatus });
      setProduct({ ...product, status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function getStockStatus() {
    if (!product) return { label: "", class: "" };
    if (product.stockQuantity === 0) {
      return { label: "Out of Stock", class: "out-of-stock" };
    }
    if (product.stockQuantity <= product.lowStockThreshold) {
      return { label: "Low Stock", class: "low-stock" };
    }
    return { label: "In Stock", class: "in-stock" };
  }

  if (loading) {
    return (
      <div className="product-view-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-view-container">
        <div className="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error || "Product not found"}</p>
          <button onClick={() => navigate("/products-module")} className="btn-back-to-list">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const allImages = product.images.length > 0 ? product.images : [];

  return (
    <div className="product-view-container">
      {/* Header */}
      <div className="product-view-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate("/products-module")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Product List
          </button>
          <h1 className="page-title">Product Details</h1>
        </div>
        <div className="header-right">
          <div className="status-toggle">
            <span className="status-label">Status:</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={product.status === "active"}
                onChange={toggleStatus}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className={`status-text ${product.status}`}>
              {product.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <button
            className="btn-edit-product"
            onClick={() => navigate(`/products-module/edit/${id}`)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <div className="product-view-content">
        {/* Left Column - Images */}
        <div className="product-images-section">
          <div className="product-image-card">
            {/* Main Image */}
            <div className="main-image-container">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImage]?.url || primaryImage?.url}
                  alt={product.name}
                  className="main-image"
                />
              ) : (
                <div className="no-image-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  <span>No Image</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="thumbnail-gallery">
                {allImages.map((img, index) => (
                  <button
                    key={img.id}
                    className={`thumbnail ${selectedImage === index ? "active" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img.url} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="info-card">
            <div className="card-header">
              <h3>Description</h3>
            </div>
            <div className="card-body">
              {product.description ? (
                <div className="description-content">
                  <div
                    className={`description-text ${!showFullDescription ? "truncated" : ""}`}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                  {product.description.length > 300 && (
                    <button
                      className="btn-see-more"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                    >
                      {showFullDescription ? "See Less" : "See More"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="no-content">No description available</p>
              )}
            </div>
          </div>

          {/* Specification Section */}
          <div className="info-card">
            <div className="card-header">
              <h3>Specification</h3>
            </div>
            <div className="card-body">
              {product.shortDescription ? (
                <div className="specification-content">
                  <div
                    className={`specification-text ${!showFullSpecification ? "truncated" : ""}`}
                    dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                  />
                  {product.shortDescription.length > 200 && (
                    <button
                      className="btn-see-more"
                      onClick={() => setShowFullSpecification(!showFullSpecification)}
                    >
                      {showFullSpecification ? "See Less" : "See More"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="no-content">No specification available</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Product Information */}
        <div className="product-info-section">
          {/* General Information */}
          <div className="info-card">
            <div className="card-header">
              <h3>General Information</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Product Name</span>
                  <span className="info-value">{product.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Category</span>
                  <span className="info-value category-badge">
                    {product.category?.name || "-"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">SKU</span>
                  <span className="info-value sku-code">{product.sku}</span>
                </div>
                {product.color && (
                  <div className="info-row">
                    <span className="info-label">Color</span>
                    <span className="info-value">{product.color}</span>
                  </div>
                )}
                {product.material && (
                  <div className="info-row">
                    <span className="info-label">Material</span>
                    <span className="info-value">{product.material}</span>
                  </div>
                )}
                {product.weightGrams && (
                  <div className="info-row">
                    <span className="info-label">Weight</span>
                    <span className="info-value">{product.weightGrams}g</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Information */}
          <div className="info-card">
            <div className="card-header">
              <h3>Price Information</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Unit Price</span>
                  <span className="info-value price-value">
                    {formatPrice(product.pricePaise)}
                  </span>
                </div>
                {product.compareAtPricePaise && (
                  <div className="info-row">
                    <span className="info-label">Compare at Price</span>
                    <span className="info-value price-compare">
                      {formatPrice(product.compareAtPricePaise)}
                    </span>
                  </div>
                )}
                {product.costPricePaise && (
                  <div className="info-row">
                    <span className="info-label">Cost Price</span>
                    <span className="info-value">{formatPrice(product.costPricePaise)}</span>
                  </div>
                )}
                {product.compareAtPricePaise && (
                  <div className="info-row">
                    <span className="info-label">Discount</span>
                    <span className="info-value discount-badge">
                      {Math.round(
                        ((product.compareAtPricePaise - product.pricePaise) /
                          product.compareAtPricePaise) *
                          100
                      )}
                      % OFF
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="info-card">
            <div className="card-header">
              <h3>Stock & Inventory</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Current Stock</span>
                  <span className={`info-value stock-badge ${stockStatus.class}`}>
                    {product.stockQuantity} ({stockStatus.label})
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Low Stock Threshold</span>
                  <span className="info-value">{product.lowStockThreshold}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Featured</span>
                  <span className="info-value">
                    {product.isFeatured ? (
                      <span className="badge-yes">Yes</span>
                    ) : (
                      <span className="badge-no">No</span>
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Visible</span>
                  <span className="info-value">
                    {product.isVisible ? (
                      <span className="badge-yes">Yes</span>
                    ) : (
                      <span className="badge-no">No</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Tags */}
          {product.searchTags && product.searchTags.length > 0 && (
            <div className="info-card">
              <div className="card-header">
                <h3>Search Tags</h3>
              </div>
              <div className="card-body">
                <div className="tags-container">
                  {product.searchTags.map((tag, index) => (
                    <span key={index} className="tag-badge">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEO & Meta Data */}
          <div className="info-card">
            <div className="card-header">
              <h3>SEO & Meta Data</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-row full-width">
                  <span className="info-label">Meta Title</span>
                  <span className="info-value">
                    {product.metaTitle || <span className="no-content">Not set</span>}
                  </span>
                </div>
                <div className="info-row full-width">
                  <span className="info-label">Meta Description</span>
                  <span className="info-value meta-description">
                    {product.metaDescription || <span className="no-content">Not set</span>}
                  </span>
                </div>
                <div className="info-row full-width">
                  <span className="info-label">Meta Image</span>
                  <div className="info-value">
                    {product.metaImageUrl ? (
                      <div className="meta-image-preview">
                        <img 
                          src={product.metaImageUrl} 
                          alt="Meta Image" 
                          style={{
                            width: "150px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb"
                          }}
                        />
                      </div>
                    ) : (
                      <span className="no-content">Not set</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="info-card timestamps-card">
            <div className="card-body">
              <div className="timestamps">
                <div className="timestamp-item">
                  <span className="timestamp-label">Created</span>
                  <span className="timestamp-value">
                    {new Date(product.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="timestamp-item">
                  <span className="timestamp-label">Last Updated</span>
                  <span className="timestamp-value">
                    {new Date(product.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
