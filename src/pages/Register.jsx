import React, { useState } from "react";
import { register } from "../services/authService";
import api from "../api/api";
import "./Register.css"; // Scoped stylesheet

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempFeatureRoles, setTempFeatureRoles] = useState([]);
  const [createdUserId, setCreatedUserId] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validatePassword = (password) => {
    // Must contain uppercase, lowercase, number, special char, min 6 chars
    // Allow any characters but enforce presence via lookaheads
    // - Lowercase, Uppercase, Digit, Non-alphanumeric (symbol), length ≥ 6
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token || userRole !== "admin") {
      return setMessage("Access denied. Only admins can register new users.");
    }

    if (form.password !== form.confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    if (!validatePassword(form.password)) {
      return setMessage(
        "Password must include at least one uppercase, one lowercase, one number, one symbol, and be 6+ characters."
      );
    }

    setIsLoading(true);
    setMessage("");

    try {
      const data = await register(token, form);
      setMessage(data.message || "User registered successfully.");
      if (data && data.showPageAssignModal && data.userId && (data.created_role === 'user')) {
        setCreatedUserId(data.userId);
        setShowRoleModal(true);
      }
      // Integrations setup removed
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTempRole = (v) => {
    let next = Array.isArray(tempFeatureRoles) ? [...tempFeatureRoles] : [];
    if (next.includes(v)) {
      next = next.filter((r) => r !== v);
    } else {
      if (next.length >= 2) return;
      next.push(v);
    }
    setTempFeatureRoles(next);
  };

  const confirmAssignRoles = async () => {
    if (!createdUserId) return;
    if (!Array.isArray(tempFeatureRoles) || tempFeatureRoles.length < 1 || tempFeatureRoles.length > 2) {
      setMessage("Select 1 or 2 roles");
      return;
    }
    try {
      setIsLoading(true);
      const payload = { feature_roles: tempFeatureRoles };
      await api.post(`api/auth/users/${createdUserId}/roles`, payload);
      setTempFeatureRoles([]);
      setShowRoleModal(false);
      setMessage("Access roles assigned successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to assign roles");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2 className="page-title">Add New User</h2>
        <p className="subtitle">Admin Only — Create new user accounts</p>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <small>
                Must include upper/lowercase letters, number & special character.
              </small>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>User Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="user">Regular User</option>
                <option value="admin">Administrator</option>
                <option value="sub_admin">Sub-Admin</option>
              </select>
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Creating User..." : "Create User"}
            </button>

            {message && (
              <div
                className={`alert ${
                  message.includes("success") ? "alert-success" : "alert-error"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h5>Assign Page Access</h5>
            </div>
            <div className="modal-body">
              <p>Select up to 2 pages the new user can access:</p>
              <div className="feature-grid">
                {['products','orders','reports','dashboard','expenses','settings'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`feature-pill ${tempFeatureRoles.includes(f) ? 'selected' : ''}`}
                    onClick={() => toggleTempRole(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => { setShowRoleModal(false); setTempFeatureRoles([]); }}>Cancel</button>
              <button type="button" className="btn-primary" onClick={confirmAssignRoles}>Assign & Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
