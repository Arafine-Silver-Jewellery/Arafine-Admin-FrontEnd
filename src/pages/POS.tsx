import { useState, useEffect } from "react";
import { api } from "../api/client";
import { FilterDrawer, StatusDropdown, ReceiptModal } from "../components";
import type { Address, CustomerAddressInput, Order } from "../types";
import "../styles/pos.css";

// Per-field limits for the POS address form. Mirrors the customer-frontend's
// `lib/addressValidation.ts` and the backend Zod schema. India-specific
// tightening: phone = 10 digits, pincode = 6 digits.
const POS_ADDRESS_LIMITS = {
  fullName:     { max: 100 },
  phone:        { max: 10 },
  addressLine1: { max: 200 },
  addressLine2: { max: 200 },
  city:         { max: 100 },
  state:        { max: 100 },
  country:      { max: 100 },
  postalCode:   { max: 6 },
  landmark:     { max: 200 },
} as const;

const POS_REQUIRED_FIELDS: (keyof CustomerAddressInput)[] = [
  "fullName", "phone", "addressLine1", "city", "state", "postalCode",
];

const PHONE_RE = /^\d{10}$/;
const PIN_RE = /^\d{6}$/;

const EMPTY_OVERRIDE: CustomerAddressInput = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  landmark: "",
};

type OverrideErrors = Partial<Record<keyof CustomerAddressInput, string>>;

/** Validate a single field on the POS address form. */
function validateOverrideField(
  field: keyof CustomerAddressInput,
  value: string,
): string | null {
  const isRequired = POS_REQUIRED_FIELDS.includes(field);
  const v = (value ?? "").trim();
  if (isRequired && !v) {
    return "Required";
  }
  if (v) {
    if (field === "phone" && !PHONE_RE.test(v)) {
      return "Enter a 10-digit mobile number";
    }
    if (field === "postalCode" && !PIN_RE.test(v)) {
      return "Enter a 6-digit pincode";
    }
  }
  return null;
}

/** Validate the full POS address form. */
function validateOverrideForm(values: CustomerAddressInput): {
  isValid: boolean;
  errors: OverrideErrors;
} {
  const errors: OverrideErrors = {};
  (Object.keys(values) as (keyof CustomerAddressInput)[]).forEach((field) => {
    const err = validateOverrideField(field, values[field] ?? "");
    if (err) errors[field] = err;
  });
  return { isValid: Object.keys(errors).length === 0, errors };
}

/** First non-null error in field-tab order, used as a toast summary. */
function firstOverrideError(errors: OverrideErrors): string | null {
  const order: (keyof CustomerAddressInput)[] = [
    "fullName", "phone", "addressLine1", "addressLine2", "city",
    "state", "postalCode", "landmark",
  ];
  for (const k of order) {
    if (errors[k]) return errors[k]!;
  }
  return null;
}

