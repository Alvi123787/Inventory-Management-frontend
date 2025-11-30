import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderService from "../services/orderService";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ShowAllOrders.css";
import { formatCurrency } from "../utils/currency";

function ShowAllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await OrderService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toDateOnly = (d) => {
    const dt = d ? new Date(d) : null;
    if (!dt || isNaN(dt)) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const filteredOrders = useMemo(() => {
    const s = startDate ? toDateOnly(startDate) : null;
    const e = endDate ? toDateOnly(endDate) : null;
    const term = query.trim().toLowerCase();
    return (orders || []).filter((o) => {
      const d = toDateOnly(o.date || o.created_at);
      if (s && (!d || d < s)) return false;
      if (e && (!d || d > e)) return false;
      if (!term) return true;
      const byCustomer = String(o.customer_name || "").toLowerCase().includes(term);
      const byTracking = String(o.tracking_id || "").toLowerCase().includes(term);
      return byCustomer || byTracking;
    });
  }, [orders, startDate, endDate, query]);

  return (
    <div className="all-orders-container container my-4">
      <h2 className="all-orders-title mb-4 text-center">All Orders</h2>

      {/* Error Message */}
      {error && (
        <div className="all-orders-error alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="all-orders-loading text-center p-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Loading orders...</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by customer or tracking ID" />
            {(startDate || endDate) && (
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setStartDate(""); setEndDate(""); }}>
                Clear
              </button>
            )}
          </div>
          <div className="all-orders-grid row g-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div className="col-md-4 col-lg-3" key={order.id}>
                <div className="all-orders-card card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h5 className="all-orders-customer mb-2">{order.customer_name}</h5>
                    <p className="all-orders-product text-muted small mb-1">
                      <strong>Product:</strong> {order.product_title}
                    </p>
                    <p className="all-orders-price mb-1">
                      <strong>Total:</strong> {formatCurrency(order.total_price ?? order.price)}
                    </p>

                    <div className="all-orders-status d-flex justify-content-between align-items-center mb-2">
                      <span
                        className={`all-orders-badge-status badge ${
                          order.status === "Delivered"
                            ? "bg-success"
                            : order.status === "Dispatch"
                            ? "bg-warning"
                            : order.status === "Cancelled"
                            ? "bg-danger"
                            : "bg-info"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`all-orders-badge-payment badge ${
                          order.payment_status === "Paid" ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </div>

                    <p className="all-orders-date small text-muted mb-2">
                      <strong>Date:</strong>{" "}
                      {order.date ? new Date(order.date).toLocaleDateString() : "-"}
                    </p>

                    <p className="all-orders-tracking small text-muted mb-2">
                      <strong>Tracking ID:</strong>{" "}
                      {order.tracking_id || "-"}
                    </p>

                    <div className="d-grid gap-2">
                      <button
                        className="all-orders-btn btn btn-outline-primary btn-sm w-100"
                        onClick={() => setSelectedOrder(order)}
                        data-bs-toggle="modal"
                        data-bs-target="#allOrdersDetailsModal"
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-outline-warning btn-sm w-100"
                        onClick={() => navigate('/orders', { state: { editOrder: order } })}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="all-orders-empty text-center text-muted mt-5">
              <i className="fas fa-inbox fa-3x mb-3"></i>
              <p>No orders found</p>
              <button className="btn btn-primary btn-sm" onClick={fetchOrders}>
                Refresh
              </button>
            </div>
          )}
        </div>
        </>
      )}

      {/* Modal */}
      <div
        className="modal fade"
        id="allOrdersDetailsModal"
        tabIndex="-1"
        aria-labelledby="allOrdersDetailsModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content all-orders-modal">
            <div className="modal-header">
              <h5 className="modal-title" id="allOrdersDetailsModalLabel">
                Order Details
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            {selectedOrder ? (
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Product:</strong> {selectedOrder.product_title}</p>
                    <p><strong>Total:</strong> {formatCurrency(selectedOrder.total_price ?? selectedOrder.price)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                    <p><strong>Payment:</strong> {selectedOrder.payment_status}</p>
                    <p><strong>Payment Method:</strong> {selectedOrder.payment_method || '-'}</p>
                    <p><strong>Date:</strong> {selectedOrder.date}</p>
                    <p><strong>Courier:</strong> {selectedOrder.courier || "-"}</p>
                    <p><strong>Tracking ID:</strong> {selectedOrder.tracking_id || "-"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="modal-body text-center text-muted">
                <p>Loading details...</p>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowAllOrders;
