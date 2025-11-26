import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import ProductService from "../services/productService";
import OrderService from "../services/orderService";
import StatusBadges from "../components/StatusBadges";
import ChartsSection from "../components/ChartsSection";
import "./Dashboard.css"

 function Dashboard() {
  const [alertsCount, setAlertsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [unpaidOldCount, setUnpaidOldCount] = useState(0);
  const [showAlertsIndicator, setShowAlertsIndicator] = useState(true);
  const LOW_STOCK_THRESHOLD = 5;
  const UNPAID_DAYS_THRESHOLD = 7;

  // Dynamic statuses for cards
  const [dashOrders, setDashOrders] = useState([]);
  const [showAllStatuses, setShowAllStatuses] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      try {
        const data = await OrderService.getAllOrders();
        if (mounted) setDashOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Dashboard: failed to fetch orders", e);
      }
    };
    fetchOrders();
    const base = import.meta.env.VITE_API_BASE || "http://localhost:3001";
    const es = new EventSource(`${base}/events`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "orders.changed") fetchOrders();
      } catch {}
    };
    return () => { mounted = false; es.close(); };
  }, []);

  const normalizeStatus = (raw) => String(raw || "").trim() || "Unknown";
  const getStatusCounts = (list) => {
    const counts = {};
    for (const o of list) {
      const st = normalizeStatus(o.status || o.Status);
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  };
  const statusCountsDynamic = getStatusCounts(dashOrders);
  const statusesArray = Object.keys(statusCountsDynamic).sort((a, b) => statusCountsDynamic[b] - statusCountsDynamic[a]);
  const COLOR_CLASSES = ["primary","success","warning","accent","secondary","danger"];
  const colorForIndex = (idx) => COLOR_CLASSES[idx % COLOR_CLASSES.length];

  useEffect(() => {
    let mounted = true;
    async function loadAlerts() {
      try {
        const prodResp = await ProductService.getAll();
        const prodList = prodResp?.data?.data || [];
        const ordList = await OrderService.getAllOrders();
        const low = Array.isArray(prodList)
          ? prodList.filter(p => Number(p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length
          : 0;
        const now = Date.now();
        const ms = UNPAID_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
        const unpaidOld = Array.isArray(ordList)
          ? ordList.filter(o => {
              const payment = o.payment_status || o.paymentStatus;
              if (String(payment).toLowerCase() !== "unpaid") return false;
              const d = o.date ? new Date(o.date) : null;
              if (!d || isNaN(d.getTime())) return false;
              return now - d.getTime() > ms;
            }).length
          : 0;
        if (!mounted) return;
        setLowStockCount(low);
        setUnpaidOldCount(unpaidOld);
        const total = low + unpaidOld;
        setAlertsCount(total);
        // Compare with acknowledged counts stored when visiting /alerts
        try {
          const ackRaw = localStorage.getItem("alertsAck");
          const ackTotal = ackRaw ? (JSON.parse(ackRaw)?.total || 0) : 0;
          setShowAlertsIndicator(total > ackTotal);
        } catch {
          setShowAlertsIndicator(total > 0);
        }
      } catch (e) {
        if (!mounted) return;
        setAlertsCount(0);
        setLowStockCount(0);
        setUnpaidOldCount(0);
      }
    }
    loadAlerts();
    return () => { mounted = false; };
  }, []);
  // Hardcoded sample data (matching your Excel-like sheet)
  const stats = {
    totalDispatch: 21,
    delivered: 16,
    returnConfirm: 1,
    paymentReceived: 18,
    returnReceived: 1,
  };

  const statusCounts = {
    "In Transit": 2,
    "Arrival at DC": 1,
    "Out for Delivery": 3,
    "Self Collection": 1,
    "Failed Delivery": 0,
    "Return": 2,
    "Cancelled": 1,
    "No Service Area": 0,
    "Address Incorrect": 0,
    "Re Attempt": 1,
  };

  const financials = {
    totalSales: 40338.0,
    totalAdSpends: 7500.0,
    totalDeliveryCharges: 4410.0,
  };

  const fixedCosts = [
    { name: "Rent", amount: 0 },
    { name: "Salaries", amount: 0 },
    { name: "Marketing Fees", amount: 0 },
    { name: "Other Expenses", amount: 0 },
    { name: "Delivery Charges", amount: 221 },
    { name: "Ad Cost", amount: 300 },
  ];

  return (
    <div className="app">
      <header className="header">
        <h1>Inventory / Orders Dashboard</h1>
        <Link to="/alerts" title="View alerts" className="alert-link">
          <FontAwesomeIcon icon={faBell} />
          <span style={{ marginLeft: 8 }}>Alerts</span>
          {showAlertsIndicator && alertsCount > 0 && (
            <span className="alert-count-badge" aria-label="alert count">{alertsCount}</span>
          )}
          {showAlertsIndicator && alertsCount > 0 && (
            <div className="alert-popover">
              <strong style={{ display: "block", marginBottom: 4 }}>{alertsCount} alerts</strong>
              <div>Low Stock: {lowStockCount}</div>
              <div>Unpaid &gt; {UNPAID_DAYS_THRESHOLD}d: {unpaidOldCount}</div>
            </div>
          )}
        </Link>
      </header>

      <main className="container">
        <StatusBadges />
        <ChartsSection stats={stats} statusCounts={statusCountsDynamic} />
        <div className="bottom-row">
          {/* <FinancialSummary financials={financials} /> */}
          {/* <FixedCostTable items={fixedCosts} /> */}
        </div>
      </main>

      <footer className="footer">
        <small>Static demo dashboard — React + Recharts</small>
      </footer>
    </div>
  );
}

export default Dashboard;