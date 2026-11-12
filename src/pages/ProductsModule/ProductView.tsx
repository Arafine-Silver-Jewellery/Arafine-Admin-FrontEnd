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

interface ColorImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface ProductColor {
  id: string;
  name: string;
  hexCode: string;
  price: number | null;
  sku: string | null;
  stockQuantity: number;
  sortOrder: number;
  images: ColorImage[];
}

interface ProductAttribute {
  id: string;
  name: string;
  values: string[];
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
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
  metaIndex: string | null;
  searchTags: string[];
  productType: string;
  unit: string;
  minOrderQty: number;
  shippingCost: number;
  discountAmount: number;
  discountType: string;
  youtubeVideoUrl: string | null;
  hsnCode: string | null;
  hasVariations: boolean;
  colors: ProductColor[];
  productAttributes: ProductAttribute[];
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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  // Auto-scroll images every 3 seconds
  useEffect(() => {
    if (!product || !isAutoPlaying || product.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setSelectedImage(prev => (prev + 1) % product.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [product, isAutoPlaying]);

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

  function formatPrice(rupees: number): string {
    return `₹${rupees.toLocaleString("en-IN")}`;
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
      <div className="pv-container">
        <div className="pv-loading">
          <div className="pv-spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pv-container">
        <div className="pv-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error || "Product not found"}</p>
          <button onClick={() => navigate("/products-module")} className="pv-btn-back">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const allImages = product.images.length > 0 ? product.images : [];

  return (
    <div className="pv-container">
      {/* Header */}
      <div className="pv-header">
        <div className="pv-header-left">
          <button className="pv-back-btn" onClick={() => navigate("/products-module")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="pv-title-group">
            <h1 className="pv-title">{product.name}</h1>
            <span className="pv-sku">SKU: {product.sku}</span>
          </div>
        </div>
        <div className="pv-header-right">
          <div className="pv-status-toggle">
            <label className="pv-toggle">
              <input
                type="checkbox"
                checked={product.status === "active"}
                onChange={toggleStatus}
              />
              <span className="pv-toggle-slider"></span>
            </label>
            <span className={`pv-status-badge ${product.status}`}>
              {product.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <button className="pv-edit-btn" onClick={() => navigate(`/products-module/edit/${id}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Product
          </button>
        </div>
      </div>

      {/* Top Section: Image + Quick Info */}
      <div className="pv-top-section">
        {/* Product Images */}
        <div 
          className="pv-image-card"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="pv-main-image">
            {allImages.length > 0 ? (
              <img src={allImages[selectedImage]?.url} alt={product.name} />
            ) : (
              <div className="pv-no-image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                <span>No Image</span>
              </div>
            )}
            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button 
                  className="pv-nav-btn pv-nav-prev"
                  onClick={() => setSelectedImage(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button 
                  className="pv-nav-btn pv-nav-next"
                  onClick={() => setSelectedImage(prev => (prev + 1) % allImages.length)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                {/* Dots indicator */}
                <div className="pv-dots">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      className={`pv-dot ${selectedImage === index ? "active" : ""}`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="pv-thumbnails">
              {allImages.map((img, index) => (
                <button
                  key={img.id}
                  className={`pv-thumb ${selectedImage === index ? "active" : ""}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img.url} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="pv-quick-info">
          {/* Price Card */}
          <div className="pv-price-card">
            <div className="pv-price-main">
              <span className="pv-price-label">Unit Price</span>
              <span className="pv-price-value">{formatPrice(product.price)}</span>
            </div>
            {product.compareAtPrice && (
              <div className="pv-price-compare">
                <span className="pv-price-old">{formatPrice(product.compareAtPrice)}</span>
                <span className="pv-discount-badge">
                  {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                </span>
              </div>
            )}
            {product.discountAmount > 0 && (
              <div className="pv-discount-row">
                <span>Discount:</span>
                <span className="pv-discount-badge">
                  {product.discountAmount}{product.discountType === "percent" ? "%" : "₹"} OFF
                </span>
              </div>
            )}
          </div>

          {/* Stock Card */}
          <div className="pv-stock-card">
            <div className="pv-stock-row">
              <span>Stock</span>
              <span className={`pv-stock-badge ${stockStatus.class}`}>
                {product.stockQuantity} {stockStatus.label}
              </span>
            </div>
            <div className="pv-stock-row">
              <span>Low Stock Alert</span>
              <span>{product.lowStockThreshold} units</span>
            </div>
          </div>

          {/* Quick Details */}
          <div className="pv-quick-details">
            <div className="pv-detail-row">
              <span className="pv-detail-label">Category</span>
              <span className="pv-detail-value pv-category">{product.category?.name || "-"}</span>
            </div>
            <div className="pv-detail-row">
              <span className="pv-detail-label">Type</span>
              <span className="pv-detail-value">{product.productType || "Physical"}</span>
            </div>
            <div className="pv-detail-row">
              <span className="pv-detail-label">Unit</span>
              <span className="pv-detail-value">{product.unit || "pc"}</span>
            </div>
            <div className="pv-detail-row">
              <span className="pv-detail-label">Min. Order</span>
              <span className="pv-detail-value">{product.minOrderQty || 1}</span>
            </div>
            {product.shippingCost > 0 && (
              <div className="pv-detail-row">
                <span className="pv-detail-label">Shipping</span>
                <span className="pv-detail-value">{formatPrice(product.shippingCost)}</span>
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="pv-flags">
            <span className={`pv-flag ${product.isFeatured ? "active" : ""}`}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Featured
            </span>
            <span className={`pv-flag ${product.isVisible ? "active" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Visible
            </span>
            <span className={`pv-flag ${product.trackInventory ? "active" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Track Inventory
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="pv-details-grid">
        {/* Description */}
        <div className="pv-card">
          <div className="pv-card-header">
            <h3>Description</h3>
          </div>
          <div className="pv-card-body">
            {product.description ? (
              <div className="pv-content" dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="pv-empty">No description available</p>
            )}
          </div>
        </div>

        {/* Specification */}
        <div className="pv-card">
          <div className="pv-card-header">
            <h3>Specification</h3>
          </div>
          <div className="pv-card-body">
            {product.shortDescription ? (
              <div className="pv-content" dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
            ) : (
              <p className="pv-empty">No specification available</p>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="pv-card">
          <div className="pv-card-header">
            <h3>Additional Details</h3>
          </div>
          <div className="pv-card-body">
            <div className="pv-info-grid">
              <div className="pv-info-item">
                <span className="pv-info-label">Slug</span>
                <span className="pv-info-value pv-mono">{product.slug}</span>
              </div>
              {product.hsnCode && (
                <div className="pv-info-item">
                  <span className="pv-info-label">HSN Code</span>
                  <span className="pv-info-value pv-mono">{product.hsnCode}</span>
                </div>
              )}
              {product.costPrice && (
                <div className="pv-info-item">
                  <span className="pv-info-label">Cost Price</span>
                  <span className="pv-info-value">{formatPrice(product.costPrice)}</span>
                </div>
              )}
              {product.color && (
                <div className="pv-info-item">
                  <span className="pv-info-label">Color</span>
                  <span className="pv-info-value">{product.color}</span>
                </div>
              )}
              {product.material && (
                <div className="pv-info-item">
                  <span className="pv-info-label">Material</span>
                  <span className="pv-info-value">{product.material}</span>
                </div>
              )}
              {product.weightGrams && (
                <div className="pv-info-item">
                  <span className="pv-info-label">Weight</span>
                  <span className="pv-info-value">{product.weightGrams}g</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="pv-card">
          <div className="pv-card-header">
            <h3>SEO & Meta</h3>
          </div>
          <div className="pv-card-body">
            <div className="pv-info-grid">
              <div className="pv-info-item pv-full">
                <span className="pv-info-label">Meta Title</span>
                <span className="pv-info-value">{product.metaTitle || <em className="pv-empty">Not set</em>}</span>
              </div>
              <div className="pv-info-item pv-full">
                <span className="pv-info-label">Meta Description</span>
                <span className="pv-info-value pv-meta-desc">{product.metaDescription || <em className="pv-empty">Not set</em>}</span>
              </div>
              <div className="pv-info-item">
                <span className="pv-info-label">Meta Index</span>
                <span className="pv-info-value">{product.metaIndex || "index"}</span>
              </div>
              {product.youtubeVideoUrl && (
                <div className="pv-info-item pv-full">
                  <span className="pv-info-label">YouTube Video</span>
                  <a href={product.youtubeVideoUrl} target="_blank" rel="noopener noreferrer" className="pv-link">
                    {product.youtubeVideoUrl}
                  </a>
                </div>
              )}
            </div>
            {product.metaImageUrl && (
              <div className="pv-meta-image">
                <span className="pv-info-label">Meta Image</span>
                <img src={product.metaImageUrl} alt="Meta" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Tags */}
      {product.searchTags && product.searchTags.length > 0 && (
        <div className="pv-tags-section">
          <h3>Search Tags</h3>
          <div className="pv-tags">
            {product.searchTags.map((tag, index) => (
              <span key={index} className="pv-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Variations Section */}
      {product.hasVariations && product.colors && product.colors.length > 0 && (
        <div className="pv-variations-section">
          <div className="pv-card">
            <div className="pv-card-header">
              <h3>Product Variations</h3>
              <span className="pv-count">{product.colors.length} variants</span>
            </div>
            <div className="pv-card-body pv-no-padding">
              <table className="pv-var-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Variant</th>
                    <th>Price</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Images</th>
                  </tr>
                </thead>
                <tbody>
                  {product.colors.map((color, index) => (
                    <tr key={color.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="pv-var-color">
                          <span className="pv-color-dot" style={{ backgroundColor: color.hexCode }} />
                          {color.name}
                        </div>
                      </td>
                      <td>{color.price ? formatPrice(color.price) : <span className="pv-empty">Base price</span>}</td>
                      <td><span className="pv-mono">{color.sku || "-"}</span></td>
                      <td>
                        <span className={`pv-stock-badge small ${color.stockQuantity === 0 ? 'out-of-stock' : color.stockQuantity <= 5 ? 'low-stock' : 'in-stock'}`}>
                          {color.stockQuantity}
                        </span>
                      </td>
                      <td>
                        {color.images && color.images.length > 0 ? (
                          <div className="pv-var-images">
                            {color.images.slice(0, 3).map((img, i) => (
                              <img key={i} src={img.url} alt={color.name} />
                            ))}
                            {color.images.length > 3 && (
                              <span className="pv-more">+{color.images.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="pv-empty">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attributes */}
      {product.hasVariations && product.productAttributes && product.productAttributes.length > 0 && (
        <div className="pv-attributes-section">
          <h3>Attributes</h3>
          <div className="pv-attributes">
            {product.productAttributes.map((attr) => (
              <div key={attr.id} className="pv-attr">
                <span className="pv-attr-name">{attr.name}</span>
                {attr.values && attr.values.length > 0 && (
                  <div className="pv-attr-values">
                    {attr.values.map((val, idx) => (
                      <span key={idx} className="pv-attr-value">{val}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Timestamps */}
      <div className="pv-footer">
        <div className="pv-timestamp">
          <span>Created</span>
          <span>{new Date(product.createdAt).toLocaleString()}</span>
        </div>
        <div className="pv-timestamp">
          <span>Last Updated</span>
          <span>{new Date(product.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
