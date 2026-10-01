import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import "../../styles/products-module.css";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface FormData {
  name: string;
  sku: string;
  description: string;
  specification: string;
  shortDescription: string;
  categoryId: string;
  pricePaise: number;
  compareAtPricePaise: number;
  costPricePaise: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: "active" | "inactive";
  isVisible: boolean;
  isFeatured: boolean;
  color: string;
  material: string;
  weightGrams: number;
  metaTitle: string;
  metaDescription: string;
  searchTags: string;
  // New fields for reference design
  productType: string;
  unit: string;
  minOrderQty: number;
  shippingCost: number;
  discountAmount: number;
  discountType: "flat" | "percent";
  youtubeVideoUrl: string;
  metaIndex: "index" | "noindex";
}

const initialFormData: FormData = {
  name: "",
  sku: "",
  description: "",
  specification: "",
  shortDescription: "",
  categoryId: "",
  pricePaise: 0,
  compareAtPricePaise: 0,
  costPricePaise: 0,
  stockQuantity: 0,
  lowStockThreshold: 5,
  status: "active",
  isVisible: true,
  isFeatured: false,
  color: "",
  material: "",
  weightGrams: 0,
  metaTitle: "",
  metaDescription: "",
  searchTags: "",
  productType: "physical",
  unit: "pc",
  minOrderQty: 1,
  shippingCost: 0,
  discountAmount: 0,
  discountType: "flat",
  youtubeVideoUrl: "",
  metaIndex: "index",
};

// Simple Rich Text Editor Component
function RichTextEditor({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  function execCommand(command: string, value: string | undefined = undefined) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  }

  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        <select 
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          defaultValue=""
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <button type="button" onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
          <u>U</u>
        </button>
        <button type="button" onClick={() => execCommand('strikeThrough')} title="Strikethrough">
          <s>S</s>
        </button>
        <span className="toolbar-divider"></span>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
          •≡
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
          1.
        </button>
        <span className="toolbar-divider"></span>
        <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left">
          ≡
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center">
          ≡
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right">
          ≡
        </button>
        <span className="toolbar-divider"></span>
        <select 
          onChange={(e) => {
            if (e.target.value) execCommand('foreColor', e.target.value);
          }}
          defaultValue=""
          title="Text Color"
        >
          <option value="">Color</option>
          <option value="#000000">Black</option>
          <option value="#ef4444">Red</option>
          <option value="#f97316">Orange</option>
          <option value="#eab308">Yellow</option>
          <option value="#22c55e">Green</option>
          <option value="#3b82f6">Blue</option>
          <option value="#8b5cf6">Purple</option>
        </select>
        <button type="button" onClick={() => execCommand('removeFormat')} title="Clear Formatting">
          ✕
        </button>
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}

