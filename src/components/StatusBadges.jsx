import React, { useEffect, useState } from "react";
import OrderService from "../services/orderService";
import "./StatusBadges.css";

const COLOR_PALETTE = [
  "#38BDF8", "#22C55E", "#FACC15", "#F87171", "#A78BFA",
  "#10B981", "#FB7185", "#F97316", "#60A5FA", "#9CA3AF"
];
const colorForIndex = (i) => COLOR_PALETTE[i % COLOR_PALETTE.length];

export default function StatusBadges() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    delivered: 0,
    dispatch: 0,
    paymentReceived: 0,
    returnReceived: 0,
    inTransit: 0,
    arrivalAtDC: 0,
    outForDelivery: 0,
    selfCollection: 0,
    failedDelivery: 0,
    reAttempt: 0,
    addressIncorrect: 0,
    nonServiceArea: 0,
    cancelled: 0,
    totalInProcess: 0,
  });
  const [statusCounts, setStatusCounts] = useState({});
  const [paymentCounts, setPaymentCounts] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const es = new EventSource(`https://inventory-backend-black.vercel.app/events`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "orders.changed") fetchStats();
      } catch {}
    };
    return () => es.close();
  }, []);

  const fetchStats = async () => {
    try {
      const orders = await OrderService.getAllOrders();

      if (!orders || !orders.length) {
        setLoading(false);
        return;
      }

      // Normalize data (handles snake_case and camelCase)
      const normalized = orders.map((o) => ({
        status: o.status || o.Status || "",
        paymentStatus: o.paymentStatus || o.payment_status || "",
      }));

      const lower = (val) => val?.toLowerCase?.() || "";

      const calc = {
        totalOrders: normalized.length,
        delivered: normalized.filter((o) => lower(o.status) === "delivered").length,
        dispatch: normalized.filter((o) => lower(o.status) === "dispatch").length,
        paymentReceived: normalized.filter((o) => lower(o.paymentStatus) === "paid").length,
        paymentUnpaid: normalized.filter((o) => lower(o.paymentStatus) === "unpaid").length,
        returnReceived: normalized.filter((o) => lower(o.status).includes("return")).length,
        inTransit: normalized.filter((o) => lower(o.status) === "in transit").length,
        arrivalAtDC: normalized.filter((o) => lower(o.status) === "arrival at dc").length,
        outForDelivery: normalized.filter((o) => lower(o.status) === "out for delivery").length,
        selfCollection: normalized.filter((o) => lower(o.status) === "self collection").length,
        failedDelivery: normalized.filter((o) => lower(o.status) === "failed delivery").length,
        reAttempt: normalized.filter((o) => lower(o.status) === "re attempt").length,
        addressIncorrect: normalized.filter((o) => lower(o.status) === "address incorrect").length,
        nonServiceArea: normalized.filter((o) => lower(o.status) === "no service area").length,
        cancelled: normalized.filter((o) => lower(o.status) === "cancelled").length,
      };

      calc.totalInProcess =
        calc.inTransit + calc.arrivalAtDC + calc.outForDelivery + calc.selfCollection;

      // Build dynamic counts map per unique status
      const sc = {};
      const pc = {};
      for (const o of normalized) {
        const sKey = String(o.status || "").trim() || "Unknown";
        sc[sKey] = (sc[sKey] || 0) + 1;
        const pKey = String(o.paymentStatus || "").trim() || "Unknown";
        pc[pKey] = (pc[pKey] || 0) + 1;
      }
      setStats(calc);
      setStatusCounts(sc);
      setPaymentCounts(pc);
    } catch (err) {
      console.error("Error fetching order stats:", err);
    } finally {
      setLoading(false);
    }
  };



  if (loading)
    return (
      <div className="text-center py-3 text-muted">
        <div className="spinner-border text-primary me-2" role="status" />
        Loading dashboard summary...
      </div>
    );

  const statusEntries = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const paymentEntries = Object.entries(paymentCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section className="status-badges card shadow-sm p-4 mb-4">
      <h5 className="fw-bold text-primary mb-4">Order Dashboard Summary</h5>

      {/* ==== ORDER OVERVIEW ==== */}
      <h6 className="fw-bold text-secondary mb-2">Order Overview</h6>
      <div className="row mb-4">
        {[ 
          { label: "Total Orders", value: stats.totalOrders, color: "text-primary" },
          { label: "Delivered", value: stats.delivered, color: "text-success" },
          { label: "Dispatch", value: stats.dispatch, color: "text-warning" },
          { label: "In Process", value: stats.totalInProcess, color: "text-info" },
        ].map((item, idx) => (
          <div className="col-md-3 col-6 mb-3" key={idx}>
            <div className="card text-center shadow-sm border-0">
              <div className="card-body py-3">
                <h6 className="card-title fw-semibold text-secondary">
                  {item.label}
                </h6>
                <h5 className={`fw-bold ${item.color}`}>{item.value}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==== PAYMENT SUMMARY ==== */}
      <h6 className="fw-bold text-secondary mb-2">Payment Summary</h6>
      <div className="row mb-4">
        {[
          { label: "Payment Received", value: stats.paymentReceived, color: "text-success" },
          { label: "Unpaid Orders", value: stats.paymentUnpaid, color: "text-danger" },
          { label: "Return Received", value: stats.returnReceived, color: "text-warning" },
        ].map((item, index) => (
          <div className="col-md-3" key={index}>
            <div className="card text-center shadow-sm border-0">
              <div className="card-body py-3">
                <h6 className="card-title">{item.label}</h6>
                <h5 className={item.color}>{item.value}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==== PAYMENT STATUS BREAKDOWN ==== */}
      <div className="badges-grid mb-4">
        {paymentEntries.map(([label, count], idx) => (
          <div
            key={label}
            className="badge-item d-flex justify-content-between align-items-center shadow-sm px-3 py-2 mb-2 rounded"
            style={{
              borderLeft: `6px solid ${colorForIndex(idx)}`,
              background: "#f9fafb",
            }}
          >
            <span className="fw-semibold text-secondary">{label}</span>
            <span className="fw-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* ==== DELIVERY STATUS ==== */}
      <h6 className="fw-bold text-secondary mb-3">Delivery Status Summary</h6>
      <div className="badges-grid">
        {statusEntries.map(([label, count], idx) => (
          <div
            key={label}
            className="badge-item d-flex justify-content-between align-items-center shadow-sm px-3 py-2 mb-2 rounded"
            style={{
              borderLeft: `6px solid ${colorForIndex(idx)}`,
              background: "#f9fafb",
            }}
          >
            <span className="fw-semibold text-secondary">{label}</span>
            <span className="fw-bold">{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
