import React, { useState } from "react";
import { forgotPassword } from "../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await forgotPassword(email);
      setMessage(data.message || "If that email exists, a reset link has been sent.");
      // Show dev preview URL if provided (Ethereal or test SMTP)
      if (data.previewUrl) setPreviewUrl(data.previewUrl);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send reset link");
    }
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
      {previewUrl && (
        <p>
          Developer preview: <a href={previewUrl} target="_blank" rel="noreferrer">View test email</a>
        </p>
      )}
    </div>
  );
};

export default ForgotPassword;