/** True if every required field is non-empty (regardless of format). */
function isOverrideStructurallyFilled(values: CustomerAddressInput): boolean {
  return POS_REQUIRED_FIELDS.every((f) => (values[f] ?? "").trim().length > 0);
}

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
  couponCode?: string;
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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [showBill, setShowBill] = useState(false);
  const [currentBill, setCurrentBill] = useState<Order | null>(null);  const [isPlacingOrder, setIsPlacingOrder] = useState(false);


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
  const [searchResults, setSearchResults] = useState<{ id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; mobileNumber: string; firstName: string; lastName: string; fullName: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Address picker state (used when the selected customer has saved addresses).
  // `useOverride` flips between "use a saved address" and "type a one-off".
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useOverride, setUseOverride] = useState(false);
  const [saveOverrideToProfile, setSaveOverrideToProfile] = useState(false);

  // Two-step customer flow:
  //   "phone"   — only the mobile-number input + Search button are visible.
  //   "details" — name form / selected-customer card + address section +
  //               Continue button are visible (the rest of the modal).
  // The cashier MUST search before the rest of the modal opens. From the
  // details phase they can hit "Change number" to go back.
  const [searchPhase, setSearchPhase] = useState<"phone" | "details">("phone");

  // Structured address typed at POS. Used by the "Different for this order"
  // path AND the "no saved addresses" path so the cashier sees the same
  // fields as the storefront. Pre-filled with the customer's name/phone
  // when a customer is selected; reset to empty otherwise.
  const [overrideAddress, setOverrideAddress] = useState<CustomerAddressInput>(EMPTY_OVERRIDE);
  // Per-field validation errors for the structured form. Empty object = ok.
  const [overrideErrors, setOverrideErrors] = useState<OverrideErrors>({});

  // Filter drawer state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tempCategoryFilter, setTempCategoryFilter] = useState("");

  // Fetch products when tab, search, page, or category filter changes
  useEffect(() => {
    fetchProducts();
  }, [activeTab, pagination.page, categoryFilter]);

  // Fetch hold orders count on mount
  useEffect(() => {
    fetchHoldOrdersCount();
  }, []);

  // Load categories for the filter drawer
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await api.getAllCategories();
        setCategories(data || []);
      } catch (error) {
        // The /categories/all endpoint requires the "category-setup" permission.
        // POS users may not have it — leave the dropdown empty rather than fail the page.
        console.warn("Failed to load categories for filter:", error);
      }
    }
    loadCategories();
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

  // Filter drawer helpers
  const categoryOptions = [
    { value: "", label: "All Categories", color: "neutral" as const },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      color: "brand" as const,
    })),
  ];

  const activeFilterCount = categoryFilter ? 1 : 0;

  function openFilterDrawer() {
    setTempCategoryFilter(categoryFilter);
    setShowFilterDrawer(true);
  }

  function applyFilters() {
    setCategoryFilter(tempCategoryFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilterDrawer(false);
  }

  function resetFilters() {
    setTempCategoryFilter("");
    setCategoryFilter("");
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilterDrawer(false);
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
    setSearchResults([]);
    setSelectedCustomer(null);
    // Reset address picker state
    setCustomerAddresses([]);
    setSelectedAddressId(null);
    setUseOverride(false);
    setSaveOverrideToProfile(false);
    // Reset structured address form
    setOverrideAddress(EMPTY_OVERRIDE);
    setOverrideErrors({});
    // Start in the phone-entry phase; the details phase opens after a search.
    setSearchPhase("phone");
    setShowCustomerModal(true);
  }

  function closeCustomerModal() {
    setShowCustomerModal(false);
  }

  // ── Address form helpers ──
  // Pre-fill the structured form from the selected customer (name + phone)
  // so the cashier only types the address fields.
  function prefillOverrideFromCustomer(customer: typeof selectedCustomer) {
    if (!customer) return;
    setOverrideAddress((prev) => ({
      ...prev,
      fullName: customer.fullName?.trim() || `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || prev.fullName,
      phone: customer.mobileNumber || prev.phone,
    }));
  }

  function updateOverrideField(field: keyof CustomerAddressInput, value: string) {
    setOverrideAddress((prev) => ({ ...prev, [field]: value }));
    if (overrideErrors[field]) {
      setOverrideErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validateOverrideFieldOnBlur(field: keyof CustomerAddressInput) {
    const err = validateOverrideField(field, overrideAddress[field] ?? "");
    setOverrideErrors((prev) => ({ ...prev, [field]: err ?? undefined }));
  }

  // Render a single field in the structured form. Used by both the
  // "Different for this order" path (inside the override radio) and the
  // "no saved addresses" path so the cashier sees the same fields as the
  // storefront. Errors are pulled from the shared `overrideErrors` state.
  function renderOverrideField(
    field: keyof CustomerAddressInput,
    label: string,
    opts?: { required?: boolean; type?: string; placeholder?: string; maxLength?: number; className?: string },
  ) {
    const required = opts?.required ?? POS_REQUIRED_FIELDS.includes(field);
    const err = overrideErrors[field];
    return (
      <div className={`pos-addr-field${opts?.className ? ` ${opts.className}` : ""}`}>
        <label>
          {label}
          {required && <span className="pos-addr-required" aria-hidden="true"> *</span>}
        </label>
        <input
          type={opts?.type ?? "text"}
          inputMode={opts?.type === "tel" ? "numeric" : undefined}
          placeholder={opts?.placeholder}
          value={overrideAddress[field] ?? ""}
          onChange={(e) => updateOverrideField(field, e.target.value)}
          onBlur={() => validateOverrideFieldOnBlur(field)}
          maxLength={opts?.maxLength ?? POS_ADDRESS_LIMITS[field].max}
          className={err ? "has-error" : undefined}
          aria-invalid={err ? "true" : undefined}
        />
        {err && <div className="pos-addr-field__error">{err}</div>}
      </div>
    );
  }

  // Render the full structured address form. Reused in two places so the
  // cashier sees identical fields whether they're filling a one-off for a
  // returning customer or typing a first address for a brand-new one.
  function renderOverrideForm() {
    return (
      <div className="pos-addr-form">
        <div className="pos-addr-form__row">
          {renderOverrideField("fullName", "Full name")}
          {renderOverrideField("phone", "Phone", { type: "tel", placeholder: "10-digit mobile" })}
        </div>
        {renderOverrideField("addressLine1", "Address line 1", { placeholder: "House no, building, street" })}
        {renderOverrideField("addressLine2", "Address line 2", { required: false, placeholder: "Area, colony (optional)" })}
        <div className="pos-addr-form__row pos-addr-form__row--3col">
          {renderOverrideField("city", "City")}
          {renderOverrideField("state", "State")}
          {renderOverrideField("postalCode", "Pincode", { type: "tel", placeholder: "6-digit" })}
        </div>
        {renderOverrideField("landmark", "Landmark", { required: false, placeholder: "Near ... (optional)" })}
      </div>
    );
  }

  async function handleCustomerSearch() {
    if (!customerPhone || customerPhone.length < 3) {
      showToast("Enter at least 3 digits to search", "warning");
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.searchPOSCustomers(customerPhone);
      setSearchResults(response.data || []);

      if (response.data.length === 0) {
        // No results - show message
        showToast("No customer found. Enter details to create new.", "info");
        setSelectedCustomer(null);
      }

      // Move to the details phase whether the search found matches or not.
      // The cashier now sees the name form (no match) or the result list
      // (match) plus the address section and Continue button.
      setSearchPhase("details");
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
    // Reset the address picker so a different customer's addresses don't
    // bleed into the UI before the fetch resolves.
    setCustomerAddresses([]);
    setSelectedAddressId(null);
    setUseOverride(false);
    setSaveOverrideToProfile(false);
    // Pre-fill the structured form with the customer's name/phone so the
    // cashier only types the address fields.
    prefillOverrideFromCustomer(customer);
    // Fire-and-forget fetch of the customer's saved addresses so the modal
    // can show a Home/Office radio list when they have any.
    void fetchCustomerAddresses(customer.id);
  }

  // Go back to the phone-entry phase from the details phase. Keeps the
  // typed phone so the cashier can correct a typo, but discards the
  // search results, selection, typed name, and address form so they
  // start fresh. Also bound to the "x" on the selected-customer card
  // — clearing the selection and going back are the same action here.
  function goBackToPhone() {
    setSelectedCustomer(null);
    setSearchResults([]);
    setCustomerFirstName("");
    setCustomerLastName("");
    setCustomerAddresses([]);
    setSelectedAddressId(null);
    setUseOverride(false);
    setSaveOverrideToProfile(false);
    setOverrideAddress(EMPTY_OVERRIDE);
    setOverrideErrors({});
    setSearchPhase("phone");
  }

  async function fetchCustomerAddresses(customerId: string) {
    setIsLoadingAddresses(true);
    try {
      const response = await api.getPOSCustomerAddresses(customerId);
      const list = response.data || [];
      setCustomerAddresses(list);
      // Pre-select the default address (the backend already returns
      // is-default-first, so the first item is the default when present).
      const def = list.find(a => a.isDefault) ?? list[0];
      setSelectedAddressId(def ? def.id : null);
      setUseOverride(false);
    } catch (error) {
      // A failure here shouldn't block the order — cashier can still type a
      // one-off. We just log and leave the address list empty.
      console.warn("Failed to fetch customer addresses:", error);
      setCustomerAddresses([]);
      setSelectedAddressId(null);
    } finally {
      setIsLoadingAddresses(false);
    }
  }

  function getCustomerInitials(name: string): string {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  async function handleCustomerContinue() {
    // Validate required fields
    if (!customerPhone || customerPhone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "warning");
      return;
    }

    // For an existing customer who already has a name on file, the cashier
    // doesn't need to re-enter it. For everyone else (new customer, or an
    // existing customer whose profile has no name) the first name is
    // required so the order has something to print on the shipping label.
    const selectedHasName = !!(selectedCustomer
      && ((selectedCustomer.firstName || "").trim() || (selectedCustomer.lastName || "").trim()));
    if (!selectedHasName && !customerFirstName.trim()) {
      showToast("Please enter the customer's first name", "warning");
      return;
    }

    // If the cashier picked "Different for this order" and started typing,
    // validate the form now so errors are visible while the modal is still
    // open. An empty override is fine (falls back to "In-Store Purchase");
    // only a partially-filled form needs to be re-checked.
    if (useOverride && isOverrideStructurallyFilled(overrideAddress)) {
      const { isValid, errors } = validateOverrideForm(overrideAddress);
      if (!isValid) {
        setOverrideErrors(errors);
        showToast(firstOverrideError(errors) ?? "Please fix the address errors", "warning");
        return;
      }
    }

    // Close modal and proceed with order
    setShowCustomerModal(false);
    await placeOrderWithCustomer();
  }

  async function placeOrderWithCustomer() {
    if (cart.length === 0) return;

    // Require UPI transaction ID when paying via UPI
    if (paymentMethod === "upi" && !upiTransactionId.trim()) {
      showToast("UPI transaction ID is required", "warning");
      return;
    }

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
      const extraDiscountPaise = Math.round(Number(extraDiscount) * 100);

      // Prepare order data with customer details
      const orderData: Parameters<typeof api.createPOSOrder>[0] = {
        items,
        paymentMethod,
        paymentReference: paymentMethod === "upi" ? upiTransactionId.trim() : undefined,
        couponCode: couponCode.trim() || undefined,
        extraDiscountPaise,
        paidAmountPaise,
        isWalkIn: false,
        customerId: selectedCustomer?.id,
        customerPhone,
        customerFirstName,
        customerLastName,
        customerName: `${customerFirstName} ${customerLastName}`.trim(),
      };

      // Address: prefer a picked saved address; otherwise the structured
      // override (the backend decides whether to persist it). If the
      // override is structurally empty, send nothing — the backend falls
      // back to the "In-Store Purchase" placeholder.
      if (selectedAddressId && !useOverride) {
        orderData.customerAddressId = selectedAddressId;
      }
      else if (isOverrideStructurallyFilled(overrideAddress)) {
        // Validate before sending. The override is also validated on
        // submit (in handleCustomerContinue), so this is a defensive
        // double-check.
        const { isValid, errors } = validateOverrideForm(overrideAddress);
        if (!isValid) {
          setOverrideErrors(errors);
          showToast(firstOverrideError(errors) ?? "Please fix the address errors", "warning");
          setIsPlacingOrder(false);
          return;
        }
        // Strip the empty optional fields the backend treats as null.
        const payload: CustomerAddressInput = {
          fullName: overrideAddress.fullName.trim(),
          phone: overrideAddress.phone.trim(),
          addressLine1: overrideAddress.addressLine1.trim(),
          city: overrideAddress.city.trim(),
          state: overrideAddress.state.trim(),
          postalCode: overrideAddress.postalCode.trim(),
          country: overrideAddress.country?.trim() || "India",
          ...(overrideAddress.addressLine2?.trim()
            ? { addressLine2: overrideAddress.addressLine2.trim() }
            : {}),
          ...(overrideAddress.landmark?.trim()
            ? { landmark: overrideAddress.landmark.trim() }
            : {}),
        };
        orderData.customerAddress = payload;
        // Only meaningful when the customer already has 1+ addresses, but
        // harmless to send either way — the backend ignores it on the
        // zero-address path.
        orderData.saveAddressToProfile = saveOverrideToProfile;
      }

      // Call API to create POS order
      const response = await api.createPOSOrder(orderData);

      // Pass the order response directly to the shared Receipt component.
      // The backend already populates all the fields the receipt needs
      // (subtotalPaise, discountPaise, extraDiscountPaise, totalPaise,
      // paidAmountPaise, changeAmountPaise, couponCode, paymentMethod,
      // paymentReference, items with productName/unitPricePaise/
      // totalPricePaise). Previously the POS built a local OrderBill
      // with cart-derived values; the shared receipt uses the canonical
      // Order shape so the cashier and the admin see identical receipts.
      const order = response.data;

      setCurrentBill(order);
      setShowBill(true);

      // Clear cart after successful order
      setCart([]);
      setPaidAmount("");
      setUpiTransactionId("");
      setCouponCode("");
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
        productType: activeTab,
        categoryId: categoryFilter || undefined,
      });

      setProducts(response.data || []);
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
    setCouponCode("");
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
        couponCode: couponCode.trim() || undefined,
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
    setCouponCode(holdOrder.couponCode || "");
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
  
  const total = subTotal - (extraDiscount * 100);

  async function handlePlaceOrder() {
    if (cart.length === 0) return;
    
    // Open customer modal to collect customer details
    openCustomerModal();
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
          <button
            type="button"
            className={activeFilterCount > 0 ? "filter-btn filter-btn--active" : "filter-btn"}
            onClick={openFilterDrawer}
            aria-haspopup="dialog"
            aria-expanded={showFilterDrawer}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
            </svg>
            Filter
            {activeFilterCount > 0 && <span className="filter-btn__count">{activeFilterCount}</span>}
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
            <span>Coupon Code:</span>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. OFFER50"
              maxLength={64}
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
              <button
                className={paymentMethod === "upi" ? "active" : ""}
                onClick={() => setPaymentMethod("upi")}
              >
                UPI
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
          {paymentMethod === "upi" && (
            <div className="upi-transaction-id">
              <span>UPI Txn ID:</span>
              <input
                type="text"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                placeholder="Enter UPI transaction reference"
                maxLength={64}
              />
            </div>
          )}
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

      {/* Bill/Receipt Modal — shared <ReceiptModal> so this matches
       * the Admin Orders receipt exactly. */}
      {showBill && currentBill && (
        <ReceiptModal
          order={currentBill}
          onClose={closeBillModal}
          title="Order Receipt"
        />
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
              {searchPhase === "phone" ? (
                /* ── Phase 1: only the phone input + Search button ── */
                <div className="customer-phone-phase">
                  <p className="customer-phase-hint">
                    Enter the customer's mobile number to find them on file or
                    create a new profile.
                  </p>
                  <div className="customer-phone-search">
                    <label>Mobile Number <span style={{color: '#ef4444'}}>*</span></label>
                    <div className="customer-phone-input-wrapper">
                      <input
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={customerPhone}
                        autoFocus
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setCustomerPhone(value);
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
                </div>
              ) : (
                /* ── Phase 2: everything else (name, address, continue) ── */
                <div className="customer-details-phase">
                  <button
                    type="button"
                    className="customer-change-number"
                    onClick={goBackToPhone}
                  >
                    ← Change number
                  </button>

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
                    {(couponCode || extraDiscount > 0) && (
                      <div className="customer-order-row">
                        <span>Discounts:</span>
                        <span>-{formatPrice(extraDiscount * 100)}</span>
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
                        {getCustomerInitials(
                          selectedCustomer.fullName ||
                          selectedCustomer.firstName ||
                          selectedCustomer.mobileNumber
                        )}
                      </div>
                      <div className="selected-customer-details">
                        <div className="selected-customer-name">
                          {selectedCustomer.fullName?.trim() || (
                            <span className="selected-customer-name--missing">No name on file</span>
                          )}
                        </div>
                        <div className="selected-customer-phone">{selectedCustomer.mobileNumber}</div>
                      </div>
                      <button className="selected-customer-clear" onClick={goBackToPhone} title="Change number">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Search Results — shown when search returned matches but
                      none has been picked yet. */}
                  {!selectedCustomer && searchResults.length > 0 && (
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
                            <div className="customer-result-name">
                              {customer.fullName?.trim() || (
                                <span className="customer-result-name--missing">No name on file</span>
                              )}
                            </div>
                            <div className="customer-result-phone">{customer.mobileNumber}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Form - shown whenever there's a name to capture:
                      - no customer selected AND no search results to pick from
                        (covers "search returned no match"),
                      - OR selected existing customer with no name on file.
                      Selected customers who already have a name don't need the
                      form at all - the selected-customer card above is enough.
                      The form is hidden while search results are visible so it
                      doesn't crowd the mid-decision view. */}
                  {((!selectedCustomer && searchResults.length === 0)
                    || (selectedCustomer
                      && !((selectedCustomer.firstName || "").trim() || (selectedCustomer.lastName || "").trim())))
                    && (
                    <div className="customer-form">
                      {selectedCustomer
                        && !((selectedCustomer.firstName || "").trim() || (selectedCustomer.lastName || "").trim())
                        && (
                          <div className="customer-form-notice">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="16" x2="12" y2="12"/>
                              <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <span>
                              This customer signed up with mobile only. Add their
                              name below — it will be saved on the order and on
                              their profile.
                            </span>
                          </div>
                        )}

                      <div className="customer-form-row">
                        <div className="customer-form-group">
                          <label>
                            First Name
                            <span style={{color: '#ef4444'}}> *</span>
                          </label>
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
                    </div>
                  )}

                  {/* Address section - shown in phase 2 only.
                      Two shapes:
                      - Customer has 1+ saved addresses → radio list of saved
                        addresses with an "Override" option at the bottom.
                      - Customer has 0 saved addresses / no selection → the
                        structured address form (auto-saved as default on
                        backend, or skipped for the "In-Store Purchase"
                        placeholder). */}
                  <div className="customer-address-section">
                {isLoadingAddresses && selectedCustomer ? (
                  <div className="customer-address-loading">Loading saved addresses…</div>
                ) : !selectedCustomer && searchResults.length > 0 ? (
                  /* Search results visible but no customer picked yet —
                     hide the empty form so it doesn't compete with the
                     selection list. Once the cashier picks a row, this
                     section re-renders with their addresses (or the
                     pre-filled structured form for new customers). */
                  <div className="customer-address-hint">
                    Select a customer above to see their saved addresses or
                    enter a new one.
                  </div>
                ) : selectedCustomer && customerAddresses.length > 0 ? (
                  <div className="pos-address-list">
                    <div className="pos-address-section-label">Delivery address</div>
                    {customerAddresses.map((a) => (
                      <label
                        key={a.id}
                        className={`pos-address-radio ${selectedAddressId === a.id && !useOverride ? "pos-address-radio--selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="customer-address"
                          checked={selectedAddressId === a.id && !useOverride}
                          onChange={() => {
                            setUseOverride(false);
                            setSelectedAddressId(a.id);
                          }}
                        />
                        <div className="pos-address-radio-body">
                          <div className="pos-address-radio-header">
                            {a.label && <span className="pos-address-label-chip">{a.label}</span>}
                            {a.isDefault && <span className="pos-address-default-badge">Default</span>}
                            {a.isDraft && <span className="pos-address-draft-badge">Draft</span>}
                          </div>
                          <div className="pos-address-radio-summary">
                            {[a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </div>
                      </label>
                    ))}
                    <label
                      className={`pos-address-radio pos-address-radio--override ${useOverride ? "pos-address-radio--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="customer-address"
                        checked={useOverride}
                        onChange={() => {
                          setUseOverride(true);
                          setSelectedAddressId(null);
                        }}
                      />
                      <div className="pos-address-radio-body">
                        <div className="pos-address-override-label">Different for this order</div>
                        {useOverride && (
                          <>
                            {renderOverrideForm()}
                            <label className="pos-address-save-checkbox">
                              <input
                                type="checkbox"
                                checked={saveOverrideToProfile}
                                onChange={(e) => setSaveOverrideToProfile(e.target.checked)}
                              />
                              <span>Save this as a new address on the customer's profile</span>
                            </label>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="pos-addr-form-wrap">
                    {renderOverrideForm()}
                    <p className="pos-addr-form__hint">
                      First address on file — auto-saved as default. Leave blank to skip and use the
                      “In-Store Purchase” placeholder.
                    </p>
                  </div>
                )}
                </div>
              </div>
              )}
            </div>

            <div className="customer-modal-actions">
              <button className="customer-btn-cancel" onClick={closeCustomerModal}>
                Cancel
              </button>
              {searchPhase === "details" && (
                <button
                  className="customer-btn-continue"
                  onClick={handleCustomerContinue}
                  disabled={(() => {
                    if (isPlacingOrder) return true;
                    if (!selectedCustomer) {
                      return !customerPhone || customerPhone.length < 10 || !customerFirstName.trim();
                    }
                    // For an existing customer with a name on file, the cashier
                    // can place the order without re-typing the name. For an
                    // existing customer missing a name, the cashier must fill it.
                    const selectedHasName = !!((selectedCustomer.firstName || "").trim() || (selectedCustomer.lastName || "").trim());
                    return !selectedHasName && !customerFirstName.trim();
                  })()}
                >
                  {isPlacingOrder ? "Processing..." : "Place Order"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    {/* Filter Drawer */}
    <FilterDrawer
      isOpen={showFilterDrawer}
      onClose={() => setShowFilterDrawer(false)}
      title="Filter Products"
      onApply={applyFilters}
      onReset={resetFilters}
    >
      <div className="ak-filter-field">
        <label className="ak-filter-field__label">Category</label>
        <StatusDropdown
          options={categoryOptions}
          value={tempCategoryFilter}
          onChange={setTempCategoryFilter}
          placeholder="All Categories"
          showDot={false}
        />
      </div>
    </FilterDrawer>
  </div>
  );
}
