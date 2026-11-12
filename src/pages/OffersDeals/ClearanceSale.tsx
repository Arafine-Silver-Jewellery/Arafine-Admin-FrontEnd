import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type {
  ClearanceSaleProduct,
  FlashDealProductInfo,
} from "../../types";
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

// Tab type
type TabType = "inhouse" | "vendor" | "priority";

// SVG Icons
const icons = {
  tag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  edit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  delete: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  users: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
}



export default function ClearanceSale() {
  const [activeTab, setActiveTab] = useState<TabType>("inhouse");

  // ===================== INHOUSE TAB STATE =====================
  const [inhouseSettings, setInhouseSettings] = useState({
    isActive: false,
    startsAt: "",
    endsAt: "",
    discountPercent: 10,
    discountType: "flat" as "flat" | "product",
    offerActiveTime: "always" as "always" | "specific",
    showOnHomepage: false,
  });
  const [savingInhouse, setSavingInhouse] = useState(false);
  const [inhouseMessage, setInhouseMessage] = useState("");

  // Products list for inhouse
  const [products, setProducts] = useState<ClearanceSaleProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Add product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [availableProducts, setAvailableProducts] = useState<FlashDealProductInfo[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  // Edit discount modal
  const [editingRow, setEditingRow] = useState<ClearanceSaleProduct | null>(null);
  const [editPercent, setEditPercent] = useState("0");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===================== VENDOR TAB STATE =====================
  const [vendorSettings, setVendorSettings] = useState({
    showOnHomepage: false,
  });
  const [vendorSearch, setVendorSearch] = useState("");

  // ===================== PRIORITY TAB STATE =====================
  const [prioritySettings, setPrioritySettings] = useState({
    useDefaultSorting: true,
    useCustomSorting: false,
  });
  const [savingPriority, setSavingPriority] = useState(false);

  // ===================== DEBOUNCE =====================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // ===================== FETCH SETTINGS =====================
  useEffect(() => {
    (async () => {
      try {
        const response = await api.getClearanceSettings();
        setInhouseSettings({
          isActive: response.isActive,
          startsAt: formatDateForInput(response.startsAt),
          endsAt: formatDateForInput(response.endsAt),
          discountPercent: response.discountPercent,
          discountType: "flat",
          offerActiveTime: "always",
          showOnHomepage: response.showOnHomepage,
        });
      } catch (error) {
        console.error("Failed to fetch clearance settings:", error);
      }
    })();
  }, []);

  // ===================== FETCH PRODUCTS =====================
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const response = await api.getClearanceProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
      });
      setProducts(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch clearance products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch]);

  useEffect(() => {
    if (activeTab === "inhouse") {
      fetchProducts();
    }
  }, [fetchProducts, activeTab]);

  // ===================== SEARCH AVAILABLE PRODUCTS =====================
  useEffect(() => {
    if (!showAddModal) return;
    (async () => {
      try {
        setLoadingAvailable(true);
        const response = await api.searchClearanceProducts({
          search: debouncedProductSearch || undefined,
          limit: 50,
        });
        setAvailableProducts(response.data);
      } catch (error) {
        console.error("Failed to search products:", error);
      } finally {
        setLoadingAvailable(false);
      }
    })();
  }, [debouncedProductSearch, showAddModal]);

  // ===================== INHOUSE HANDLERS =====================
  async function saveInhouseSettings(e: React.FormEvent) {
    e.preventDefault();
    setInhouseMessage("");

    if (inhouseSettings.startsAt && inhouseSettings.endsAt) {
      const start = new Date(inhouseSettings.startsAt);
      const end = new Date(inhouseSettings.endsAt);
      if (end <= start) {
        setInhouseMessage("End date must be after start date");
        return;
      }
    }

    try {
      setSavingInhouse(true);
      await api.updateClearanceSettings({
        isActive: inhouseSettings.isActive,
        startsAt: inhouseSettings.startsAt ? new Date(inhouseSettings.startsAt).toISOString() : null,
        endsAt: inhouseSettings.endsAt ? new Date(inhouseSettings.endsAt).toISOString() : null,
        discountPercent: Number(inhouseSettings.discountPercent),
        showOnHomepage: inhouseSettings.showOnHomepage,
      });
      setInhouseMessage("Settings saved successfully");
      setTimeout(() => setInhouseMessage(""), 3000);
    } catch (error: any) {
      console.error("Failed to save clearance settings:", error);
      setInhouseMessage(error.message || "Failed to save settings");
    } finally {
      setSavingInhouse(false);
    }
  }

  function resetInhouseSettings() {
    setInhouseSettings({
      isActive: false,
      startsAt: "",
      endsAt: "",
      discountPercent: 10,
      discountType: "flat",
      offerActiveTime: "always",
      showOnHomepage: false,
    });
  }

  async function addProduct(product: FlashDealProductInfo) {
    try {
      setAddingProduct(true);
      await api.addClearanceProduct({
        productId: product.id,
        discountPercent: inhouseSettings.discountPercent,
      });
      setShowAddModal(false);
      setProductSearch("");
      setCurrentPage(1);
      fetchProducts();
    } catch (error) {
      console.error("Failed to add product:", error);
    } finally {
      setAddingProduct(false);
    }
  }

  function openEditModal(row: ClearanceSaleProduct) {
    setEditingRow(row);
    setEditPercent(String(row.discountPercent));
  }

  async function saveEdit() {
    if (!editingRow) return;

    try {
      setSavingEdit(true);
      await api.updateClearanceProduct(editingRow.id, { discountPercent: Number(editPercent) });
      setEditingRow(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to update clearance product:", error);
    } finally {
      setSavingEdit(false);
    }
  }

  async function toggleActive(row: ClearanceSaleProduct) {
    try {
      await api.updateClearanceProduct(row.id, { isActive: !row.isActive });
      fetchProducts();
    } catch (error) {
      console.error("Failed to toggle clearance product:", error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await api.deleteClearanceProduct(deleteId);
      setDeleteId(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete clearance product:", error);
    } finally {
      setDeleting(false);
    }
  }

  // ===================== PRIORITY HANDLERS =====================
  function handleSortingChange(type: "default" | "custom") {
    setPrioritySettings({
      useDefaultSorting: type === "default",
      useCustomSorting: type === "custom",
    });
  }

  async function savePrioritySettings() {
    try {
      setSavingPriority(true);
      // API call would go here when backend supports it
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSavingPriority(false);
    } catch (error) {
      console.error("Failed to save priority settings:", error);
      setSavingPriority(false);
    }
  }

  // ===================== TABLE COLUMNS =====================
  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: ClearanceSaleProduct, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "product",
      header: "Product",
      render: (product: ClearanceSaleProduct) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "8px",
            overflow: "hidden",
            background: "var(--color-pearl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {product.productImageUrl ? (
              <img
                src={product.productImageUrl}
                alt={product.productName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 500, color: "var(--text-strong)" }}>{product.productName}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{product.productSku}</div>
          </div>
        </div>
      ),
    },
    {
      key: "originalPrice",
      header: "Original Price",
      width: "130px",
      render: (product: ClearanceSaleProduct) => (
        <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>
          ₹{product.originalPrice.toLocaleString()}
        </span>
      ),
    },
    {
      key: "discountPrice",
      header: "Discount Price",
      width: "130px",
      render: (product: ClearanceSaleProduct) => (
        <span style={{ fontWeight: 600, color: "#22c55e" }}>
          ₹{product.discountPrice.toLocaleString()}
        </span>
      ),
    },
    {
      key: "discountPercent",
      header: "Discount %",
      width: "110px",
      render: (product: ClearanceSaleProduct) => (
        <span style={{
          display: "inline-block",
          padding: "4px 10px",
          background: "#dcfce7",
          color: "#16a34a",
          borderRadius: "20px",
          fontSize: "0.8rem",
          fontWeight: 500,
        }}>
          {product.discountPercent}% OFF
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      width: "80px",
      align: "center" as const,
      render: (product: ClearanceSaleProduct) => <span>{product.stock}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "90px",
      render: (product: ClearanceSaleProduct) => (
        <label className="ak-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={product.isActive} onChange={() => toggleActive(product)} />
          <span className="ak-toggle__slider" />
        </label>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "100px",
      render: (product: ClearanceSaleProduct) => (
        <div className="ak-row-actions">
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--edit"
            title="Edit discount"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(product);
            }}
          >
            {icons.edit}
          </button>
          <button
            type="button"
            className="ak-icon-btn ak-icon-btn--delete"
            title="Remove"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(product.id);
            }}
          >
            {icons.delete}
          </button>
        </div>
      ),
    },
  ];

  // ===================== RENDER =====================
  return (
    <div className="reports-container">
      {/* Page Header with Tabs */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <span style={{ color: "var(--color-champagne-gold)", fontSize: "1.5rem" }}>{icons.tag}</span>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>Clearance Sale</h1>
        </div>

        {/* Tabs - Text style with underline */}
        <div style={{ display: "flex", gap: "32px", borderBottom: "1px solid var(--border-color-light)", paddingBottom: "0" }}>
          <button
            type="button"
            onClick={() => setActiveTab("inhouse")}
            style={{
              padding: "0 0 12px 0",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9rem",
              background: "transparent",
              color: activeTab === "inhouse" ? "var(--text-strong)" : "var(--text-muted)",
              borderBottom: activeTab === "inhouse" ? "2px solid var(--color-champagne-gold)" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.2s ease",
            }}
          >
            Manage Inhouse Offer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vendor")}
            style={{
              padding: "0 0 12px 0",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9rem",
              background: "transparent",
              color: activeTab === "vendor" ? "var(--text-strong)" : "var(--text-muted)",
              borderBottom: activeTab === "vendor" ? "2px solid var(--color-champagne-gold)" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.2s ease",
            }}
          >
            Manage Vendor Offer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("priority")}
            style={{
              padding: "0 0 12px 0",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9rem",
              background: "transparent",
              color: activeTab === "priority" ? "var(--text-strong)" : "var(--text-muted)",
              borderBottom: activeTab === "priority" ? "2px solid var(--color-champagne-gold)" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.2s ease",
            }}
          >
            Priority setup
          </button>
        </div>
      </div>

      {/* ===================== INHOUSE TAB ===================== */}
      {activeTab === "inhouse" && (
        <>
          {/* Settings Card */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            {/* Active Offer Toggle Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color-light)",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Active clearance sale offer ?</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Show your offer in the store details page in customer website and apps
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Active Offer</span>
                <label className="ak-toggle">
                  <input
                    type="checkbox"
                    checked={inhouseSettings.isActive}
                    onChange={(e) => setInhouseSettings({ ...inhouseSettings, isActive: e.target.checked })}
                  />
                  <span className="ak-toggle__slider" />
                </label>
              </div>
            </div>

            {/* Setup Offer Logics */}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>Setup Offer Logics</h4>
                <a href="#" style={{ color: "var(--color-champagne-gold)", fontSize: "0.85rem", textDecoration: "none" }}>
                  Meta Data Setup →
                </a>
              </div>

              <form onSubmit={saveInhouseSettings}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  {/* Left Column */}
                  <div>
                    {/* Duration */}
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Duration<span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <input
                          type="datetime-local"
                          className="ak-input"
                          value={inhouseSettings.startsAt}
                          onChange={(e) => setInhouseSettings({ ...inhouseSettings, startsAt: e.target.value })}
                          style={{ fontSize: "0.85rem" }}
                        />
                        <input
                          type="datetime-local"
                          className="ak-input"
                          value={inhouseSettings.endsAt}
                          onChange={(e) => setInhouseSettings({ ...inhouseSettings, endsAt: e.target.value })}
                          style={{ fontSize: "0.85rem" }}
                        />
                      </div>
                    </div>

                    {/* Discount Amount */}
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Discount Amount (%)<span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          className="ak-input"
                          value={inhouseSettings.discountPercent}
                          onChange={(e) => setInhouseSettings({ ...inhouseSettings, discountPercent: Number(e.target.value) })}
                          style={{ paddingRight: "40px" }}
                        />
                        <span style={{
                          position: "absolute",
                          right: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)",
                        }}>
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    {/* Discount Type */}
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Discount Type<span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ display: "flex", gap: "24px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="discountType"
                            checked={inhouseSettings.discountType === "flat"}
                            onChange={() => setInhouseSettings({ ...inhouseSettings, discountType: "flat" })}
                            style={{ accentColor: "var(--color-champagne-gold)" }}
                          />
                          <span style={{ fontSize: "0.9rem" }}>Flat Discount</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="discountType"
                            checked={inhouseSettings.discountType === "product"}
                            onChange={() => setInhouseSettings({ ...inhouseSettings, discountType: "product" })}
                            style={{ accentColor: "var(--color-champagne-gold)" }}
                          />
                          <span style={{ fontSize: "0.9rem" }}>Product wise discount</span>
                        </label>
                      </div>
                    </div>

                    {/* Offer Active Time */}
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "8px" }}>
                        Offer Active Time<span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ display: "flex", gap: "24px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="offerActiveTime"
                            checked={inhouseSettings.offerActiveTime === "always"}
                            onChange={() => setInhouseSettings({ ...inhouseSettings, offerActiveTime: "always" })}
                            style={{ accentColor: "var(--color-champagne-gold)" }}
                          />
                          <span style={{ fontSize: "0.9rem" }}>Always</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="offerActiveTime"
                            checked={inhouseSettings.offerActiveTime === "specific"}
                            onChange={() => setInhouseSettings({ ...inhouseSettings, offerActiveTime: "specific" })}
                            style={{ accentColor: "var(--color-champagne-gold)" }}
                          />
                          <span style={{ fontSize: "0.9rem" }}>Specific time in a day</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show on Homepage & Buttons */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  paddingTop: "20px",
                  borderTop: "1px solid var(--border-color-light)",
                }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Also show in home page</span>
                    <span style={{ color: "var(--text-muted)" }}>{icons.info}</span>
                    <input
                      type="checkbox"
                      checked={inhouseSettings.showOnHomepage}
                      onChange={(e) => setInhouseSettings({ ...inhouseSettings, showOnHomepage: e.target.checked })}
                      style={{ accentColor: "var(--color-champagne-gold)", width: "18px", height: "18px" }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: "12px" }}>
                    {inhouseMessage && (
                      <span style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        background: inhouseMessage.includes("success") ? "#dcfce7" : "#fee2e2",
                        color: inhouseMessage.includes("success") ? "#16a34a" : "#dc2626",
                      }}>
                        {inhouseMessage}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={resetInhouseSettings}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color-light)",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={savingInhouse}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "6px",
                        border: "none",
                        background: "var(--color-champagne-gold)",
                        color: "white",
                        cursor: savingInhouse ? "not-allowed" : "pointer",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                        opacity: savingInhouse ? 0.7 : 1,
                      }}
                    >
                      {savingInhouse ? "Saving…" : "Update"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Products Table Card */}
          <div className="table-card">
            <div className="table-header">
              <h3>
                Clearance Products <span className="count">{totalItems}</span>
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="search-box">
                  {icons.search}
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="btn-export" onClick={() => setShowAddModal(true)}>
                  {icons.plus}
                  Add Product
                </button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={products}
              loading={loadingProducts}
              emptyIcon="box"
              emptyTitle="No products in clearance sale"
              emptyDescription="Add products to your clearance sale to offer discounts."
              keyExtractor={(product) => product.id}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* ===================== VENDOR TAB ===================== */}
      {activeTab === "vendor" && (
        <>
          {/* Show Offer in Home Page Card */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Show Clearance Offer in Home Page</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  You can highlight all clearance offer products in home page to increase customer reach
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Show Offer in home page</span>
                <label className="ak-toggle">
                  <input
                    type="checkbox"
                    checked={vendorSettings.showOnHomepage}
                    onChange={(e) => setVendorSettings({ ...vendorSettings, showOnHomepage: e.target.checked })}
                  />
                  <span className="ak-toggle__slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Add Vendor Card */}
          <div className="table-card" style={{ marginBottom: "24px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color-light)" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Add Vendor</h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Alongside with your in-house product, you can highlight vendor's product who has activate their clearance offer.
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  {icons.search}
                </span>
                <input
                  type="text"
                  className="ak-input"
                  placeholder="Search Vendors"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                />
              </div>
            </div>
          </div>

          {/* Vendor List Card */}
          <div className="table-card">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color-light)" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Vendor List</h3>
            </div>
            <div style={{
              padding: "60px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}>
              {icons.users}
              <p style={{ margin: "16px 0 0", fontSize: "0.95rem" }}>No vendors are added</p>
            </div>
          </div>
        </>
      )}

      {/* ===================== PRIORITY TAB ===================== */}
      {activeTab === "priority" && (
        <div className="table-card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "200px" }}>
            {/* Left Side - Description */}
            <div style={{ padding: "24px", borderRight: "1px solid var(--border-color-light)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 600 }}>Stock Clearance Product</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Stock clearance products are items specifically selected
                and listed to be sold at discounted prices to customers.
              </p>
            </div>

            {/* Right Side - Options */}
            <div style={{ padding: "24px" }}>
              {/* Default Sorting */}
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 600 }}>Use Default Sorting List</h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-champagne-gold)" }}>
                    ⓘ Currently sorting this section based on latest add
                  </p>
                </div>
                <label className="ak-toggle">
                  <input
                    type="checkbox"
                    checked={prioritySettings.useDefaultSorting}
                    onChange={() => handleSortingChange("default")}
                  />
                  <span className="ak-toggle__slider" />
                </label>
              </div>

              {/* Custom Sorting */}
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 600 }}>Use Custom Sorting List</h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-champagne-gold)" }}>
                    ⓘ You can sorting this section by others way
                  </p>
                </div>
                <label className="ak-toggle">
                  <input
                    type="checkbox"
                    checked={prioritySettings.useCustomSorting}
                    onChange={() => handleSortingChange("custom")}
                  />
                  <span className="ak-toggle__slider" />
                </label>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={savePrioritySettings}
                  disabled={savingPriority}
                  style={{
                    padding: "10px 32px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--color-champagne-gold)",
                    color: "white",
                    cursor: savingPriority ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    opacity: savingPriority ? 0.7 : 1,
                  }}
                >
                  {savingPriority ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODALS ===================== */}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="ak-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="ak-modal" style={{ maxWidth: "650px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Add Product to Clearance Sale</h2>
              <button type="button" className="ak-modal__close" onClick={() => setShowAddModal(false)}>
                {icons.close}
              </button>
            </div>
            <div className="ak-modal__body">
              <input
                type="text"
                className="ak-input"
                placeholder="Search products by name or SKU…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ marginBottom: "12px" }}
              />
              {loadingAvailable ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
              ) : availableProducts.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  No products found (products already in the sale are excluded).
                </div>
              ) : (
                <div style={{ maxHeight: "320px", overflowY: "auto", border: "1px solid var(--border-color-light)", borderRadius: "8px" }}>
                  {availableProducts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border-color-light)",
                      }}
                    >
                      <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{p.sku}</span>
                      <span style={{ fontWeight: 500 }}>₹{p.price}</span>
                      <button
                        type="button"
                        className="ak-btn ak-btn--ghost ak-btn--sm"
                        disabled={addingProduct}
                        onClick={() => addProduct(p)}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                New products start with the flat discount of {inhouseSettings.discountPercent}%. Edit per-product from the table.
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setShowAddModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Discount Modal */}
      {editingRow && (
        <div className="ak-modal-overlay" onClick={() => setEditingRow(null)}>
          <div className="ak-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Edit Discount — {editingRow.productName}</h2>
              <button type="button" className="ak-modal__close" onClick={() => setEditingRow(null)}>
                {icons.close}
              </button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-form-group">
                <label className="ak-label">Discount (%)<span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="ak-input"
                    value={editPercent}
                    onChange={(e) => setEditPercent(e.target.value)}
                    style={{ paddingRight: "40px" }}
                  />
                  <span style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}>
                    %
                  </span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Original: ₹{editingRow.originalPrice.toLocaleString()} → New price: ₹{(Math.round(editingRow.originalPrice * (1 - Number(editPercent || 0) / 100) * 100) / 100).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setEditingRow(null)} disabled={savingEdit}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="ak-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="ak-modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">Remove from Clearance Sale</h2>
              <button type="button" className="ak-modal__close" onClick={() => setDeleteId(null)}>
                {icons.close}
              </button>
            </div>
            <div className="ak-modal__body">
              <p>Remove this product from the clearance sale? The product itself is not deleted.</p>
            </div>
            <div className="ak-modal__footer">
              <button type="button" className="ak-btn ak-btn--ghost" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ak-btn ak-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
