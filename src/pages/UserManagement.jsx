// Top imports inside UserManagement.jsx
import React, { useState, useEffect } from "react";
import { register } from "../services/authService";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

// Scoped CSS to prevent style leakage
const userManagementStyles = {
  container: {
    marginTop: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: "1rem",
    marginBottom: "1.5rem"
  },
  title: {
    color: "#2c3e50",
    margin: "0 0 0.25rem 0",
    fontSize: "1.75rem",
    fontWeight: "600"
  },
  subtitle: {
    color: "#7f8c8d",
    margin: "0",
    fontSize: "0.9rem"
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  cardHeader: {
    padding: "1rem 1.25rem",
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: "#f8f9fa"
  },
  cardHeaderPrimary: {
    backgroundColor: "#3498db",
    color: "white"
  },
  cardBody: {
    padding: "1.25rem"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  tableHeader: {
    backgroundColor: "#2c3e50",
    color: "white"
  },
  tableRow: {
    borderBottom: "1px solid #e0e0e0"
  },
  tableCell: {
    padding: "0.75rem",
    textAlign: "left"
  },
  badge: {
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "600",
    display: "inline-block"
  },
  badgePrimary: {
    backgroundColor: "#3498db",
    color: "white"
  },
  badgeDanger: {
    backgroundColor: "#e74c3c",
    color: "white"
  },
  button: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s ease"
  },
  buttonPrimary: {
    backgroundColor: "#3498db",
    color: "white"
  },
  buttonSuccess: {
    backgroundColor: "#27ae60",
    color: "white"
  },
  buttonDanger: {
    backgroundColor: "#e74c3c",
    color: "white"
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
    color: "#7f8c8d",
    cursor: "not-allowed"
  },
  buttonSmall: {
    padding: "0.375rem 0.75rem",
    fontSize: "0.8rem"
  },
  formGroup: {
    marginBottom: "1rem"
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "500",
    color: "#2c3e50"
  },
  input: {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #bdc3c7",
    borderRadius: "4px",
    fontSize: "0.875rem",
    boxSizing: "border-box"
  },
  alert: {
    padding: "0.75rem 1rem",
    borderRadius: "4px",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  alertSuccess: {
    backgroundColor: "#d5f4e6",
    color: "#27ae60",
    border: "1px solid #a3e4bf"
  },
  alertError: {
    backgroundColor: "#fadbd8",
    color: "#e74c3c",
    border: "1px solid #f5b7b1"
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: "inherit"
  },
  spinner: {
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #3498db",
    borderRadius: "50%",
    width: "2rem",
    height: "2rem",
    animation: "spin 1s linear infinite",
    margin: "0 auto"
  }
};

// Add keyframes for spinner animation
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempFeatureRoles, setTempFeatureRoles] = useState([]);
  const [assignUserId, setAssignUserId] = useState(null);
  const [assignMode, setAssignMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    feature_roles: []
  });
  
  const navigate = useNavigate();

  
  const role = localStorage.getItem("role");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (role === 'sub_admin') {
        const { data } = await api.get(`api/auth/account/users`);
        setUsers(data.data);
      } else {
        const { data } = await api.get(`api/auth/users`);
        setUsers(data.data);
      }
    } catch (error) {
      setMessage("Error fetching users: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      const url = role === 'sub_admin' ? `api/auth/account/users/${userId}` : `api/auth/users/${userId}`;
      await api.delete(url);
      setMessage("User deleted successfully");
      fetchUsers(); // Refresh list
    } catch (error) {
      setMessage("Error deleting user: " + (error.response?.data?.message || error.message));
    }
  };

  // Add new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (role === 'sub_admin') {
      setShowRoleModal(true);
      setAssignMode(false);
      return;
    }
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const data = await register(token, { name: form.name, email: form.email, password: form.password, role: form.role });
      if (data && data.showPageAssignModal && data.userId && (data.created_role === 'user')) {
        setAssignUserId(data.userId);
        setAssignMode(true);
        setShowRoleModal(true);
      }
      setForm({ name: "", email: "", password: "", role: "user", feature_roles: [] });
      setShowAddForm(false);
      setMessage("User added successfully");
      fetchUsers();
    } catch (err) {
      setMessage("Failed to add user: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'feature_roles') {
      const v = value;
      let next = Array.isArray(form.feature_roles) ? [...form.feature_roles] : [];
      if (checked) {
        if (!next.includes(v)) next.push(v);
      } else {
        next = next.filter((r) => r !== v);
      }
      if (next.length > 2) return; // enforce max 2 selections
      setForm({ ...form, feature_roles: next });
    } else {
      setForm({ ...form, [name]: value });
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

  const confirmCreateWithRoles = async () => {
    if (tempFeatureRoles.length < 1 || tempFeatureRoles.length > 2) {
      setMessage("Select 1 or 2 roles");
      return;
    }
    try {
      setLoading(true);
      const payload = { name: form.name, email: form.email, password: form.password, feature_roles: tempFeatureRoles };
      await api.post(`api/auth/account/users`, payload);
      setForm({ name: "", email: "", password: "", role: "user", feature_roles: [] });
      setTempFeatureRoles([]);
      setShowRoleModal(false);
      setShowAddForm(false);
      setMessage("User added successfully");
      fetchUsers();
    } catch (err) {
      setMessage("Failed to add user: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const confirmAssignRolesForAdmin = async () => {
    if (tempFeatureRoles.length < 1 || tempFeatureRoles.length > 2) {
      setMessage("Select 1 or 2 roles");
      return;
    }
    if (!assignUserId) return;
    try {
      setLoading(true);
      await api.post(`api/auth/users/${assignUserId}/roles`, { feature_roles: tempFeatureRoles });
      setTempFeatureRoles([]);
      setAssignUserId(null);
      setAssignMode(false);
      setShowRoleModal(false);
      setMessage("Access roles assigned successfully");
      fetchUsers();
    } catch (err) {
      setMessage("Failed to assign roles: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Get current user ID safely
  const getCurrentUserId = () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  const canDeleteRow = (u) => {
    const rowRole = String(u?.role || '').trim().toLowerCase();
    if (role === 'admin') return u?.id !== currentUserId;
    if (role === 'sub_admin') return rowRole === 'user';
    return false;
  };

  const displayAccess = (u) => {
    const fr = u?.feature_roles;
    if (!fr) return '—';
    if (Array.isArray(fr)) return fr.length ? fr.join(', ') : '—';
    if (typeof fr === 'string') return fr.length ? fr.split(',').join(', ') : '—';
    return '—';
  };

  return (
    <div style={userManagementStyles.container}>
      {/* Header */}
      <div style={userManagementStyles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={userManagementStyles.title}>User Management</h2>
            <p style={userManagementStyles.subtitle}>Admin Panel - Manage all system users</p>
          </div>
          <button 
            style={{
              ...userManagementStyles.button,
              ...userManagementStyles.buttonPrimary,
              ...(showAddForm ? userManagementStyles.buttonDanger : {})
            }}
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={role === 'sub_admin' && users.length >= 4}
          >
            {role === 'sub_admin' && users.length >= 4 ? "Limit Reached (4)" : (showAddForm ? "Cancel" : "Add New User")}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          ...userManagementStyles.alert,
          ...(message.includes('successfully') ? userManagementStyles.alertSuccess : userManagementStyles.alertError)
        }}>
          <span>{message}</span>
          <button 
            style={userManagementStyles.closeButton} 
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {showRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '420px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0e0e0' }}>
              <h4 style={{ margin: 0 }}>Select Roles (min 1, max 2)</h4>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {['products','orders','reports','dashboard','expenses','settings'].map((fr) => (
                  <label key={fr} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', border: '1px solid #e0e0e0', borderRadius: '6px' }}>
                    <input type="checkbox" checked={tempFeatureRoles.includes(fr)} onChange={() => toggleTempRole(fr)} />
                    {fr}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" style={{ ...userManagementStyles.button, ...userManagementStyles.buttonDanger }} onClick={() => { setShowRoleModal(false); setTempFeatureRoles([]); setAssignMode(false); setAssignUserId(null); }}>Cancel</button>
              <button type="button" style={{ ...userManagementStyles.button, ...userManagementStyles.buttonSuccess }} onClick={assignMode ? confirmAssignRolesForAdmin : confirmCreateWithRoles}>{assignMode ? 'Assign & Save' : 'Assign & Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div style={userManagementStyles.card}>
          <div style={{...userManagementStyles.cardHeader, ...userManagementStyles.cardHeaderPrimary}}>
            <h5 style={{margin: 0}}>Add New User</h5>
          </div>
          <div style={userManagementStyles.cardBody}>
            <form onSubmit={handleAddUser}>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem"}}>
                <div style={userManagementStyles.formGroup}>
                  <label style={userManagementStyles.label}>Full Name</label>
                  <input
                    type="text"
                    style={userManagementStyles.input}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={userManagementStyles.formGroup}>
                  <label style={userManagementStyles.label}>Email</label>
                  <input
                    type="email"
                    style={userManagementStyles.input}
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={userManagementStyles.formGroup}>
                  <label style={userManagementStyles.label}>Password</label>
                  <input
                    type="password"
                    style={userManagementStyles.input}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                </div>
                {role !== 'sub_admin' && (
                  <div style={userManagementStyles.formGroup}>
                    <label style={userManagementStyles.label}>Role</label>
                    <select 
                      style={userManagementStyles.input} 
                      name="role" 
                      value={form.role} 
                      onChange={handleChange}
                    >
                      <option value="user">Regular User</option>
                      <option value="admin">Administrator</option>
                      <option value="sub_admin">Sub-Admin</option>
                    </select>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                style={{
                  ...userManagementStyles.button,
                  ...userManagementStyles.buttonSuccess,
                  ...(loading ? userManagementStyles.buttonDisabled : {})
                }}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={userManagementStyles.card}>
        <div style={userManagementStyles.cardHeader}>
          <h5 style={{margin: 0}}>All Users ({users.length})</h5>
        </div>
        <div style={userManagementStyles.cardBody}>
          {loading ? (
            <div style={{textAlign: "center", padding: "2rem"}}>
              <div style={userManagementStyles.spinner}></div>
            </div>
          ) : (
            <div style={{overflowX: "auto"}}>
              <table style={userManagementStyles.table}>
                <thead>
                  <tr style={userManagementStyles.tableHeader}>
                    <th style={userManagementStyles.tableCell}>ID</th>
                    <th style={userManagementStyles.tableCell}>Name</th>
                    <th style={userManagementStyles.tableCell}>Email</th>
                    <th style={userManagementStyles.tableCell}>Role</th>
                    <th style={userManagementStyles.tableCell}>Owner</th>
                    <th style={userManagementStyles.tableCell}>Access</th>
                    <th style={userManagementStyles.tableCell}>Created</th>
                    {(role === 'admin' || role === 'sub_admin') && (
                      <th style={userManagementStyles.tableCell}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={userManagementStyles.tableRow}>
                      <td style={userManagementStyles.tableCell}>{user.id}</td>
                      <td style={userManagementStyles.tableCell}>{user.name}</td>
                      <td style={userManagementStyles.tableCell}>{user.email}</td>
                      <td style={userManagementStyles.tableCell}>
                        <span style={{
                          ...userManagementStyles.badge,
                          ...(user.role === 'admin' ? userManagementStyles.badgeDanger : user.role === 'sub_admin' ? userManagementStyles.badgePrimary : userManagementStyles.badgePrimary)
                        }}>
                          {user.role === 'admin' ? 'ADMIN' : user.role === 'sub_admin' ? 'SUB-ADMIN' : 'USER'}
                        </span>
                      </td>
                      <td style={userManagementStyles.tableCell}>
                        {user.role === 'user'
                          ? (user.created_by_name ? `${user.created_by_name}` : '—')
                          : (user.role === 'sub_admin' ? 'Admin' : '—')}
                      </td>
                      <td style={userManagementStyles.tableCell}>{displayAccess(user)}</td>
                      <td style={userManagementStyles.tableCell}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                      {(role === 'admin' || role === 'sub_admin') && (
                        <td style={{...userManagementStyles.tableCell, textAlign: 'right'}}>
                          <button
                            type="button"
                            style={{
                              ...userManagementStyles.button,
                              ...userManagementStyles.buttonDanger,
                              ...userManagementStyles.buttonSmall,
                              ...(canDeleteRow(user) ? {} : userManagementStyles.buttonDisabled)
                            }}
                            disabled={!canDeleteRow(user)}
                            onClick={() => deleteUser(user.id, user.name)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
