import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import TagInput from "../../components/TagInput";
import "../../styles/add-new-product.css";

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
  price: number;
  compareAtPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: "active" | "inactive" | "draft";
  isVisible: boolean;
  isFeatured: boolean;
  color: string;
  material: string;
  weightGrams: number;
  metaTitle: string;
  metaDescription: string;
  searchTags: string;
  productType: string;
  unit: string;
  minOrderQty: number;
  shippingCost: number;
  discountAmount: number;
  discountType: "flat" | "percent";
  youtubeVideoUrl: string;
  metaIndex: "index" | "noindex";
}

// The range only comes in these three finishes, so the Variations card offers
// them as a fixed set rather than a free colour picker — an arbitrary hex let
// products drift outside the range the storefront and the warehouse stock.
// `hex` is what gets stored on the product, so it has to stay stable.
const COLOR_PRESETS = [
  { id: "gold-plated", name: "Gold Plated", hex: "#D4AF37" },
  { id: "rose-gold-platinum", name: "Rose Gold Platinum", hex: "#B76E79" },
  { id: "silver", name: "Silver", hex: "#C0C0C0" },
] as const;

const initialFormData: FormData = {
  name: "",
  sku: "",
  description: "",
  specification: "",
  shortDescription: "",
  categoryId: "",
  price: 0,
  compareAtPrice: 0,
  costPrice: 0,
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

  function execCommand(command: string, cmdValue: string | undefined = undefined) {
    document.execCommand(command, false, cmdValue);
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
    <div className="anp-rich-editor">
      <div className="anp-editor-toolbar">
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
        <span className="anp-toolbar-divider"></span>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
          •≡
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
          1.
        </button>
        <span className="anp-toolbar-divider"></span>
        <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left">
          ≡
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center">
          ≡
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right">
          ≡
        </button>
      </div>
      <div
        ref={editorRef}
        className="anp-editor-content"
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
  
  // Additional images (Gallery)
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
      
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        specification: product.shortDescription || "",
        shortDescription: product.shortDescription || "",
        categoryId: product.categoryId || "",
        price: product.price || 0,
        compareAtPrice: product.compareAtPrice || 0,
        costPrice: product.costPrice || 0,
        stockQuantity: product.stockQuantity || 0,
        lowStockThreshold: product.lowStockThreshold || 5,
        // A draft has to become editable as a normal product, otherwise Submit
        // would write "draft" straight back and you could never publish it.
        // Coerce to "inactive" so the Visibility toggle correctly reads OFF
        // and the user chooses when it goes live.
        status: product.status === "draft" ? "inactive" : (product.status || "active"),
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
      
      if (product.metaImageUrl) {
        setExistingMetaImageUrl(product.metaImageUrl);
        setMetaImagePreview(product.metaImageUrl);
      }
      
      if (product.searchTags && product.searchTags.length > 0) {
        setSearchTagsList(product.searchTags.map((tag: string) => ({
          id: tag.toLowerCase().replace(/\s+/g, "-"),
          name: tag,
        })));
      }
      
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0];
        setExistingThumbnailUrl(primaryImage.url);
        setThumbnailPreview(primaryImage.url);
        
        setProductImages(product.images.map((img: any) => ({
          file: null,
          preview: img.url,
          existing: true,
          isPrimary: img.isPrimary || false,
        })));
        
        const additionalImgs = product.images.filter((img: any) => !img.isPrimary);
        if (additionalImgs.length > 0) {
          setAdditionalImages(additionalImgs.map((img: any) => ({
            file: null,
            preview: img.url,
            existing: true,
          })));
        }
      }
      
      if (product.hasVariations) {
        setHasVariations(true);
        
        if (product.colors && product.colors.length > 0) {
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
        
        if (product.productAttributes && product.productAttributes.length > 0) {
          setSelectedAttributes(product.productAttributes.map((attr: any) => ({
            id: attr.id,
            name: attr.name,
          })));
        }
      }
      
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
      const newImages = Array.from(files).filter(file => {
        if (file.size > 2 * 1024 * 1024) {
          toast.warning(`${file.name} exceeds 2MB limit`);
          return false;
        }
        return true;
      }).map(file => {
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

  function removeColor(colorId: string) {
    setSelectedColors(prev => prev.filter(c => c.id !== colorId));
    // `colorWiseImages` carries a row per colour, so it has to drop in step or
    // the uploads would survive for a colour that's no longer selected.
    setColorWiseImages(prev => prev.filter(c => c.colorId !== colorId));
  }

  /** Matches on hex, not the preset id — colours loaded from an existing
   *  product carry the database's UUID, so a preset id never matches those. */
  function findSelectedColor(hex: string) {
    return selectedColors.find(c => c.hex?.toUpperCase() === hex.toUpperCase());
  }

  function toggleColor(preset: (typeof COLOR_PRESETS)[number]) {
    const existing = findSelectedColor(preset.hex);
    if (existing) {
      removeColor(existing.id);
      return;
    }
    setSelectedColors(prev => [...prev, { id: preset.id, name: preset.name, hex: preset.hex }]);
    setColorWiseImages(prev => [...prev, { colorId: preset.id, colorName: preset.name, images: [] }]);
  }

  async function handleSubmit(asDraft = false) {
    // Still required on a draft: generateSlug() needs a name, and without
    // this you'd accumulate a list of rows all called "New Product".
    if (!formData.name.trim()) {
      setError("Product name is required");
      toast.error("Product name is required");
      return;
    }
    if (!formData.sku.trim() && !isEditMode) {
      generateSKU();
    }
    // Drafts exist to be half-finished, so the price gate only applies on
    // the publish path.
    if (!asDraft && formData.price <= 0) {
      setError("Price must be greater than 0");
      toast.error("Price must be greater than 0");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const allImages: { url: string; altText: string; sortOrder: number; isPrimary: boolean }[] = [];
      
      for (let i = 0; i < productImages.length; i++) {
        const img = productImages[i];
        let imageUrl = img.preview;
        
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

      let metaImageUrl: string | null = existingMetaImageUrl || null;
      if (metaImage) {
        const metaUploadResult = await api.uploadFile(metaImage, "products");
        metaImageUrl = metaUploadResult.url;
      }

      let finalCategoryId = 
        (selectedSubSubCategoriesTags.length > 0 ? selectedSubSubCategoriesTags[0].id : null) ||
        (selectedSubCategoriesTags.length > 0 ? selectedSubCategoriesTags[0].id : null) ||
        (selectedCategories.length > 0 ? selectedCategories[0].id : null) ||
        formData.categoryId || selectedSubCategory || selectedMainCategory || null;

      const productData: any = {
        name: formData.name,
        slug: generateSlug(formData.name),
        description: formData.description || null,
        shortDescription: formData.specification || null,
        sku: formData.sku || `PRD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice || null,
        costPrice: formData.costPrice || null,
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
        status: asDraft ? "draft" : formData.status,
        // A draft must not be visible regardless of the toggle. Status alone
        // is the only thing keeping it off the storefront, and every caller
        // would have to remember to check it.
        isVisible: asDraft ? false : formData.isVisible,
        isFeatured: formData.isFeatured,
        productType: formData.productType,
        unit: formData.unit,
        minOrderQty: formData.minOrderQty,
        shippingCost: formData.shippingCost,
        discountAmount: formData.discountAmount,
        discountType: formData.discountType,
        youtubeVideoUrl: formData.youtubeVideoUrl || null,
        metaIndex: formData.metaIndex,
        hasVariations: hasVariations,
      };

      if (allImages.length > 0 || !isEditMode) {
        productData.images = allImages;
      }

      if (hasVariations && selectedColors.length > 0) {
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

      if (hasVariations && selectedAttributes.length > 0) {
        productData.productAttributes = selectedAttributes.map((attr, idx) => ({
          name: attr.name,
          values: [],
          sortOrder: idx,
        }));
      }

      if (isEditMode && productId) {
        await api.updateProduct(productId, productData);
        // Say what actually happened. A loaded draft is coerced to "inactive"
        // on load, so Submit on one does NOT put it live — claiming success
        // here told the user they had published something they hadn't.
        toast.success(
          asDraft ? "Draft updated" : `Product updated${productData.status === "inactive" ? " (inactive — not live in the store)" : " successfully"}`
        );
      } else {
        await api.createProduct(productData);
        toast.success(asDraft ? "Draft saved" : "Product created successfully");
      }

      navigate("/products-module");
    } catch (err: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} product:`, err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
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
      setSelectedColors([]);
      setSelectedAttributes([]);
      setColorWiseImages([]);
    }
    setError("");
  }

  if (loading) {
    return (
      <div className="anp-container">
        <div className="anp-loading">
          <div className="anp-loading-spinner"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="anp-container">
      {/* No page header here on purpose: the app shell's <AppHeader /> owns
          the title, and the breadcrumb + h1 + back link that used to sit in
          this column duplicated it. The list is reachable from the sidebar. */}

      {error && (
        <div className="anp-error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="anp-layout">
        {/* Main Form */}
        <div className="anp-main">
          {/* Basic Information */}
          <section className="anp-section">
            <div className="anp-card">
              <div className="anp-section-header">
                <h2>Basic Information</h2>
                <p>Name and describe the product customers will see.</p>
              </div>
              <div className="anp-form-group">
                <label>PRODUCT NAME *</label>
                <input
                  type="text"
                  placeholder="Ex: New Product"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="anp-form-group">
                <label>DESCRIPTION *</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange("description", value)}
                  placeholder="Enter product description..."
                />
              </div>

              <div className="anp-form-group">
                <label>PRODUCT SPECIFICATION</label>
                <RichTextEditor
                  value={formData.specification}
                  onChange={(value) => handleInputChange("specification", value)}
                  placeholder="Enter product specification..."
                />
              </div>
            </div>
          </section>

          {/* Organization */}
          <section className="anp-section">
            <div className="anp-card">
              <div className="anp-section-header">
                <h2>Organization</h2>
                <p>Type, category and identifiers that help you and shoppers find it.</p>
              </div>
              <div className="anp-row-2">
                <div className="anp-form-group">
                  <label>PRODUCT TYPE</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => handleInputChange("productType", e.target.value)}
                  >
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>
                <div className="anp-form-group">
                  <label>SKU</label>
                  <div className="anp-input-with-btn">
                    <input
                      type="text"
                      placeholder="Ex: PRD-ABC123"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value.toUpperCase())}
                    />
                    <button type="button" onClick={generateSKU} className="anp-btn-generate">
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="anp-row-3">
                <div className="anp-form-group">
                  <label>CATEGORY *</label>
                  <select
                    value={selectedMainCategory}
                    onChange={(e) => {
                      setSelectedMainCategory(e.target.value);
                      setSelectedSubCategory("");
                      setSelectedCategories(e.target.value ? [{ id: e.target.value, name: categories.find(c => c.id === e.target.value)?.name || "" }] : []);
                      setSelectedSubCategoriesTags([]);
                      setSelectedSubSubCategoriesTags([]);
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="anp-form-group">
                  <label>SUB CATEGORY</label>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => {
                      setSelectedSubCategory(e.target.value);
                      setSelectedSubCategoriesTags(e.target.value ? [{ id: e.target.value, name: subCategories.find(c => c.id === e.target.value)?.name || "" }] : []);
                      setSelectedSubSubCategoriesTags([]);
                    }}
                    disabled={!selectedMainCategory}
                  >
                    <option value="">Select sub category</option>
                    {subCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="anp-form-group">
                  <label>SUB SUB CATEGORY</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      handleInputChange("categoryId", e.target.value);
                      setSelectedSubSubCategoriesTags(e.target.value ? [{ id: e.target.value, name: subSubCategories.find(c => c.id === e.target.value)?.name || "" }] : []);
                    }}
                    disabled={!selectedSubCategory}
                  >
                    <option value="">Select sub sub category</option>
                    {subSubCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="anp-row-2">
                <div className="anp-form-group">
                  <label>UNIT *</label>
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
                <div className="anp-form-group">
                  <label>SEARCH TAGS</label>
                  <TagInput
                    placeholder="Type tag and press Enter"
                    selectedTags={searchTagsList}
                    onTagsChange={setSearchTagsList}
                    allowCustomTags={true}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Pricing & Inventory */}
          <section className="anp-section">
            <div className="anp-card">
              <div className="anp-section-header">
                <h2>Pricing & Inventory</h2>
                <p>Set what it costs, how much you have and when to be warned.</p>
              </div>
              <div className="anp-row-3">
                <div className="anp-form-group">
                  <label>UNIT PRICE (₹) *</label>
                  <div className="anp-input-prefix">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.price || ""}
                      onChange={(e) => handleInputChange("price", parseFloat(e.target.value || "0"))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="anp-form-group">
                  <label>DISCOUNT</label>
                  <div className="anp-input-with-select">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.discountAmount || ""}
                      onChange={(e) => handleInputChange("discountAmount", parseFloat(e.target.value || "0"))}
                      min="0"
                    />
                    <select
                      value={formData.discountType}
                      onChange={(e) => handleInputChange("discountType", e.target.value)}
                    >
                      <option value="flat">Flat</option>
                      <option value="percent">Percent</option>
                    </select>
                  </div>
                </div>
                <div className="anp-form-group">
                  <label>SHIPPING COST (₹)</label>
                  <div className="anp-input-prefix">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.shippingCost || ""}
                      onChange={(e) => handleInputChange("shippingCost", parseFloat(e.target.value || "0"))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="anp-row-3">
                <div className="anp-form-group">
                  <label>MIN. ORDER QTY</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.minOrderQty || ""}
                    onChange={(e) => handleInputChange("minOrderQty", parseInt(e.target.value || "1"))}
                    min="1"
                  />
                </div>
                <div className="anp-form-group">
                  <label>STOCK QUANTITY</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.stockQuantity || ""}
                    onChange={(e) => handleInputChange("stockQuantity", parseInt(e.target.value || "0"))}
                    min="0"
                  />
                </div>
                <div className="anp-form-group">
                  <label>LOW STOCK THRESHOLD</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={formData.lowStockThreshold || ""}
                    onChange={(e) => handleInputChange("lowStockThreshold", parseInt(e.target.value || "5"))}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Product Variations */}
          <section className="anp-section">
            <div className="anp-card">
              <div className="anp-section-header-with-toggle">
                <div>
                  <h2>Product Variations</h2>
                  <p>Enable to add sizes, colors or other options with their own price and stock.</p>
                </div>
                <label className="anp-toggle">
                  <input
                    type="checkbox"
                    checked={hasVariations}
                    onChange={(e) => {
                      setHasVariations(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedColors([]);
                        setSelectedAttributes([]);
                        setColorWiseImages([]);
                      }
                    }}
                  />
                  <span className="anp-toggle-slider"></span>
                </label>
              </div>

              {hasVariations && (
              <div>
                <div className="anp-row-2">
                  <div className="anp-form-group">
                    <label>Colors</label>

                    <>
                        {selectedColors.length > 0 && (
                          <div className="anp-color-tags">
                            {selectedColors.map(color => (
                              <span key={color.id} className="anp-color-tag">
                                <span className="anp-color-dot" style={{ background: color.hex || "#ccc" }} />
                                {color.name}
                                <button
                                  type="button"
                                  aria-label={`Remove ${color.name}`}
                                  onClick={() => removeColor(color.id)}
                                >×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="anp-color-presets">
                          {COLOR_PRESETS.map(preset => {
                            const isSelected = !!findSelectedColor(preset.hex);
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                className={`anp-color-preset${isSelected ? " anp-color-preset--selected" : ""}`}
                                aria-pressed={isSelected}
                                onClick={() => toggleColor(preset)}
                              >
                                <span className="anp-color-dot" style={{ background: preset.hex }} />
                                {preset.name}
                              </button>
                            );
                          })}
                        </div>
                    </>
                  </div>

                  <div className="anp-form-group">
                    <label>Attributes</label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !selectedAttributes.some(a => a.id === e.target.value)) {
                          setSelectedAttributes(prev => [...prev, { id: e.target.value, name: e.target.options[e.target.selectedIndex].text }]);
                        }
                      }}
                    >
                      <option value="">Choose attributes</option>
                      <option value="size">Size</option>
                      <option value="material">Material</option>
                      <option value="style">Style</option>
                      <option value="weight">Weight</option>
                    </select>
                    {selectedAttributes.length > 0 && (
                      <div className="anp-attr-tags">
                        {selectedAttributes.map(attr => (
                          <span key={attr.id} className="anp-attr-tag">
                            {attr.name}
                            <button type="button" onClick={() => setSelectedAttributes(prev => prev.filter(a => a.id !== attr.id))}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Color-wise images */}
                {selectedColors.length > 0 && (
                  <div className="anp-color-images">
                    <h4>Product Color Wise Images</h4>
                    <p className="anp-hint">Upload images for each color variation.</p>
                    {colorWiseImages.map((colorItem) => (
                      <div key={colorItem.colorId} className="anp-color-image-row">
                        <div className="anp-color-label">{colorItem.colorName}</div>
                        <div className="anp-color-image-grid">
                          {colorItem.images.map((img, imgIndex) => (
                            <div key={imgIndex} className="anp-color-image-item">
                              <img src={img.preview} alt="" />
                              <button
                                type="button"
                                onClick={() => {
                                  setColorWiseImages(prev => prev.map(c => 
                                    c.colorId === colorItem.colorId 
                                      ? { ...c, images: c.images.filter((_, i) => i !== imgIndex) }
                                      : c
                                  ));
                                }}
                              >×</button>
                            </div>
                          ))}
                          <div
                            className="anp-color-image-add"
                            onClick={() => colorImageInputRefs.current[colorItem.colorId]?.click()}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Add</span>
                          </div>
                          <input
                            ref={(el) => { colorImageInputRefs.current[colorItem.colorId] = el; }}
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                Promise.all(Array.from(files).map(file => {
                                  const reader = new FileReader();
                                  return new Promise<{ file: File; preview: string }>((resolve) => {
                                    reader.onloadend = () => resolve({ file, preview: reader.result as string });
                                    reader.readAsDataURL(file);
                                  });
                                })).then(images => {
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
                )}
              </div>
              )}
            </div>
          </section>

          {/* Gallery & Video */}
          <section className="anp-section">
            <div className="anp-card">
              <div className="anp-section-header">
                <h2>Gallery & Video</h2>
                <p>Extra product images and an optional YouTube video.</p>
              </div>
              <div className="anp-gallery-grid">
                {additionalImages.map((img, index) => (
                  <div key={index} className="anp-gallery-item">
                    <img src={img.preview} alt="" />
                    <button type="button" onClick={() => removeAdditionalImage(index)}>×</button>
                  </div>
                ))}
                <div className="anp-gallery-add" onClick={() => additionalImagesInputRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add image</span>
                </div>
              </div>
              <input
                ref={additionalImagesInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleAdditionalImagesUpload}
              />
              <p className="anp-hint">Upload several at once. JPEG, PNG or WEBP.</p>

              <div className="anp-form-group" style={{ marginTop: "1.5rem" }}>
                <label>YOUTUBE VIDEO URL</label>
                <input
                  type="url"
                  placeholder="Ex: https://www.youtube.com/watch?v=xxxxx"
                  value={formData.youtubeVideoUrl}
                  onChange={(e) => handleInputChange("youtubeVideoUrl", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* SEO */}
          <section className="anp-section">
            <div className="anp-card">
              <div className="anp-section-header">
                <h2>SEO</h2>
                <p>Control how this product appears in search results.</p>
              </div>
              {/* SEO Preview */}
              <div className="anp-seo-preview">
                <span className="anp-seo-url">arafine.com › products › {formData.name ? generateSlug(formData.name) : "your-product"}</span>
                <span className="anp-seo-title">{formData.metaTitle || "Your meta title appears here"}</span>
                <span className="anp-seo-desc">{formData.metaDescription || "Your meta description appears here, giving shoppers a short summary."}</span>
              </div>

              <div className="anp-form-group">
                <label>META TITLE</label>
                <input
                  type="text"
                  placeholder="SEO title for search results"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                />
              </div>

              <div className="anp-form-group">
                <label>META DESCRIPTION</label>
                <textarea
                  placeholder="SEO description for search results"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="anp-row-2">
                <div className="anp-form-group">
                  <label>META IMAGE</label>
                  {metaImagePreview ? (
                    <div className="anp-meta-image-preview">
                      <img src={metaImagePreview} alt="Meta" />
                      <button type="button" onClick={removeMetaImage}>×</button>
                    </div>
                  ) : (
                    <div className="anp-meta-image-upload" onClick={() => metaImageInputRef.current?.click()}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Upload</span>
                    </div>
                  )}
                  <input
                    ref={metaImageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleMetaImageUpload}
                  />
                </div>
                <div className="anp-form-group">
                  <label>SEARCH ENGINE INDEXING</label>
                  <div className="anp-radio-group">
                    <label className="anp-radio">
                      <input
                        type="radio"
                        name="metaIndex"
                        checked={formData.metaIndex === "index"}
                        onChange={() => handleInputChange("metaIndex", "index")}
                      />
                      <span>Index</span>
                    </label>
                    <label className="anp-radio">
                      <input
                        type="radio"
                        name="metaIndex"
                        checked={formData.metaIndex === "noindex"}
                        onChange={() => handleInputChange("metaIndex", "noindex")}
                      />
                      <span>No index</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Actions — lives inside .anp-main so the bar tracks the
              form column. As a child of .anp-container it spanned the full
              1400px and parked the buttons under the sidebar, ~344px right
              of the card edge they belong to. */}
          <div className="anp-footer">
            <span className="anp-footer-note">Fields marked * are required.</span>
            <div className="anp-footer-actions">
              <button type="button" className="anp-btn-reset" onClick={handleReset} disabled={submitting}>
                Reset
              </button>
              <button type="button" className="anp-btn-draft" onClick={() => handleSubmit(true)} disabled={submitting}>
                Save as draft
              </button>
              <button type="button" className="anp-btn-submit" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? (uploadingThumbnail ? "Uploading..." : "Saving...") : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="anp-sidebar">
          {/* Visibility */}
          <div className="anp-sidebar-card">
            <h3>Visibility</h3>
            <div className="anp-visibility-item">
              <div>
                <span className="anp-visibility-label">Active</span>
                <span className="anp-visibility-desc">Visible in the store</span>
              </div>
              <label className="anp-toggle">
                <input
                  type="checkbox"
                  checked={formData.status === "active"}
                  onChange={(e) => handleInputChange("status", e.target.checked ? "active" : "inactive")}
                />
                <span className="anp-toggle-slider"></span>
              </label>
            </div>
            <div className="anp-visibility-item">
              <div>
                <span className="anp-visibility-label">Featured</span>
                <span className="anp-visibility-desc">Show on the home page</span>
              </div>
              <label className="anp-toggle">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange("isFeatured", e.target.checked)}
                />
                <span className="anp-toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Product Images */}
          <div className="anp-sidebar-card">
            <h3>Product Images *</h3>
            <p className="anp-hint">The first image becomes the primary one.</p>
            
            {productImages.length > 0 && (
              <div className="anp-product-images-grid">
                {productImages.map((img, index) => (
                  <div key={index} className={`anp-product-image-item ${img.isPrimary ? "primary" : ""}`}>
                    <img src={img.preview} alt="" />
                    {img.isPrimary && <span className="anp-primary-badge">Primary</span>}
                    <div className="anp-image-actions">
                      {!img.isPrimary && (
                        <button type="button" onClick={() => setAsPrimaryImage(index)} title="Set as primary">★</button>
                      )}
                      <button type="button" onClick={() => removeProductImage(index)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              className="anp-upload-area"
              onClick={() => productImagesInputRef.current?.click()}
              onDrop={handleProductImagesDrop}
              onDragOver={handleDragOver}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
              <p><strong>Click to upload</strong><br />or drag and drop</p>
            </div>
            
            <input
              ref={productImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleProductImagesUpload}
            />
            
            <p className="anp-hint">JPEG, PNG, JPG, WEBP · max 2MB each<br />Ratio 1:1 (500 × 500 px)</p>
          </div>
        </div>
      </div>

      </div>
  );
}
