import { useState } from "react";
import "../../styles/products-module.css";

interface Product {
  id: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  orders: number;
  status: boolean;
}

const mockProducts: Product[] = [
  { id: "1", name: "Vintage Pear-Cut Hal...", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=60&h=60&fit=crop", unitPrice: 3199.00, quantity: 0, orders: 0, status: true },
  { id: "2", name: "Evil Eye Bracelet in...", image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=60&h=60&fit=crop", unitPrice: 5099.00, quantity: 0, orders: 0, status: true },
  { id: "3", name: "Heart Pearl Halo Stu...", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=60&h=60&fit=crop", unitPrice: 3399.00, quantity: 0, orders: 0, status: true },
  { id: "4", name: "Double Heart Mother-...", image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=60&h=60&fit=crop", unitPrice: 3499.00, quantity: 0, orders: 0, status: true },
  { id: "5", name: "Heart & Crescent Moo...", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop", unitPrice: 3199.00, quantity: 0, orders: 10, status: true },
  { id: "6", name: "Stella Polaris Neckl...", image: "https://images.unsplash.com/photo-1599459183200-59c3f4b13c2e?w=60&h=60&fit=crop", unitPrice: 3099.00, quantity: 0, orders: 0, status: true },
  { id: "7", name: "The Imperial Garden...", image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=60&h=60&fit=crop", unitPrice: 3299.00, quantity: 0, orders: 0, status: true },
];

export default function LimitedStock() {
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
            <select className="sort-select">
              <option>Default</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Product Name</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Orders</th>
                <th>Active Status</th>
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
                      <span className="name link">{product.name}</span>
                    </div>
                  </td>
                  <td>₹{product.unitPrice.toLocaleString()}</td>
                  <td>
                    <span className="quantity-badge">
                      {product.quantity}
                      <button className="btn-add-qty">+</button>
                    </span>
                  </td>
                  <td>{product.orders}</td>
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
      </div>
    </div>
  );
}
