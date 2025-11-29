import api from "../api/api";

export const login = async (email, password) => {
  const payload = {
    email: String(email || "").trim().toLowerCase(),
    password: String(password || "").trim(),
  };
  const { data } = await api.post("/api/auth/login", payload);
  return data;
};

export const register = async (_token, formData) => {
  const { data } = await api.post("api/auth/register", formData);
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post("api/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async (token, newPassword) => {
  const { data } = await api.post(`api/auth/reset-password/${token}`, { newPassword });
  return data;
};
