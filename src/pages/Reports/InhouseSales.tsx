import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { Category } from "../../types";
import { formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ak-table` lives in the UI kit.
import "../../styles/ui-kit.css";
import "./inhouse-sales.css";

interface CategoryOption {
  id: string;
  name: string;
  parentId?: string | null;
}

type SaleRow = {
  productId: string;
  name: string;
  sku: string;
  totalSale: number;
  unitsSold: number;
  imageUrl: string | null;
};

const PAGE_SIZE = 20;

export default function InhouseSales() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryOption[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<CategoryOption[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [totals, setTotals] = useState({ totalSale: 0, unitsSold: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The three category levels live in one `categories` table, so each list
  // is fetched once and then narrowed client-side by parent id.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getAllCategories(),
      api.getAllSubCategories(),
      api.getAllSubSubCategories(),
    ])
      .then(([top, sub, subSub]) => {
        if (cancelled) return;
        const toOptions = (list: any[]): CategoryOption[] =>
          (list ?? []).map((c: Category) => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId ?? c.parent?.id ?? null,
          }));
        setCategories(toOptions(top));
        setSubCategories(toOptions(sub));
        setSubSubCategories(toOptions(subSub));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load categories");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sub-categories belong to the selected category; sub-sub-categories
  // belong to the selected sub-category. Both lists narrow as the parent
  // selection changes.
  const visibleSubCategories = useMemo(() => {
    if (!selectedCategory) return subCategories;
    return subCategories.filter((s) => s.parentId === selectedCategory);
  }, [subCategories, selectedCategory]);

  const visibleSubSubCategories = useMemo(() => {
    if (!selectedSubCategory) return subSubCategories;
    return subSubCategories.filter((s) => s.parentId === selectedSubCategory);
  }, [subSubCategories, selectedSubCategory]);

  // The most specific selection wins — a product sits in exactly one
  // category row, so the deepest level the user picked is the filter.
  const effectiveCategoryId =
    selectedSubSubCategory || selectedSubCategory || selectedCategory || undefined;

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getInhouseSalesReport({
        page,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        categoryId: effectiveCategoryId,
        range: "all",
      });
      setRows(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
      setTotals(response.totals ?? { totalSale: 0, unitsSold: 0 });
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load in-house sales");
    }
    finally {
      setLoading(false);
    }
  }, [page, searchQuery, effectiveCategoryId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // The sales-share bar is scaled against the leading product on the page,
  // so the best seller always reads as a full bar.
  const topSale = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.totalSale), 0),
    [rows],
  );

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    setSearchQuery("");
    setPage(1);
  };

  const handleExport = () => {
    const headers = ["Rank", "Product Name", "SKU", "Units Sold", "Total Sale"];
    const data = rows.map((row, index) => [
      (page - 1) * PAGE_SIZE + index + 1,
      row.name,
      row.sku,
      row.unitsSold,
      formatPrice(row.totalSale),
    ]);
    downloadCsv(`inhouse-sales-${new Date().toISOString().slice(0, 10)}`, buildCsv(headers, data));
  };

  const columns = [
    {
      key: "rank",
      header: "Rank",
      width: "72px",
      align: "center" as const,
      render: (_row: SaleRow, index: number) => (
        <span className="ih-rank">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "name",
      header: "Product Name",
      render: (row: SaleRow) => (
        <div className="ih-product">
          <div className="ih-product-icon">
            {row.imageUrl
              ? <img src={row.imageUrl} alt="" />
              : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                    <rect x="3" y="4" width="18" height="4" rx="1" />
                    <path d="M10 12h4" />
                  </svg>
                )}
          </div>
          <div className="ih-product-text">
            <span className="ih-product-name">{row.name}</span>
            <span className="ih-product-sku">{row.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "unitsSold",
      header: "Units Sold",
      align: "right" as const,
      render: (row: SaleRow) => row.unitsSold.toLocaleString(),
    },
    {
      key: "share",
      header: "Sales Share",
      width: "220px",
      render: (row: SaleRow) => (
        <div className="ih-share">
          <div
            className="ih-share-fill"
            style={{ width: `${topSale > 0 ? (row.totalSale / topSale) * 100 : 0}%` }}
          />
        </div>
      ),
    },
    {
      key: "totalSale",
      header: "Total Sale",
      align: "right" as const,
      render: (row: SaleRow) => formatPrice(row.totalSale),
    },
  ];

  return (
    <div className="inhouse-sales">
      <nav className="ih-breadcrumb">
        <span>Sales &amp; Transaction Report</span>
        <span className="ih-breadcrumb-sep">/</span>
        <span className="ih-breadcrumb-current">Inhouse Sales</span>
      </nav>

      <h1 className="ih-title">Inhouse Sales</h1>

      {error && (
        <div className="ih-error-card">
          <p>{error}</p>
        </div>
      )}

      <div className="ih-stats-grid">
        <div className="ih-stat-card">
          <div className="ih-stat-icon ih-stat-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9h6M9 13h6M12 9v7" />
            </svg>
          </div>
          <div className="ih-stat-body">
            <div className="ih-stat-value">{formatPrice(totals.totalSale, { compact: true })}</div>
            <div className="ih-stat-label">Total In-House Sales</div>
          </div>
        </div>

        <div className="ih-stat-card">
          <div className="ih-stat-icon ih-stat-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
              <rect x="3" y="4" width="18" height="4" rx="1" />
              <path d="M10 12h4" />
            </svg>
          </div>
          <div className="ih-stat-body">
            <div className="ih-stat-value">{totals.unitsSold.toLocaleString()}</div>
            <div className="ih-stat-label">Units Sold</div>
          </div>
        </div>

        <div className="ih-stat-card">
          <div className="ih-stat-icon ih-stat-icon--teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="ih-stat-body">
            <div className="ih-stat-value">{totalItems.toLocaleString()}</div>
            <div className="ih-stat-label">Total Products</div>
          </div>
        </div>
      </div>

      <div className="ih-filter-card">
        <div className="ih-filter-group">
          <label htmlFor="ih-category">Category</label>
          <select
            id="ih-category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              // Changing the parent invalidates the children.
              setSelectedSubCategory("");
              setSelectedSubSubCategory("");
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ih-filter-group">
          <label htmlFor="ih-sub-category">Sub Category</label>
          <select
            id="ih-sub-category"
            value={selectedSubCategory}
            onChange={(e) => {
              setSelectedSubCategory(e.target.value);
              setSelectedSubSubCategory("");
              setPage(1);
            }}
          >
            <option value="">All Sub Category</option>
            {visibleSubCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ih-filter-group">
          <label htmlFor="ih-sub-sub-category">Sub Sub Category</label>
          <select
            id="ih-sub-sub-category"
            value={selectedSubSubCategory}
            onChange={(e) => {
              setSelectedSubSubCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Sub Sub Category</option>
            {visibleSubSubCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="ih-clear-btn" onClick={clearFilters}>
          Clear
        </button>

        <div className="ih-filter-actions">
          <div className="ih-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <button
            type="button"
            className="ih-export-btn"
            onClick={handleExport}
            disabled={rows.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="ih-table-card">
        <div className="ih-table-header">
          <h2>
            In-House Product List
            <span className="ih-table-count">{totalItems.toLocaleString()}</span>
          </h2>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          loadingText="Loading in-house sales…"
          emptyIcon="box"
          emptyTitle="No in-house sales found"
          emptyDescription="Products sold by a vendor are excluded from this report — this screen covers first-party products only."
          keyExtractor={(row) => row.productId}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="products"
        />
      </div>
    </div>
  );
}
