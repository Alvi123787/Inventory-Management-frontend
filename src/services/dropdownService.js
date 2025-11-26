import api from "../api/api";

const DropdownService = {
  async getStatuses() {
    const res = await api.get("api/statuses");
    const json = res.data;
    return Array.isArray(json?.data) ? json.data : [];
  },
  async addStatus(name) {
    const res = await api.post("api/statuses", { name });
    const json = res.data;
    if (!res.status || res.status >= 400) throw new Error(json?.message || "Failed to add status");
    return json?.data;
  },

  async getPaymentStatuses() {
    const res = await api.get("api/payment-statuses");
    const json = res.data;
    return Array.isArray(json?.data) ? json.data : [];
  },
  async addPaymentStatus(name) {
    const res = await api.post("api/payment-statuses", { name });
    const json = res.data;
    if (!res.status || res.status >= 400) throw new Error(json?.message || "Failed to add payment status");
    return json?.data;
  },

  async getCouriers() {
    const res = await api.get("api/couriers");
    const json = res.data;
    return Array.isArray(json?.data) ? json.data : [];
  },
  async addCourier(name) {
    const res = await api.post("api/couriers", { name });
    const json = res.data;
    if (!res.status || res.status >= 400) throw new Error(json?.message || "Failed to add courier");
    return json?.data;
  },

  async getChannels() {
    const res = await api.get("api/channels");
    const json = res.data;
    const rows = Array.isArray(json?.data) ? json.data : [];
    return rows.map(r => r?.name).filter(Boolean);
  },
  async addChannel(name) {
    const res = await api.post("api/channels", { name });
    const json = res.data;
    if (!res.status || res.status >= 400) throw new Error(json?.message || "Failed to add channel");
    return json?.data;
  }
};

export default DropdownService;
