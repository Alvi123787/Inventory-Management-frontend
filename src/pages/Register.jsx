import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import "./Register.css"; // Scoped stylesheet

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    </div>
  );
};

export default Register;
