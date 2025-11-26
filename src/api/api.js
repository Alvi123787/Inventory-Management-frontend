// src/api/api.js
import axios from "axios";
import { getToken, logout } from "../utils/auth";

const api = axios.create({
  baseURL: "https://inventory-management-backend-flame.vercel.app",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) logout();
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post("api/auth/login", { email, password }),
  register: (data) => api.post("api/auth/register", data),
};

export default api;
