import axios from "axios";

const API_URL = "http://localhost:3001/api/expenses";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const ExpenseService = {
  getAll: () => axios.get(API_URL, { headers: getAuthHeaders() }),
  add: (data) => axios.post(API_URL, data, { headers: getAuthHeaders() }),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() }),
  delete: (id) => axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() }),
};

export default ExpenseService;