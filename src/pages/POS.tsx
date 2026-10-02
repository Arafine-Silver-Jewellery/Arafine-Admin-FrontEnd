import { useState, useEffect } from "react";
import { api } from "../api/client";
import "../styles/pos.css";

interface Product {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  productType: "physical" | "digital";
  stockQuantity: number;
  images: { url: string; sortOrder: number; isPrimary: boolean }[];
  category?: { name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function POS() {
  const [activeTab, setActiveTab] = useState<"physical" | "digital">("physical");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);

  // Fetch products when tab, search, or page changes
  useEffect(() => {
    fetchProducts();
  }, [activeTab, pagination.page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchProducts();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const response = await api.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: "active",
      });

      // Filter by product type (physical/digital)
      const filtered = (response.data || []).filter(
        (p: Product) => p.productType === activeTab
      );
      
      setProducts(filtered);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination!.total,
          totalPages: response.pagination!.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  function getProductImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      // First try to find primary image
      const primary = product.images.find(img => img.isPrimary);
      if (primary) return primary.url;
      
      // Otherwise sort by sortOrder and get first
      const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
      return sorted[0].url;
    }
    return "https://via.placeholder.com/150?text=No+Image";
  }

  function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  function addToCart(product: Product) {
    // Check stock for physical products
    if (product.productType === "physical") {
      const existingItem = cart.find(item => item.product.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      if (currentQty >= product.stockQuantity) {
        alert("Not enough stock available");
        return;
      }
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          
          const newQty = item.quantity + delta;
          
          // Check stock for physical products
          if (delta > 0 && item.product.productType === "physical") {
            if (newQty > item.product.stockQuantity) {
              alert("Not enough stock available");
              return item;
            }
          }
          
          return { ...item, quantity: Math.max(0, newQty) };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setPaidAmount("");
    setCouponDiscount(0);
    setExtraDiscount(0);
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  }

  const subTotal = cart.reduce(
    (sum, item) => sum + item.product.pricePaise * item.quantity,
    0
  );
  
  const productDiscount = cart.reduce((sum, item) => {
    const comparePrice = item.product.compareAtPricePaise || item.product.pricePaise;
    return sum + (comparePrice - item.product.pricePaise) * item.quantity;
  }, 0);
  
  const total = subTotal - (couponDiscount * 100) - (extraDiscount * 100);

  // Generate pagination buttons
  function renderPaginationButtons() {
    const buttons = [];
    const { page, totalPages } = pagination;
    
    // Previous button
    buttons.push(
      <button key="prev" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
        &lt;
      </button>
    );

    // Page numbers
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          className={page === i ? "active" : ""}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button key="next" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages || totalPages === 0}>
        &gt;
      </button>
    );

    return buttons;
  }

  return (
    <div className="pos-container">
      <div className="pos-products">
        <div className="pos-search-bar">
          <input
            type="text"
            placeholder="Search by name or sku"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
            </svg>
            Filter
          </button>
        </div>

        <div className="pos-tabs">
          <button
            className={activeTab === "physical" ? "active" : ""}
            onClick={() => {
              setActiveTab("physical");
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            Physical Products
          </button>
          <button
            className={activeTab === "digital" ? "active" : ""}
            onClick={() => {
              setActiveTab("digital");
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            Digital Products
          </button>
        </div>

        <div className="pos-product-grid">
          {loading ? (
            <div className="pos-loading">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="pos-empty">No products found</div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className={`pos-product-card ${product.stockQuantity === 0 && product.productType === "physical" ? "out-of-stock" : ""}`}
                onClick={() => addToCart(product)}
              >
                <img src={getProductImage(product)} alt={product.name} />
                <div className="pos-product-info">
                  <span className="pos-product-name">{product.name}</span>
                  {product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise && (
                    <span className="pos-product-original">
                      {formatPrice(product.compareAtPricePaise)}
                    </span>
                  )}
                  <span className="pos-product-price">
                    {formatPrice(product.pricePaise)}
                  </span>
                  {product.productType === "physical" && product.stockQuantity <= 5 && (
                    <span className="pos-product-stock">
                      {product.stockQuantity === 0 ? "Out of stock" : `Only ${product.stockQuantity} left`}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="pos-pagination">
            {renderPaginationButtons()}
          </div>
        )}
      </div>

      <div className="pos-billing">
        <div className="pos-billing-header">
          <h2>Billing Section</h2>
          <button className="hold-orders-btn">
            View All Hold Orders
            <span className="hold-count">0</span>
          </button>
        </div>

        <div className="pos-customer-select">
          <select>
            <option>Walk In Customer</option>
          </select>
        </div>

        <div className="pos-cart">
          <h3>Cart Item List</h3>
          {cart.length === 0 ? (
            <div className="pos-cart-empty">No items in cart</div>
          ) : (
            <div className="pos-cart-items">
              {cart.map((item) => (
                <div key={item.product.id} className="pos-cart-item">
                  <img src={getProductImage(item.product)} alt={item.product.name} />
                  <div className="pos-cart-item-info">
                    <span className="name">{item.product.name}</span>
                    <span className="price">{formatPrice(item.product.pricePaise)}</span>
                  </div>
                  <div className="pos-cart-item-qty">
                    <button onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                  </div>
                  <button
                    className="pos-cart-item-remove"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pos-billing-summary">
          <h3>Billing Summary</h3>
          <div className="summary-row">
            <span>Sub Total:</span>
            <span>{formatPrice(subTotal)}</span>
          </div>
          <div className="summary-row">
            <span>Product Discount:</span>
            <span>{formatPrice(productDiscount)}</span>
          </div>
          <div className="summary-row editable">
            <span>Coupon Discount:</span>
            <input
              type="number"
              value={couponDiscount || ""}
              onChange={(e) => setCouponDiscount(Number(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div className="summary-row editable">
            <span>Extra Discount:</span>
            <input
              type="number"
              value={extraDiscount || ""}
              onChange={(e) => setExtraDiscount(Number(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>{formatPrice(Math.max(0, total))}</span>
          </div>
        </div>

        <div className="pos-payment">
          <div className="payment-method">
            <span>Paid By:</span>
            <div className="payment-buttons">
              <button
                className={paymentMethod === "cash" ? "active" : ""}
                onClick={() => setPaymentMethod("cash")}
              >
                Cash
              </button>
              <button
                className={paymentMethod === "card" ? "active" : ""}
                onClick={() => setPaymentMethod("card")}
              >
                Card
              </button>
            </div>
          </div>
          <div className="paid-amount">
            <span>Paid Amount:</span>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="pos-actions">
          <button className="btn-clear" onClick={clearCart}>
            Clear Cart
          </button>
          <button className="btn-hold">Hold</button>
          <button className="btn-place-order" disabled={cart.length === 0}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
