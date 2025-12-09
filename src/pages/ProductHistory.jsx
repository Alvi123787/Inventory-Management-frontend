import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { formatCurrency } from "../utils/currency";
import "./ProductHistory.css"

export default function ProductHistory() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("change_date");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const [histRes, prodRes] = await Promise.all([
        api.get("api/product-history"),
        api.get("api/products"),
      ]);

      const historyRows = Array.isArray(histRes?.data?.data) ? histRes.data.data : [];
      const products = Array.isArray(prodRes?.data?.data) ? prodRes.data.data : [];
      const byId = new Map(products.map(p => [Number(p.id), p]));

      const normalized = historyRows.map(r => {
        const p = r.product_id != null ? byId.get(Number(r.product_id)) : null;
        return {
          ...r,
          image_url: p?.image_url || null,
          cost: p?.cost != null ? Number(p.cost) : null,
          price: p?.price != null ? Number(p.price) : null,
          discount_rate: p?.discount_rate != null ? Number(p.discount_rate) : 0,
          stock: p?.stock != null ? Number(p.stock) : null,
          product_date: p?.product_date || null,
          user_email: "",
        };
      });

      setRecords(normalized);
    } catch (err) {
      console.error("Failed to fetch product history:", err);
      setError(err?.response?.data?.message || "Failed to load product history");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onDeleteOne = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this history record?")) return;
    try {
      setLoading(true);
      await api.delete(`api/product-history/${id}`);
      await fetchHistory();
    } catch (err) {
      console.error("Failed to delete history record:", err);
      setError(err?.response?.data?.message || "Failed to delete history record");
    } finally {
      setLoading(false);
    }
  };

  const onClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all filtered history records?")) return;
    try {
      setLoading(true);
      const ids = filtered.map(r => r.id).filter(Boolean);
      await Promise.all(ids.map(id => api.delete(`api/product-history/${id}`)));
      await fetchHistory();
    } catch (err) {
      console.error("Failed to clear history:", err);
      setError(err?.response?.data?.message || "Failed to clear history");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    try {
      const headers = [
        "id","product_id","product_name","action_type","field_changed","old_value","new_value","quantity","change_date","user_name","notes","price","cost","discount_rate","stock","product_date"
      ];
      const rows = filtered.map(r => [
        r.id,
        r.product_id,
        r.product_name,
        r.action_type,
        r.field_changed,
        r.old_value,
        r.new_value,
        r.quantity,
        r.change_date,
        r.user_name,
        r.notes,
        r.price,
        r.cost,
        r.discount_rate,
        r.stock,
        r.product_date,
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(v => v == null ? "" : String(v).includes(",") ? `"${String(v).replace(/"/g, '""')}"` : String(v)).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `product_history_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export CSV");
      setTimeout(() => setError(""), 3000);
    }
  };

  const columns = [
    { key: 'image_url', label: 'Image', sortable: false },
    { key: 'product_name', label: 'Product', sortable: true },
    { key: 'cost', label: 'Cost', sortable: true },
    { key: 'price', label: 'Price', sortable: true },
    { key: 'discount_rate', label: 'Discount', sortable: true },
    { key: 'stock', label: 'Stock', sortable: true },
    { key: 'product_date', label: 'Added', sortable: true },
    { key: 'action_type', label: 'Action', sortable: true },
    { key: 'change_summary', label: 'Change Details', sortable: false },
    { key: 'change_date', label: 'Timestamp', sortable: true },
    { key: 'user_name', label: 'User', sortable: true },
    { key: 'actions', label: '', sortable: false },
  ];

  const summarizeChange = (rec) => {
    const f = String(rec.field_changed || '').trim();
    const oldVal = rec.old_value;
    const newVal = rec.new_value;
    const action = String(rec.action_type || '').toUpperCase();
    const labelMap = {
      name: 'Name',
      price: 'Price',
      discount_rate: 'Discount',
      cost: 'Cost',
      stock: 'Stock',
      product_date: 'Product Date',
      image_url: 'Image',
      product: 'Product'
    };
    const label = labelMap[f] || (f ? f.charAt(0).toUpperCase() + f.slice(1) : '');
    const toCurrency = (v) => formatCurrency(v);
    const toPercent = (v) => `${Number(v || 0)}%`;
    const fmt = (field, v) => {
      if (!v && v !== 0) return 'Empty';
      if (field === 'price' || field === 'cost') return toCurrency(v);
      if (field === 'discount_rate') return toPercent(v);
      if (field === 'name') return `"${String(v)}"`;
      if (field === 'product_date') {
        try {
          return new Date(v).toLocaleDateString();
        } catch {
          return String(v);
        }
      }
      return String(v);
    };
    
    if (action === 'DELETE') {
      try {
        const parsed = JSON.parse(String(oldVal || '{}'));
        const nm = parsed?.name ? `"${parsed.name}"` : `#${rec.product_id}`;
        return `Product deleted (${nm})`;
      } catch {
        return `Product #${rec.product_id} deleted`;
      }
    }
    if (action === 'CREATE') {
      if (!f) return 'Product created';
      return `${label} set to ${fmt(f, newVal)}`;
    }
    if (action === 'STOCK_ADJUSTMENT') {
      const o = Number(oldVal);
      const n = Number(newVal);
      if (!Number.isNaN(o) && !Number.isNaN(n)) {
        if (n < o) return `Stock reduced from ${o} to ${n}`;
        if (n > o) return `Stock increased from ${o} to ${n}`;
        return `Stock unchanged at ${n}`;
      }
      return `Stock changed from ${oldVal || 'Empty'} to ${newVal || 'Empty'}`;
    }
    if (action === 'UPDATE') {
      if (!f) return 'Product updated';
      return `${label} changed from ${fmt(f, oldVal)} to ${fmt(f, newVal)}`;
    }
    return `${label || 'Change'}: ${newVal || 'Empty'}`;
  };

  const onSort = (key) => {
    if (!key || key === 'actions' || key === 'image_url' || key === 'change_summary') return;
    if (sortBy === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return records;
    const ql = query.toLowerCase().trim();
    return records.filter(r =>
      String(r.product_name || '').toLowerCase().includes(ql) ||
      String(r.user_name || '').toLowerCase().includes(ql) ||
      String(r.user_email || '').toLowerCase().includes(ql) ||
      String(r.action_type || '').toLowerCase().includes(ql) ||
      String(r.field_changed || '').toLowerCase().includes(ql)
    );
  }, [records, query]);

  const sortedAndFiltered = useMemo(() => {
    const filteredRecords = [...filtered];
    
    if (sortBy) {
      filteredRecords.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        // Handle special cases
        if (sortBy === 'change_date' || sortBy === 'product_date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        
        if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });
    }
    
    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredRecords.slice(start, end);
  }, [filtered, sortBy, sortOrder, page, limit]);

  const totalPages = Math.ceil(filtered.length / limit) || 1;

  return (
    <div className="prod-history">
      <div className="prod-history__header">
        <div className="prod-history__title-section">
          <h1 className="prod-history__title">Product History</h1>
          <p className="prod-history__subtitle">Audit log of product changes and updates</p>
        </div>
        <div className="prod-history__stats">
          <div className="prod-history__stat">
            <span className="prod-history__stat-label">Total Records</span>
            <span className="prod-history__stat-value">{filtered.length}</span>
          </div>
          <div className="prod-history__stat">
            <span className="prod-history__stat-label">Filtered</span>
            <span className="prod-history__stat-value">{sortedAndFiltered.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="prod-history__demo-banner">
          <div className="prod-history__demo-content">
            <span className="prod-history__demo-icon">ℹ️</span>
            <span>{error}</span>
          </div>
          <button 
            type="button" 
            className="prod-history__demo-close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="prod-history__card">
        <div className="prod-history__controls">
          <div className="prod-history__search">
            <div className="prod-history__search-input-wrapper">
              <svg className="prod-history__search-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input 
                type="text" 
                className="prod-history__search-input"
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, users, actions..." 
              />
            </div>
          </div>

          <div className="prod-history__actions">
            <button 
              type="button" 
              className="prod-history__btn prod-history__btn--secondary"
              onClick={exportCSV}
              disabled={filtered.length === 0}
            >
              <svg className="prod-history__btn-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Export CSV
            </button>
            <button 
              type="button" 
              className="prod-history__btn prod-history__btn--danger"
              onClick={onClearAll}
              disabled={filtered.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="prod-history__table-container">
          {loading ? (
            <div className="prod-history__loading">
              <div className="prod-history__spinner"></div>
              <p>Loading history...</p>
            </div>
          ) : sortedAndFiltered.length === 0 ? (
            <div className="prod-history__empty">
              <div className="prod-history__empty-icon">📋</div>
              <h3 className="prod-history__empty-title">No history records found</h3>
              <p className="prod-history__empty-text">
                {query ? `No results for "${query}"` : "Start tracking product changes to see history here"}
              </p>
              {query && (
                <button 
                  type="button" 
                  className="prod-history__btn prod-history__btn--outline"
                  onClick={() => setQuery("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="prod-history__table-responsive">
                <table className="prod-history__table">
                  <thead className="prod-history__thead">
                    <tr>
                      {columns.map(col => (
                        <th 
                          key={col.key} 
                          className={`prod-history__th ${col.sortable ? 'prod-history__th--sortable' : ''}`}
                          onClick={() => col.sortable && onSort(col.key)}
                        >
                          <div className="prod-history__th-content">
                            {col.label}
                            {col.sortable && sortBy === col.key && (
                              <span className="prod-history__sort-indicator">
                                {sortOrder === 'ASC' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="prod-history__tbody">
                    {sortedAndFiltered.map(rec => (
                      <tr key={rec.id} className="prod-history__tr">
                        <td className="prod-history__td prod-history__td--image">
                          {rec.image_url ? (
                            <img 
                              src={rec.image_url} 
                              alt={rec.product_name} 
                              className="prod-history__product-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div class="prod-history__image-placeholder">📷</div>';
                              }}
                            />
                          ) : (
                            <div className="prod-history__image-placeholder">📷</div>
                          )}
                        </td>
                        <td className="prod-history__td prod-history__td--product">
                          <div className="prod-history__product-name">{rec.product_name}</div>
                          <div className="prod-history__product-id">ID: {rec.product_id}</div>
                        </td>
                        <td className="prod-history__td prod-history__td--numeric">
                          {formatCurrency(rec.cost)}
                        </td>
                        <td className="prod-history__td prod-history__td--numeric prod-history__td--price">
                          {formatCurrency(rec.price)}
                        </td>
                        <td className="prod-history__td prod-history__td--numeric">
                          <span className={`prod-history__discount ${rec.discount_rate > 0 ? 'prod-history__discount--active' : ''}`}>
                            {rec.discount_rate}%
                          </span>
                        </td>
                        <td className="prod-history__td prod-history__td--numeric">
                          <span className={`prod-history__stock ${rec.stock > 50 ? 'prod-history__stock--high' : rec.stock > 20 ? 'prod-history__stock--medium' : 'prod-history__stock--low'}`}>
                            {rec.stock}
                          </span>
                        </td>
                        <td className="prod-history__td">
                          {new Date(rec.product_date).toLocaleDateString()}
                        </td>
                        <td className="prod-history__td">
                          <span className={`prod-history__action prod-history__action--${rec.action_type.toLowerCase()}`}>
                            {rec.action_type}
                          </span>
                        </td>
                        <td className="prod-history__td prod-history__td--details">
                          {summarizeChange(rec)}
                        </td>
                        <td className="prod-history__td">
                          {rec.change_date ? new Date(rec.change_date).toLocaleString() : ""}
                        </td>
                        <td className="prod-history__td">
                          <div className="prod-history__user">
                            <div className="prod-history__user-name">{rec.user_name}</div>
                            <div className="prod-history__user-email">{rec.user_email}</div>
                          </div>
                        </td>
                        <td className="prod-history__td prod-history__td--actions">
                          <button 
                            type="button" 
                            className="prod-history__action-btn"
                            onClick={() => onDeleteOne(rec.id)}
                            title="Delete record"
                          >
                            <svg className="prod-history__action-icon" viewBox="0 0 24 24" width="16" height="16">
                              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="prod-history__pagination">
                <div className="prod-history__pagination-info">
                  Showing {Math.min((page - 1) * limit + 1, filtered.length)} to {Math.min(page * limit, filtered.length)} of {filtered.length} records
                </div>
                <div className="prod-history__pagination-controls">
                  <button 
                    type="button" 
                    className="prod-history__pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <div className="prod-history__pagination-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`prod-history__pagination-number ${page === pageNum ? 'prod-history__pagination-number--active' : ''}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    type="button" 
                    className="prod-history__pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
                <div className="prod-history__page-size">
                  <span className="prod-history__page-size-label">Show:</span>
                  <select 
                    className="prod-history__page-size-select"
                    value={limit} 
                    onChange={(e) => { 
                      setLimit(Number(e.target.value)); 
                      setPage(1); 
                    }}
                  >
                    {[5, 10, 25, 50].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
