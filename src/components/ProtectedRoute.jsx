import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roleRequired, featureRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  let features = [];
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    features = Array.isArray(user.feature_roles) ? user.feature_roles : [];
  } catch {}

  const NoAccess = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
      <div style={{ background: "#fff", border: "1px solid #f5c2c7", color: "#842029", padding: "1rem 1.25rem", borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.08)", maxWidth: 600, textAlign: "center" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Only Admin or Sub-Admin can access it!</div>
        <div>You don't have permission to access this page.</div>
      </div>
    </div>
  );

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired) {
    const allowed = Array.isArray(roleRequired) ? roleRequired : [roleRequired];
    if (!allowed.includes(role)) {
      return <NoAccess />;
    }
  }

  if (featureRequired) {
    const required = Array.isArray(featureRequired) ? featureRequired : [featureRequired];
    if (role === "admin" || role === "sub_admin") {
      return children;
    }
    const hasAll = required.every((f) => features.includes(f));
    if (!hasAll) {
      return <NoAccess />;
    }
  }

  return children;
}

export default ProtectedRoute;
