import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ShowAllProducts.css"; // external scoped CSS
import { formatCurrency, getCurrencyCode } from "../utils/currency";

function ShowAllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "http://localhost:3001/api";

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
      const response = await axios.get(`${API_BASE}/products`, {
        headers: getAuthHeaders(),
      });

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
    const base = API_BASE.replace("/api", "");
    const es = new EventSource(`${base}/events`);
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

      {loading ? (
        <div className="products-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => (
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
