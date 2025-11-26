import api from "../api/api";

export const getSettings = async () => {
  const res = await api.get("api/settings");
  return res.data;
};

export const updateSettings = async (payload) => {
  const res = await api.put("api/settings", payload);
  return res.data;
};

export default { getSettings, updateSettings };
