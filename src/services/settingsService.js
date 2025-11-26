const API_BASE = "http://localhost:3001/api/settings";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const getSettings = async () => {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() });
  return res.json();
};

export const updateSettings = async (payload) => {
  const res = await fetch(API_BASE, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  return res.json();
};

export default { getSettings, updateSettings };