import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [features, setFeatures] = useState([]);

  // Detect login state on route change
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    setIsLoggedIn(!!token);
    setUserRole(role || null);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const fr = Array.isArray(user.feature_roles) ? user.feature_roles : [];
      setFeatures(fr);
    } catch {}
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/login");
  };

  const getUserName = () => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData).name : "User";
    } catch {
      return "User";
    }
  };

  const can = (f) => userRole === "admin" || userRole === "sub_admin" || features.includes(f);

  return (
    <nav className="dnb-navbar navbar navbar-expand-lg navbar-dark">
      <div className="container-fluid">
        {/* Brand */}
        <NavLink className="dnb-navbar-brand navbar-brand" to="/">
          Dashboard
        </NavLink>

        {/* Toggler for mobile */}
        <button
          className="dnb-navbar-toggler navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#dnbNavbarNav"
          aria-controls="dnbNavbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="dnb-navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="dnbNavbarNav">
          <ul className="dnb-navbar-nav navbar-nav me-auto">
            {can("dashboard") && (
              <li className="dnb-nav-item nav-item">
                <NavLink className="dnb-nav-link nav-link" to="/" end>
                  Dashboard
                </NavLink>
              </li>
            )}

            {/* Admin Only Dropdown */}
            {isLoggedIn && userRole === "admin" && (
              <li className="dnb-nav-item nav-item dropdown">
                <a
                  className="dnb-dropdown-toggle nav-link dropdown-toggle"
                  href="#"
                  id="dnbAdminDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Admin
                </a>
                <ul
                  className="dnb-dropdown-menu dropdown-menu"
                  aria-labelledby="dnbAdminDropdown"
                >
                  <li>
                    <NavLink
                      className="dnb-dropdown-item dropdown-item"
                      to="/user-management"
                    >
                      Manage Users
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      className="dnb-dropdown-item dropdown-item"
                      to="/register"
                    >
                      Add User
                    </NavLink>
                  </li>
                  {/* Integrations link removed */}
                </ul>
              </li>
            )}

            {/* Sub-Admin: Add Users link */}
            {isLoggedIn && userRole === "sub_admin" && (
              <li className="dnb-nav-item nav-item dropdown">
                <a
                  className="dnb-dropdown-toggle nav-link dropdown-toggle"
                  href="#"
                  id="dnbUsersDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Users
                </a>
                <ul
                  className="dnb-dropdown-menu dropdown-menu"
                  aria-labelledby="dnbUsersDropdown"
                >
                  <li>
                    <NavLink
                      className="dnb-dropdown-item dropdown-item"
                      to="/user-management"
                    >
                      Add Users
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {can("products") && (
              <li className="dnb-nav-item nav-item dropdown">
                <a
                  className="dnb-dropdown-toggle nav-link dropdown-toggle"
                  href="#"
                  id="dnbProductsDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Products
                </a>
                <ul
                  className="dnb-dropdown-menu dropdown-menu"
                  aria-labelledby="dnbProductsDropdown"
                >
                  <li>
                    <NavLink
                      className="dnb-dropdown-item dropdown-item"
                      to="/products"
                    >
                      Add Product
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      className="dnb-dropdown-item dropdown-item"
                      to="/showproducts"
                    >
                      Show Products
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {can("orders") && (
              <li className="dnb-nav-item nav-item dropdown">
                <a
                  className="dnb-dropdown-toggle nav-link dropdown-toggle"
                  href="#"
                  id="dnbOrdersDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Orders
                </a>
                <ul
                  className="dnb-dropdown-menu dropdown-menu"
                  aria-labelledby="dnbOrdersDropdown"
                >
                  <li>
                    <NavLink
                      className="dnb-dropdown-item dropdown-item"
                      to="/orders"
                    >
                      Add Order
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      className="dnb-dropdown-item dropdown-item"
                      to="/showorders"
                    >
                      Show Orders
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {can("reports") && (
              <li className="dnb-nav-item nav-item">
                <NavLink className="dnb-nav-link nav-link" to="/reports">
                  Reports
                </NavLink>
              </li>
            )}
            {can("expenses") && (
              <li className="dnb-nav-item nav-item">
                <NavLink className="dnb-nav-link nav-link" to="/expenses">
                  Expenses
                </NavLink>
              </li>
            )}
            {can("settings") && (
              <li className="dnb-nav-item nav-item">
                <NavLink className="dnb-nav-link nav-link" to="/settings">
                  Settings
                </NavLink>
              </li>
            )}
          </ul>

          {/* Right Side Actions */}
          <div className="dnb-navbar-actions">
            {/* User Info & Actions */}
            {isLoggedIn ? (
              <>
                <div className="dnb-user-info-container">
                  <span
                    className={`dnb-role-badge ${
                      userRole === "admin" ? "dnb-admin" : userRole === "sub_admin" ? "dnb-subadmin" : "dnb-user"
                    }`}
                  >
                    {userRole === "admin" ? "ADMIN" : userRole === "sub_admin" ? "SUB-ADMIN" : "USER"}
                  </span>
                </div>

                <button
                  className="dnb-btn dnb-logout-btn"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                </button>
              </>
            ) : (
              <button
                className="dnb-btn dnb-login-btn"
                onClick={() => navigate("/login")}
              >
                <FontAwesomeIcon icon={faSignInAlt} /> Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
