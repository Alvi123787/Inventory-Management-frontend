import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import "./Login.css"
const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form.email, form.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);
      setMessage("Login successful!");
      navigate("/"); // Redirect to dashboard after login
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>
      </form>

      <div style={{ marginTop: "10px" }}>
        <Link to="/forgot-password">Forgot your password?</Link>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
