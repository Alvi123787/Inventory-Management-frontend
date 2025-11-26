const API_BASE = "http://localhost:3001";

// Helper to attach auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const DropdownService = {
  // Statuses
  async getStatuses() {
    const res = await fetch(`${API_BASE}/api/statuses`, { headers: getAuthHeaders() });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  },
  async addStatus(name) {
    const res = await fetch(`${API_BASE}/api/statuses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to add status');
    return json?.data;
  },

  // Payment Statuses
  async getPaymentStatuses() {
    const res = await fetch(`${API_BASE}/api/payment-statuses`, { headers: getAuthHeaders() });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  },
  async addPaymentStatus(name) {
    const res = await fetch(`${API_BASE}/api/payment-statuses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to add payment status');
    return json?.data;
  },

  // Couriers
  async getCouriers() {
    const res = await fetch(`${API_BASE}/api/couriers`, { headers: getAuthHeaders() });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  },
  async addCourier(name) {
    const res = await fetch(`${API_BASE}/api/couriers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to add courier');
    return json?.data;
  },

  // Channels
  async getChannels() {
    const res = await fetch(`${API_BASE}/api/channels`, { headers: getAuthHeaders() });
    const json = await res.json();
    // API returns objects with { id, name }, normalize to names
    const rows = Array.isArray(json?.data) ? json.data : [];
    return rows.map(r => r?.name).filter(Boolean);
  },
  async addChannel(name) {
    const res = await fetch(`${API_BASE}/api/channels`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to add channel');
    return json?.data;
  }
};

export default DropdownService;