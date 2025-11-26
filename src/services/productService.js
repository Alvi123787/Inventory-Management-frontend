import api from "../api/api";

// Use shared axios client with env base and interceptors
const ProductService = {
  getAll: () => api.get("api/products"),
  add: (data) => api.post("api/products", data),
  update: (id, data) => api.put(`api/products/${id}`, data),
  delete: (id) => api.delete(`api/products/${id}`),
};

export default ProductService;
