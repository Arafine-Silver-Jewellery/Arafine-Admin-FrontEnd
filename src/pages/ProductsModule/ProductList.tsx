import { useState } from "react";
import "../../styles/products-module.css";

interface Product {
  id: string;
  name: string;
  image: string;
  productType: "Physical" | "Digital";
  unitPrice: number;
  stock: number;
  showOnHomepage: boolean;
  status: boolean;
}

const mockProducts: Product[] = [
  { id: "284", name: "Luna Butterfly Clust...", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=60&h=60&fit=crop", productType: "Physical", unitPrice: 4318.80, stock: 1, showOnHomepage: false, status: true },
  { id: "283", name: "Aria Split-Shank Sol...", image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=60&h=60&fit=crop", productType: "Physical", unitPrice: 4078.80, stock: 0, showOnHomepage: false, status: true },
  { id: "282", name: "Sunset Sorbet Crisco...", image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=60&h=60&fit=crop", productType: "Physical", unitPrice: 4078.80, stock: 1, showOnHomepage: false, status: true },
  { id: "281", name: "Pearl Whisper Baquet...", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop", productType: "Physical", unitPrice: 3958.80, stock: 1, showOnHomepage: false, status: true },
  { id: "280", name: "Meadow Glow Sideways...", image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=60&h=60&fit=crop", productType: "Physical", unitPrice: 3598.80, stock: 1, showOnHomepage: false, status: true },
  { id: "279", name: "Arafine Braided Baqu...", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=60&h=60&fit=crop", productType: "Physical", unitPrice: 5398.80, stock: 1, showOnHomepage: false, status: true },
];

export default function ProductList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState(mockProducts);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function toggleStatus(id: string) {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, status: !p.status } : p)
    );
  }

  return (
    <div className="products-module-container">
      <div className="products-header">
        <h1>
          <span className="header-icon orange">🏠</span>
          In House Product List
          <span className="count-badge">{filteredProducts.length}</span>
        </h1>
      </div>

      <div className="products-card">
        <div className="products-toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Product Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div className="toolbar-actions">
            <button className="btn-export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button className="btn-filter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
              </svg>
              Filter
            </button>
            <button className="btn-add">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add New Product
            </button>
          </div>
        </div>

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Product Name</th>
                <th>Product Type</th>
                <th>Unit Price</th>
                <th>Stock</th>
                <th>Show As Featured On Homepage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="product-name-cell">
                      <img src={product.image} alt="" className="product-thumb" />
                      <div className="product-info">
                        <span className="name">{product.name}</span>
                        <span className="id">Id # {product.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="product-type-badge">{product.productType}</span>
                  </td>
                  <td>₹{product.unitPrice.toLocaleString()}</td>
                  <td>
                    <span className={`stock-badge ${product.stock === 0 ? "out" : "in"}`}>
                      {product.stock}
                      <span className="stock-icon">{product.stock === 0 ? "🔴" : "🟢"}</span>
                    </span>
                  </td>
                  <td>
                    <input type="checkbox" checked={product.showOnHomepage} readOnly />
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={product.status}
                        onChange={() => toggleStatus(product.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-barcode" title="Barcode">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 5h2v14H3zM7 5h1v14H7zM11 5h2v14h-2zM15 5h1v14h-1zM19 5h2v14h-2z" />
                        </svg>
                      </button>
                      <button className="btn-action btn-view" title="View">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="btn-action btn-edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-action btn-delete" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button disabled>&lt;</button>
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>4</button>
          <button>5</button>
          <button>&gt;</button>
        </div>
      </div>
    </div>
  );
}
