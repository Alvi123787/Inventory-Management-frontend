// services/OrderService.js (refactored to use shared axios client)
import api from "../api/api";

class OrderService {
  // Get all orders and normalize fields
  static async getAllOrders() {
    try {
      const res = await api.get("api/orders");
      const result = res.data || {};
      const raw = Array.isArray(result.data) ? result.data : [];

      const normalized = raw.map((o) => {
        // Parse items from products (can be JSON string or array)
        let items = [];
        try {
          items = typeof o.products === "string" ? JSON.parse(o.products || "[]") : o.products || [];
          if (!Array.isArray(items)) items = [];
        } catch (e) {
          items = [];
        }

        // Build product title if missing
        const productTitle = o.product_title && String(o.product_title).trim().length > 0
          ? o.product_title
          : (items.length > 0
            ? items.map(it => `${it.name || it.external_name || "Item"} x${Number(it.quantity || 1)}`).join("; ")
            : "");

        // Compute total price if missing
        const computedTotal = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
        const totalRaw = o.total_price ?? computedTotal ?? o.price;
        const total = Number(isNaN(Number(totalRaw)) ? 0 : Number(totalRaw)).toFixed(2);

        // Normalize date
        const date = o.date ?? o.created_at ?? o.updated_at ?? null;

        return {
          ...o,
          product_title: productTitle,
          total_price: Number(total),
          price: Number(total),
          date,
        };
      });

      return normalized;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  }

  // Create new order
  static async createOrder(orderData) {
    try {
      const res = await api.post("api/orders", orderData);
      return res.data?.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  // Start edit (restore stock server-side)
  static async startEditOrder(id) {
    try {
      const res = await api.post(`api/orders/${id}/edit-start`);
      return res.data?.data;
    } catch (error) {
      console.error("Error starting order edit:", error);
      throw error;
    }
  }

  // Update order
  static async updateOrder(id, orderData) {
    try {
      const res = await api.put(`api/orders/${id}`, orderData);
      return res.data?.data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }

  // Delete order
  static async deleteOrder(id) {
    try {
      const res = await api.delete(`api/orders/${id}`);
      return res.data; // contains success + message from backend
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }
}

export default OrderService;
