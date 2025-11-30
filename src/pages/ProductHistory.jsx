import React, { useEffect, useMemo, useState, useCallback } from "react";
import ProductHistoryService from "../services/productHistoryService";
import { formatCurrency } from "../utils/currency";

export default function ProductHistory() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  const onDeleteOne = async (id) => {
    try {
      if (!window.confirm('Delete this history record?')) return;
      await ProductHistoryService.deleteOne(id);
      await fetchHistory();
    } catch (e) {
      console.error(e);
      setError('Failed to delete history record');
    }
  };

  const onClearAll = async () => {
    try {
      if (!window.confirm('Delete all product history?')) return;
      await ProductHistoryService.clearAll();
      setPage(1);
      await fetchHistory();
    } catch (e) {
      console.error(e);
      setError('Failed to clear history');
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await ProductHistoryService.getAll({ q: query || undefined, sortBy, sortOrder, page, limit });
      const list = Array.isArray(resp?.data?.data) ? resp.data.data : [];
      setRecords(list);
      setTotal(Number(resp?.data?.total || list.length));
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 404) {
        setRecords([]);
        setTotal(0);
        setError("");
      } else {
        setError("Failed to load product history");
      }
    } finally {
      setLoading(false);
    }
  }, [query, sortBy, sortOrder, page, limit]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const exportCSV = async () => {
    try {
      const resp = await ProductHistoryService.exportCSV({ q: query || undefined, sortBy, sortOrder });
      const blob = resp?.data instanceof Blob ? resp.data : new Blob([resp.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_history.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("Failed to export history");
    }
  };

  const columns = [
    { key: 'image_url', label: 'Image' },
    { key: 'product_name', label: 'Name' },
    { key: 'cost', label: 'Cost Price' },
    { key: 'price', label: 'Sale Price' },
    { key: 'discount_rate', label: 'Discount (%)' },
    { key: 'stock', label: 'Stock' },
    { key: 'product_date', label: 'Product Date' },
    { key: 'action_type', label: 'Action Type' },
    { key: 'change_summary', label: 'Change Details' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'user_name', label: 'User' },
    { key: 'actions', label: 'Actions' },
  ];

  const summarizeChange = (rec) => {
    const f = String(rec.field_changed || '').trim();
    const oldVal = rec.old_value;
    const newVal = rec.new_value;
    const action = String(rec.action_type || '').toUpperCase();
    const labelMap = {
      name: 'Name',
      price: 'Sale Price',
      discount_rate: 'Discount (%)',
      cost: 'Cost Price',
      stock: 'Stock',
      product_date: 'Product Date',
      image_url: 'Image',
      product: 'Product'
    };
    const label = labelMap[f] || (f ? f : '');
    const toCurrency = (v) => formatCurrency(v);
    const toPercent = (v) => `${Number(v || 0)}%`;
    const fmt = (field, v) => {
      if (field === 'price' || field === 'cost') return toCurrency(v);
      if (field === 'discount_rate') return toPercent(v);
      if (field === 'name') return `'${String(v || '')}'`;
      if (field === 'product_date') return String(v || '-');
      return String(v ?? '-');
    };
    if (action === 'DELETE') {
      try {
        const parsed = JSON.parse(String(oldVal || '{}'));
        const nm = parsed?.name ? `'${parsed.name}'` : `#${rec.product_id}`;
        return `Product deleted (${nm})`;
      } catch {
        return 'Product deleted';
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
      return `Stock changed from ${String(oldVal ?? '-') } to ${String(newVal ?? '-')}`;
    }
    if (action === 'UPDATE') {
      return `${label} changed from ${fmt(f, oldVal)} to ${fmt(f, newVal)}`;
    }
    return `${label || 'Change'}: ${String(newVal ?? '-')}`;
  };

  const onSort = (key) => {
    if (sortBy === key) setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    else setSortBy(key);
  };

  const filtered = useMemo(() => {
    if (!query) return records;
    const ql = query.toLowerCase();
    return records.filter(r =>
      String(r.product_name || '').toLowerCase().includes(ql)
      || String(r.user_name || '').toLowerCase().includes(ql)
      || String(r.user_email || '').toLowerCase().includes(ql)
      || String(r.action_type || '').toLowerCase().includes(ql)
      || String(r.field_changed || '').toLowerCase().includes(ql)
      || String(r.old_value || '').toLowerCase().includes(ql)
      || String(r.new_value || '').toLowerCase().includes(ql)
    );
  }, [records, query]);

  return (
    <div className="inventory-products">
      <div className="inventory-products__header">
        <h2 className="inventory-products__title">Product History</h2>
        <p className="inventory-products__subtitle">Complete audit log of product changes</p>
      </div>

      {error && (
        <div className="inventory-products-alert inventory-products-alert--error">
          {error}
          <button type="button" className="inventory-products-alert__close" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="inventory-products-table-card">
        <div className="inventory-products-table-header" style={{ alignItems: 'center' }}>
          <div className="inventory-products-table-header__left">
            <h3 className="inventory-products-table-header__title">Audit Log</h3>
            <span className="inventory-products-table-header__count">{total} records</span>
          </div>
          <div className="inventory-products-table-header__center" style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by product, user, field" />
            <button type="button" className="inventory-products-btn" onClick={fetchHistory}>Search</button>
            <button type="button" className="inventory-products-btn" onClick={exportCSV}>Export CSV</button>
            <button type="button" className="inventory-products-btn" onClick={onClearAll}>Delete All</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>Rows</label>
            <select value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}>
              {[25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button type="button" className="inventory-products-btn" disabled={page<=1} onClick={()=>setPage(page-1)}>Prev</button>
            <button type="button" className="inventory-products-btn" disabled={(page*limit)>=total} onClick={()=>setPage(page+1)}>Next</button>
          </div>
        </div>

        <div className="inventory-products-table-container">
          {loading ? (
            <div className="inventory-products-loading"><div className="inventory-products-spinner"></div><p>Loading history...</p></div>
          ) : (
            <table className="inventory-products-table">
              <thead className="inventory-products-table__head">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="inventory-products-table__header" onClick={()=>onSort(col.key)} style={{ cursor: 'pointer' }}>
                      {col.label}{sortBy===col.key? (sortOrder==='ASC'?' ▲':' ▼'):''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map(rec => (
                  <tr key={rec.history_id} className="inventory-products-table__row">
                    <td className="inventory-products-table__cell" style={{ width: 56 }}>
                      {rec.image_url ? <img src={rec.image_url} alt={rec.product_name || ''} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} /> : '-'}
                    </td>
                    <td className="inventory-products-table__cell">{rec.product_name || `#${rec.product_id}`}</td>
                    <td className="inventory-products-table__cell">{formatCurrency(rec.cost)}</td>
                    <td className="inventory-products-table__cell">{formatCurrency(rec.price)}</td>
                    <td className="inventory-products-table__cell">{`${Number(rec.discount_rate || 0)}%`}</td>
                    <td className="inventory-products-table__cell">{rec.stock ?? '-'}</td>
                    <td className="inventory-products-table__cell">{rec.product_date ? new Date(rec.product_date).toLocaleDateString() : '-'}</td>
                    <td className="inventory-products-table__cell">{rec.action_type}</td>
                    <td className="inventory-products-table__cell">{summarizeChange(rec)}</td>
                    <td className="inventory-products-table__cell">{rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '-'}</td>
                    <td className="inventory-products-table__cell">{rec.user_name || '-'}</td>
                    <td className="inventory-products-table__cell">
                      <button type="button" className="inventory-products-btn" onClick={() => onDeleteOne(rec.history_id)}>Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="inventory-products-table__cell" colSpan={columns.length}>No history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
