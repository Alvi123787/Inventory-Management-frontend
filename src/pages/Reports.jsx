import React, { useEffect, useMemo, useState } from "react";
import OrderService from "../services/orderService";
import ProductService from "../services/productService";
import ExpenseService from "../services/expenseService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import "./Reports.css"
import { formatCurrency, getCurrencyCode } from "../utils/currency";

// Helpers to parse order items and compute metrics
const parseItems = (order) => {
  try {
    const items =
      typeof order.products === "string"
        ? JSON.parse(order.products || "[]")
        : order.products || [];
    return Array.isArray(items) ? items : [];
  } catch (e) {
    return [];
  }
};

const buildCostMap = (products) => {
  const map = {};
  (products || []).forEach((p) => {
    if (!p) return;
    const nameKey = (p.name || "").toLowerCase();
    const idKey = p.id != null ? `id:${p.id}` : null;
    const cost = Number(p.cost || 0) || 0;
    if (nameKey) map[nameKey] = cost;
    if (idKey) map[idKey] = cost;
  });
  return map;
};

const computeOrderProfit = (order, costMap, overrides) => {
  const items = parseItems(order);
  const costSum = items.reduce((sum, it) => {
    const nameKey = (it.name || it.external_name || "Item").toLowerCase();
    const idKey = it.product_id != null ? `id:${it.product_id}` : null;
    const unitCost =
      (idKey && costMap[idKey] != null ? Number(costMap[idKey]) :
        (costMap[nameKey] != null ? Number(costMap[nameKey]) : Number(it.cost || 0) || 0));
    const qty = Number(it.quantity || 1);
    return sum + unitCost * qty;
  }, 0);

  // Allow dynamic override from filters: profit = netBeforeTax - COGS
  if (overrides && typeof overrides.netBeforeTax === "number") {
    const net = Number(overrides.netBeforeTax) || 0;
    return Number((net - costSum).toFixed(2));
  }

  const total = Number(order.total_price ?? order.price ?? 0);
  const tax = Number(order.tax_amount ?? 0);

  if (!isNaN(total) && (order.total_price != null || order.tax_amount != null)) {
    return Number((total - costSum - tax).toFixed(2));
  }

  const itemProfit = items.reduce((sum, it) => {
    const nameKey = (it.name || it.external_name || "Item").toLowerCase();
    const unitCost = costMap[nameKey] ?? Number(it.cost || 0) ?? 0;
    const unitPrice = Number(it.price || 0);
    const qty = Number(it.quantity || 1);
    return sum + (unitPrice - unitCost) * qty;
  }, 0);
  return Number(itemProfit.toFixed(2));
};

