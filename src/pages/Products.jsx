// Products.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "./Products.css";
import { formatCurrency } from "../utils/currency";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    cost: "",
    price: "",
    discount_rate: "",
    stock: "",
    image_url: "",
    product_date: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  useEffect(() => {
    fetchProducts();
  }, []);

  // Subscribe to SSE for real-time refresh
  useEffect(() => {
    const es = new EventSource(`https://inventory-backend-black.vercel.app/events`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "products.changed" || msg?.type === "orders.changed") {
          fetchProducts();
        }
      } catch {}
    };
    // Suppress noisy aborted errors (connection closes on reload/unmount; EventSource auto-reconnects)
    es.onerror = (err) => {
      console.debug("SSE connection error (ignored in dev):", err);
    };
    return () => es.close();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("api/products");
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      setError("Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`api/products/${editingId}`, formData);
      } else {
        await api.post("api/products", formData);
      }

      await fetchProducts();
      setFormData({ name: "", cost: "", price: "", discount_rate: "", stock: "", image_url: "", product_date: "" });
      setEditingId(null);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 413) {
        setError("Image is too large. Please upload an image under 5MB.");
      } else if (status === 400 && err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to save product");
      }
      console.error("Error saving product:", err);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      cost: product.cost,
      price: product.price,
      discount_rate: product.discount_rate ?? 0,
      stock: product.stock,
      image_url: product.image_url || "",
      product_date: product.product_date || "",
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`api/products/${id}`);
        await fetchProducts();
      } catch (err) {
        setError("Failed to delete product");
        console.error("Error deleting product:", err);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", cost: "", price: "", discount_rate: "", stock: "", image_url: "", product_date: "" });
  };

  const toDateOnly = (d) => {
    const dt = d ? new Date(d) : null;
    if (!dt || isNaN(dt)) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const filteredProductsByDate = useMemo(() => {
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
    <div className="inventory-products">
      <div className="inventory-products__header">
        <h2 className="inventory-products__title">Product Management</h2>
        <p className="inventory-products__subtitle">Manage your product inventory and pricing</p>
        <div style={{ marginTop: '8px' }}>
          <button type="button" className="inventory-products-btn" onClick={() => navigate('/products/history')}>View Product History</button>
        </div>
      </div>

      {error && (
        <div className="inventory-products-alert inventory-products-alert--error">
          {error}
          <button
            type="button"
            className="inventory-products-alert__close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* Product Form */}
      <div className="inventory-products-form-card">
        <h3 className="inventory-products-form-card__title">{editingId ? "Edit Product" : "Add New Product"}</h3>
        <form onSubmit={handleSubmit} className="inventory-products-form">
          <div className="inventory-products-form__grid">
            <div className="inventory-products-form__group">
              <label className="inventory-products-form__label">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
                className="inventory-products-form__input"
              />
            </div>

            <div className="inventory-products-form__group">
              <label className="inventory-products-form__label">Cost Price</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="inventory-products-form__input"
              />
            </div>

            <div className="inventory-products-form__group">
              <label className="inventory-products-form__label">Sale Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="inventory-products-form__input"
              />
            </div>

            <div className="inventory-products-form__group">
              <label className="inventory-products-form__label">Discount Rate (%)</label>
              <input
                type="number"
                name="discount_rate"
                value={formData.discount_rate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                className="inventory-products-form__input"
              />
            </div>

            <div className="inventory-products-form__group">
              <label className="inventory-products-form__label">Stock Quantity</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                placeholder="0"
                className="inventory-products-form__input"
              />
            </div>

            <div className="inventory-products-form__group">
              <label className="inventory-products-form__label">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="inventory-products-form__input"
              />
              {formData.image_url && (
                <div className="inventory-products-image-preview">
                  <img src={formData.image_url} alt="Preview" className="inventory-products-image-thumb" />
                </div>
              )}
            </div>

            <div className="inventory-products-form__group">
              <label className="inventory-products-form__label">Product Date</label>
              <input
                type="date"
                name="product_date"
                value={formData.product_date}
                onChange={handleChange}
                className="inventory-products-form__input"
              />
            </div>
          </div>

          <div className="inventory-products-form__actions">
            <button
              type="submit"
              className="inventory-products-btn inventory-products-btn--primary"
              disabled={loading}
            >
              {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="inventory-products-btn inventory-products-btn--secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="inventory-products-table-card">
        <div className="inventory-products-table-header">
          <div className="inventory-products-table-header__left">
            <h3 className="inventory-products-table-header__title">Product List</h3>
            <span className="inventory-products-table-header__count">{filteredProductsByDate.length} products</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button type="button" className="inventory-products-btn" onClick={() => navigate('/products/history')}>Audit Log</button>
          </div>
          <div className="inventory-products-table-header__center" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            {(startDate || endDate) && (
              <button type="button" className="inventory-products-btn" onClick={() => { setStartDate(""); setEndDate(""); }}>
                Clear
              </button>
            )}
          </div>
          <div className="inventory-products-search">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              className="inventory-products-search__input"
            />
          </div>
        </div>

        {loading ? (
          <div className="inventory-products-loading">
            <div className="inventory-products-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : filteredProductsByDate.length === 0 ? (
          <div className="inventory-products-empty">
            <p className="inventory-products-empty__message">No products available</p>
            <p className="inventory-products-empty__subtitle">Add your first product to get started</p>
          </div>
        ) : (
          <div className="inventory-products-table-container">
            <table className="inventory-products-table">
              <thead className="inventory-products-table__head">
                <tr>
                  <th className="inventory-products-table__header">Image</th>
                  <th className="inventory-products-table__header">Name</th>
                  <th className="inventory-products-table__header">Cost Price</th>
                  <th className="inventory-products-table__header">Sale Price</th>
                  <th className="inventory-products-table__header">Discount (%)</th>
                  <th className="inventory-products-table__header">Stock</th>
                  <th className="inventory-products-table__header">Product Date</th>
                  <th className="inventory-products-table__header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredProductsByDate || []).filter(p => String(p.name || '').toLowerCase().includes(query.trim().toLowerCase())).map((product) => (
                  <tr key={product.id} className="inventory-products-table__row">
                    <td className="inventory-products-table__cell inventory-products-table__image">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="inventory-products-image-thumb" />
                      ) : (
                        <div className="inventory-products-image-placeholder">No Image</div>
                      )}
                    </td>
                    <td className="inventory-products-table__cell inventory-products-table__product-name">{product.name}</td>
                    <td className="inventory-products-table__cell">{formatCurrency(parseFloat(product.cost).toFixed(2))}</td>
                    <td className="inventory-products-table__cell">{formatCurrency(parseFloat(product.price).toFixed(2))}</td>
                    <td className="inventory-products-table__cell">{Number(product.discount_rate || 0).toFixed(2)}%</td>
                    <td className="inventory-products-table__cell">
                      <span className={`inventory-products-stock-badge ${product.stock <= 5 ? 'inventory-products-stock-badge--low' : ''}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="inventory-products-table__cell">
                      {product.product_date ? new Date(product.product_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="inventory-products-table__cell">
                      <div className="inventory-products-actions">
                        <button
                          className="inventory-products-btn inventory-products-btn--warning"
                          onClick={() => handleEdit(product)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          className="inventory-products-btn inventory-products-btn--danger"
                          onClick={() => handleDelete(product.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
