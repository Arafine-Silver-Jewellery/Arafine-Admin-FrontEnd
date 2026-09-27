import { useState } from "react";
import "../styles/pos.css";

interface Product {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  image: string;
  category: "physical" | "digital";
}

interface CartItem {
  product: Product;
  quantity: number;
}

const mockProducts: Product[] = [
  { id: "1", name: "Luna Butterfly Ring", originalPrice: 4310, salePrice: 3886.92, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=150&h=150&fit=crop", category: "physical" },
  { id: "2", name: "Aria Split-Shank Ring", originalPrice: 4078, salePrice: 3670.92, image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=150&h=150&fit=crop", category: "physical" },
  { id: "3", name: "Sunset Sorbet Ring", originalPrice: 4078, salePrice: 3670.42, image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=150&h=150&fit=crop", category: "physical" },
  { id: "4", name: "Pearl Whisper Pendant", originalPrice: 3958, salePrice: 3562.92, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=150&h=150&fit=crop", category: "physical" },
  { id: "5", name: "Meadow Glow Earrings", originalPrice: 3598, salePrice: 3238.92, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&h=150&fit=crop", category: "physical" },
  { id: "6", name: "Arafine Braided Band", originalPrice: 5398, salePrice: 4858.92, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=150&h=150&fit=crop", category: "physical" },
  { id: "7", name: "Arafine Trio Pink Set", originalPrice: 5038, salePrice: 4534.92, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150&h=150&fit=crop", category: "physical" },
  { id: "8", name: "Arafine Cascade Necklace", originalPrice: 5878, salePrice: 5290.42, image: "https://images.unsplash.com/photo-1599459183200-59c3f4b13c2e?w=150&h=150&fit=crop", category: "physical" },
  { id: "9", name: "Arafine Trinity Bracelet", originalPrice: 5038, salePrice: 4534.92, image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=150&h=150&fit=crop", category: "physical" },
  { id: "10", name: "Arafine Interlock Ring", originalPrice: 4678, salePrice: 4210.92, image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=150&h=150&fit=crop", category: "physical" },
  { id: "11", name: "Digital Gift Card", originalPrice: 1000, salePrice: 1000, image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop", category: "digital" },
  { id: "12", name: "Premium Membership", originalPrice: 2999, salePrice: 2499, image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&h=150&fit=crop", category: "digital" },
];

export default function POS() {
  const [activeTab, setActiveTab] = useState<"physical" | "digital">("physical");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.category === activeTab &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function addToCart(product: Product) {
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
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
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

  const subTotal = cart.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0
  );
  const productDiscount = cart.reduce(
    (sum, item) =>
      sum + (item.product.originalPrice - item.product.salePrice) * item.quantity,
    0
  );
  const total = subTotal - couponDiscount - extraDiscount;

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
            onClick={() => setActiveTab("physical")}
          >
            Physical Products
          </button>
          <button
            className={activeTab === "digital" ? "active" : ""}
            onClick={() => setActiveTab("digital")}
          >
            Digital Products
          </button>
        </div>

        <div className="pos-product-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="pos-product-card"
              onClick={() => addToCart(product)}
            >
              <img src={product.image} alt={product.name} />
              <div className="pos-product-info">
                <span className="pos-product-name">{product.name}</span>
                <span className="pos-product-original">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
                <span className="pos-product-price">
                  ₹{product.salePrice.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pos-pagination">
          <button disabled>&lt;</button>
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>4</button>
          <button>5</button>
          <button>&gt;</button>
        </div>
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
            <option>John Doe</option>
            <option>Jane Smith</option>
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
                  <img src={item.product.image} alt={item.product.name} />
                  <div className="pos-cart-item-info">
                    <span className="name">{item.product.name}</span>
                    <span className="price">₹{item.product.salePrice.toLocaleString()}</span>
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
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Product Discount:</span>
            <span>₹{productDiscount.toFixed(2)}</span>
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
            <span>₹{total.toFixed(2)}</span>
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
