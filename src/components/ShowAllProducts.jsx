import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "./ShowAllProducts.css"; // external scoped CSS
import { formatCurrency, getCurrencyCode } from "../utils/currency";

function ShowAllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("api/products");

      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        setError("Failed to load products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Subscribe to SSE for real-time refresh
  useEffect(() => {
    const es = new EventSource(`https://inventory-management-backend-flame.vercel.app/events`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "products.changed" || msg?.type === "orders.changed") {
          fetchProducts();
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  const toDateOnly = (d) => {
    const dt = d ? new Date(d) : null;
    if (!dt || isNaN(dt)) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const filteredProducts = useMemo(() => {
    if (!startDate && !endDate) return products;
    const s = startDate ? toDateOnly(startDate) : null;
    const e = endDate ? toDateOnly(endDate) : null;
    return (products || []).filter((p) => {
      const d = toDateOnly(p.product_date || p.created_at);
      if (!d) return false;
      const afterStart = s ? d >= s : true;
      const beforeEnd = e ? d <= e : true;
      return afterStart && beforeEnd;
    });
  }, [products, startDate, endDate]);

  return (
    <div className="products-container">
      <h3 className="products-title">All Products</h3>

      {error && (
        <div className="products-alert">
          <span>{error}</span>
          <button
            type="button"
            className="products-alert-close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="products-filters" style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        {(startDate || endDate) && (
          <button type="button" className="products-btn-clear" onClick={() => { setStartDate(""); setEndDate(""); }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="products-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <p className="products-empty">No products found.</p>
      ) : (
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Product Name</th>
                <th>{`Cost (${getCurrencyCode()})`}</th>
                <th>{`Price (${getCurrencyCode()})`}</th>
                <th>Stock</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, index) => (
                <tr key={p.id}>
                  <td>{index + 1}</td>
                  <td className="product-image-cell">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="product-thumb"
                      />
                    ) : (
                      <div className="product-image-placeholder">No Image</div>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{formatCurrency(parseFloat(p.cost))}</td>
                  <td>{formatCurrency(parseFloat(p.price))}</td>
                  <td>{p.stock}</td>
                  <td>{(() => { const d = p.product_date || p.created_at; return d ? new Date(d).toLocaleDateString() : "-"; })()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ShowAllProducts;
