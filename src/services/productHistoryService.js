import api from "../api/api";

const ProductHistoryService = {
  getAll: (params = {}) => api.get("api/product-history", { params }),
  exportCSV: (params = {}) => api.get("api/product-history/export", { params, responseType: 'blob' }),
  deleteOne: (id) => api.delete(`api/product-history/${id}`),
  clearAll: () => api.delete('api/product-history'),
};

export default ProductHistoryService;
