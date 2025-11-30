import api from "../api/api";

const ProductHistoryService = {
  getAll: (params = {}) => api.get("api/product-history", { params }),
  exportCSV: (params = {}) => api.get("api/product-history/export", { params, responseType: 'blob' }),
};

export default ProductHistoryService;