export default function AddNewProduct() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: productId } = useParams<{ id: string }>();
  const isEditMode = Boolean(productId);
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<Category[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Product variation toggle
  const [hasVariations, setHasVariations] = useState(false);
  
  // Thumbnail image
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [, setThumbnailPreview] = useState("");
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  
  // Product images (multi-image upload)
  const [productImages, setProductImages] = useState<{ file: File | null; preview: string; existing?: boolean; isPrimary?: boolean }[]>([]);
  const productImagesInputRef = useRef<HTMLInputElement>(null);
  
  // Additional images (kept for backward compatibility)
  const [additionalImages, setAdditionalImages] = useState<{ file: File | null; preview: string; existing?: boolean }[]>([]);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  
  // Meta image
  const [, setMetaImage] = useState<File | null>(null);
  const [metaImagePreview, setMetaImagePreview] = useState("");
  const metaImageInputRef = useRef<HTMLInputElement>(null);

  // Load categories and product on mount
  useEffect(() => {
    loadCategories();
    if (isEditMode && productId) {
      loadProduct(productId);
    }
  }, [productId]);

  // Load sub categories when main category changes
  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    } else {
      setSubCategories([]);
      setSubSubCategories([]);
    }
  }, [selectedMainCategory]);

  // Load sub-sub categories when sub category changes
  useEffect(() => {
    if (selectedSubCategory) {
      loadSubSubCategories(selectedSubCategory);
    } else {
      setSubSubCategories([]);
    }
  }, [selectedSubCategory]);

  async function loadProduct(id: string) {
    setLoading(true);
    try {
      const product = await api.getProduct(id);
      
      // Set form data
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        specification: product.shortDescription || "",
        shortDescription: product.shortDescription || "",
        categoryId: product.categoryId || "",
        pricePaise: product.pricePaise || 0,
        compareAtPricePaise: product.compareAtPricePaise || 0,
        costPricePaise: product.costPricePaise || 0,
        stockQuantity: product.stockQuantity || 0,
        lowStockThreshold: product.lowStockThreshold || 5,
        status: product.status || "active",
        isVisible: product.isVisible ?? true,
        isFeatured: product.isFeatured ?? false,
        color: product.color || "",
        material: product.material || "",
        weightGrams: product.weightGrams || 0,
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
        searchTags: product.searchTags?.join(", ") || "",
        productType: product.productType || "physical",
        unit: product.unit || "pc",
        minOrderQty: product.minOrderQty || 1,
        shippingCost: product.shippingCost || 0,
        discountAmount: product.discountAmount || 0,
        discountType: product.discountType || "flat",
        youtubeVideoUrl: product.youtubeVideoUrl || "",
        metaIndex: product.metaIndex || "index",
      });
      
      // Set existing thumbnail
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0];
        setExistingThumbnailUrl(primaryImage.url);
        setThumbnailPreview(primaryImage.url);
        
        // Set all images into productImages
        setProductImages(product.images.map((img: any) => ({
          file: null,
          preview: img.url,
          existing: true,
          isPrimary: img.isPrimary || false,
        })));
        
        // Set additional images (for backward compatibility)
        const additionalImgs = product.images.filter((img: any) => !img.isPrimary);
        if (additionalImgs.length > 0) {
          setAdditionalImages(additionalImgs.map((img: any) => ({
            file: null,
            preview: img.url,
            existing: true,
          })));
        }
      }
      
      // Load category hierarchy if product has a category
      if (product.category) {
        await loadCategoryHierarchy(product.category);
      }
    } catch (err) {
      console.error("Failed to load product:", err);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategoryHierarchy(category: any) {
    try {
      const allCategories = await api.getAllCategories();
      const allSubCategories = await api.getAllSubCategories();
      const allSubSubCategories = await api.getAllSubSubCategories();
      
      const isMainCategory = allCategories.find((c: Category) => c.id === category.id && !c.parentId);
      if (isMainCategory) {
        setSelectedMainCategory(category.id);
        return;
      }
      
      const isSubCategory = allSubCategories.find((c: Category) => c.id === category.id);
      if (isSubCategory) {
        setSelectedMainCategory(isSubCategory.parentId || "");
        setSubCategories(allSubCategories.filter((c: Category) => c.parentId === isSubCategory.parentId));
        setSelectedSubCategory(category.id);
        return;
      }
      
      const isSubSubCategory = allSubSubCategories.find((c: Category) => c.id === category.id);
      if (isSubSubCategory) {
        const parentSubCategory = allSubCategories.find((c: Category) => c.id === isSubSubCategory.parentId);
        if (parentSubCategory) {
          setSelectedMainCategory(parentSubCategory.parentId || "");
          setSubCategories(allSubCategories.filter((c: Category) => c.parentId === parentSubCategory.parentId));
          setSelectedSubCategory(parentSubCategory.id);
          setSubSubCategories(allSubSubCategories.filter((c: Category) => c.parentId === parentSubCategory.id));
          setFormData(prev => ({ ...prev, categoryId: category.id }));
        }
      }
    } catch (err) {
      console.error("Failed to load category hierarchy:", err);
    }
  }

  async function loadCategories() {
    try {
      const data = await api.getAllCategories();
      const mainCategories = data.filter((c: Category) => !c.parentId);
      setCategories(mainCategories);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  async function loadSubCategories(parentId: string) {
    try {
      const response = await api.getAllSubCategories();
      const filtered = response.filter((c: Category) => c.parentId === parentId);
      setSubCategories(filtered);
    } catch (err) {
      console.error("Failed to load sub categories:", err);
    }
  }

  async function loadSubSubCategories(parentId: string) {
    try {
      const response = await api.getAllSubSubCategories();
      const filtered = response.filter((c: Category) => c.parentId === parentId);
      setSubSubCategories(filtered);
    } catch (err) {
      console.error("Failed to load sub-sub categories:", err);
    }
  }

  function handleInputChange(field: keyof FormData, value: string | number | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleProductImagesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).filter(file => {
        if (file.size > 2 * 1024 * 1024) {
          toast.warning(`${file.name} exceeds 2MB limit`);
          return false;
        }
        return true;
      }).map(file => {
        const reader = new FileReader();
        return new Promise<{ file: File; preview: string; isPrimary: boolean }>((resolve) => {
          reader.onloadend = () => {
            resolve({ file, preview: reader.result as string, isPrimary: false });
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newImages).then(images => {
        setProductImages(prev => {
          const updated = [...prev, ...images];
          // If no primary image, set the first one as primary
          if (!updated.some(img => img.isPrimary) && updated.length > 0) {
            updated[0].isPrimary = true;
          }
          return updated;
        });
      });
    }
    if (productImagesInputRef.current) {
      productImagesInputRef.current.value = "";
    }
  }

  function removeProductImage(index: number) {
    setProductImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If removed image was primary, set first remaining as primary
      if (prev[index]?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  }

  function setAsPrimaryImage(index: number) {
    setProductImages(prev => 
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    );
  }

  function handleProductImagesDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files) {
      const newImages = Array.from(files).filter(file => {
        if (!file.type.startsWith('image/')) {
          toast.warning(`${file.name} is not an image`);
          return false;
        }
        if (file.size > 2 * 1024 * 1024) {
          toast.warning(`${file.name} exceeds 2MB limit`);
          return false;
        }
        return true;
      }).map(file => {
        const reader = new FileReader();
        return new Promise<{ file: File; preview: string; isPrimary: boolean }>((resolve) => {
          reader.onloadend = () => {
            resolve({ file, preview: reader.result as string, isPrimary: false });
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newImages).then(images => {
        setProductImages(prev => {
          const updated = [...prev, ...images];
          if (!updated.some(img => img.isPrimary) && updated.length > 0) {
            updated[0].isPrimary = true;
          }
          return updated;
        });
      });
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleAdditionalImagesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => {
        const reader = new FileReader();
        return new Promise<{ file: File; preview: string }>((resolve) => {
          reader.onloadend = () => {
            resolve({ file, preview: reader.result as string });
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newImages).then(images => {
        setAdditionalImages(prev => [...prev, ...images]);
      });
    }
    if (additionalImagesInputRef.current) {
      additionalImagesInputRef.current.value = "";
    }
  }

  function removeAdditionalImage(index: number) {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  }

  function handleMetaImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Image size must be less than 2MB");
        return;
      }
      setMetaImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMetaImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeMetaImage() {
    setMetaImage(null);
    setMetaImagePreview("");
    if (metaImageInputRef.current) {
      metaImageInputRef.current.value = "";
    }
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function generateSKU() {
    const prefix = formData.name.substring(0, 3).toUpperCase() || "PRD";
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
  }

  async function handleSubmit() {
    // Validation
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!formData.sku.trim() && !isEditMode) {
      generateSKU();
    }
    if (formData.pricePaise <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Upload all product images
      const allImages: { url: string; altText: string; sortOrder: number; isPrimary: boolean }[] = [];
      
      for (let i = 0; i < productImages.length; i++) {
        const img = productImages[i];
        let imageUrl = img.preview;
        
        // Upload if it's a new file
        if (img.file) {
          setUploadingThumbnail(true);
          const uploadResult = await api.uploadFile(img.file, "products");
          imageUrl = uploadResult.url;
        }
        
        allImages.push({
          url: imageUrl,
          altText: formData.name,
          sortOrder: i,
          isPrimary: img.isPrimary || false,
        });
      }
      
      // Fallback: Upload legacy thumbnail if productImages is empty
      if (allImages.length === 0 && thumbnail) {
        setUploadingThumbnail(true);
        const uploadResult = await api.uploadFile(thumbnail, "products");
        allImages.push({
          url: uploadResult.url,
          altText: formData.name,
          sortOrder: 0,
          isPrimary: true,
        });
      } else if (allImages.length === 0 && existingThumbnailUrl) {
        allImages.push({
          url: existingThumbnailUrl,
          altText: formData.name,
          sortOrder: 0,
          isPrimary: true,
        });
      }
      
      setUploadingThumbnail(false);

      // Determine final categoryId
      let finalCategoryId = formData.categoryId || selectedSubCategory || selectedMainCategory || null;

      // Prepare product data
      const productData: any = {
        name: formData.name,
        slug: generateSlug(formData.name),
        description: formData.description || null,
        shortDescription: formData.specification || null,
        sku: formData.sku || `PRD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        pricePaise: formData.pricePaise,
        compareAtPricePaise: formData.compareAtPricePaise || null,
        costPricePaise: formData.costPricePaise || null,
        categoryId: finalCategoryId,
        stockQuantity: formData.stockQuantity,
        lowStockThreshold: formData.lowStockThreshold,
        trackInventory: true,
        color: formData.color || null,
        material: formData.material || null,
        weightGrams: formData.weightGrams || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        searchTags: formData.searchTags ? formData.searchTags.split(",").map(t => t.trim()) : [],
        status: formData.status,
        isVisible: formData.isVisible,
        isFeatured: formData.isFeatured,
        // Additional fields
        productType: formData.productType,
        unit: formData.unit,
        minOrderQty: formData.minOrderQty,
        shippingCost: formData.shippingCost,
        discountAmount: formData.discountAmount,
        discountType: formData.discountType,
        youtubeVideoUrl: formData.youtubeVideoUrl || null,
        metaIndex: formData.metaIndex,
      };

      // Only include images if we have new ones or it's a new product
      if (allImages.length > 0 || !isEditMode) {
        productData.images = allImages;
      }

      if (isEditMode && productId) {
        await api.updateProduct(productId, productData);
      } else {
        await api.createProduct(productData);
      }
      
      navigate("/products-module");
    } catch (err: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} product:`, err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
    } finally {
      setSubmitting(false);
      setUploadingThumbnail(false);
    }
  }

  function handleReset() {
    if (isEditMode) {
      if (productId) loadProduct(productId);
    } else {
      setFormData(initialFormData);
      setSelectedMainCategory("");
      setSelectedSubCategory("");
      setThumbnail(null);
      setThumbnailPreview("");
      setExistingThumbnailUrl("");
      setProductImages([]);
      setAdditionalImages([]);
      setMetaImage(null);
      setMetaImagePreview("");
      setHasVariations(false);
    }
    setError("");
  }

  if (loading) {
    return (
      <div className="products-module-container">
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-module-container">
      <div className="page-back-header">
        <button className="btn-back" onClick={() => navigate("/products-module")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Product List
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "1rem",
          color: "#dc2626",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="add-product-form">
        <div className="form-section">
          {/* Basic Setup */}
          <div className="section-header">
            <h2>{isEditMode ? "Edit Product" : "Basic Setup"}</h2>
            <p>{isEditMode ? "Update the product information." : "Add your product basic information from here."}</p>
          </div>

          <div className="form-card">
            <div className="form-content">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  placeholder="Ex: New Product"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange("description", value)}
                  placeholder="Enter product description..."
                />
              </div>

              <div className="form-group">
                <label>Product Specification</label>
                <RichTextEditor
                  value={formData.specification}
                  onChange={(value) => handleInputChange("specification", value)}
                  placeholder="Enter product specification..."
                />
              </div>
            </div>
          </div>

          {/* General Setup */}
          <div className="section-header" style={{ marginTop: "2rem" }}>
            <h2>General Setup</h2>
            <p>Setup product type, category, and other details.</p>
          </div>

          <div className="form-card">
            <div className="form-content">
              {/* Product Type & SKU */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Product Type</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => handleInputChange("productType", e.target.value)}
                  >
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>SKU</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Ex: PRD-ABC123"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value.toUpperCase())}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={generateSKU}
                      className="btn-generate"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={selectedMainCategory}
                    onChange={(e) => setSelectedMainCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub Category</label>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    disabled={!selectedMainCategory}
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub Sub Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange("categoryId", e.target.value)}
                    disabled={!selectedSubCategory}
                  >
                    <option value="">Select Sub Sub Category</option>
                    {subSubCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit & Search Tags */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                  >
                    <option value="pc">Pc</option>
                    <option value="kg">Kg</option>
                    <option value="gm">Gm</option>
                    <option value="ltr">Ltr</option>
                    <option value="ml">Ml</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Search Tags</label>
                  <input
                    type="text"
                    placeholder="Enter tags separated by comma"
                    value={formData.searchTags}
                    onChange={(e) => handleInputChange("searchTags", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Others */}
          <div className="section-header" style={{ marginTop: "2rem" }}>
            <h2>Pricing & Others</h2>
            <p>Setup product pricing and stock information.</p>
          </div>

          <div className="form-card">
            <div className="form-content">
              {/* Unit Price, Min Order Qty */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.pricePaise / 100 || ""}
                    onChange={(e) => handleInputChange("pricePaise", Math.round(parseFloat(e.target.value || "0") * 100))}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Min. Order Qty</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.minOrderQty || ""}
                    onChange={(e) => handleInputChange("minOrderQty", parseInt(e.target.value || "1"))}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.stockQuantity || ""}
                    onChange={(e) => handleInputChange("stockQuantity", parseInt(e.target.value || "0"))}
                    min="0"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Discount</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.discountAmount || ""}
                      onChange={(e) => handleInputChange("discountAmount", parseFloat(e.target.value || "0"))}
                      min="0"
                      style={{ flex: 1 }}
                    />
                    <select
                      value={formData.discountType}
                      onChange={(e) => handleInputChange("discountType", e.target.value)}
                      style={{ width: "100px" }}
                    >
                      <option value="flat">Flat</option>
                      <option value="percent">Percent</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Shipping Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.shippingCost || ""}
                    onChange={(e) => handleInputChange("shippingCost", parseFloat(e.target.value || "0"))}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.status === "active"}
                        onChange={(e) => handleInputChange("status", e.target.checked ? "active" : "inactive")}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: "0.875rem", color: formData.status === "active" ? "#16a34a" : "#94a3b8" }}>
                      {formData.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Low Stock Threshold */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={formData.lowStockThreshold || ""}
                    onChange={(e) => handleInputChange("lowStockThreshold", parseInt(e.target.value || "5"))}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Featured</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => handleInputChange("isFeatured", e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: "0.875rem", color: formData.isFeatured ? "#16a34a" : "#94a3b8" }}>
                      {formData.isFeatured ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Variation Setup */}
          <div className="section-header" style={{ marginTop: "2rem" }}>
            <h2>Product Variation Setup</h2>
            <p>Add variations such as color, size etc.</p>
          </div>

          <div className="form-card">
            <div className="form-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.875rem", color: "#475569" }}>
                  Enable product variations (colors, sizes, etc.)
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={hasVariations}
                    onChange={(e) => setHasVariations(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {hasVariations && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #e2e8f0" }}>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", textAlign: "center" }}>
                    Product variation setup coming soon. You can add color, size, and other attributes here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Additional Images */}
          <div className="section-header" style={{ marginTop: "2rem" }}>
            <h2>Product Additional Images</h2>
            <p>Upload additional product images for gallery.</p>
          </div>

          <div className="form-card">
            <div className="form-content">
              <div className="additional-images-grid">
                {additionalImages.map((img, index) => (
                  <div key={index} className="additional-image-item">
                    <img src={img.preview} alt={`Additional ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeAdditionalImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div
                  className="add-image-placeholder"
                  onClick={() => additionalImagesInputRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Image</span>
                </div>
              </div>
              <input
                ref={additionalImagesInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleAdditionalImagesUpload}
                multiple
                style={{ display: "none" }}
              />
              <p className="upload-hint" style={{ marginTop: "0.75rem" }}>
                You can upload multiple images at once. Supported formats: JPEG, PNG, WEBP
              </p>
            </div>
          </div>

          {/* Product Video */}
          <div className="section-header" style={{ marginTop: "2rem" }}>
            <h2>Product Video</h2>
            <p>Add a YouTube video link for the product.</p>
          </div>

          <div className="form-card">
            <div className="form-content">
              <div className="form-group">
                <label>YouTube Video URL</label>
                <input
                  type="url"
                  placeholder="Ex: https://www.youtube.com/watch?v=xxxxx"
                  value={formData.youtubeVideoUrl}
                  onChange={(e) => handleInputChange("youtubeVideoUrl", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <div className="section-header" style={{ marginTop: "2rem" }}>
            <h2>SEO Section</h2>
            <p>Setup meta title, description, and other SEO related info.</p>
          </div>

          <div className="form-card">
            <div className="form-content">
              <div className="form-group">
                <label>Meta Title</label>
                <input
                  type="text"
                  placeholder="SEO title for search results"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label>Meta Description</label>
                <textarea
                  placeholder="SEO description for search results"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Meta Image</label>
                  {metaImagePreview ? (
                    <div style={{
                      position: "relative",
                      width: "150px",
                      height: "150px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                    }}>
                      <img
                        src={metaImagePreview}
                        alt="Meta"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={removeMetaImage}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      className="meta-image-upload"
                      onClick={() => metaImageInputRef.current?.click()}
                      style={{
                        width: "150px",
                        height: "150px",
                        border: "2px dashed #e2e8f0",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        gap: "8px",
                        color: "#94a3b8",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                      <span style={{ fontSize: "0.75rem" }}>Upload</span>
                    </div>
                  )}
                  <input
                    ref={metaImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleMetaImageUpload}
                    style={{ display: "none" }}
                  />
                </div>

                <div className="form-group">
                  <label>Index / No Index</label>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="metaIndex"
                        checked={formData.metaIndex === "index"}
                        onChange={() => handleInputChange("metaIndex", "index")}
                      />
                      <span style={{ fontSize: "0.875rem" }}>Index</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="metaIndex"
                        checked={formData.metaIndex === "noindex"}
                        onChange={() => handleInputChange("metaIndex", "noindex")}
                      />
                      <span style={{ fontSize: "0.875rem" }}>No Index</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="form-sidebar">
          <div className="form-group">
            <label>Product Images *</label>
            <p className="label-hint">Upload product images (first image will be primary)</p>
            
            {/* Image Grid */}
            {productImages.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
                marginBottom: "12px",
              }}>
                {productImages.map((img, index) => (
                  <div 
                    key={index}
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: img.isPrimary ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                      aspectRatio: "1",
                    }}
                  >
                    <img
                      src={img.preview}
                      alt={`Product ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {img.isPrimary && (
                      <span style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        background: "#3b82f6",
                        color: "#fff",
                        fontSize: "0.625rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}>
                        Primary
                      </span>
                    )}
                    <div style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      display: "flex",
                      gap: "4px",
                    }}>
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setAsPrimaryImage(index)}
                          title="Set as primary"
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#fff",
                            color: "#3b82f6",
                            border: "1px solid #3b82f6",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                          }}
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeProductImage(index)}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload Area */}
            <div 
              className="upload-area"
              onClick={() => productImagesInputRef.current?.click()}
              onDrop={handleProductImagesDrop}
              onDragOver={handleDragOver}
              style={{ 
                cursor: "pointer",
                minHeight: productImages.length > 0 ? "80px" : "150px",
              }}
            >
              <div className="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                <p>Click to upload<br />Or drag and drop</p>
              </div>
            </div>
            
            <input
              ref={productImagesInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleProductImagesUpload}
              multiple
              style={{ display: "none" }}
            />
            
            <p className="upload-hint">
              JPEG, PNG, JPG, WEBP<br />
              Image size: Max 2MB each<br />
              Ratio 1:1 (500 x 500 px)
            </p>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-reset" 
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </button>
            <button 
              type="button" 
              className="btn-submit" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (uploadingThumbnail ? "Uploading..." : "Saving...") : (isEditMode ? "Update" : "Submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
