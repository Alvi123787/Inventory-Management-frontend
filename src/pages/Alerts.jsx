import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductService from "../services/productService";
import OrderService from "../services/orderService";
import styles from "./Alerts.module.css";

const LOW_STOCK_THRESHOLD = 5; // configurable threshold
const UNPAID_DAYS_THRESHOLD = 7; // unpaid older than N days

function Alerts() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const prodResp = await ProductService.getAll();
        const prodList = prodResp?.data?.data || [];
        const ordList = await OrderService.getAllOrders();
        if (!mounted) return;
        setProducts(Array.isArray(prodList) ? prodList : []);
        setOrders(Array.isArray(ordList) ? ordList : []);
      } catch (e) {
        console.error("Failed to load alerts:", e);
        if (mounted) setError("Failed to load alerts data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock ?? 0) <= LOW_STOCK_THRESHOLD);
  }, [products]);

  const unpaidOldOrders = useMemo(() => {
    const now = Date.now();
    const ms = UNPAID_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
    return orders.filter(o => {
      if ((o.payment_status || o.paymentStatus) !== "Unpaid") return false;
      const d = o.date ? new Date(o.date) : null;
      if (!d || isNaN(d.getTime())) return false;
      return now - d.getTime() > ms;
    });
  }, [orders]);

  // Mark alerts as seen when visiting this page and data has loaded
  useEffect(() => {
    if (!loading && !error) {
      const ack = {
        low: lowStockProducts.length,
        unpaid: unpaidOldOrders.length,
        total: lowStockProducts.length + unpaidOldOrders.length,
        ts: Date.now()
      };
      try {
        localStorage.setItem("alertsAck", JSON.stringify(ack));
      } catch {}
    }
  }, [loading, error, lowStockProducts.length, unpaidOldOrders.length]);

  return (
    <div className={styles.alertsContainer}>
      <div className={styles.alertsHeader}>
        <div>
          <h2>Alerts & Notifications</h2>
          <p>Monitor low stock and overdue unpaid orders</p>
        </div>
        <div>
          <span className={`${styles.countBadge} ${styles.warnBadge}`}>
            {lowStockProducts.length + unpaidOldOrders.length} alerts
          </span>
        </div>
      </div>

      {error && <div className={styles.emptyState}>{error}</div>}
      {loading && <div className={styles.emptyState}>Loading alerts...</div>}

      {!loading && !error && (
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              Low Stock ({lowStockProducts.length})
            </h3>
            {lowStockProducts.length === 0 ? (
              <div className={styles.emptyState}>No low stock products</div>
            ) : (
              <div className={styles.list}>
                {lowStockProducts.map((p) => (
                  <div key={p.id} className={styles.listItem}>
                    <span className={styles.itemPrimary}>{p.name}</span>
                    <span className={styles.itemSecondary}>Stock: {p.stock}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.actions}>
              <Link className={styles.btn} to="/products">Go to Products</Link>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              Unpaid Orders &gt; {UNPAID_DAYS_THRESHOLD} days ({unpaidOldOrders.length})
            </h3>
            {unpaidOldOrders.length === 0 ? (
              <div className={styles.emptyState}>No overdue unpaid orders</div>
            ) : (
              <div className={styles.list}>
                {unpaidOldOrders.map((o) => (
                  <div key={o.id} className={styles.listItem}>
                    <span className={styles.itemPrimary}>{o.customer_name}</span>
                    <span className={styles.itemSecondary}>
                      {o.product_title || "Order"} • {new Date(o.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.actions}>
              <Link className={styles.btn} to="/orders">Go to Orders</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;