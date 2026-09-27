import { useState } from "react";
import "../../styles/products-module.css";

export default function AddNewProduct() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    specification: "",
  });

  return (
    <div className="products-module-container">
      <div className="add-product-form">
        <div className="form-section">
          <div className="section-header">
            <h2>Basic Setup</h2>
            <p>Here you can setup the product information for website.</p>
          </div>

          <div className="form-card">
            <div className="language-tabs">
              <button className="active">English(EN)</button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label>Product Name (EN) *</label>
                <input
                  type="text"
                  placeholder="Ex: New Product"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description (EN) *</label>
                <div className="rich-editor">
                  <div className="editor-toolbar">
                    <select><option>Normal</option></select>
                    <button>B</button>
                    <button><i>I</i></button>
                    <button><u>U</u></button>
                    <button>S</button>
                    <button>H₁</button>
                    <button>H₂</button>
                    <button>≡</button>
                    <button>≡</button>
                    <button>≡</button>
                    <select><option>Sans Serif</option></select>
                    <select><option>Normal</option></select>
                    <button>A</button>
                    <button>✗</button>
                    <button>❝</button>
                    <button>❞</button>
                    <button>&lt;/&gt;</button>
                  </div>
                  <textarea
                    placeholder="Enter product description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Specification (EN)</label>
                <div className="rich-editor">
                  <div className="editor-toolbar">
                    <select><option>Normal</option></select>
                    <button>B</button>
                    <button><i>I</i></button>
                    <button><u>U</u></button>
                    <button>S</button>
                    <button>H₁</button>
                    <button>H₂</button>
                    <button>≡</button>
                    <button>≡</button>
                    <button>≡</button>
                    <select><option>Sans Serif</option></select>
                    <select><option>Normal</option></select>
                    <button>A</button>
                    <button>✗</button>
                    <button>❝</button>
                    <button>❞</button>
                    <button>&lt;/&gt;</button>
                  </div>
                  <textarea
                    placeholder="Enter product specification..."
                    value={formData.specification}
                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-sidebar">
          <div className="form-group">
            <label>Product thumbnail *</label>
            <p className="label-hint">Upload image</p>
            <div className="upload-area">
              <div className="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                <p>Click to upload<br />Or drag and drop</p>
              </div>
            </div>
            <p className="upload-hint">JPEG, PNG, JPG, WEBP Image size : Max 2MB Ratio 1:1 (500 x 500 px)</p>
          </div>

          <div className="form-actions">
            <button className="btn-reset">Reset</button>
            <button className="btn-submit">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
