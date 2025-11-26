import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaBox, FaClipboardList, FaChartBar } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  let role = null;
  let features = [];
  try {
    role = localStorage.getItem("role");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    features = Array.isArray(user.feature_roles) ? user.feature_roles : [];
  } catch {}
  const can = (f) => role === 'admin' || role === 'sub_admin' || features.includes(f);

  return (
    <>
      {/* Toggle Button (Mobile) */}
      <button
        className="btn btn-dark d-md-none position-fixed top-0 start-0 m-3 z-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div
        className={`bg-dark text-white p-3 vh-100 position-fixed top-0 start-0 transition-all ${
          isOpen ? "translate-none" : "d-none"
        } d-md-block`}
        style={{ width: "240px", zIndex: 2 }}
      >
        <h4 className="text-center mb-4">Dashboard</h4>

        <ul className="nav flex-column gap-2">
          {can('products') && (
            <li className="nav-item">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `nav-link text-white d-flex align-items-center gap-2 ${
                    isActive ? "bg-secondary rounded" : ""
                  }`
                }
              >
                <FaBox /> Products
              </NavLink>
            </li>
          )}

          {can('orders') && (
            <li className="nav-item">
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `nav-link text-white d-flex align-items-center gap-2 ${
                    isActive ? "bg-secondary rounded" : ""
                  }`
                }
              >
                <FaClipboardList /> Orders
              </NavLink>
            </li>
          )}

          {can('reports') && (
            <li className="nav-item">
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `nav-link text-white d-flex align-items-center gap-2 ${
                    isActive ? "bg-secondary rounded" : ""
                  }`
                }
              >
                <FaChartBar /> Reports
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
