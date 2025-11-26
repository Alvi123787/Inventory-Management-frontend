import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:3001/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
        />
        <button
          type="submit"
          style={{ padding: "10px 20px", background: "#007bff", color: "#fff", border: "none" }}
        >
          Reset Password
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ResetPassword;
