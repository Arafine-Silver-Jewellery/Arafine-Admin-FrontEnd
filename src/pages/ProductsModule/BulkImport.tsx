import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "../../components/Toast";
import { api } from "../../api/client";
import * as XLSX from "xlsx";
import "../../styles/bulk-import.css";

const MAX_IMPORT_LIMIT = 50;

interface ImportRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
  existingProductId?: string;
  skip: boolean;
  imported: boolean;
  importError?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function BulkImport() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [allFileData, setAllFileData] = useState<any[]>([]); // Store ALL rows from file
  const [parsedData, setParsedData] = useState<ImportRow[]>([]); // Current batch
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalRowsInFile, setTotalRowsInFile] = useState(0);
  
  // Batch tracking
  const [currentBatch, setCurrentBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(1);
  const [batchesCompleted, setBatchesCompleted] = useState<number[]>([]);
  
  // Progress tracking
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportIndex, setCurrentImportIndex] = useState(0);
  const [importAborted, setImportAborted] = useState(false);

  // Load categories for mapping
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.getAllCategories();
        setCategories(response || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    
    if (!validTypes.includes(selectedFile.type) && !["xlsx", "xls", "csv"].includes(extension || "")) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }
    
    setFile(selectedFile);
    setParsedData([]);
    setAllFileData([]);
    setImportComplete(false);
    setImportProgress(0);
    setCurrentImportIndex(0);
    setImportAborted(false);
    setTotalRowsInFile(0);
    setCurrentBatch(1);
    setTotalBatches(1);
    setBatchesCompleted([]);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setIsValidating(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      // Store total rows and all data
      setTotalRowsInFile(jsonData.length);
      setAllFileData(jsonData);
      
      // Calculate batches
      const batches = Math.ceil(jsonData.length / MAX_IMPORT_LIMIT);
      setTotalBatches(batches);
      setCurrentBatch(1);
      
      // Load first batch
      await loadBatch(jsonData, 1);
    } catch (error) {
      console.error("Failed to parse file:", error);
      toast.error("Failed to parse file. Please check the format.");
    } finally {
      setIsValidating(false);
    }
  };

  const loadBatch = async (allData: any[], batchNumber: number) => {
    setIsValidating(true);
    
    try {
      const startIndex = (batchNumber - 1) * MAX_IMPORT_LIMIT;
      const endIndex = startIndex + MAX_IMPORT_LIMIT;
      const batchData = allData.slice(startIndex, endIndex);
      
      // Collect all SKUs to check for existing products
      const skus = batchData
        .map((row: any) => String(row["SKU"] || "").trim())
        .filter(Boolean);
      
      // Check which SKUs already exist
      let existingSkus: Set<string> = new Set();
      if (skus.length > 0) {
        try {
          const existingProducts = await api.exportProducts();
          existingSkus = new Set(
            (existingProducts.data || []).map((p: any) => p.sku)
          );
        } catch (error) {
          console.error("Failed to check existing products:", error);
        }
      }
      
      // Validate each row
      const validatedRows: ImportRow[] = batchData.map((row: any, index: number) => {
        const errors: string[] = [];
        const sku = String(row["SKU"] || "").trim();
        const isExisting = existingSkus.has(sku);
        
        // Required field validation
        if (!row["Product Name"] || String(row["Product Name"]).trim() === "") {
          errors.push("Product Name is required");
        }
        if (!sku) {
          errors.push("SKU is required");
        }
        if (!row["Price (₹)"] && row["Price (₹)"] !== 0) {
          errors.push("Price is required");
        } else if (isNaN(Number(row["Price (₹)"])) || Number(row["Price (₹)"]) < 0) {
          errors.push("Price must be a valid positive number");
        }
        if (row["Stock Quantity"] !== undefined && row["Stock Quantity"] !== "") {
          if (isNaN(Number(row["Stock Quantity"])) || Number(row["Stock Quantity"]) < 0) {
            errors.push("Stock Quantity must be a valid non-negative number");
          }
        }
        
        return {
          rowNumber: startIndex + index + 2, // Actual Excel row number
          data: row,
          errors,
          isValid: errors.length === 0,
          existingProductId: isExisting ? sku : undefined,
          skip: false,
          imported: false,
          importError: undefined,
        };
      });
      
      setParsedData(validatedRows);
      setImportComplete(false);
      setImportAborted(false);
      setImportProgress(0);
      setCurrentImportIndex(0);
    } catch (error) {
      console.error("Failed to load batch:", error);
      toast.error("Failed to load batch data.");
    } finally {
      setIsValidating(false);
    }
  };

  const goToNextBatch = () => {
    if (currentBatch < totalBatches) {
      const nextBatch = currentBatch + 1;
      setCurrentBatch(nextBatch);
      loadBatch(allFileData, nextBatch);
    }
  };

  const goToPrevBatch = () => {
    if (currentBatch > 1) {
      const prevBatch = currentBatch - 1;
      setCurrentBatch(prevBatch);
      loadBatch(allFileData, prevBatch);
    }
  };

  const goToBatch = (batchNumber: number) => {
    if (batchNumber >= 1 && batchNumber <= totalBatches) {
      setCurrentBatch(batchNumber);
      loadBatch(allFileData, batchNumber);
    }
  };

  const toggleSkip = (rowNumber: number) => {
    setParsedData(prev =>
      prev.map(row =>
        row.rowNumber === rowNumber ? { ...row, skip: !row.skip } : row
      )
    );
  };

  const toggleSkipAllExisting = (skip: boolean) => {
    setParsedData(prev =>
      prev.map(row =>
        row.existingProductId ? { ...row, skip } : row
      )
    );
  };

  const downloadTemplate = (withData: boolean) => {
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Description",
      "Short Description",
      "Price (₹)",
      "Compare At Price (₹)",
      "Cost Price (₹)",
      "Stock Quantity",
      "Low Stock Threshold",
      "Track Inventory",
      "Status",
      "Is Visible",
      "Is Featured",
      "Product Type",
      "Unit",
      "Min Order Qty",
      "Shipping Cost (₹)",
      "Discount Amount",
      "Discount Type",
      "Color",
      "Material",
      "Weight (grams)",
      "Search Tags",
      "Meta Title",
      "Meta Description",
      "Primary Image URL",
    ];
    
    let data: Record<string, any>[] = [];
    
    if (withData) {
      data = [
        {
          "Product Name": "Sample Product 1",
          "SKU": "SAMPLE-001",
          "Category": "Electronics",
          "Description": "This is a sample product description",
          "Short Description": "Sample short description",
          "Price (₹)": "999.00",
          "Compare At Price (₹)": "1299.00",
          "Cost Price (₹)": "500.00",
          "Stock Quantity": "100",
          "Low Stock Threshold": "10",
          "Track Inventory": "Yes",
          "Status": "active",
          "Is Visible": "Yes",
          "Is Featured": "No",
          "Product Type": "physical",
          "Unit": "pc",
          "Min Order Qty": "1",
          "Shipping Cost (₹)": "50",
          "Discount Amount": "0",
          "Discount Type": "flat",
          "Color": "Black",
          "Material": "Metal",
          "Weight (grams)": "250",
          "Search Tags": "sample, product, electronics",
          "Meta Title": "Sample Product - Best Price",
          "Meta Description": "Buy sample product at best price",
          "Primary Image URL": "https://example.com/image.jpg",
        },
        {
          "Product Name": "Sample Product 2",
          "SKU": "SAMPLE-002",
          "Category": "Clothing",
          "Description": "Another sample product",
          "Short Description": "Short desc",
          "Price (₹)": "599.00",
          "Compare At Price (₹)": "",
          "Cost Price (₹)": "300.00",
          "Stock Quantity": "50",
          "Low Stock Threshold": "5",
          "Track Inventory": "Yes",
          "Status": "active",
          "Is Visible": "Yes",
          "Is Featured": "Yes",
          "Product Type": "physical",
          "Unit": "pc",
          "Min Order Qty": "1",
          "Shipping Cost (₹)": "0",
          "Discount Amount": "10",
          "Discount Type": "percent",
          "Color": "Blue",
          "Material": "Cotton",
          "Weight (grams)": "100",
          "Search Tags": "clothing, fashion",
          "Meta Title": "",
          "Meta Description": "",
          "Primary Image URL": "",
        },
      ];
    } else {
      data = [Object.fromEntries(headers.map(h => [h, ""]))];
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    worksheet["!cols"] = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    
    const filename = withData ? "products-import-template-with-sample.xlsx" : "products-import-template.xlsx";
    XLSX.writeFile(workbook, filename);
    toast.success("Template downloaded!");
  };

  const transformRowToProduct = (row: ImportRow) => {
    const data = row.data;
    
    // Find category by name if provided
    let categoryId: string | null = null;
    if (data["Category"]) {
      const category = categories.find(
        c => c.name.toLowerCase() === String(data["Category"]).toLowerCase()
      );
      if (category) {
        categoryId = category.id;
      }
    }
    
    // Generate slug from name if not provided
    const name = String(data["Product Name"] || "").trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    // Parse boolean values
    const parseBoolean = (val: any): boolean => {
      if (typeof val === "boolean") return val;
      const str = String(val || "").toLowerCase().trim();
      return str === "yes" || str === "true" || str === "1";
    };
    
    // Parse price (convert rupees to paise)
    const parsePrice = (val: any): number => {
      const num = parseFloat(String(val || "0").replace(/[^\d.-]/g, ""));
      return Math.round((isNaN(num) ? 0 : num) * 100);
    };
    
    return {
      name,
      sku: String(data["SKU"] || "").trim(),
      slug: slug + "-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      description: data["Description"] || null,
      shortDescription: data["Short Description"] || null,
      pricePaise: parsePrice(data["Price (₹)"]),
      compareAtPricePaise: data["Compare At Price (₹)"] ? parsePrice(data["Compare At Price (₹)"]) : null,
      costPricePaise: data["Cost Price (₹)"] ? parsePrice(data["Cost Price (₹)"]) : null,
      categoryId,
      stockQuantity: parseInt(String(data["Stock Quantity"] || "0")) || 0,
      lowStockThreshold: parseInt(String(data["Low Stock Threshold"] || "5")) || 5,
      trackInventory: parseBoolean(data["Track Inventory"] ?? true),
      status: String(data["Status"] || "active").toLowerCase() === "inactive" ? "inactive" : "active",
      isVisible: parseBoolean(data["Is Visible"] ?? true),
      isFeatured: parseBoolean(data["Is Featured"]),
      productType: String(data["Product Type"] || "physical").toLowerCase() === "digital" ? "digital" : "physical",
      unit: data["Unit"] || "pc",
      minOrderQty: parseInt(String(data["Min Order Qty"] || "1")) || 1,
      shippingCost: parseFloat(String(data["Shipping Cost (₹)"] || "0")) || 0,
      discountAmount: parseFloat(String(data["Discount Amount"] || "0")) || 0,
      discountType: String(data["Discount Type"] || "flat").toLowerCase() === "percent" ? "percent" : "flat",
      color: data["Color"] || null,
      material: data["Material"] || null,
      weightGrams: data["Weight (grams)"] ? parseFloat(String(data["Weight (grams)"])) : null,
      searchTags: data["Search Tags"] ? String(data["Search Tags"]).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      metaTitle: data["Meta Title"] || null,
      metaDescription: data["Meta Description"] || null,
      primaryImageUrl: data["Primary Image URL"] || null,
    };
  };

  const handleImport = async () => {
    // Get rows to import (valid, not skipped, not already imported)
    const rowsToImport = parsedData.filter(row => row.isValid && !row.skip && !row.imported);
    
    if (rowsToImport.length === 0) {
      toast.error("No rows to import");
      return;
    }
    
    setIsImporting(true);
    setImportAborted(false);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i];
      setCurrentImportIndex(i + 1);
      setImportProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
      
      try {
        const product = transformRowToProduct(row);
        await api.bulkImportProducts([product]);
        
        // Mark as imported
        setParsedData(prev =>
          prev.map(r =>
            r.rowNumber === row.rowNumber ? { ...r, imported: true, importError: undefined } : r
          )
        );
        successCount++;
      } catch (error: any) {
        failedCount++;
        const errorMsg = error.message || "Unknown error";
        
        // Mark as failed
        setParsedData(prev =>
          prev.map(r =>
            r.rowNumber === row.rowNumber ? { ...r, importError: errorMsg } : r
          )
        );
        
        // Stop on error
        setImportAborted(true);
        toast.error(`Error at row ${row.rowNumber}: ${errorMsg}`);
        break;
      }
    }
    
    setIsImporting(false);
    
    if (!importAborted) {
      setImportComplete(true);
      setBatchesCompleted(prev => [...prev, currentBatch]);
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} products!`);
      }
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedData([]);
    setAllFileData([]);
    setImportComplete(false);
    setImportProgress(0);
    setCurrentImportIndex(0);
    setImportAborted(false);
    setTotalRowsInFile(0);
    setCurrentBatch(1);
    setTotalBatches(1);
    setBatchesCompleted([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = parsedData.filter(r => r.isValid && !r.skip).length;
  const errorCount = parsedData.filter(r => !r.isValid).length;
  const existingCount = parsedData.filter(r => r.existingProductId).length;
  const skippedCount = parsedData.filter(r => r.skip).length;
  const importedCount = parsedData.filter(r => r.imported).length;
  const pendingCount = parsedData.filter(r => r.isValid && !r.skip && !r.imported).length;

  return (
    <div className="bulk-import-container">
      {/* Header */}
      <div className="bulk-import-header">
        <div>
          <h1>Bulk Import Products</h1>
          <p>Import up to {MAX_IMPORT_LIMIT} products at once using an Excel or CSV file</p>
        </div>
        <div className="template-buttons">
          <button className="btn-template" onClick={() => downloadTemplate(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Template
          </button>
        </div>
      </div>

      {/* Main Upload Area */}
      {!file ? (
        <div
          className={`upload-area ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            style={{ display: "none" }}
          />
          
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          
          <h2>Drag & drop your file here</h2>
          <p>or <span className="browse-link">browse</span> to upload</p>
          
          <div className="supported-formats">
            <span>Supported formats:</span>
            <span className="format-badge">.xlsx</span>
            <span className="format-badge">.xls</span>
            <span className="format-badge">.csv</span>
            <span className="limit-badge">Max {MAX_IMPORT_LIMIT} rows</span>
          </div>
        </div>
      ) : (
        <div className="file-selected">
          {/* File Info */}
          <div className="file-info-card">
            <div className="file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <div className="file-details">
              <h3>{file.name}</h3>
              <p>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!isImporting && (
              <button className="btn-remove-file" onClick={resetForm} title="Remove file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Batch Info / Limit Warning */}
          {totalBatches > 1 && !isValidating && (
            <div className="batch-info">
              <div className="batch-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <div>
                  <strong>File contains {totalRowsInFile} rows ({totalBatches} batches)</strong>
                  <p>Processing {MAX_IMPORT_LIMIT} rows per batch. Currently viewing Batch {currentBatch} of {totalBatches}.</p>
                </div>
              </div>
              <div className="batch-navigation">
                <button 
                  className="btn-batch" 
                  onClick={goToPrevBatch} 
                  disabled={currentBatch === 1 || isImporting}
                >
                  ← Previous
                </button>
                
                {/* Show limited batch indicators with ellipsis for large numbers */}
                <div className="batch-indicators">
                  {totalBatches <= 7 ? (
                    // Show all if 7 or less
                    Array.from({ length: totalBatches }, (_, i) => i + 1).map(batch => (
                      <button
                        key={batch}
                        className={`batch-dot ${batch === currentBatch ? "active" : ""} ${batchesCompleted.includes(batch) ? "completed" : ""}`}
                        onClick={() => goToBatch(batch)}
                        disabled={isImporting}
                        title={`Batch ${batch}: Rows ${(batch - 1) * MAX_IMPORT_LIMIT + 1}-${Math.min(batch * MAX_IMPORT_LIMIT, totalRowsInFile)}${batchesCompleted.includes(batch) ? " (Completed)" : ""}`}
                      >
                        {batchesCompleted.includes(batch) ? "✓" : batch}
                      </button>
                    ))
                  ) : (
                    // Show condensed version: 1 ... prev current next ... last
                    <>
                      {/* First batch */}
                      <button
                        className={`batch-dot ${currentBatch === 1 ? "active" : ""} ${batchesCompleted.includes(1) ? "completed" : ""}`}
                        onClick={() => goToBatch(1)}
                        disabled={isImporting}
                        title={`Batch 1${batchesCompleted.includes(1) ? " (Completed)" : ""}`}
                      >
                        {batchesCompleted.includes(1) ? "✓" : 1}
                      </button>
                      
                      {/* Ellipsis or batch 2 */}
                      {currentBatch > 3 && <span className="batch-ellipsis">...</span>}
                      
                      {/* Batches around current */}
                      {Array.from({ length: 3 }, (_, i) => currentBatch - 1 + i)
                        .filter(batch => batch > 1 && batch < totalBatches)
                        .map(batch => (
                          <button
                            key={batch}
                            className={`batch-dot ${batch === currentBatch ? "active" : ""} ${batchesCompleted.includes(batch) ? "completed" : ""}`}
                            onClick={() => goToBatch(batch)}
                            disabled={isImporting}
                            title={`Batch ${batch}${batchesCompleted.includes(batch) ? " (Completed)" : ""}`}
                          >
                            {batchesCompleted.includes(batch) ? "✓" : batch}
                          </button>
                        ))}
                      
                      {/* Ellipsis before last */}
                      {currentBatch < totalBatches - 2 && <span className="batch-ellipsis">...</span>}
                      
                      {/* Last batch */}
                      <button
                        className={`batch-dot ${currentBatch === totalBatches ? "active" : ""} ${batchesCompleted.includes(totalBatches) ? "completed" : ""}`}
                        onClick={() => goToBatch(totalBatches)}
                        disabled={isImporting}
                        title={`Batch ${totalBatches}${batchesCompleted.includes(totalBatches) ? " (Completed)" : ""}`}
                      >
                        {batchesCompleted.includes(totalBatches) ? "✓" : totalBatches}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Batch input for large numbers */}
                {totalBatches > 7 && (
                  <div className="batch-jump">
                    <input
                      type="number"
                      min={1}
                      max={totalBatches}
                      value={currentBatch}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= totalBatches) {
                          goToBatch(val);
                        }
                      }}
                      disabled={isImporting}
                    />
                    <span>/ {totalBatches}</span>
                  </div>
                )}
                
                <button 
                  className="btn-batch" 
                  onClick={goToNextBatch} 
                  disabled={currentBatch === totalBatches || isImporting}
                >
                  Next →
                </button>
              </div>
              <div className="batch-range">
                Rows {(currentBatch - 1) * MAX_IMPORT_LIMIT + 1} - {Math.min(currentBatch * MAX_IMPORT_LIMIT, totalRowsInFile)} of {totalRowsInFile}
              </div>
            </div>
          )}

          {/* Validation Status */}
          {isValidating ? (
            <div className="validation-loading">
              <div className="spinner"></div>
              <p>Validating file and checking existing products...</p>
            </div>
          ) : parsedData.length > 0 ? (
            <>
              {/* Progress Bar (during import) */}
              {isImporting && (
                <div className="import-progress">
                  <div className="progress-header">
                    <span>Importing products...</span>
                    <span>{currentImportIndex} / {pendingCount + importedCount}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${importProgress}%` }}></div>
                  </div>
                  <p className="progress-text">Please wait, do not close this page</p>
                </div>
              )}

              {/* Validation Summary */}
              {!isImporting && (
                <div className="validation-summary">
                  <div className="summary-card total">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span className="count">{parsedData.length}</span>
                    <span className="label">Total Rows</span>
                  </div>
                  <div className="summary-card valid">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    <span className="count">{importedCount > 0 ? importedCount : validCount}</span>
                    <span className="label">{importedCount > 0 ? "Imported" : "Valid"}</span>
                  </div>
                  {existingCount > 0 && (
                    <div className="summary-card existing">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="count">{existingCount}</span>
                      <span className="label">Existing</span>
                    </div>
                  )}
                  {(errorCount > 0 || skippedCount > 0) && (
                    <div className="summary-card errors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span className="count">{errorCount + skippedCount}</span>
                      <span className="label">{skippedCount > 0 ? "Skipped/Errors" : "Errors"}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Existing Products Warning */}
              {existingCount > 0 && !isImporting && !importComplete && (
                <div className="existing-warning">
                  <div className="warning-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span><strong>{existingCount}</strong> product(s) already exist and will be <strong>updated</strong></span>
                  </div>
                  <div className="warning-actions">
                    <button className="btn-skip-all" onClick={() => toggleSkipAllExisting(true)}>
                      Skip All Existing
                    </button>
                    <button className="btn-include-all" onClick={() => toggleSkipAllExisting(false)}>
                      Update All Existing
                    </button>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {errorCount > 0 && !isImporting && (
                <div className="error-details">
                  <h4>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Validation Errors
                  </h4>
                  <div className="error-list">
                    {parsedData.filter(r => !r.isValid).slice(0, 10).map((row) => (
                      <div key={row.rowNumber} className="error-row">
                        <span className="row-num">Row {row.rowNumber}</span>
                        <span className="row-name">{row.data["Product Name"] || "(No name)"}</span>
                        <span className="row-errors">{row.errors.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Aborted - Show continue option */}
              {importAborted && !isImporting && (
                <div className="import-aborted">
                  <div className="aborted-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h3>Import Paused</h3>
                  <p>{importedCount} of {parsedData.filter(r => r.isValid && !r.skip).length} products imported</p>
                  <p className="hint">You can continue importing remaining products or reset to start over</p>
                </div>
              )}

              {/* Preview Table */}
              {!isImporting && (
                <div className="preview-section">
                  <h4>Products to Import</h4>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>Skip</th>
                          <th style={{ width: 60 }}>Status</th>
                          <th style={{ width: 50 }}>Row</th>
                          <th>Product Name</th>
                          <th>SKU</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.map((row) => (
                          <tr 
                            key={row.rowNumber} 
                            className={`
                              ${!row.isValid ? "invalid" : ""} 
                              ${row.skip ? "skipped" : ""} 
                              ${row.imported ? "imported" : ""}
                              ${row.importError ? "import-failed" : ""}
                            `}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={row.skip}
                                onChange={() => toggleSkip(row.rowNumber)}
                                disabled={!row.isValid || row.imported || isImporting}
                              />
                            </td>
                            <td>
                              {row.imported ? (
                                <span className="status-imported" title="Imported">✓</span>
                              ) : row.importError ? (
                                <span className="status-failed" title={row.importError}>!</span>
                              ) : row.skip ? (
                                <span className="status-skipped" title="Skipped">—</span>
                              ) : row.existingProductId ? (
                                <span className="status-existing" title="Will update existing">↻</span>
                              ) : row.isValid ? (
                                <span className="status-new" title="New product">+</span>
                              ) : (
                                <span className="status-invalid" title={row.errors.join(", ")}>✗</span>
                              )}
                            </td>
                            <td>{row.rowNumber}</td>
                            <td>{row.data["Product Name"] || "-"}</td>
                            <td>
                              {row.data["SKU"] || "-"}
                              {row.existingProductId && <span className="existing-badge">exists</span>}
                            </td>
                            <td>{row.data["Category"] || "-"}</td>
                            <td>₹{row.data["Price (₹)"] || "0"}</td>
                            <td>{row.data["Stock Quantity"] || "0"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Complete */}
              {importComplete && (
                <div className="import-results">
                  <div className="result-icon success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  </div>
                  <h3>Batch {currentBatch} Complete!</h3>
                  <p>{importedCount} products imported successfully</p>
                  {currentBatch < totalBatches && (
                    <p className="next-batch-hint">
                      {totalBatches - batchesCompleted.length} batch(es) remaining
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {!importComplete && (
                <div className="import-actions">
                  <button className="btn-reset" onClick={resetForm} disabled={isImporting}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1,4 1,10 7,10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    Reset
                  </button>
                  <button
                    className="btn-import"
                    onClick={handleImport}
                    disabled={pendingCount === 0 || isImporting}
                  >
                    {isImporting ? (
                      <>
                        <div className="btn-spinner"></div>
                        Importing...
                      </>
                    ) : importAborted ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                        Continue Import ({pendingCount} remaining)
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                        Import {pendingCount} Products
                      </>
                    )}
                  </button>
                </div>
              )}

              {importComplete && (
                <div className="import-actions">
                  {currentBatch < totalBatches ? (
                    <button className="btn-import" onClick={goToNextBatch}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9,18 15,12 9,6" />
                      </svg>
                      Continue to Batch {currentBatch + 1}
                    </button>
                  ) : (
                    <button className="btn-import" onClick={resetForm}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Import Another File
                    </button>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Instructions */}
      <div className="import-instructions">
        <h3>Instructions</h3>
        <div className="instruction-steps">
          <div className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Download Template</h4>
              <p>Download the Excel template with all required columns. Use "Template with Sample Data" to see example entries.</p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Fill Your Data</h4>
              <p>Add your product information (max {MAX_IMPORT_LIMIT} rows). Required: <strong>Product Name</strong>, <strong>SKU</strong>, <strong>Price</strong>.</p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Upload & Import</h4>
              <p>Upload your file, review validation, skip/include existing products, and click Import.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
