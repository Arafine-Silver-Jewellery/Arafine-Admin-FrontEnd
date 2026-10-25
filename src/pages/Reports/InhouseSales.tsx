import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { DataTable } from "../../components";
import type { Category } from "../../types";
import { formatPrice } from "../../utils/format";
import { buildCsv, downloadCsv } from "./reportCsv";
// `ak-table` lives in the UI kit.
import "../../styles/ui-kit.css";
import "../../styles/reports.css";

interface CategoryOption {
  id: string;
  name: string;
  parentId?: string | null;
}

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
  const [rows, setRows] = useState<{
    productId: string;
    name: string;
    sku: string;
    totalSalePaise: number;
    unitsSold: number;
    imageUrl: string | null;
  }[]>([]);
  const [totals, setTotals] = useState({ totalSalePaise: 0, unitsSold: 0 });
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
      setTotals(response.totals ?? { totalSalePaise: 0, unitsSold: 0 });
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

  const handleExport = () => {
    const headers = ["SL", "Product Name", "SKU", "Units Sold", "Total Sale"];
    const data = rows.map((row, index) => [
      (page - 1) * PAGE_SIZE + index + 1,
      row.name,
      row.sku,
      row.unitsSold,
      formatPrice(row.totalSalePaise),
    ]);
    downloadCsv(`inhouse-sales-${new Date().toISOString().slice(0, 10)}`, buildCsv(headers, data));
  };

  const columns = [
    {
      key: "sl",
      header: "SL",
      width: "56px",
      align: "center" as const,
      render: (_row: (typeof rows)[number], index: number) =>
        (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: "name",
      header: "Product Name",
      render: (row: (typeof rows)[number]) => (
        <div className="product-cell">
          {row.imageUrl ? (
            <img className="product-img" src={row.imageUrl} alt={row.name} />
          ) : (
            <div
              className="product-img"
              style={{
                background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              📦
            </div>
          )}
          <div className="vendor-info">
            <span className="product-name">{row.name}</span>
            <span className="vendor-email">{row.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "unitsSold",
      header: "Units Sold",
      align: "right" as const,
      render: (row: (typeof rows)[number]) => row.unitsSold,
    },
    {
      key: "totalSalePaise",
      header: "Total Sale",
      align: "right" as const,
      render: (row: (typeof rows)[number]) => formatPrice(row.totalSalePaise),
    },
  ];

  return (
    <div className="reports-container">
      <div className="filter-card">
        <h3>Filter Data</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Category</label>
            <select
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
          <div className="filter-group">
            <label>Sub Category</label>
            <select
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
          <div className="filter-group">
            <label>Sub Sub Category</label>
            <select
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
          <button
            className="btn-filter-secondary"
            onClick={() => {
              setSelectedCategory("");
              setSelectedSubCategory("");
              setSelectedSubSubCategory("");
              setSearchQuery("");
              setPage(1);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="report-card" style={{ borderLeft: "4px solid #f44336" }}>
          <p style={{ margin: 0, color: "#f44336" }}>{error}</p>
        </div>
      )}

      <div className="reports-stats-grid">
        <div className="reports-stat-card wide">
          <div className="reports-stat-icon blue">💰</div>
          <div className="reports-stat-content">
            <h2>{formatPrice(totals.totalSalePaise, { compact: true })}</h2>
            <p>Total In-House Sales</p>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon green">📦</div>
          <div className="reports-stat-content">
            <h2>{totals.unitsSold.toLocaleString()}</h2>
            <p>Units Sold</p>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon teal">🧾</div>
          <div className="reports-stat-content">
            <h2>{totalItems}</h2>
            <p>Total Products</p>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>
            In-House Product List <span className="count">{totalItems}</span>
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="search-box">
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
            <button className="btn-export" onClick={handleExport} disabled={rows.length === 0}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
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
        />
      </div>
    </div>
  );
}
