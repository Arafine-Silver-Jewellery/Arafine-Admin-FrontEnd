import { useState, useEffect } from "react";
import { DataTable, StatusDropdown } from "../../components";
import * as XLSX from "xlsx";
import "../../styles/ui-kit.css";

interface RestockRequest {
  id: string;
  name: string;
  image: string;
  variant?: string;
  sellingPrice: number;
  lastRequestDate: string;
  numberOfRequest: number;
}

const categoryOptions = [
  { value: "", label: "All Categories", color: "neutral" as const },
  { value: "rings", label: "Rings", color: "neutral" as const },
  { value: "necklaces", label: "Necklaces", color: "neutral" as const },
  { value: "bracelets", label: "Bracelets", color: "neutral" as const },
  { value: "earrings", label: "Earrings", color: "neutral" as const },
];

export default function RequestRestockList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [requests] = useState<RestockRequest[]>([]);
  const [loading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = r.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesSearch;
  });

  // Paginated data
  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function handleExport() {
    const exportData = filteredRequests.map((request, index) => ({
      SL: index + 1,
      "Product Name": request.name,
      Variant: request.variant || "",
      "Selling Price (₹)": request.sellingPrice?.toLocaleString() || "",
      "Last Request Date": request.lastRequestDate,
      "Number of Requests": request.numberOfRequest,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Restock Requests");
    XLSX.writeFile(workbook, `restock-requests-${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function handleReset() {
    setSearchQuery("");
    setCategory("");
  }

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "60px",
      render: (_: RestockRequest, index: number) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "product",
      header: "Product Name",
      render: (request: RestockRequest) => (
        <div className="ak-product-cell">
          {request.image ? (
            <img src={request.image} alt={request.name} className="ak-product-cell__img" />
          ) : (
            <div className="ak-product-cell__placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
          )}
          <div>
            <span className="ak-product-cell__name ak-text-link">{request.name}</span>
            {request.variant && (
              <span className="ak-text-muted ak-text-sm" style={{ display: "block" }}>
                Variant: {request.variant}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      width: "130px",
      render: (request: RestockRequest) => (
        <span style={{ fontWeight: 500 }}>
          {request.sellingPrice != null ? `₹${Number(request.sellingPrice).toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "lastRequestDate",
      header: "Last Request Date",
      width: "150px",
      render: (request: RestockRequest) => (
        <span className="ak-text-muted">{request.lastRequestDate || "—"}</span>
      ),
    },
    {
      key: "numberOfRequest",
      header: "Requests",
      width: "100px",
      align: "center" as const,
      render: (request: RestockRequest) => (
        <span
          className={`ak-status ak-status--${request.numberOfRequest > 10 ? "danger" : request.numberOfRequest > 5 ? "warning" : "info"}`}
        >
          <span className="ak-status__dot" />
          {request.numberOfRequest ?? 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "120px",
      render: (_request: RestockRequest) => (
        <div className="ak-row-actions">
          <button type="button" className="ak-icon-btn ak-icon-btn--view" title="View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button type="button" className="ak-icon-btn" title="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button type="button" className="ak-icon-btn ak-icon-btn--delete" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ak-page">
      {/* Page Header */}
      <div className="ak-page-header">
        <div className="ak-page-header__left">
          <h1 className="ak-page-header__title">
            Restock Requests
            {totalItems > 0 && <span className="ak-page-header__count">{totalItems}</span>}
          </h1>
          <p className="ak-page-header__subtitle">Track products customers want restocked</p>
        </div>
        <div className="ak-page-header__actions">
          <button type="button" className="ak-btn ak-btn--ghost" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Page Body */}
      <div className="ak-page-body">
        {/* Toolbar */}
        <div className="ak-toolbar">
          <div className="ak-toolbar__search">
            <div className="ak-searchbar">
              <div className="ak-searchbar__form">
                <svg
                  className="ak-searchbar__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="ak-searchbar__input"
                  placeholder="Search by Product Name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ak-toolbar__filters">
            <StatusDropdown
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="All Categories"
              size="sm"
            />
            <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedRequests}
          loading={loading}
          loadingText="Loading restock requests…"
          emptyIcon="box"
          emptyTitle="No restock requests"
          emptyDescription="When customers request product restocks, they will appear here."
          keyExtractor={(request) => request.id}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