const toDateOnly = (d) => {
  const dt = d ? new Date(d) : null;
  if (!dt || isNaN(dt)) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

function Reports() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [ordersData, productsResp, expensesResp] = await Promise.all([
          OrderService.getAllOrders(),
          ProductService.getAll(),
          ExpenseService.getAll(),
        ]);
        const productsData = Array.isArray(productsResp?.data?.data)
          ? productsResp.data.data
          : productsResp?.data || [];
        const expensesData = Array.isArray(expensesResp?.data?.data)
          ? expensesResp.data.data
          : Array.isArray(expensesResp?.data)
            ? expensesResp.data
            : [];
        setOrders(ordersData || []);
        setProducts(productsData || []);
        setExpenses(expensesData || []);
        setFilteredOrders(ordersData || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load reports data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Subscribe to SSE for real-time refresh
  useEffect(() => {
    const es = new EventSource(`https://inventory-management-backend-flame.vercel.app/events`);
    es.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "orders.changed" || msg?.type === "products.changed" || msg?.type === "expenses.changed") {
          // Re-run loadData to update metrics/charts
          setLoading(true);
          setError("");
          try {
            const [ordersData, productsResp, expensesResp] = await Promise.all([
              OrderService.getAllOrders(),
              ProductService.getAll(),
              ExpenseService.getAll(),
            ]);
            const productsData = Array.isArray(productsResp?.data?.data)
              ? productsResp.data.data
              : productsResp?.data || [];
            const expensesData = Array.isArray(expensesResp?.data?.data)
              ? expensesResp.data.data
              : Array.isArray(expensesResp?.data)
                ? expensesResp.data
                : [];
            setOrders(ordersData || []);
            setProducts(productsData || []);
            setExpenses(expensesData || []);
            setFilteredOrders(ordersData || []);
          } catch (e2) {
            console.error(e2);
            setError("Failed to refresh reports data.");
          } finally {
            setLoading(false);
          }
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  // Filtering
  const applyFilter = () => {
    if (!startDate && !endDate) {
      setFilteredOrders(orders);
      return;
    }
    const start = startDate ? toDateOnly(startDate) : null;
    const end = endDate ? toDateOnly(endDate) : null;
    const filtered = (orders || []).filter((o) => {
      const od = toDateOnly(o.date);
      if (!od) return false;
      const afterStart = start ? od >= start : true;
      const beforeEnd = end ? od <= end : true;
      return afterStart && beforeEnd;
    });
    setFilteredOrders(filtered);
  };

  // Auto-apply filter when dates or orders change
  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, orders]);

  // Derived data
  const costMap = useMemo(() => buildCostMap(products), [products]);

  // Expenses filtered by the selected date range
  const filteredExpensesByDate = useMemo(() => {
    const start = startDate ? toDateOnly(startDate) : null;
    const end = endDate ? toDateOnly(endDate) : null;
    return (expenses || []).filter((exp) => {
      if (!exp?.date) return true;
      const ed = toDateOnly(exp.date);
      if (!ed) return true;
      const afterStart = start ? ed >= start : true;
      const beforeEnd = end ? ed <= end : true;
      return afterStart && beforeEnd;
    });
  }, [expenses, startDate, endDate]);

  // Total expenses within the filtered range
  const totalExpenses = useMemo(() => {
    return (filteredExpensesByDate || []).reduce(
      (sum, exp) => sum + (Number(exp.amount || 0) || 0),
      0
    );
  }, [filteredExpensesByDate]);

  const contributingOrders = useMemo(() => {
    return (filteredOrders || [])
      .map((o) => {
        const status = String(o.payment_status ?? o.paymentStatus ?? '').toLowerCase();
        const total = Number(o.total_price ?? o.price ?? 0) || 0;
        const partialPaid = Number(o.partial_paid_amount ?? o.partialPaidAmount ?? 0) || 0;
        const isPaid = status === 'paid';
        const isPartial = status === 'partial paid';
        const paidFraction = isPaid ? 1 : (isPartial && total > 0 ? Math.max(0, Math.min(1, partialPaid / total)) : 0);
        return { order: o, status, total, partialPaid, paidFraction };
      })
      .filter((row) => row.paidFraction > 0);
  }, [filteredOrders]);

  // Use contributingOrders for sales, profit, charts, and CSV
  const metrics = useMemo(() => {
    let sales = 0; // includes tax
    let grossSales = 0; // before discount & tax
    let netSales = 0; // sum of paid amounts
    let totalTax = 0;
    let totalDiscount = 0;
    let profit = 0;

    (contributingOrders || []).forEach(({ order: o, paidFraction, total, partialPaid }) => {
      const tax = Number(o.tax_amount ?? 0) || 0;
      const discount = Number(o.discount_amount ?? 0) || 0;
      const subtotal = o.subtotal != null ? Number(o.subtotal) : null;

      const baseGross = subtotal != null ? subtotal : (total - tax + discount);

      const extraDiscount = Number(discountAmount) || 0;
      const discountUsed = discount + extraDiscount;
      const netBeforeTaxAdj = Math.max(0, baseGross - discountUsed);

      const taxRateOverride = (Number(taxPercent) || 0) / 100;
      const taxUsed =
        taxRateOverride > 0
          ? Number((netBeforeTaxAdj * taxRateOverride).toFixed(2))
          : tax;

      const totalAdj = Number((netBeforeTaxAdj + taxUsed).toFixed(2));

      sales += totalAdj * paidFraction;
      totalTax += taxUsed * paidFraction;
      totalDiscount += discountUsed * paidFraction;
      netSales += paidFraction >= 1 ? total : partialPaid;
      grossSales += baseGross * paidFraction;

      profit += computeOrderProfit(o, costMap, { netBeforeTax: netBeforeTaxAdj * paidFraction });
    });

    const netProfit = Number((profit - totalExpenses).toFixed(2));
    return { sales, grossSales, netSales, totalTax, totalDiscount, profit, expenses: totalExpenses, netProfit };
  }, [contributingOrders, costMap, taxPercent, discountAmount, totalExpenses]);

  const salesProfitSeries = useMemo(() => {
    const map = {};
    (contributingOrders || []).forEach(({ order: o, paidFraction }) => {
      const d = toDateOnly(o.date) || toDateOnly(new Date());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const total = Number(o.total_price ?? o.price ?? 0) || 0;
      const tax = Number(o.tax_amount ?? 0) || 0;
      const discount = Number(o.discount_amount ?? 0) || 0;
      const subtotal = o.subtotal != null ? Number(o.subtotal) : null;

      const baseGross = subtotal != null ? subtotal : (total - tax + discount);
      const extraDiscount = Number(discountAmount) || 0;
      const discountUsed = discount + extraDiscount;
      const netBeforeTaxAdj = Math.max(0, baseGross - discountUsed);

      const taxRateOverride = (Number(taxPercent) || 0) / 100;
      const taxUsed =
        taxRateOverride > 0
          ? Number((netBeforeTaxAdj * taxRateOverride).toFixed(2))
          : tax;

      const totalAdj = Number((netBeforeTaxAdj + taxUsed).toFixed(2));
      
      if (!map[key]) map[key] = { date: key, sales: 0, profit: 0, expenses: 0, netProfit: 0 };
      map[key].sales += totalAdj * paidFraction;
      map[key].profit += computeOrderProfit(o, costMap, { netBeforeTax: netBeforeTaxAdj * paidFraction });
    });
    
    (filteredExpensesByDate || []).forEach((exp) => {
      const d = toDateOnly(exp.date) || toDateOnly(new Date());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const amount = Number(exp.amount || 0) || 0;
      if (!map[key]) map[key] = { date: key, sales: 0, profit: 0, expenses: 0, netProfit: 0 };
      map[key].expenses = (map[key].expenses || 0) + amount;
    });

    Object.values(map).forEach((row) => {
      row.netProfit = Number(((row.profit || 0) - (row.expenses || 0)).toFixed(2));
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [contributingOrders, costMap, taxPercent, discountAmount, filteredExpensesByDate]);

  const topProducts = useMemo(() => {
    const tally = {};
    (filteredOrders || []).forEach((o) => {
      const items = parseItems(o);
      items.forEach((it) => {
        const name = it.name || it.external_name || "Item";
        tally[name] = (tally[name] || 0) + Number(it.quantity || 1);
      });
    });
    const arr = Object.entries(tally).map(([name, qty]) => ({ name, qty }));
    arr.sort((a, b) => b.qty - a.qty);
    return arr.slice(0, 5);
  }, [filteredOrders]);

  const lowStock = useMemo(
    () => (products || []).filter((p) => Number(p.stock || 0) <= 5).slice(0, 5),
    [products]
  );

  // Exports
  const exportCSV = () => {
    const code = getCurrencyCode();
    const header = [
      "Date",
      "Order ID",
      "Products",
      `Gross (${code})`,
      `Net (${code})`,
      `Tax (${code})`,
      `Discount (${code})`,
      `Total (${code})`,
      `Profit (${code})`,
    ];
    const rows = (contributingOrders || []).map(({ order: o, paidFraction }) => {
      const items = parseItems(o);
      const dateStr = o.date ? new Date(o.date).toISOString().slice(0, 10) : "";
      const total = Number(o.total_price ?? o.price ?? 0) || 0;
      const tax = Number(o.tax_amount ?? 0) || 0;
      const discount = Number(o.discount_amount ?? 0) || 0;
      const subtotal = o.subtotal != null ? Number(o.subtotal) : null;

      const baseGross = subtotal != null ? subtotal : (total - tax + discount);
      const extraDiscount = Number(discountAmount) || 0;
      const discountUsed = discount + extraDiscount;
      const netBeforeTaxAdj = Math.max(0, baseGross - discountUsed);

      const taxRateOverride = (Number(taxPercent) || 0) / 100;
      const taxUsed =
        taxRateOverride > 0
          ? Number((netBeforeTaxAdj * taxRateOverride).toFixed(2))
          : tax;

      const totalAdj = Number((netBeforeTaxAdj + taxUsed).toFixed(2));

      const grossScaled = Number((baseGross * paidFraction).toFixed(2));
      const netScaled = Number((netBeforeTaxAdj * paidFraction).toFixed(2));
      const taxScaled = Number((taxUsed * paidFraction).toFixed(2));
      const discountScaled = Number((discountUsed * paidFraction).toFixed(2));
      const totalScaled = Number((totalAdj * paidFraction).toFixed(2));
      const profitScaled = computeOrderProfit(o, costMap, { netBeforeTax: netBeforeTaxAdj * paidFraction });

      return [
        dateStr,
        o.id ?? "",
        o.product_title ?? (items.map(it => `${it.name || it.external_name || 'Item'} x${Number(it.quantity || 1)}`).join('; ')) ?? "",
        grossScaled.toFixed(2),
        netScaled.toFixed(2),
        taxScaled.toFixed(2),
        discountScaled.toFixed(2),
        totalScaled.toFixed(2),
        Number(profitScaled || 0).toFixed(2),
      ];
    });
    const csvContent = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reports Summary", 10, 15);

    doc.setFontSize(12);
    doc.text(`Total Sales (incl. tax): ${formatCurrency(metrics.sales)}`, 10, 30);
    doc.text(`Gross Sales: ${formatCurrency(metrics.grossSales)}`, 10, 40);
    doc.text(`Net Sales (pre-tax): ${formatCurrency(metrics.netSales)}`, 10, 50);
    doc.text(`Total Tax: ${formatCurrency(metrics.totalTax)}`, 10, 60);
    doc.text(`Total Discount: ${formatCurrency(metrics.totalDiscount)}`, 10, 70);
    doc.text(`Total Profit: ${formatCurrency(metrics.profit)}`, 10, 80);
    doc.text(`Total Expenses: ${formatCurrency(metrics.expenses)}`, 10, 90);
    doc.text(`Net Profit: ${formatCurrency(metrics.netProfit)}`, 10, 100);

    doc.text("Top Products:", 10, 95);
    topProducts.forEach((p, idx) => {
      doc.text(`${idx + 1}. ${p.name} (${p.qty})`, 14, 105 + idx * 10);
    });

    const baseY = 115 + topProducts.length * 10 + 10;
    doc.text("Low Stock:", 10, baseY);
    lowStock.forEach((p, idx) => {
      doc.text(`${p.name} (${p.stock})`, 14, baseY + 10 + idx * 10);
    });

    doc.save("report.pdf");
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>
        <p>Track sales performance and business metrics</p>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <button className="btn btn-primary" onClick={applyFilter}>
            Apply Filter
          </button>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading data...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(metrics.grossSales)}</div>
            <div className="metric-label">Gross Sales</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(metrics.netSales)}</div>
            <div className="metric-label">Net Sales (All Paid Orders)</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(metrics.profit)}</div>
            <div className="metric-label">Total Profit</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(metrics.expenses)}</div>
            <div className="metric-label">Total Expenses</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(metrics.netProfit)}</div>
            <div className="metric-label">Net Profit</div>
          </div>
        </div>
      </div>

      {/* Charts and Export */}
      <div className="charts-section">
        <div className="charts-column">
          <div className="chart-card">
            <h3>Sales vs Profit Trend</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesProfitSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#2563EB" name="Sales" />
                  <Line type="monotone" dataKey="profit" stroke="#22C55E" name="Profit" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Expenses" />
                  <Line type="monotone" dataKey="netProfit" stroke="#8B5CF6" name="Net Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Top Selling Products</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="qty" fill="#2563EB" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="export-card">
            <h3>Export Reports</h3>
            <button className="btn btn-outline export-btn" onClick={exportCSV}>
              Export as CSV
            </button>
            <button className="btn btn-outline export-btn" onClick={exportPDF}>
              Export as PDF
            </button>
          </div>

          {lowStock.length > 0 && (
            <div className="alert-card">
              <h3>Low Stock Alert</h3>
              <div className="alert-list">
                {lowStock.map((product, index) => (
                  <div key={index} className="alert-item">
                    <span>{product.name}</span>
                    <span className="stock-count">{product.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
