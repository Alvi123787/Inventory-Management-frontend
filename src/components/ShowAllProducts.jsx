import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "./ShowAllProducts.css"; // external scoped CSS
import { formatCurrency, getCurrencyCode } from "../utils/currency";
import { 
  Calendar, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Filter,
  X
} from "lucide-react";

function ShowAllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

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
    const es = new EventSource(`https://inventory-backend-black.vercel.app/events`);
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

  // Calculate profit margin
  const calculateProfitMargin = (cost, price) => {
    if (!cost || cost === 0) return 0;
    return ((price - cost) / cost * 100).toFixed(1);
  };

  // Get stock status class
  const getStockStatus = (stock) => {
    if (stock <= 0) return "out-of-stock";
    if (stock <= 5) return "low-stock";
    return "in-stock";
  };

  return (
    <div className="inventory-products-container">
      <div className="inventory-products-header">
        <h3 className="inventory-products-title">
          <Package size={24} className="inventory-products-title-icon" />
          Product Inventory
          <span className="inventory-products-count">
            ({filteredProducts.length} products)
          </span>
        </h3>
        
        <div className="inventory-products-view-controls">
          <button 
            className={`inventory-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <div className="inventory-grid-icon"></div>
          </button>
          <button 
            className={`inventory-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <div className="inventory-list-icon"></div>
          </button>
        </div>
      </div>

      {error && (
        <div className="inventory-products-alert inventory-alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            type="button"
            className="inventory-alert-close"
            onClick={() => setError("")}
            aria-label="Close error message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="inventory-products-filters">
        <div className="inventory-filters-header">
          <Filter size={18} />
          <span>Filter by Date</span>
        </div>
        <div className="inventory-date-filters">
          <div className="inventory-date-input-group">
            <label className="inventory-date-label">From</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="inventory-date-input"
            />
          </div>
          <div className="inventory-date-input-group">
            <label className="inventory-date-label">To</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="inventory-date-input"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              type="button" 
              className="inventory-btn-clear"
              onClick={() => { setStartDate(""); setEndDate(""); }}
            >
              Clear Filters
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="inventory-products-loading">
          <div className="inventory-spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="inventory-products-empty">
          <Package size={64} className="inventory-empty-icon" />
          <h4>No products found</h4>
          <p>Try adjusting your filters or add new products</p>
        </div>
      ) : (
        <div className={`inventory-products-display inventory-${viewMode}-view`}>
          {filteredProducts.map((product, index) => (
            <div className="inventory-product-card" key={product.id}>
              <div className="inventory-product-card-header">
                <div className="inventory-product-badge">#{index + 1}</div>
                <div className={`inventory-stock-badge inventory-stock-${getStockStatus(product.stock)}`}>
                  {product.stock <= 0 ? 'Out of Stock' : product.stock <= 5 ? 'Low Stock' : 'In Stock'}
                </div>
              </div>
              
              <div className="inventory-product-image-container">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="inventory-product-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f1f5f9'/%3E%3Cpath d='M50,50 L150,50 L150,100 L50,100 Z' fill='%23cbd5e1'/%3E%3Ccircle cx='100' cy='75' r='20' fill='%2394a3b8'/%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="inventory-product-image-placeholder">
                    <Package size={48} className="inventory-placeholder-icon" />
                  </div>
                )}
              </div>
              
              <div className="inventory-product-details">
                <h4 className="inventory-product-name" title={product.name}>
                  {product.name}
                </h4>
                
                <div className="inventory-product-meta">
                  <div className="inventory-meta-item">
                    <Calendar size={14} />
                    <span>
                      {(() => { 
                        const d = product.product_date || product.created_at; 
                        return d ? new Date(d).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : "-"; 
                      })()}
                    </span>
                  </div>
                  <div className="inventory-meta-item">
                    <Package size={14} />
                    <span>Stock: {product.stock}</span>
                  </div>
                </div>
                
                <div className="inventory-product-pricing">
                  <div className="inventory-price-row">
                    <div className="inventory-price-label">
                      <DollarSign size={14} />
                      <span>Cost</span>
                    </div>
                    <div className="inventory-price-value inventory-cost">
                      {formatCurrency(parseFloat(product.cost))}
                    </div>
                  </div>
                  
                  <div className="inventory-price-row">
                    <div className="inventory-price-label">
                      <TrendingUp size={14} />
                      <span>Price</span>
                    </div>
                    <div className="inventory-price-value inventory-sale-price">
                      {formatCurrency(parseFloat(product.price))}
                    </div>
                  </div>
                  
                  <div className="inventory-price-row">
                    <div className="inventory-price-label">
                      <span>Margin</span>
                    </div>
                    <div className={`inventory-margin-value ${
                      calculateProfitMargin(product.cost, product.price) > 30 ? 'high-margin' : 
                      calculateProfitMargin(product.cost, product.price) > 10 ? 'medium-margin' : 'low-margin'
                    }`}>
                      {calculateProfitMargin(product.cost, product.price)}%
                    </div>
                  </div>
                </div>
                
                <div className="inventory-product-currency">
                  <small>All prices in {getCurrencyCode()}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShowAllProducts;