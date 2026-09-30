import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import JsBarcode from "jsbarcode";
import "../../styles/barcode.css";

interface Product {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
  stockQuantity: number;
}

export default function GenerateBarcode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [companyName] = useState("Arafine Silver Jewellery");
  const printRef = useRef<HTMLDivElement>(null);

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
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function generateBarcodes() {
    if (!product) return;
    
    const maxQty = product.stockQuantity || 100;
    const qty = Math.min(quantity, maxQty);
    
    // Generate array of barcodes
    const newBarcodes: string[] = [];
    for (let i = 0; i < qty; i++) {
      newBarcodes.push(product.sku);
    }
    setBarcodes(newBarcodes);

    // Wait for DOM to update, then render barcodes
    setTimeout(() => {
      renderBarcodes();
    }, 100);
  }

  function renderBarcodes() {
    if (!product) return;
    
    const barcodeElements = document.querySelectorAll(".barcode-svg");
    barcodeElements.forEach((element) => {
      try {
        JsBarcode(element, product.sku, {
          format: "CODE128",
          width: 1.5,
          height: 50,
          displayValue: false,
          margin: 5,
        });
      } catch (err) {
        console.error("Failed to generate barcode:", err);
      }
    });
  }

  function handleReset() {
    setQuantity(1);
    setBarcodes([]);
  }

  function handlePrint() {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Barcodes - ${product?.sku}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10mm;
            }
            .barcode-print-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 5mm;
            }
            .barcode-print-item {
              border: 1px dashed #ccc;
              padding: 3mm;
              text-align: center;
              page-break-inside: avoid;
            }
            .barcode-company {
              font-size: 10pt;
              font-weight: bold;
              margin-bottom: 2mm;
            }
            .barcode-product-name {
              font-size: 8pt;
              color: #666;
              margin-bottom: 1mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .barcode-price {
              font-size: 9pt;
              margin-bottom: 2mm;
            }
            .barcode-svg {
              display: block;
              margin: 0 auto;
            }
            .barcode-code {
              font-size: 8pt;
              margin-top: 1mm;
            }
            @media print {
              body {
                padding: 5mm;
              }
              .barcode-print-item {
                border: 1px dashed #999;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  if (loading) {
    return (
      <div className="barcode-container">
        <div className="loading-state">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="barcode-container">
        <div className="error-state">
          <p>Product not found</p>
          <button onClick={() => navigate("/products-module")} className="btn-back-to-list">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const maxQuantity = product.stockQuantity || 100;

  return (
    <div className="barcode-container">
      {/* Header */}
      <div className="barcode-header">
        <div className="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="2" height="16" fill="#f59e0b"/>
            <rect x="7" y="4" width="1" height="16" fill="#f59e0b"/>
            <rect x="10" y="4" width="3" height="16" fill="#f59e0b"/>
            <rect x="15" y="4" width="1" height="16" fill="#f59e0b"/>
            <rect x="18" y="4" width="2" height="16" fill="#f59e0b"/>
            <rect x="22" y="4" width="1" height="16" fill="#f59e0b"/>
          </svg>
        </div>
        <h1>Generate Barcode</h1>
      </div>

      {/* Product Info Card */}
      <div className="barcode-card">
        <table className="barcode-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="code-cell">{product.sku}</td>
              <td className="name-cell">{product.name}</td>
              <td className="quantity-cell">
                <div className="quantity-cell-inner">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={maxQuantity}
                    className="quantity-input"
                  />
                  <span className="max-quantity">Maximum quantity {maxQuantity}</span>
                </div>
              </td>
              <td className="action-cell">
                <div className="action-cell-inner">
                  <button className="btn-generate" onClick={generateBarcodes}>
                    Generate barcode
                  </button>
                  <button className="btn-reset" onClick={handleReset}>
                    Reset
                  </button>
                  <button 
                    className="btn-print" 
                    onClick={handlePrint}
                    disabled={barcodes.length === 0}
                  >
                    Print
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Barcode Preview */}
      {barcodes.length > 0 && (
        <div className="barcode-preview-section">
          <div className="barcode-print-grid" ref={printRef}>
            {barcodes.map((code, index) => (
              <div key={index} className="barcode-print-item">
                <div className="barcode-company">{companyName}</div>
                <div className="barcode-product-name">{product.name}</div>
                <div className="barcode-price">{formatPrice(product.pricePaise)}</div>
                <svg className="barcode-svg"></svg>
                <div className="barcode-code">Code : {code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="barcode-footer">
        <button className="btn-back" onClick={() => navigate("/products-module")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Product List
        </button>
      </div>
    </div>
  );
}
