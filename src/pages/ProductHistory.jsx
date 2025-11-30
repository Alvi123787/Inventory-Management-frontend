import React, { useEffect, useMemo, useState } from "react";
import ProductHistoryService from "../services/productHistoryService";

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

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await ProductHistoryService.getAll({ q: query || undefined, sortBy, sortOrder, page, limit });
      const list = Array.isArray(resp?.data?.data) ? resp.data.data : [];
      setRecords(list);
      setTotal(Number(resp?.data?.total || list.length));
    } catch (e) {
      console.error(e);
      setError("Failed to load product history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [sortBy, sortOrder, page, limit]);

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
    { key: 'timestamp', label: 'When' },
    { key: 'product_name', label: 'Product' },
    { key: 'action_type', label: 'Action' },
    { key: 'field_changed', label: 'Field' },
    { key: 'old_value', label: 'Old Value' },
    { key: 'new_value', label: 'New Value' },
    { key: 'user_name', label: 'User' },
    { key: 'user_email', label: 'Email' },
  ];

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
                    <td className="inventory-products-table__cell">{rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '-'}</td>
                    <td className="inventory-products-table__cell">{rec.product_name || `#${rec.product_id}`}</td>
                    <td className="inventory-products-table__cell">{rec.action_type}</td>
                    <td className="inventory-products-table__cell">{rec.field_changed || '-'}</td>
                    <td className="inventory-products-table__cell">{rec.old_value ?? '-'}</td>
                    <td className="inventory-products-table__cell">{rec.new_value ?? '-'}</td>
                    <td className="inventory-products-table__cell">{rec.user_name || '-'}</td>
                    <td className="inventory-products-table__cell">{rec.user_email || '-'}</td>
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

