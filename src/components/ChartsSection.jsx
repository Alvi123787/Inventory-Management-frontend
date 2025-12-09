// src/components/ChartsSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import OrderService from "../services/orderService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const normalizeStatus = (raw) => {
  const s = String(raw || "").trim();
  const key = s.toLowerCase();
  if (key === "dispatch") return "Dispatch";
  if (key === "delivered") return "Delivered";
  if (key === "in transit" || key === "in-transit") return "In Transit";
  if (key === "out for delivery" || key === "out-for-delivery") return "Out for Delivery";
  if (key === "cancel" || key === "cancelled") return "Cancelled";
  if (key === "returned" || key === "return") return "Returned";
  return s || "Unknown";
};

const COLORS = [
  "#2E86C1", "#1ABC9C", "#E74C3C", "#27AE60", "#E67E22",
  "#5DADE2", "#5499C7", "#F7DC6F", "#76D7C4", "#F1948A",
  "#BB8FCE", "#F8C471", "#7DCEA0", "#85929E", "#566573",
];

function ChartsSection({ stats, statusCounts }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await OrderService.getAllOrders();
        if (mounted) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("ChartsSection: failed to fetch orders", e);
        if (mounted) setError("Failed to load chart data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchOrders();
    // Subscribe to SSE for real-time updates
    const es = new EventSource(`https://inventory-backend-black.vercel.app/events`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "orders.changed") {
          fetchOrders();
        }
      } catch {}
    };
    return () => { mounted = false; es.close(); };
  }, []);

  const computeStatusCounts = (list) => {
    const counts = {};
    for (const o of list) {
      const st = normalizeStatus(o.status);
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  };

  const computeSummaryFromOrders = (list) => {
    const counts = computeStatusCounts(list);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value);
  };

  const computePieFromOrders = (list) => {
    const counts = computeStatusCounts(list);
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value: Number(value || 0),
        percent: total > 0 ? ((Number(value || 0) / total) * 100).toFixed(1) : "0.0",
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const computeSummaryFromProps = (s) => {
    if (!s) return [];
    return [
      { name: "Total Dispatch", value: Number(s.totalDispatch || 0) },
      { name: "Delivered", value: Number(s.delivered || 0) },
      { name: "Return Confirm", value: Number(s.returnConfirm || 0) },
      { name: "Payment Received", value: Number(s.paymentReceived || 0) },
      { name: "Return Received", value: Number(s.returnReceived || 0) },
    ];
  };

  const computePieFromProps = (sc) => {
    const entries = Object.entries(sc || {});
    const total = entries.reduce((sum, [, v]) => sum + Number(v || 0), 0);
    return entries
      .map(([name, v]) => ({
        name,
        value: Number(v || 0),
        percent: total > 0 ? ((Number(v || 0) / total) * 100).toFixed(1) : "0.0",
      }))
      .filter(d => d.value > 0);
  };

  const { summaryData, pieData } = useMemo(() => {
    if (orders && orders.length > 0) {
      return {
        summaryData: computeSummaryFromOrders(orders),
        pieData: computePieFromOrders(orders),
      };
    }
    return {
      summaryData: computeSummaryFromProps(stats),
      pieData: computePieFromProps(statusCounts),
    };
  }, [orders, stats, statusCounts]);

  const hasBarData = summaryData.some(d => Number(d.value || 0) > 0);
  const hasPieData = pieData.length > 0;

  return (
    <div className="charts-section row">
      {loading && (
        <div className="col-lg-12">
          <div className="loading-state">Loading chart data…</div>
        </div>
      )}
      {!loading && error && (
        <div className="col-lg-12">
          <div className="no-data">{error}</div>
        </div>
      )}
      {!loading && !error && !hasBarData && !hasPieData && (
        <div className="col-lg-12">
          <div className="no-data">No order data available</div>
        </div>
      )}

      {!loading && !error && hasBarData && (
        <div className="col-lg-12">
          <div className="chart-card p-4">
            <h2 className="text-xl font-semibold text-center mb-4">Order Status Summary</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={summaryData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} height={100} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#2E86C1" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && !error && hasPieData && (
        <div className="col-lg-12">
          <div className="chart-card p-4">
            <h2 className="text-xl font-semibold text-center mb-4">Order Percentage</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  labelLine={false}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${percent}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChartsSection;
