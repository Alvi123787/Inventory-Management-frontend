// Centralized auth utilities

export const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
  } catch {}
  // Redirect to login page
  window.location.href = "/login";
};

export default { getToken, logout };