import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import TagInput from "../../components/TagInput";
import "../../styles/products-module.css";
import "../../styles/tag-input.css";

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
  
  // Tag-based selections for multi-select
  const [selectedCategories, setSelectedCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubCategoriesTags, setSelectedSubCategoriesTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubSubCategoriesTags, setSelectedSubSubCategoriesTags] = useState<{ id: string; name: string }[]>([]);
  const [searchTagsList, setSearchTagsList] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Product variation toggle
  const [hasVariations, setHasVariations] = useState(false);
  const [enableColors, setEnableColors] = useState(false);
  const [selectedColors, setSelectedColors] = useState<{ id: string; name: string; hex?: string }[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<{ id: string; name: string }[]>([]);
  const [colorWiseImages, setColorWiseImages] = useState<{ colorId: string; colorName: string; images: { file: File | null; preview: string }[] }[]>([]);
  const colorImageInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
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
  const [metaImage, setMetaImage] = useState<File | null>(null);
  const [metaImagePreview, setMetaImagePreview] = useState("");
  const [existingMetaImageUrl, setExistingMetaImageUrl] = useState("");
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
      
      // Set existing meta image
      if (product.metaImageUrl) {
        setExistingMetaImageUrl(product.metaImageUrl);
        setMetaImagePreview(product.metaImageUrl);
      }
      
      // Set search tags as tag list
      if (product.searchTags && product.searchTags.length > 0) {
        setSearchTagsList(product.searchTags.map((tag: string) => ({
          id: tag.toLowerCase().replace(/\s+/g, "-"),
          name: tag,
        })));
      }
      
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
      
      // Load variations data
      if (product.hasVariations) {
        setHasVariations(true);
        
        // Load colors
        if (product.colors && product.colors.length > 0) {
          setEnableColors(true);
          setSelectedColors(product.colors.map((c: any) => ({
            id: c.id,
            name: c.name,
            hex: c.hexCode,
          })));
          setColorWiseImages(product.colors.map((c: any) => ({
            colorId: c.id,
            colorName: c.name,
            images: c.images?.map((img: any) => ({
              file: null,
              preview: img.url,
            })) || [],
          })));
        }
        
        // Load attributes
        if (product.productAttributes && product.productAttributes.length > 0) {
          setSelectedAttributes(product.productAttributes.map((attr: any) => ({
            id: attr.id,
            name: attr.name,
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
        setSelectedCategories([{ id: category.id, name: category.name }]);
        return;
      }
      
      const isSubCategory = allSubCategories.find((c: Category) => c.id === category.id);
      if (isSubCategory) {
        setSelectedMainCategory(isSubCategory.parentId || "");
        setSubCategories(allSubCategories.filter((c: Category) => c.parentId === isSubCategory.parentId));
        setSelectedSubCategory(category.id);
        
        // Set tag-based selections
        const mainCat = allCategories.find((c: Category) => c.id === isSubCategory.parentId);
        if (mainCat) {
          setSelectedCategories([{ id: mainCat.id, name: mainCat.name }]);
        }
        setSelectedSubCategoriesTags([{ id: category.id, name: category.name }]);
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
          
          // Set tag-based selections
          const mainCat = allCategories.find((c: Category) => c.id === parentSubCategory.parentId);
          if (mainCat) {
            setSelectedCategories([{ id: mainCat.id, name: mainCat.name }]);
          }
          setSelectedSubCategoriesTags([{ id: parentSubCategory.id, name: parentSubCategory.name }]);
          setSelectedSubSubCategoriesTags([{ id: category.id, name: category.name }]);
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
    setExistingMetaImageUrl("");
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

      // Upload meta image if provided
      let metaImageUrl: string | null = existingMetaImageUrl || null;
      if (metaImage) {
        const metaUploadResult = await api.uploadFile(metaImage, "products");
        metaImageUrl = metaUploadResult.url;
      }

      // Determine final categoryId - use first selected category or sub-category
      let finalCategoryId = 
        (selectedSubSubCategoriesTags.length > 0 ? selectedSubSubCategoriesTags[0].id : null) ||
        (selectedSubCategoriesTags.length > 0 ? selectedSubCategoriesTags[0].id : null) ||
        (selectedCategories.length > 0 ? selectedCategories[0].id : null) ||
        formData.categoryId || selectedSubCategory || selectedMainCategory || null;

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
        metaImageUrl: metaImageUrl,
        searchTags: searchTagsList.length > 0 
          ? searchTagsList.map(t => t.name) 
          : (formData.searchTags ? formData.searchTags.split(",").map(t => t.trim()) : []),
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
        // Variation fields
        hasVariations: hasVariations,
      };

      // Only include images if we have new ones or it's a new product
      if (allImages.length > 0 || !isEditMode) {
        productData.images = allImages;
      }

      // Add colors if variations are enabled
      if (hasVariations && enableColors && selectedColors.length > 0) {
        // Upload color images first if needed
        const colorsWithUploadedImages = await Promise.all(
          colorWiseImages.map(async (colorItem) => {
            const uploadedImages = await Promise.all(
              colorItem.images.map(async (img, idx) => {
                let imageUrl = img.preview;
                if (img.file) {
                  const uploadResult = await api.uploadFile(img.file, "products");
                  imageUrl = uploadResult.url;
                }
                return {
                  url: imageUrl,
                  altText: `${colorItem.colorName} image ${idx + 1}`,
                  sortOrder: idx,
                };
              })
            );
            
            const colorInfo = selectedColors.find(c => c.id === colorItem.colorId);
            return {
              name: colorItem.colorName,
              hexCode: colorInfo?.hex || "#000000",
              sortOrder: selectedColors.findIndex(c => c.id === colorItem.colorId),
              images: uploadedImages,
            };
          })
        );
        productData.colors = colorsWithUploadedImages;
      }

      // Add attributes if variations are enabled
      if (hasVariations && selectedAttributes.length > 0) {
        productData.productAttributes = selectedAttributes.map((attr, idx) => ({
          name: attr.name,
          values: [],
          sortOrder: idx,
        }));
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
      setSelectedCategories([]);
      setSelectedSubCategoriesTags([]);
      setSelectedSubSubCategoriesTags([]);
      setSearchTagsList([]);
      setThumbnail(null);
      setThumbnailPreview("");
      setExistingThumbnailUrl("");
      setProductImages([]);
      setAdditionalImages([]);
      setMetaImage(null);
      setMetaImagePreview("");
      setExistingMetaImageUrl("");
      setHasVariations(false);
      setEnableColors(false);
      setSelectedColors([]);
      setSelectedAttributes([]);
      setColorWiseImages([]);
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

              {/* Category Selection - Tag Based */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Category *</label>
                  <TagInput
                    placeholder="Select category"
                    selectedTags={selectedCategories}
                    onTagsChange={(tags) => {
                      setSelectedCategories(tags);
                      // Update legacy state for filtering
                      if (tags.length > 0) {
                        setSelectedMainCategory(tags[tags.length - 1].id);
                      } else {
                        setSelectedMainCategory("");
                        setSelectedSubCategoriesTags([]);
                      }
                    }}
                    options={categories.map(c => ({ id: c.id, name: c.name }))}
                  />
                </div>

                <div className="form-group">
                  <label>Sub Category</label>
                  <TagInput
                    placeholder="Select sub category"
                    selectedTags={selectedSubCategoriesTags}
                    onTagsChange={(tags) => {
                      setSelectedSubCategoriesTags(tags);
                      // Update legacy state for filtering
                      if (tags.length > 0) {
                        setSelectedSubCategory(tags[tags.length - 1].id);
                      } else {
                        setSelectedSubCategory("");
                      }
                    }}
                    options={subCategories.map(c => ({ id: c.id, name: c.name }))}
                    disabled={selectedCategories.length === 0}
                  />
                </div>

                <div className="form-group">
                  <label>Sub Sub Category</label>
                  <TagInput
                    placeholder="Select sub sub category"
                    selectedTags={selectedSubSubCategoriesTags}
                    onTagsChange={(tags) => {
                      setSelectedSubSubCategoriesTags(tags);
                      // Update formData.categoryId for backward compatibility
                      if (tags.length > 0) {
                        handleInputChange("categoryId", tags[tags.length - 1].id);
                      } else {
                        handleInputChange("categoryId", "");
                      }
                    }}
                    options={subSubCategories.map(c => ({ id: c.id, name: c.name }))}
                    disabled={selectedSubCategoriesTags.length === 0}
                  />
                </div>
              </div>

              {/* Unit & Search Tags */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                  >
                    <option value="pc">pc</option>
                    <option value="kg">kg</option>
                    <option value="gms">gms</option>
                    <option value="ltrs">ltrs</option>
                    <option value="pair">pair</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="ml">ml</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="set">set</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Search Tags</label>
                  <TagInput
                    placeholder="Type tag and press Enter"
                    selectedTags={searchTagsList}
                    onTagsChange={setSearchTagsList}
                    allowCustomTags={true}
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
          <div className="section-header" style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2>Product Variation Setup</h2>
              <p>Enable and manage different variations of a product.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={hasVariations}
                onChange={(e) => {
                  setHasVariations(e.target.checked);
                  if (!e.target.checked) {
                    setEnableColors(false);
                    setSelectedColors([]);
                    setSelectedAttributes([]);
                    setColorWiseImages([]);
                  }
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {hasVariations && (
            <div className="form-card">
              <div className="form-content">
                {/* Colors and Attributes Row */}
                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
                  {/* Colors Section */}
                  <div className="form-group">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <label style={{ margin: 0 }}>
                        Colors
                        <span style={{ 
                          display: "inline-block",
                          width: "14px",
                          height: "14px",
                          marginLeft: "4px",
                          borderRadius: "50%",
                          background: "#e5e7eb",
                          color: "#6b7280",
                          fontSize: "10px",
                          textAlign: "center",
                          lineHeight: "14px",
                          cursor: "help"
                        }} title="Add color variations for this product">?</span>
                      </label>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={enableColors}
                          onChange={(e) => {
                            setEnableColors(e.target.checked);
                            if (!e.target.checked) {
                              setSelectedColors([]);
                              setColorWiseImages([]);
                            }
                          }}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    {/* Selected Colors Display */}
                    {selectedColors.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                        {selectedColors.map(color => (
                          <span 
                            key={color.id} 
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <span style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              background: color.hex || "#ccc",
                              border: "1px solid rgba(0,0,0,0.1)"
                            }} />
                            {color.name}
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = selectedColors.filter(c => c.id !== color.id);
                                setSelectedColors(newColors);
                                setColorWiseImages(prev => prev.filter(c => c.colorId !== color.id));
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#9ca3af",
                                cursor: "pointer",
                                padding: "0",
                                fontSize: "14px",
                                lineHeight: 1
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Color Picker */}
                    {enableColors && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        background: "#fff"
                      }}>
                        <input
                          type="color"
                          id="colorPicker"
                          style={{
                            width: "44px",
                            height: "44px",
                            padding: "0",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: "transparent"
                          }}
                          onChange={(e) => {
                            const hex = e.target.value.toUpperCase();
                            const colorNameInput = document.getElementById("colorNameInput") as HTMLInputElement;
                            if (colorNameInput) {
                              colorNameInput.value = hex;
                            }
                          }}
                        />
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#6b7280", fontSize: "14px" }}>#</span>
                          <input
                            type="text"
                            id="colorNameInput"
                            placeholder="F54927"
                            maxLength={6}
                            style={{
                              flex: 1,
                              padding: "10px 12px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontFamily: "monospace",
                              textTransform: "uppercase"
                            }}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
                              e.target.value = value;
                              if (value.length === 6) {
                                const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
                                if (colorPicker) {
                                  colorPicker.value = `#${value}`;
                                }
                              }
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
                            const colorNameInput = document.getElementById("colorNameInput") as HTMLInputElement;
                            const hex = colorPicker?.value?.toUpperCase() || "#000000";
                            const colorName = colorNameInput?.value?.toUpperCase() || hex.replace("#", "");
                            
                            // Check if color already exists
                            if (selectedColors.some(c => c.hex?.toUpperCase() === hex)) {
                              return;
                            }
                            
                            const newColor = { 
                              id: `color-${Date.now()}`, 
                              name: `#${colorName}`, 
                              hex: hex 
                            };
                            const newColors = [...selectedColors, newColor];
                            setSelectedColors(newColors);
                            setColorWiseImages(prev => [...prev, { colorId: newColor.id, colorName: newColor.name, images: [] }]);
                            
                            // Reset inputs
                            if (colorNameInput) colorNameInput.value = "";
                          }}
                          style={{
                            padding: "10px 20px",
                            background: "#3B82F6",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            cursor: "pointer"
                          }}
                        >
                          Add Color
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Attributes Section */}
                  <div className="form-group">
                    <label>
                      Attributes
                      <span style={{ 
                        display: "inline-block",
                        width: "14px",
                        height: "14px",
                        marginLeft: "4px",
                        borderRadius: "50%",
                        background: "#e5e7eb",
                        color: "#6b7280",
                        fontSize: "10px",
                        textAlign: "center",
                        lineHeight: "14px",
                        cursor: "help"
                      }} title="Add attribute variations like size, material etc.">?</span>
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const option = { id: e.target.value, name: e.target.options[e.target.selectedIndex].text };
                          if (!selectedAttributes.some(a => a.id === option.id)) {
                            setSelectedAttributes([...selectedAttributes, option]);
                          }
                        }
                      }}
                    >
                      <option value="">Choose attributes</option>
                      <option value="size" disabled={selectedAttributes.some(a => a.id === "size")}>Size</option>
                      <option value="material" disabled={selectedAttributes.some(a => a.id === "material")}>Material</option>
                      <option value="style" disabled={selectedAttributes.some(a => a.id === "style")}>Style</option>
                      <option value="weight" disabled={selectedAttributes.some(a => a.id === "weight")}>Weight</option>
                      <option value="length" disabled={selectedAttributes.some(a => a.id === "length")}>Length</option>
                      <option value="width" disabled={selectedAttributes.some(a => a.id === "width")}>Width</option>
                    </select>
                    {selectedAttributes.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {selectedAttributes.map(attr => (
                          <span key={attr.id} className="tag-chip">
                            {attr.name}
                            <button
                              type="button"
                              className="tag-remove"
                              onClick={() => setSelectedAttributes(selectedAttributes.filter(a => a.id !== attr.id))}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Color Wise Images */}
                {enableColors && selectedColors.length > 0 && (
                  <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                      Product Color Wise Images
                    </h3>
                    <p style={{ fontSize: "0.813rem", color: "#6b7280", marginBottom: "1rem" }}>
                      Here you can add color wise product image. <span style={{ color: "#9ca3af" }}>JPG, JPEG, PNG image size : Max 20 MB (Ratio 1:1 500 x 500 px).</span>
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {colorWiseImages.map((colorItem) => (
                        <div 
                          key={colorItem.colorId}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "1rem",
                            padding: "1rem",
                            background: "#f9fafb",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb"
                          }}
                        >
                          <div style={{
                            minWidth: "80px",
                            padding: "8px 16px",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            color: "#3b82f6",
                            fontWeight: 500,
                            textAlign: "center"
                          }}>
                            {colorItem.colorName}
                          </div>
                          
                          <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {colorItem.images.map((img, imgIndex) => (
                              <div 
                                key={imgIndex}
                                style={{
                                  position: "relative",
                                  width: "60px",
                                  height: "60px",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  border: "1px solid #e5e7eb"
                                }}
                              >
                                <img 
                                  src={img.preview} 
                                  alt={`${colorItem.colorName} ${imgIndex + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setColorWiseImages(prev => prev.map(c => 
                                      c.colorId === colorItem.colorId 
                                        ? { ...c, images: c.images.filter((_, i) => i !== imgIndex) }
                                        : c
                                    ));
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: "2px",
                                    right: "2px",
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                    color: "#fff",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            
                            {/* Add Image Button */}
                            <div
                              onClick={() => colorImageInputRefs.current[colorItem.colorId]?.click()}
                              style={{
                                width: "60px",
                                height: "60px",
                                borderRadius: "6px",
                                border: "2px dashed #d1d5db",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "#9ca3af",
                                fontSize: "10px",
                                gap: "2px"
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Add
                            </div>
                            <input
                              ref={(el) => { colorImageInputRefs.current[colorItem.colorId] = el; }}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              multiple
                              style={{ display: "none" }}
                              onChange={(e) => {
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
                                    setColorWiseImages(prev => prev.map(c => 
                                      c.colorId === colorItem.colorId 
                                        ? { ...c, images: [...c.images, ...images] }
                                        : c
                                    ));
                                  });
                                }
                                e.target.value = "";
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
