// pages/Orders.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import OrderService from "../services/orderService";
import ProductService from "../services/productService";
import DropdownService from "../services/dropdownService";
import styles from "./Orders.module.css";
import { formatCurrency } from "../utils/currency";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    productTitle: "",
    price: "",
    courier: "",
    trackingId: "",
    status: "Dispatch",
    paymentStatus: "Unpaid",
    paymentMethod: "Cash On Delivery",
    date: "",
    tax_included: false,
    tax_rate: "",
    channel: "",
    orderId: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [products, setProducts] = useState([]);
  const [productsSnapshot, setProductsSnapshot] = useState(null);
  const [orderItems, setOrderItems] = useState([{ productId: "", quantity: 1, price: 0 }]);
  const [didRestoreOnEdit, setDidRestoreOnEdit] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dynamic dropdown options and add-new modal state
  const ADD_NEW = "__add_new__";
  const [paymentStatusOptions, setPaymentStatusOptions] = useState(["Paid", "Unpaid", "Partial Paid"]);
  const [orderStatusOptions, setOrderStatusOptions] = useState([
    "Dispatch",
    "Delivered",
    "In Transit",
    "Out for Delivery",
    "Cancelled",
    "Returned",
  ]);
  const [courierOptions, setCourierOptions] = useState(["TCS", "Leopards", "DHL", "FedEx"]);
  const [channelOptions, setChannelOptions] = useState(["Whatsapp", "Direct", "Online"]);
  const [addNewModal, setAddNewModal] = useState({ open: false, target: null, value: "" });
  const [partialPaidModal, setPartialPaidModal] = useState({ open: false, value: "" });
  const [partialPaidAmount, setPartialPaidAmount] = useState(0);
  const location = useLocation();

  // Custom Dropdown With Delete
  const DropdownWithDelete = ({ label, name, value, options, onSelect, onAddNew, allowAddNew = true, target }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (val) => {
      onSelect({ target: { name, value: val } });
      setOpen(false);
    };

    const handleDelete = async (opt) => {
      const confirmed = window.confirm(`Delete "${opt}" from ${label}?`);
      if (!confirmed) return;
      try {
        // Try backend delete, ignore if not implemented
        try {
          if (target === "orderStatus") {
            await DropdownService.deleteStatus?.(opt);
          } else if (target === "courier") {
            await DropdownService.deleteCourier?.(opt);
          } else if (target === "channel") {
            await DropdownService.deleteChannel?.(opt);
          }
        } catch (e) {
          // Silently ignore missing endpoint
        }
        // Update local options
        const updater = {
          orderStatus: setOrderStatusOptions,
          courier: setCourierOptions,
          channel: setChannelOptions,
        }[target];
        const currentList = {
          orderStatus: orderStatusOptions,
          courier: courierOptions,
          channel: channelOptions,
        }[target];
        const next = currentList.filter((o) => String(o).toLowerCase() !== String(opt).toLowerCase());
        updater(next);
        const field = mapTargetToField(target);
        setFormData((prev) => ({ ...prev, [field]: prev[field] === opt ? "" : prev[field] }));
        setSuccess(`${label} option deleted`);
        setTimeout(() => setSuccess(""), 2500);
      } catch (err) {
        setError(err?.message || `Failed to delete ${label} option`);
        setTimeout(() => setError(""), 2500);
      }
    };

    return (
      <div
        className={styles.ordersDropdownWrapper}
        tabIndex={0}
        onBlur={(e) => {
          // Only close if focus moves outside the wrapper (not into list/buttons)
          const next = e.relatedTarget;
          if (!next || !e.currentTarget.contains(next)) {
            setOpen(false);
          }
        }}
      >
        <button type="button" className={styles.ordersDropdownButton} onClick={() => setOpen((v) => !v)}>
          <span className={styles.ordersDropdownLabel}>{value || `Select ${label}`}</span>
          <svg className={styles.ordersDropdownChevron} viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.25 8.4a.75.75 0 0 1-.02-1.19z" fill="currentColor" />
          </svg>
        </button>
        {open && (
          <div className={styles.ordersDropdownList}>
            {ensureIncludesCurrent(options, value).map((opt) => (
              <div key={opt} className={`${styles.ordersDropdownItem} ${value === opt ? styles.ordersDropdownItemSelected : ''}`}>
                <button
                  type="button"
                  className={styles.ordersDropdownSelect}
                  onMouseDown={() => handleSelect(opt)}
                >
                  <span className={styles.ordersDropdownOptionLabel}>{opt}</span>
                  {value === opt && <span className={styles.ordersDropdownSelectedMark}>✓</span>}
                </button>
                <button
                  type="button"
                  className={styles.ordersDropdownDelete}
                  title={`Delete ${opt}`}
                  onMouseDown={(e) => { e.stopPropagation(); handleDelete(opt); }}
                >
                  <svg className={styles.ordersDropdownTrashIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="5" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M10 10v6M14 10v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {allowAddNew && (
              <div className={`${styles.ordersDropdownItem} ${styles.ordersDropdownAdd}`}> 
                <button
                  type="button"
                  className={styles.ordersDropdownSelect}
                  onMouseDown={() => onAddNew?.(target)}
                >
                  + Add New…
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
    fetchAvailableProducts();
    fetchDropdownOptions();
  }, []);

  // If navigated with an order to edit, start edit automatically
  useEffect(() => {
    const incoming = location.state && location.state.editOrder;
    if (incoming) {
      handleEdit(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to SSE for real-time refresh
  useEffect(() => {
    const es = new EventSource(`https://inventory-management-backend-flame.vercel.app/events`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "orders.changed") {
          fetchOrders();
        }
        if (msg?.type === "products.changed") {
          // Refresh product list to keep stock constraints correct
          fetchAvailableProducts();
        }
      } catch {}
    };
    return () => es.close();
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
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toDateOnly = (d) => {
    const dt = d ? new Date(d) : null;
    if (!dt || isNaN(dt)) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const filteredOrdersByDate = useMemo(() => {
    if (!startDate && !endDate) return orders;
    const s = startDate ? toDateOnly(startDate) : null;
    const e = endDate ? toDateOnly(endDate) : null;
    return (orders || []).filter((o) => {
      const d = toDateOnly(o.date || o.created_at);
      if (!d) return false;
      const afterStart = s ? d >= s : true;
      const beforeEnd = e ? d <= e : true;
      return afterStart && beforeEnd;
    });
  }, [orders, startDate, endDate]);

  const fetchAvailableProducts = async () => {
    try {
      const response = await ProductService.getAll();
      const list = response?.data?.data || [];
      const normalized = Array.isArray(list) ? list : [];
      setProducts(normalized);
      setProductsSnapshot(normalized);
      return normalized;
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again.");
      setProducts([]);
      setProductsSnapshot([]);
      return [];
    }
  };

  const normalizeUnique = (list) => {
    const names = (Array.isArray(list) ? list : []).map(item =>
      typeof item === "string" ? item : (item?.name ?? item?.status ?? "")
    ).filter(Boolean);
    const unique = [];
    const seenLower = new Set();
    for (const n of names) {
      const lower = String(n).toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        unique.push(String(n));
      }
    }
    return unique;
  };

  const fetchDropdownOptions = async () => {
    try {
      const [statuses, _paymentStatuses, couriers, channels] = await Promise.all([
        DropdownService.getStatuses(),
        DropdownService.getPaymentStatuses(),
        DropdownService.getCouriers(),
        DropdownService.getChannels(),
      ]);
      const statusList = normalizeUnique(statuses);
      const courierList = normalizeUnique(couriers);
      const channelList = normalizeUnique(channels);
      if (statusList.length) setOrderStatusOptions(statusList);
      // Keep paymentStatus options fixed to Paid/Unpaid/Partial Paid
      if (courierList.length) setCourierOptions(courierList);
      if (channelList.length) setChannelOptions(channelList);
    } catch (err) {
      console.error("Failed to fetch dropdown options:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === "price" ? Number(value) : value)
    }));
  };

  // Helpers for dynamic dropdowns
  const mapTargetToField = (target) => {
    if (target === "paymentStatus") return "paymentStatus";
    if (target === "orderStatus") return "status";
    if (target === "courier") return "courier";
    if (target === "channel") return "channel";
    return target;
  };

  const openAddNew = (target) => setAddNewModal({ open: true, target, value: "" });
  const closeAddNew = () => setAddNewModal({ open: false, target: null, value: "" });

  const ensureIncludesCurrent = (opts, currentValue) => {
    const normalized = opts.map(o => String(o));
    if (currentValue && !normalized.map(o => o.toLowerCase()).includes(String(currentValue).toLowerCase())) {
      return [...normalized, currentValue];
    }
    return normalized;
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;

    // Payment status special handling
    if (name === "paymentStatus") {
      if (value === "Partial Paid") {
        setPartialPaidModal({ open: true, value: partialPaidAmount ? String(partialPaidAmount) : "" });
      } else {
        setPartialPaidAmount(0);
      }
      handleChange(e);
      return;
    }

    // Other selects only: support Add New
    if (value === ADD_NEW) {
      const target = name === "status" ? "orderStatus" : name === "courier" ? "courier" : name === "channel" ? "channel" : null;
      if (target) openAddNew(target);
      return;
    }
    handleChange(e);
  };

  const cancelPartialPaid = () => {
    setPartialPaidModal({ open: false, value: "" });
    setPartialPaidAmount(0);
    setFormData(prev => ({ ...prev, paymentStatus: "Unpaid" }));
  };

  const submitPartialPaid = () => {
    const val = Number(partialPaidModal.value || 0);
    const total = calculateItemsTotal(orderItems);
    const clamped = Math.max(0, Math.min(val, total));
    setPartialPaidAmount(clamped);
    setPartialPaidModal({ open: false, value: "" });
    setFormData(prev => ({ ...prev, paymentStatus: "Partial Paid" }));
  };

  const submitAddNew = async () => {
    const { target, value } = addNewModal;
    const newVal = String(value || "").trim();
    if (!target || !newVal) return;

    try {
      // Persist to backend
      if (target === "paymentStatus") {
        await DropdownService.addPaymentStatus(newVal);
      } else if (target === "orderStatus") {
        await DropdownService.addStatus(newVal);
      } else if (target === "courier") {
        await DropdownService.addCourier(newVal);
      } else if (target === "channel") {
        await DropdownService.addChannel(newVal);
      }

      // Update local options
      const updater = {
        paymentStatus: setPaymentStatusOptions,
        orderStatus: setOrderStatusOptions,
        courier: setCourierOptions,
        channel: setChannelOptions,
      }[target];

      const currentList = {
        paymentStatus: paymentStatusOptions,
        orderStatus: orderStatusOptions,
        courier: courierOptions,
        channel: channelOptions,
      }[target];

      const exists = currentList.some(opt => String(opt).toLowerCase() === newVal.toLowerCase());
      const nextList = exists ? currentList : [...currentList, newVal];
      updater(nextList);

      const field = mapTargetToField(target);
      setFormData(prev => ({ ...prev, [field]: newVal }));
      closeAddNew();
    } catch (err) {
      console.error("Failed to add new dropdown value:", err);
      setError(err.message || "Failed to add new value");
    }
  };

  const addItemRow = () => {
    setOrderItems((prev) => [
      ...prev,
      { productId: "", quantity: editingId ? 0 : 1, prevQuantity: 0, price: 0 }
    ]);
  };

  const removeItemRow = (index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems((prev) => {
      const next = [...prev];
      const current = next[index] || {};

      if (field === "quantity") {
        const currentProductId = current.productId;
        const p = getProductById(currentProductId);
        const baseStock = Number(p?.stock ?? Infinity);
        const minQty = editingId ? 0 : 1;
        const n = Math.max(minQty, Number(value));
        const prevQty = editingId ? Number(current.prevQuantity || 0) : 0;
        const othersAllocated = orderItems.reduce((sum, it, idx) => {
          if (idx === index) return sum;
          return Number(it.productId) === Number(currentProductId) ? sum + Number(it.quantity || 0) : sum;
        }, 0);
        const freeStock = Number.isFinite(baseStock) ? Math.max(0, baseStock - othersAllocated) : Infinity;
        const maxQty = editingId
          ? (Number.isFinite(freeStock) ? (didRestoreOnEdit ? freeStock : prevQty + freeStock) : Infinity)
          : freeStock;
        const clamped = Number.isFinite(maxQty) ? Math.min(n, maxQty) : n;
        next[index] = { ...current, quantity: clamped };
      } else if (field === "productId") {
        const p = getProductById(value);
        const baseQty = Number(current.quantity ?? (editingId ? 0 : 1));
        const baseStock = Number(p?.stock ?? Infinity);
        const prevQty = editingId ? 0 : 0;
        const othersAllocated = orderItems.reduce((sum, it, idx) => {
          if (idx === index) return sum;
          return Number(it.productId) === Number(value) ? sum + Number(it.quantity || 0) : sum;
        }, 0);
        const freeStock = Number.isFinite(baseStock) ? Math.max(0, baseStock - othersAllocated) : Infinity;
        const maxQty = editingId
          ? (Number.isFinite(freeStock) ? (didRestoreOnEdit ? freeStock : prevQty + freeStock) : Infinity)
          : freeStock;
        const clamped = Number.isFinite(maxQty) ? Math.min(baseQty, maxQty) : baseQty;
        const defaultPrice = Number(p?.price ?? 0);
        next[index] = { ...current, productId: Number(value), quantity: clamped, prevQuantity: prevQty, price: defaultPrice };
      } else if (field === "price") {
        const n = Math.max(0, Number(value));
        next[index] = { ...current, price: n };
      } else {
        next[index] = { ...current, [field]: Number(value) };
      }
      return next;
    });
  };

  const getProductById = (id) => {
    const source = Array.isArray(productsSnapshot) ? productsSnapshot : products;
    return source.find((p) => Number(p.id) === Number(id));
  };

  const getAllocatedForProduct = (productId) => {
    const pid = Number(productId);
    if (!pid) return 0;
    return orderItems.reduce((sum, it) => {
      return Number(it.productId) === pid ? sum + Number(it.quantity || 0) : sum;
    }, 0);
  };

  // Get the effective price for an item (custom price if set, otherwise product price)
  const getItemPrice = (item) => {
    const product = getProductById(item.productId);
    const custom = item && item.price != null ? Number(item.price) : null;
    return custom != null && !Number.isNaN(custom) ? custom : Number(product?.price ?? 0);
  };

  // Calculate total for items (using custom prices if set)
  const calculateItemsTotal = (items) => {
    return items.reduce((sum, it) => {
      const price = getItemPrice(it);
      const qty = Number(it.quantity || 0);
      return sum + (price * qty);
    }, 0);
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      phone: "",
      address: "",
      productTitle: "",
      price: "",
      courier: "",
      trackingId: "",
      status: "Dispatch",
      paymentStatus: "Unpaid",
      paymentMethod: "Cash On Delivery",
      date: "",
      tax_included: false,
      tax_rate: "",
      channel: "",
      orderId: "",
    });
    setEditingId(null);
    setError("");
    setOrderItems([{ productId: "", quantity: 1 }]);
    setDidRestoreOnEdit(false);
    setPartialPaidAmount(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");

      // Basic validation
      if (!formData.customerName.trim()) {
        setError("Customer name is required");
        return;
      }

      const selectedItems = orderItems.filter((it) => it.productId && Number(it.quantity || 0) > 0);

      if (!editingId && selectedItems.length === 0) {
        setError("Please add at least one product to the order");
        return;
      }

      const aggregate = new Map();
      for (let i = 0; i < orderItems.length; i++) {
        const it = orderItems[i];
        if (!it.productId) continue;
        const p = getProductById(it.productId);
        const baseStock = Number(p?.stock ?? 0);
        const newQty = Number(it.quantity || 0);
        const prevQty = editingId ? Number(it.prevQuantity || 0) : 0;
        const delta = editingId ? (didRestoreOnEdit ? newQty : newQty - prevQty) : newQty;
        const curr = aggregate.get(it.productId) || 0;
        aggregate.set(it.productId, curr + Math.max(0, delta));
        if (!editingId && baseStock <= 0) {
          setError(`${p?.name || "Selected product"} is out of stock`);
          return;
        }
      }
      for (const [pid, sumDelta] of aggregate.entries()) {
        const p = getProductById(pid);
        const baseStock = Number(p?.stock ?? 0);
        if (sumDelta > baseStock) {
          setError(`Total quantity for ${p?.name || "product"} exceeds available stock (${baseStock} available)`);
          return;
        }
      }

      const payload = { ...formData };

      if (selectedItems.length > 0) {
        const itemsSummary = selectedItems
          .map((it) => {
            const p = getProductById(it.productId);
            const name = p?.name || `#${it.productId}`;
            return `${name} x${it.quantity}`;
          })
          .join("; ");

        const itemsForBackend = selectedItems.map((it) => {
          const p = getProductById(it.productId);
          const rawPrice = getItemPrice(it);
          const effectivePrice = Number(Number(rawPrice || 0).toFixed(2));
          return {
            name: p?.name || `#${it.productId}`,
            quantity: Number(it.quantity || 1),
            price: effectivePrice,
            product_id: Number(p?.id ?? it.productId) || null
          };
        });

        payload.productTitle = itemsSummary;
        // Let backend compute subtotal/discount/tax/total based on user settings
        if (payload.price !== undefined) delete payload.price;
        payload.orderItems = itemsForBackend;

        // Include per-order tax controls (optional)
        if (payload.tax_rate === "") delete payload.tax_rate;
      }
      // Indicate whether stock was restored before edit
      payload.restoredOnEdit = !!didRestoreOnEdit;
      // Include partial paid amount if applicable
      if (formData.paymentStatus === "Partial Paid") {
        payload.partialPaidAmount = Number(partialPaidAmount || 0);
      } else {
        payload.partialPaidAmount = 0;
      }

      if (editingId) {
        await OrderService.updateOrder(editingId, payload);
        setSuccess("Order updated successfully"); // REPLACE window alert
      } else {
        await OrderService.createOrder(payload);
        setSuccess("Order created successfully"); // REPLACE window alert
      }
      resetForm();
      fetchOrders();
      setTimeout(() => setSuccess(""), 4000); // auto-dismiss success
    } catch (error) {
      console.error("Error saving order:", error);
      setError(`Failed to save order: ${error.message}`);
    }
  };

  const handleEdit = async (order) => {
    setFormData({
      customerName: order.customer_name || "",
      phone: order.phone || "",
      address: order.address || "",
      productTitle: order.product_title || "",
      price: order.price || "",
      courier: order.courier || "",
      trackingId: order.tracking_id || "",
      status: order.status || "Dispatch",
      paymentStatus: order.payment_status || "Unpaid",
      paymentMethod: order.payment_method || "Cash",
      date: order.date || "",
      tax_included: !!order.tax_included,
      tax_rate: "",
      channel: order.channel || "",
      orderId: order.order_id || String(order.id || ""),
    });
    // Restore stock server-side before editing
    try {
      setLoading(true);
      setError("");
      await OrderService.startEditOrder(order.id);
      setDidRestoreOnEdit(true);
      await fetchAvailableProducts();
    } catch (err) {
      setError(err?.message || "Failed to prepare order for edit");
    } finally {
      setLoading(false);
    }

    setEditingId(order.id);

    // Hydrate order items from backend 'products' JSON
    try {
      const raw = typeof order.products === "string"
        ? JSON.parse(order.products || "[]")
        : (order.products || []);
      const sourceProducts = Array.isArray(productsSnapshot) ? productsSnapshot : products;
      const items = (Array.isArray(raw) ? raw : []).map((it) => {
        const externalName = String(it.name || it.external_name || "").trim();
        let pid = it.product_id != null ? Number(it.product_id) : "";
        if (!pid && externalName) {
          const match = sourceProducts.find(
            (p) => String(p.name || "").toLowerCase() === externalName.toLowerCase()
          );
          if (match) pid = Number(match.id);
        }
        const p = sourceProducts.find(sp => Number(sp.id) === Number(pid));
        return {
          productId: pid || "",
          quantity: Number(it.quantity || 0),
          prevQuantity: Number(it.quantity || 0),
          price: Number(it.price != null ? it.price : (p?.price ?? 0))
        };
      });
      setOrderItems(items.length ? items : [{ productId: "", quantity: 0, prevQuantity: 0, price: 0 }]);
    } catch (e) {
      setOrderItems([{ productId: "", quantity: 0, prevQuantity: 0, price: 0 }]);
    }

    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      setError("");
      const result = await OrderService.deleteOrder(id);
      setSuccess(result.message || "Order deleted successfully"); // REPLACE window alert
      fetchOrders();
      setTimeout(() => setSuccess(""), 4000); // auto-dismiss success
    } catch (error) {
      console.error("Failed to delete order:", error);
      setError(`Failed to delete order: ${error.message}`);
    }
  };

  return (
    <div className={styles["orders-management-container"]}>
      <div className={styles["orders-management-header"]}>
        <h2>Orders Management</h2>
        <p>Create and manage customer orders</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className={`${styles.ordersAlert} ${styles["ordersAlert-error"]}`}>
          <span className={styles["ordersAlert-icon"]}>⚠️</span>
          <span className={styles["ordersAlert-text"]}>{error}</span>
          <button
            type="button"
            className={styles["ordersAlert-close"]}
            onClick={() => setError("")}
            aria-label="Close"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className={`${styles.ordersAlert} ${styles["ordersAlert-success"]}`}>
          <span className={styles["ordersAlert-icon"]}>✅</span>
          <span className={styles["ordersAlert-text"]}>{success}</span>
          <button
            type="button"
            className={styles["ordersAlert-close"]}
            onClick={() => setSuccess("")}
            aria-label="Close"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Order Form Card */}
      <div className={styles.ordersCard}>
        <form onSubmit={handleSubmit} className={styles["orders-management-form"]}>
          <div className={styles["orders-section-header"]}>
            <h3>{editingId ? "Edit Order" : "Create New Order"}</h3>
            <p className={styles["orders-section-subtitle"]}>
              Fill customer details and add products
            </p>
          </div>

          {/* Form grid unchanged */}
          <div className={styles["orders-form-grid"]}>
            <div className={styles["orders-form-group"]}>
              <label>Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Order ID</label>
              <input
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                placeholder="e.g., ORD-0001"
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Channel</label>
              <DropdownWithDelete
                label="Channel"
                name="channel"
                value={formData.channel}
                options={channelOptions}
                onSelect={handleSelectChange}
                onAddNew={openAddNew}
                allowAddNew={true}
                target="channel"
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Phone *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Status</label>
              <DropdownWithDelete
                label="Order Status"
                name="status"
                value={formData.status}
                options={orderStatusOptions}
                onSelect={handleSelectChange}
                onAddNew={openAddNew}
                allowAddNew={true}
                target="orderStatus"
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Payment Status</label>
              <div className={styles.ordersSelect}>
                <select
                  className={styles.ordersSelectControl}
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleSelectChange}
                >
                  <option value="">Select Payment Status</option>
                  {paymentStatusOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Payment Method</label>
              <div className={styles.ordersSelect}>
                <select
                  className={styles.ordersSelectControl}
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="Cash On Delivery">Cash On Delivery</option>
                  <option value="Bank">Bank</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="EasyPaisa/JazzCash">EasyPaisa/JazzCash</option>
                </select>
              </div>
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Courier</label>
              <DropdownWithDelete
                label="Courier"
                name="courier"
                value={formData.courier}
                options={courierOptions}
                onSelect={handleSelectChange}
                onAddNew={openAddNew}
                allowAddNew={true}
                target="courier"
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Tracking ID</label>
              <input
                type="text"
                name="trackingId"
                value={formData.trackingId}
                onChange={handleChange}
              />
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles["orders-form-group"]} ${styles["orders-form-group-inline"]}`}>
              <label>
                <input
                  type="checkbox"
                  name="tax_included"
                  checked={!!formData.tax_included}
                  onChange={handleChange}
                />
                Tax Included in Item Prices
              </label>
            </div>

            <div className={styles["orders-form-group"]}>
              <label>Order Tax Rate (%)</label>
              <input
                type="number"
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 10"
              />
              <small className={styles["orders-help-text"]}>
                If set, overrides default tax rate for this order.
              </small>
            </div>
          </div>


        {/* Order Items Section */}
        <div className={styles["orders-form-section"]}>
          <div className={styles["orders-section-header"]}>
            <h3>Order Items</h3>
            <button type="button" className={`${styles.ordersBtn} ${styles["ordersBtn-outline"]}`} onClick={addItemRow}>
              Add Item
            </button>
          </div>

          <div className={styles["orders-items-list"]}>
            {orderItems.map((item, idx) => {
              const product = item.productId ? getProductById(item.productId) : null;
              return (
                <div className={styles["orders-item-row"]} key={idx}>
                  <div className={styles["orders-item-grid"]}>
                    <div className={styles["orders-item-field"]}>
                      <label>Product</label>
                      <div className={styles.ordersSelect}>
                        <select
                          className={styles.ordersSelectControl}
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles["orders-item-field"]}>
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        max={product ? Number(product.stock || 0) : undefined}
                        disabled={product ? Number(product.stock || 0) <= 0 : false}
                      />
                      {product && Number(product.stock || 0) <= 0 && (
                        <span className={styles["orders-field-error"]}>Out of stock</span>
                      )}
                    </div>

                    <div className={styles["orders-item-field"]}>
                      <label>Cost</label>
                      <input
                        value={product ? formatCurrency(parseFloat(product.cost).toFixed(2)) : ""}
                        placeholder="-"
                        readOnly
                      />
                    </div>
                    <div className={styles["orders-item-field"]}>
                      <label>Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number(item.price ?? 0)}
                        onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                      />
                    </div>
                    <div className={styles["orders-item-field"]}>
                      <label>Stock</label>
                      <input value={product ? Math.max(0, Number(product.stock || 0) - getAllocatedForProduct(item.productId)) : ""} placeholder="-" readOnly />
                    </div>

                    <div className={styles["orders-item-actions"]}>
                      <button 
                        type="button" 
                        className={`${styles.ordersBtn} ${styles["ordersBtn-danger"]}`} 
                        onClick={() => removeItemRow(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Summary (visible only for Partial Paid) */}
        {formData.paymentStatus === "Partial Paid" && (
          <div className={styles["orders-form-section"]}>
            <div className={styles["orders-section-header"]}>
              <h3>Totals</h3>
            </div>
            <div className={styles["orders-items-list"]}>
              <div className={styles["orders-item-row"]}>
                <div className={styles["orders-item-grid"]}>
                  <div className={styles["orders-item-field"]}>
                    <label>Total (Items)</label>
                    <input
                      value={formatCurrency(calculateItemsTotal(orderItems).toFixed(2))}
                      readOnly
                    />
                  </div>
                  <div className={styles["orders-item-field"]}>
                    <label>Paid Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={Number(partialPaidAmount || 0)}
                      onChange={(e) => {
                        const val = Number(e.target.value || 0);
                        const total = calculateItemsTotal(orderItems);
                        const clamped = Math.max(0, Math.min(val, total));
                        setPartialPaidAmount(clamped);
                      }}
                    />
                  </div>
                  <div className={styles["orders-item-field"]}>
                    <label>Unpaid Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(() => {
                        const total = calculateItemsTotal(orderItems);
                        const remaining = Math.max(0, total - Number(partialPaidAmount || 0));
                        return Number(remaining.toFixed(2));
                      })()}
                      onChange={(e) => {
                        const newRemaining = Number(e.target.value || 0);
                        const total = calculateItemsTotal(orderItems);
                        const clampedRemaining = Math.max(0, Math.min(newRemaining, total));
                        const newPaid = Math.max(0, total - clampedRemaining);
                        setPartialPaidAmount(newPaid);
                      }}
                    />
                  </div>
                  <div className={styles["orders-item-field"]}>
                    <label>Remaining</label>
                    <input
                      value={(() => {
                        const total = calculateItemsTotal(orderItems);
                        const remaining = Math.max(0, total - Number(partialPaidAmount || 0));
                        return formatCurrency(remaining.toFixed(2));
                      })()}
                      readOnly
                    />
                  </div>
                  <div className={styles["orders-item-field"]}>
                    <label>Net Sales</label>
                    <input
                      value={(() => {
                        const total = calculateItemsTotal(orderItems);
                        const net = Number(partialPaidAmount || 0);
                        return formatCurrency(net.toFixed(2));
                      })()}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles["orders-form-actions"]}>
          <button type="submit" className={`${styles.ordersBtn} ${styles["ordersBtn-primary"]}`}>
            {editingId ? "Update Order" : "Create Order"}
          </button>
          {editingId && (
            <button type="button" className={`${styles.ordersBtn} ${styles["ordersBtn-secondary"]}`} onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        {/* Add New Modal */}
        {addNewModal.open && (
          <div className={styles["orders-modal-backdrop"]} role="dialog" aria-modal="true">
            <div className={styles.ordersModal}>
              <div className={styles["orders-modal-header"]}>
                <h4>
                  Add New {addNewModal.target === 'orderStatus' ? 'Order Status' : addNewModal.target === 'courier' ? 'Courier' : 'Channel'}
                </h4>
              </div>
              <div className={styles["orders-modal-body"]}>
                <input
                  type="text"
                  value={addNewModal.value}
                  onChange={(e) => setAddNewModal(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Type new value"
                  autoFocus
                />
              </div>
              <div className={styles["orders-modal-actions"]}>
                <button type="button" className={`${styles.ordersBtn} ${styles["ordersBtn-outline"]}`} onClick={closeAddNew}>Cancel</button>
                <button type="button" className={`${styles.ordersBtn} ${styles["ordersBtn-primary"]}`} onClick={submitAddNew}>Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Partial Paid Modal */}
        {partialPaidModal.open && (
          <div className={styles["orders-modal-backdrop"]} role="dialog" aria-modal="true">
            <div className={styles.ordersModal}>
              <div className={styles["orders-modal-header"]}>
                <h4>Enter Partial Paid Amount</h4>
              </div>
              <div className={styles["orders-modal-body"]}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={partialPaidModal.value}
                  onChange={(e) => setPartialPaidModal(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., 1000"
                  autoFocus
                />
              </div>
              <div className={styles["orders-modal-actions"]}>
                <button type="button" className={`${styles.ordersBtn} ${styles["ordersBtn-outline"]}`} onClick={cancelPartialPaid}>Cancel</button>
                <button type="button" className={`${styles.ordersBtn} ${styles["ordersBtn-primary"]}`} onClick={submitPartialPaid}>Save</button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* End Order Form Card */}
      </div>

      {/* Orders Table */}
      <div className={`${styles.ordersCard} ${styles["orders-table-section"]}`}>
        <div className={styles["orders-section-header"]}>
          <h3>Orders List</h3>
          <div className={styles["orders-header-right"]}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.ordersSearchInput}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.ordersSearchInput}
            />
            {(startDate || endDate) && (
              <button className={`${styles.ordersBtn} ${styles["ordersBtn-outline"]}`} onClick={() => { setStartDate(""); setEndDate(""); }}>
                Clear
              </button>
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer or tracking ID"
              className={styles.ordersSearchInput}
            />
            <button className={`${styles.ordersBtn} ${styles["ordersBtn-outline"]}`} onClick={fetchOrders}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles["orders-loading-state"]}>
            <div className={styles.ordersSpinner}></div>
            <p>Loading orders...</p>
          </div>
        ) : (
          <div className={styles["orders-table-container"]}>
            <table className={styles["orders-management-table"]}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Channel</th>
                  <th>Courier</th>
                  <th>Products</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdersByDate && filteredOrdersByDate.length > 0 ? (
                  (filteredOrdersByDate || [])
                    .filter(o => {
                      const term = query.trim().toLowerCase();
                      if (!term) return true;
                      const byCustomer = String(o.customer_name || '').toLowerCase().includes(term);
                      const byTracking = String(o.tracking_id || '').toLowerCase().includes(term);
                      return byCustomer || byTracking;
                    })
                    .map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.order_id || '-'}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.phone}</td>
                      <td>{order.channel || '-'}</td>
                      <td>{order.courier || '-'}</td>
                      <td className={styles["orders-products-cell"]}>{order.product_title}</td>
                      <td>{(() => {
                        try {
                          const items = typeof order.products === "string" ? JSON.parse(order.products || "[]") : (order.products || []);
                          const total = order.total_price != null
                            ? Number(order.total_price)
                            : (Array.isArray(items) ? items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0) : Number(order.price || 0));
                          return formatCurrency(Number(total || 0).toFixed(2));
                        } catch {
                          return formatCurrency(Number(order.total_price ?? order.price ?? 0).toFixed(2));
                        }
                      })()}</td>
                      <td>
                        <span className={`${styles["orders-status-badge"]} ${styles[`orders-status-${order.status?.toLowerCase().replace(' ', '-')}`] || ""}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {order.payment_status === 'Partial Paid' ? (
                          <>
                            <span className={`${styles["orders-payment-badge"]} ${styles[`orders-payment-${order.payment_status?.toLowerCase()}`] || ""}`}>
                              {order.payment_status}
                            </span>
                            {(() => {
                              const paid = Number(order.partial_paid_amount ?? order.partialPaidAmount ?? 0) || 0;
                              const total = Number(order.total_price ?? order.price ?? 0) || 0;
                              const unpaid = Math.max(0, total - paid);
                              return (
                                <small>
                                  Paid: {formatCurrency(paid)} | Unpaid: {formatCurrency(unpaid)}
                                </small>
                              );
                            })()}
                          </>
                        ) : (
                          <span className={`${styles["orders-payment-badge"]} ${styles[`orders-payment-${order.payment_status?.toLowerCase()}`] || ""}`}>
                            {order.payment_status}
                          </span>
                        )}
                      </td>
                      <td>{order.payment_method || '-'}</td>
                      <td>{order.date ? new Date(order.date).toLocaleDateString() : "-"}</td>
                      <td>
                        <div className={styles["orders-action-buttons"]}>
                          <button
                            className={`${styles.ordersBtn} ${styles["ordersBtn-warning"]}`}
                            onClick={() => handleEdit(order)}
                          >
                            Edit
                          </button>
                          <button
                            className={`${styles.ordersBtn} ${styles["ordersBtn-danger"]}`}
                            onClick={() => handleDelete(order.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className={styles["orders-empty-row"]}>
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
