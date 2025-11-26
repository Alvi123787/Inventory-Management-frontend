import api from "../api/api";

const ExpenseService = {
  getAll: () => api.get("api/expenses"),
  add: (data) => api.post("api/expenses", data),
  update: (id, data) => api.put(`api/expenses/${id}`, data),
  delete: (id) => api.delete(`api/expenses/${id}`),
};

export default ExpenseService;
