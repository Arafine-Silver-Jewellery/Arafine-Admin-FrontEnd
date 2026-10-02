import { useState, useEffect, useRef } from "react";
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

interface OrderBill {
  orderNumber: string;
  date: Date;
  items: CartItem[];
  subTotal: number;
  productDiscount: number;
  couponDiscount: number;
  extraDiscount: number;
  total: number;
  paymentMethod: "cash" | "card";
  paidAmount: number;
  change: number;
}

interface HoldOrderItem {
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  quantity: number;
  unitPricePaise: number;
  stockQuantity: number;
}

interface HoldOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: HoldOrderItem[];
  couponDiscount: number;
  extraDiscount: number;
  note?: string;
  heldAt: string;
  heldBy?: string;
  subTotalPaise: number;
  totalPaise: number;
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
  const [showBill, setShowBill] = useState(false);
  const [currentBill, setCurrentBill] = useState<OrderBill | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);

  // Hold orders state
  const [holdOrders, setHoldOrders] = useState<HoldOrder[]>([]);
  const [holdOrdersCount, setHoldOrdersCount] = useState(0);
  const [showHoldOrdersModal, setShowHoldOrdersModal] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdNote, setHoldNote] = useState("");

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  // Product quick view modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "warning" | "danger" | "info";
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  // Customer modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch products when tab, search, or page changes
  useEffect(() => {
    fetchProducts();
  }, [activeTab, pagination.page]);

  // Fetch hold orders count on mount
  useEffect(() => {
    fetchHoldOrdersCount();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function showToast(message: string, type: "success" | "error" | "warning" | "info" = "success") {
    setToast({ message, type });
  }

  function showConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { type?: "warning" | "danger" | "info"; confirmText?: string; cancelText?: string }
  ) {
    setConfirmModal({
      show: true,
      title,
      message,
      type: options?.type || "warning",
      onConfirm,
      confirmText: options?.confirmText || "OK",
      cancelText: options?.cancelText || "Cancel",
    });
  }

  function closeConfirmModal() {
    setConfirmModal(null);
  }

  // Customer modal functions
  function openCustomerModal() {
    // Reset customer modal state
    setCustomerPhone("");
    setCustomerFirstName("");
    setCustomerLastName("");
    setCustomerAddress("");
    setSearchResults([]);
    setSelectedCustomer(null);
    setHasSearched(false);
    setShowCustomerModal(true);
  }

  function closeCustomerModal() {
    setShowCustomerModal(false);
  }

  async function handleCustomerSearch() {
    if (!customerPhone || customerPhone.length < 3) {
      showToast("Enter at least 3 digits to search", "warning");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const response = await api.searchPOSCustomers(customerPhone);
      setSearchResults(response.data || []);
      setHasSearched(true);
      
      if (response.data.length === 0) {
        // No results - show message
        showToast("No customer found. Enter details to create new.", "info");
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error("Failed to search customers:", error);
      showToast("Failed to search customers", "error");
    } finally {
      setIsSearching(false);
    }
  }

  function selectCustomer(customer: { id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string }) {
    setSelectedCustomer(customer);
    setCustomerPhone(customer.mobileNumber);
    setCustomerFirstName(customer.firstName);
    setCustomerLastName(customer.lastName);
    setSearchResults([]);
  }

  function clearSelectedCustomer() {
    setSelectedCustomer(null);
    setCustomerPhone("");
    setCustomerFirstName("");
    setCustomerLastName("");
  }

  function getCustomerInitials(name: string): string {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  async function handleCustomerContinue() {
    // Validate required fields - always required now
    if (!customerPhone || customerPhone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "warning");
      return;
    }
    if (!customerFirstName.trim()) {
      showToast("Please enter customer's first name", "warning");
      return;
    }

    // Close modal and proceed with order
    setShowCustomerModal(false);
    await placeOrderWithCustomer();
  }

  async function placeOrderWithCustomer() {
    if (cart.length === 0) return;
    
    setIsPlacingOrder(true);
    
    try {
      // Prepare items for API
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: Number(item.quantity),
        unitPricePaise: Number(item.product.pricePaise),
      }));

      // Calculate amounts
      const paidAmountPaise = Math.round((Number(paidAmount) || 0) * 100);
      const couponDiscountPaise = Math.round(Number(couponDiscount) * 100);
      const extraDiscountPaise = Math.round(Number(extraDiscount) * 100);

      // Prepare order data with customer details
      const orderData: Parameters<typeof api.createPOSOrder>[0] = {
        items,
        paymentMethod,
        couponDiscountPaise,
        extraDiscountPaise,
        paidAmountPaise,
        isWalkIn: false,
        customerId: selectedCustomer?.id,
        customerPhone,
        customerFirstName,
        customerLastName,
        customerName: `${customerFirstName} ${customerLastName}`.trim(),
        customerAddress: customerAddress || undefined,
      };

      // Call API to create POS order
      const response = await api.createPOSOrder(orderData);

      // Create bill data from response
      const order = response.data;
      const finalTotal = Number(order.totalPaise);
      const changeAmount = Math.max(0, paidAmountPaise - finalTotal);

      const bill: OrderBill = {
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt),
        items: [...cart],
        subTotal: Number(order.subtotalPaise),
        productDiscount,
        couponDiscount: couponDiscountPaise,
        extraDiscount: extraDiscountPaise,
        total: finalTotal,
        paymentMethod,
        paidAmount: paidAmountPaise,
        change: changeAmount,
      };

      setCurrentBill(bill);
      setShowBill(true);
      
      // Clear cart after successful order
      setCart([]);
      setPaidAmount("");
      setCouponDiscount(0);
      setExtraDiscount(0);
    } catch (error) {
      console.error("Failed to place order:", error);
      showToast(error instanceof Error ? error.message : "Failed to place order. Please try again.", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  function openProductQuickView(product: Product) {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    // Set default qty to 1, or max available stock
    const maxQty = product.productType === "physical" ? product.stockQuantity : 99;
    setQuickViewQty(Math.min(1, maxQty));
  }

  function closeProductQuickView() {
    setSelectedProduct(null);
    setQuickViewQty(1);
    setSelectedImageIndex(0);
  }

  function handleQuickViewAddToCart() {
    if (!selectedProduct) return;

    // Check stock for physical products
    if (selectedProduct.productType === "physical") {
      const existingItem = cart.find(item => item.product.id === selectedProduct.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      if (currentQty + quickViewQty > selectedProduct.stockQuantity) {
        showToast("Not enough stock available", "warning");
        return;
      }
    }

    // Add to cart with selected quantity
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === selectedProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === selectedProduct.id
            ? { ...item, quantity: item.quantity + quickViewQty }
            : item
        );
      }
      return [...prev, { product: selectedProduct, quantity: quickViewQty }];
    });

    showToast(`${selectedProduct.name} added to cart`, "success");
    closeProductQuickView();
  }

  function getDiscountPercentage(product: Product): number | null {
    if (product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise) {
      return Math.round(((product.compareAtPricePaise - product.pricePaise) / product.compareAtPricePaise) * 100);
    }
    return null;
  }

  function getProductImages(product: Product): string[] {
    if (product.images && product.images.length > 0) {
      // Sort by sortOrder and return URLs
      return [...product.images]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(img => img.url);
    }
    return ["https://via.placeholder.com/300?text=No+Image"];
  }

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

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          
          const newQty = item.quantity + delta;
          
          // Check stock for physical products
          if (delta > 0 && item.product.productType === "physical") {
            if (newQty > item.product.stockQuantity) {
              showToast("Not enough stock available", "warning");
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

  // Hold Orders Functions
  async function fetchHoldOrdersCount() {
    try {
      const response = await api.getHoldOrdersCount();
      setHoldOrdersCount(response.count);
    } catch (error) {
      console.error("Failed to fetch hold orders count:", error);
    }
  }

  async function fetchHoldOrders() {
    try {
      const response = await api.getHoldOrders();
      setHoldOrders(response.data || []);
      setHoldOrdersCount(response.count || 0);
    } catch (error) {
      console.error("Failed to fetch hold orders:", error);
    }
  }

  async function handleHoldOrder() {
    if (cart.length === 0) {
      showToast("Cart is empty", "warning");
      return;
    }

    setIsHolding(true);
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        productImage: getProductImage(item.product),
        quantity: item.quantity,
        unitPricePaise: item.product.pricePaise,
        stockQuantity: item.product.stockQuantity,
      }));

      await api.createHoldOrder({
        customerName: "Walk In Customer",
        items,
        couponDiscount,
        extraDiscount,
        note: holdNote || undefined,
      });

      // Clear cart and note
      clearCart();
      setHoldNote("");
      
      // Update hold orders count
      await fetchHoldOrdersCount();
      
      showToast("Order held successfully!", "success");
    } catch (error) {
      console.error("Failed to hold order:", error);
      showToast("Failed to hold order. Please try again.", "error");
    } finally {
      setIsHolding(false);
    }
  }

  async function handleResumeHoldOrder(holdOrder: HoldOrder) {
    try {
      // Build cart from hold order items
      const newCart: CartItem[] = [];
      const stockIssues: { name: string; had: number; now: number }[] = [];
      const outOfStock: string[] = [];
      
      for (const item of holdOrder.items) {
        // Fetch current product data
        try {
          const product = await api.getProduct(item.productId);
          
          // Check stock availability
          if (product.productType === "physical") {
            if (product.stockQuantity === 0) {
              // Completely out of stock - skip and notify
              outOfStock.push(item.productName);
            } else if (product.stockQuantity < item.quantity) {
              // Partial stock available
              stockIssues.push({
                name: item.productName,
                had: item.quantity,
                now: product.stockQuantity,
              });
              newCart.push({
                product,
                quantity: product.stockQuantity,
              });
            } else {
              // Full stock available
              newCart.push({
                product,
                quantity: item.quantity,
              });
            }
          } else {
            // Digital product - no stock check needed
            newCart.push({
              product,
              quantity: item.quantity,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch product ${item.productId}:`, err);
          outOfStock.push(item.productName);
        }
      }

      // If all items are out of stock
      if (newCart.length === 0) {
        showConfirm(
          "All Items Out of Stock",
          `All items in this hold order are now out of stock:\n\n${outOfStock.map(n => `• ${n}`).join('\n')}\n\nThis hold order cannot be resumed.`,
          () => closeConfirmModal(),
          { type: "danger", confirmText: "OK", cancelText: "Close" }
        );
        return;
      }

      // Build message for issues
      let message = "";
      
      if (outOfStock.length > 0) {
        message += `Out of stock (will be skipped):\n${outOfStock.map(n => `• ${n}`).join('\n')}\n\n`;
      }
      
      if (stockIssues.length > 0) {
        message += `Reduced quantity:\n${stockIssues.map(s => `• ${s.name}: ${s.had} → ${s.now}`).join('\n')}\n\n`;
      }

      // If there are any issues, show confirmation
      if (outOfStock.length > 0 || stockIssues.length > 0) {
        showConfirm(
          "Stock Changed",
          `${message}Continue with available items?`,
          async () => {
            await completeResumeOrder(holdOrder, newCart);
          },
          { type: "warning", confirmText: "Continue", cancelText: "Cancel" }
        );
        return;
      }

      // No issues - resume directly
      await completeResumeOrder(holdOrder, newCart);
    } catch (error) {
      console.error("Failed to resume hold order:", error);
      showToast("Failed to resume order. Please try again.", "error");
    }
  }

  async function completeResumeOrder(holdOrder: HoldOrder, newCart: CartItem[]) {
    if (newCart.length === 0) {
      showToast("No items to restore", "error");
      return;
    }

    // Set cart with held items
    setCart(newCart);
    setCouponDiscount(holdOrder.couponDiscount);
    setExtraDiscount(holdOrder.extraDiscount);

    // Delete the hold order
    await api.deleteHoldOrder(holdOrder.id);
    
    // Refresh hold orders
    await fetchHoldOrders();
    
    // Close modal and show success
    setShowHoldOrdersModal(false);
    closeConfirmModal();
    showToast("Order resumed successfully", "success");
  }

  async function handleDeleteHoldOrder(holdId: string) {
    showConfirm(
      "Delete Hold Order",
      "Are you sure you want to delete this held order? This action cannot be undone.",
      async () => {
        try {
          await api.deleteHoldOrder(holdId);
          await fetchHoldOrders();
          closeConfirmModal();
          showToast("Hold order deleted", "success");
        } catch (error) {
          console.error("Failed to delete hold order:", error);
          showToast("Failed to delete hold order", "error");
        }
      },
      { type: "danger", confirmText: "Delete", cancelText: "Keep" }
    );
  }

  function openHoldOrdersModal() {
    fetchHoldOrders();
    setShowHoldOrdersModal(true);
  }

  function formatHeldTime(heldAt: string): string {
    const held = new Date(heldAt);
    const now = new Date();
    const diffMs = now.getTime() - held.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    
    return held.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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

  async function handlePlaceOrder() {
    if (cart.length === 0) return;
    
    // Open customer modal to collect customer details
    openCustomerModal();
  }

  function handlePrintBill() {
    if (!billRef.current) return;

    const printContent = billRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${currentBill?.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              padding: 10px;
              font-size: 12px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt-header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .receipt-header h1 { font-size: 18px; margin-bottom: 5px; }
            .receipt-header p { font-size: 11px; color: #333; }
            .receipt-info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .receipt-info p { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .receipt-items { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .receipt-item { margin-bottom: 8px; }
            .receipt-item-name { font-weight: bold; }
            .receipt-item-details { display: flex; justify-content: space-between; font-size: 11px; }
            .receipt-summary { margin-bottom: 15px; }
            .receipt-summary p { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .receipt-summary .total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .receipt-footer { text-align: center; margin-top: 15px; font-size: 11px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  function closeBillModal() {
    setShowBill(false);
    setCurrentBill(null);
  }

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
                onClick={() => openProductQuickView(product)}
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
          <button className="hold-orders-btn" onClick={openHoldOrdersModal}>
            View All Hold Orders
            <span className="hold-count">{holdOrdersCount}</span>
          </button>
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
          <button 
            className="btn-hold" 
            onClick={handleHoldOrder}
            disabled={cart.length === 0 || isHolding}
          >
            {isHolding ? "Holding..." : "Hold"}
          </button>
          <button 
            className="btn-place-order" 
            disabled={cart.length === 0 || isPlacingOrder}
            onClick={handlePlaceOrder}
          >
            {isPlacingOrder ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>

      {/* Bill/Receipt Modal */}
      {showBill && currentBill && (
        <div className="bill-modal-overlay" onClick={closeBillModal}>
          <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bill-modal-header">
              <h2>Order Receipt</h2>
              <button className="bill-close-btn" onClick={closeBillModal}>×</button>
            </div>
            
            <div className="bill-content" ref={billRef}>
              <div className="receipt-header">
                <h1>ARAFINE</h1>
                <p>Premium Jewelry Store</p>
                <p>Thank you for shopping with us!</p>
              </div>

              <div className="receipt-info">
                <p><span>Order No:</span> <span>{currentBill.orderNumber}</span></p>
                <p><span>Date:</span> <span>{currentBill.date.toLocaleDateString("en-IN")}</span></p>
                <p><span>Time:</span> <span>{currentBill.date.toLocaleTimeString("en-IN")}</span></p>
                <p><span>Payment:</span> <span>{currentBill.paymentMethod.toUpperCase()}</span></p>
              </div>

              <div className="receipt-items">
                <p className="receipt-items-header">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Price</span>
                </p>
                {currentBill.items.map((item) => (
                  <div key={item.product.id} className="receipt-item">
                    <div className="receipt-item-name">{item.product.name}</div>
                    <div className="receipt-item-details">
                      <span>{item.quantity} x {formatPrice(item.product.pricePaise)}</span>
                      <span>{formatPrice(item.product.pricePaise * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="receipt-summary">
                <p><span>Sub Total:</span> <span>{formatPrice(currentBill.subTotal)}</span></p>
                {currentBill.productDiscount > 0 && (
                  <p><span>Product Discount:</span> <span>-{formatPrice(currentBill.productDiscount)}</span></p>
                )}
                {currentBill.couponDiscount > 0 && (
                  <p><span>Coupon Discount:</span> <span>-{formatPrice(currentBill.couponDiscount)}</span></p>
                )}
                {currentBill.extraDiscount > 0 && (
                  <p><span>Extra Discount:</span> <span>-{formatPrice(currentBill.extraDiscount)}</span></p>
                )}
                <p className="total"><span>Total:</span> <span>{formatPrice(currentBill.total)}</span></p>
                <p><span>Paid:</span> <span>{formatPrice(currentBill.paidAmount)}</span></p>
                {currentBill.change > 0 && (
                  <p><span>Change:</span> <span>{formatPrice(currentBill.change)}</span></p>
                )}
              </div>

              <div className="receipt-footer">
                <p>*** Thank You! Visit Again ***</p>
                <p>www.arafine.com</p>
              </div>
            </div>

            <div className="bill-modal-actions">
              <button className="btn-print" onClick={handlePrintBill}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Receipt
              </button>
              <button className="btn-done" onClick={closeBillModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Orders Modal */}
      {showHoldOrdersModal && (
        <div className="hold-modal-overlay" onClick={() => setShowHoldOrdersModal(false)}>
          <div className="hold-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hold-modal-header">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Hold Orders
                <span className="hold-badge">{holdOrders.length}</span>
              </h2>
              <button className="hold-close-btn" onClick={() => setShowHoldOrdersModal(false)}>×</button>
            </div>

            <div className="hold-modal-content">
              {holdOrders.length === 0 ? (
                <div className="hold-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="48" height="48">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <p>No hold orders</p>
                  <span>Orders you hold will appear here</span>
                </div>
              ) : (
                <div className="hold-orders-list">
                  {holdOrders.map((order) => (
                    <div key={order.id} className="hold-order-card">
                      <div className="hold-order-header">
                        <div className="hold-order-customer">
                          <span className="customer-name">{order.customerName}</span>
                          {order.customerPhone && (
                            <span className="customer-phone">{order.customerPhone}</span>
                          )}
                        </div>
                        <div className="hold-order-time">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {formatHeldTime(order.heldAt)}
                        </div>
                      </div>

                      <div className="hold-order-items">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="hold-item">
                            <img src={item.productImage} alt={item.productName} />
                            <div className="hold-item-info">
                              <span className="item-name">{item.productName}</span>
                              <span className="item-qty">{item.quantity} × {formatPrice(item.unitPricePaise)}</span>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="hold-items-more">
                            +{order.items.length - 3} more items
                          </div>
                        )}
                      </div>

                      {order.note && (
                        <div className="hold-order-note">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                          {order.note}
                        </div>
                      )}

                      <div className="hold-order-footer">
                        <div className="hold-order-total">
                          <span>Total:</span>
                          <strong>{formatPrice(order.totalPaise)}</strong>
                        </div>
                        <div className="hold-order-actions">
                          <button 
                            className="btn-delete-hold"
                            onClick={() => handleDeleteHoldOrder(order.id)}
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                          <button 
                            className="btn-resume-hold"
                            onClick={() => handleResumeHoldOrder(order)}
                          >
                            Resume
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <div className="quickview-overlay" onClick={closeProductQuickView}>
          <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="quickview-close" onClick={closeProductQuickView}>×</button>
            
            <div className="quickview-content">
              {/* Left - Product Images */}
              <div className="quickview-images">
                <div className="quickview-main-image">
                  <img 
                    src={getProductImages(selectedProduct)[selectedImageIndex]} 
                    alt={selectedProduct.name} 
                  />
                </div>
                {getProductImages(selectedProduct).length > 1 && (
                  <div className="quickview-thumbnails">
                    {getProductImages(selectedProduct).map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className={`quickview-thumb ${idx === selectedImageIndex ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(idx)}
                      >
                        <img src={imgUrl} alt={`${selectedProduct.name} ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="quickview-meta">
                  <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                  {selectedProduct.category && (
                    <p><strong>Category:</strong> {selectedProduct.category.name}</p>
                  )}
                </div>
              </div>

              {/* Right - Product Details */}
              <div className="quickview-details">
                <div className="quickview-stock-row">
                  <span className="quickview-stock-label">Stock: <strong>{selectedProduct.stockQuantity}</strong></span>
                  {selectedProduct.stockQuantity > 0 ? (
                    <span className="quickview-stock-badge in-stock">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      In Stock
                    </span>
                  ) : (
                    <span className="quickview-stock-badge out-of-stock">Out of Stock</span>
                  )}
                  {getDiscountPercentage(selectedProduct) && (
                    <span className="quickview-discount-badge">{getDiscountPercentage(selectedProduct)}% Off</span>
                  )}
                </div>

                <h2 className="quickview-title">{selectedProduct.name}</h2>

                <div className="quickview-price">
                  {selectedProduct.compareAtPricePaise && selectedProduct.compareAtPricePaise > selectedProduct.pricePaise && (
                    <span className="quickview-original-price">{formatPrice(selectedProduct.compareAtPricePaise)}</span>
                  )}
                  <span className="quickview-current-price">{formatPrice(selectedProduct.pricePaise)}</span>
                </div>

                {/* Stock Warning */}
                {selectedProduct.productType === "physical" && selectedProduct.stockQuantity > 0 && selectedProduct.stockQuantity <= 5 && (
                  <div className="quickview-warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div>
                      <strong>Warning</strong>
                      <p>Only {selectedProduct.stockQuantity} items left in stock</p>
                    </div>
                    <button className="quickview-warning-close" onClick={(e) => e.currentTarget.parentElement?.remove()}>×</button>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="quickview-qty-row">
                  <span className="quickview-qty-label">Qty</span>
                  <div className="quickview-qty-control">
                    <button 
                      onClick={() => setQuickViewQty(q => Math.max(1, q - 1))}
                      disabled={quickViewQty <= 1}
                    >
                      −
                    </button>
                    <input 
                      type="number" 
                      value={quickViewQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const max = selectedProduct.productType === "physical" ? selectedProduct.stockQuantity : 99;
                        setQuickViewQty(Math.min(Math.max(1, val), max));
                      }}
                      min={1}
                      max={selectedProduct.productType === "physical" ? selectedProduct.stockQuantity : 99}
                    />
                    <button 
                      onClick={() => {
                        const max = selectedProduct.productType === "physical" ? selectedProduct.stockQuantity : 99;
                        setQuickViewQty(q => Math.min(max, q + 1));
                      }}
                      disabled={selectedProduct.productType === "physical" && quickViewQty >= selectedProduct.stockQuantity}
                    >
                      +
                    </button>
                  </div>
                  <div className="quickview-total">
                    <span>Total Price:</span>
                    <strong>{formatPrice(selectedProduct.pricePaise * quickViewQty)}</strong>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button 
                  className="quickview-add-btn"
                  onClick={handleQuickViewAddToCart}
                  disabled={selectedProduct.productType === "physical" && selectedProduct.stockQuantity === 0}
                >
                  {selectedProduct.stockQuantity === 0 && selectedProduct.productType === "physical" 
                    ? "Out of Stock" 
                    : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.show && (
        <div className="confirm-modal-overlay" onClick={closeConfirmModal}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-modal-icon confirm-icon-${confirmModal.type}`}>
              {confirmModal.type === "warning" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
              {confirmModal.type === "danger" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              {confirmModal.type === "info" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            <h3 className="confirm-modal-title">{confirmModal.title}</h3>
            <p className="confirm-modal-message">{confirmModal.message}</p>
            <div className="confirm-modal-actions">
              <button className="confirm-btn-cancel" onClick={closeConfirmModal}>
                {confirmModal.cancelText}
              </button>
              <button 
                className={`confirm-btn-confirm confirm-btn-${confirmModal.type}`}
                onClick={() => {
                  confirmModal.onConfirm();
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`pos-toast pos-toast-${toast.type}`}>
          <div className="pos-toast-icon">
            {toast.type === "success" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
            {toast.type === "error" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
            {toast.type === "warning" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
            {toast.type === "info" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            )}
          </div>
          <span className="pos-toast-message">{toast.message}</span>
          <button className="pos-toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Customer Details Modal */}
      {showCustomerModal && (
        <div className="customer-modal-overlay" onClick={closeCustomerModal}>
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer-modal-header">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Customer Details
              </h2>
              <button className="customer-close-btn" onClick={closeCustomerModal}>×</button>
            </div>

            <div className="customer-modal-content">
              {/* Order Summary */}
              <div className="customer-order-summary">
                <h4>Order Summary</h4>
                <div className="customer-order-row">
                  <span>Items:</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="customer-order-row">
                  <span>Sub Total:</span>
                  <span>{formatPrice(subTotal)}</span>
                </div>
                {(couponDiscount > 0 || extraDiscount > 0) && (
                  <div className="customer-order-row">
                    <span>Discounts:</span>
                    <span>-{formatPrice((couponDiscount + extraDiscount) * 100)}</span>
                  </div>
                )}
                <div className="customer-order-row total">
                  <span>Total:</span>
                  <span>{formatPrice(Math.max(0, total))}</span>
                </div>
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="selected-customer-info">
                  <div className="selected-customer-avatar">
                    {getCustomerInitials(selectedCustomer.fullName || selectedCustomer.firstName)}
                  </div>
                  <div className="selected-customer-details">
                    <div className="selected-customer-name">{selectedCustomer.fullName}</div>
                    <div className="selected-customer-phone">{selectedCustomer.mobileNumber}</div>
                  </div>
                  <button className="selected-customer-clear" onClick={clearSelectedCustomer} title="Clear">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Phone Search - only show if no customer selected */}
              {!selectedCustomer && (
                <>
                  <div className="customer-phone-search">
                    <label>Mobile Number <span style={{color: '#ef4444'}}>*</span></label>
                    <div className="customer-phone-input-wrapper">
                      <input
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={customerPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setCustomerPhone(value);
                          // Clear search results when typing
                          if (searchResults.length > 0 || hasSearched) {
                            setSearchResults([]);
                            setHasSearched(false);
                          }
                        }}
                        onKeyDown={(e) => e.key === "Enter" && customerPhone.length >= 3 && handleCustomerSearch()}
                      />
                      <button
                        className="customer-search-btn"
                        onClick={handleCustomerSearch}
                        disabled={isSearching || customerPhone.length < 3}
                      >
                        {isSearching ? (
                          "..."
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <circle cx="11" cy="11" r="8"/>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            Search
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="customer-search-results">
                      <div className="customer-search-results-header">
                        Found {searchResults.length} customer(s) - Click to select
                      </div>
                      {searchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="customer-result-item"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="customer-result-avatar">
                            {getCustomerInitials(customer.fullName || customer.firstName)}
                          </div>
                          <div className="customer-result-info">
                            <div className="customer-result-name">{customer.fullName}</div>
                            <div className="customer-result-phone">{customer.mobileNumber}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Form - Only show when searched and NO results found (new customer) */}
                  {hasSearched && searchResults.length === 0 && (
                    <div className="customer-form">
                      <div className="customer-form-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="8.5" cy="7" r="4"/>
                          <line x1="20" y1="8" x2="20" y2="14"/>
                          <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        New Customer Details
                      </div>

                      <div className="customer-form-row">
                        <div className="customer-form-group">
                          <label>First Name <span>*</span></label>
                          <input
                            type="text"
                            placeholder="First name"
                            value={customerFirstName}
                            onChange={(e) => setCustomerFirstName(e.target.value)}
                          />
                        </div>
                        <div className="customer-form-group">
                          <label>Last Name</label>
                          <input
                            type="text"
                            placeholder="Last name"
                            value={customerLastName}
                            onChange={(e) => setCustomerLastName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="customer-form-row">
                        <div className="customer-form-group full-width">
                          <label>Address (Optional)</label>
                          <input
                            type="text"
                            placeholder="Delivery address"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Address field for selected customer */}
              {selectedCustomer && (
                <div className="customer-form">
                  <div className="customer-form-row">
                    <div className="customer-form-group full-width">
                      <label>Address (Optional)</label>
                      <input
                        type="text"
                        placeholder="Delivery address"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="customer-modal-actions">
              <button className="customer-btn-cancel" onClick={closeCustomerModal}>
                Cancel
              </button>
              <button
                className="customer-btn-continue"
                onClick={handleCustomerContinue}
                disabled={isPlacingOrder || (!selectedCustomer && (!customerPhone || customerPhone.length < 10 || !customerFirstName.trim()))}
              >
                {isPlacingOrder ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
