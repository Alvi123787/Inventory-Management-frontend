// ProductHistory.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import "./ProductHistory.css";
import { useNavigate } from "react-router-dom";

export default function ProductHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  // Fetch product history
  const fetchHistory = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit
      };
      
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("api/product-history", { params });

      if (response.data.success) {
        setHistory(response.data.data || []);
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.totalPages);
          setTotal(response.data.pagination.total);
        }
      } else {
        setError(response.data.message || "Failed to fetch product history");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch product history");
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1, searchQuery);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistory(1, searchQuery);
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchHistory(currentPage - 1, searchQuery);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchHistory(currentPage + 1, searchQuery);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get action badge color
  const getActionBadgeClass = (action) => {
    switch (action) {
      case "CREATE":
        return "badge-create";
      case "UPDATE":
        return "badge-update";
      case "DELETE":
        return "badge-delete";
      case "STOCK_ADJUSTMENT":
        return "badge-stock";
      default:
        return "badge-default";
    }
  };

  // Truncate long values
  const truncateValue = (value, maxLength = 100) => {
    if (!value) return "-";
    const str = String(value);
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  return (
    <div className="product-history-container">
      <div className="history-header">
        <div className="header-content">
          <h1>Product History & Audit Log</h1>
          <p className="subtitle">Complete track of all product changes, edits, and stock movements</p>
        </div>
        <button 
          className="btn-back"
          onClick={() => navigate('/products')}
        >
          ← Back to Products
        </button>
      </div>

      {/* Search Bar */}
      <div className="history-search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by product name, user name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search">
              🔍 Search
            </button>
          </div>
        </form>
        <div className="results-info">
          <span>Total Records: <strong>{total}</strong></span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      )}

      {/* History Table */}
      {!loading && history.length > 0 && (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Action</th>
                <th>Field Changed</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>User</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.history_id} className="history-row">
                  <td className="col-id">{record.history_id}</td>
                  <td className="col-product">
                    <span className="product-name">{record.product_name || `ID: ${record.product_id}`}</span>
                  </td>
                  <td className="col-action">
                    <span className={`action-badge ${getActionBadgeClass(record.action_type)}`}>
                      {record.action_type}
                    </span>
                  </td>
                  <td className="col-field">
                    <code>{record.field_changed || "-"}</code>
                  </td>
                  <td className="col-old-value">
                    <span className="value-old" title={record.old_value}>
                      {truncateValue(record.old_value)}
                    </span>
                  </td>
                  <td className="col-new-value">
                    <span className="value-new" title={record.new_value}>
                      {truncateValue(record.new_value)}
                    </span>
                  </td>
                  <td className="col-user">
                    <div className="user-info">
                      <div className="user-name">{record.user_name}</div>
                      <div className="user-email">{record.user_email}</div>
                    </div>
                  </td>
                  <td className="col-timestamp">
                    <span className="timestamp">
                      {formatTimestamp(record.timestamp)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && history.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No product history records found</p>
          {searchQuery && (
            <p className="empty-subtitle">Try adjusting your search criteria</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="pagination-section">
          <button
            className="btn-pagination btn-prev"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <div className="pagination-info">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
          <button
            className="btn-pagination btn-next"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
