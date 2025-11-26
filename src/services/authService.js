import axios from "axios";

const API_URL = "http://localhost:3001/api/auth";

export const login = async (email, password) => {
  const { data } = await axios.post(`${API_URL}/login`, { email, password });
  return data;
};

export const register = async (token, formData) => {
  const { data } = await axios.post(`${API_URL}/register`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await axios.post(`${API_URL}/forgot-password`, { email });
  return data;
};

export const resetPassword = async (token, newPassword) => {
  const { data } = await axios.post(`${API_URL}/reset-password/${token}`, { newPassword });
  return data;
};
