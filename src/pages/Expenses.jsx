import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Expenses.css";
import { formatCurrency } from "../utils/currency";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ 
    title: "", 
    category: "", 
    amount: "", 
    notes: "" 
  });
  const [editingId, setEditingId] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const API = import.meta.env.VITE_API_BASE_URL;

  // Build dynamic category list from existing expenses for filtering
  const uniqueCategories = Array.from(new Set(expenses.map((exp) => exp.category)));

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [expenses]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(data);
    } catch (err) {
      setError("Failed to fetch expenses. Please try again.");
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title || !form.amount) {
      setError("Title and amount are required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (editingId) {
        await axios.put(`${API}/api/expenses/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Expense updated successfully!");
      } else {
        await axios.post(`${API}/api/expenses`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Expense added successfully!");
      }
      setForm({ title: "", category: "", amount: "", notes: "" });
      setEditingId(null);
      fetchExpenses();
      
      // Auto-hide success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(editingId ? "Failed to update expense. Please try again." : "Failed to add expense. Please try again.");
      console.error(editingId ? "Error updating expense:" : "Error adding expense:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Expense deleted successfully!");
      fetchExpenses();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete expense. Please try again.");
      console.error("Error deleting expense:", err);
    }
  };

  const calculateTotal = () => {
    const filteredExpenses = filterCategory === "All" 
      ? expenses 
      : expenses.filter(exp => exp.category === filterCategory);
    
    const sum = filteredExpenses.reduce((total, exp) => total + parseFloat(exp.amount), 0);
    setTotal(sum);
  };

  const filteredExpenses = filterCategory === "All" 
    ? expenses 
    : expenses.filter(exp => exp.category === filterCategory);

  const getCategoryColor = (category) => {
    const colors = {
      Food: "#22C55E",
      Travel: "#3B82F6",
      Bills: "#EF4444",
      Shopping: "#8B5CF6",
      Entertainment: "#F59E0B",
      Healthcare: "#EC4899",
      Other: "#6B7280"
    };
    return colors[category] || "#6B7280";
  };

  const handleEdit = (expense) => {
    setForm({
      title: expense.title || "",
      category: expense.category || "",
      amount: String(expense.amount ?? ""),
      notes: expense.notes || ""
    });
    setEditingId(expense.id);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ title: "", category: "", amount: "", notes: "" });
  };

  return (
    <div className="expenses-page">
      {/* Header Section */}
      <header className="expenses-header">
        <div className="header-content">
          <h1 className="page-title text-light">Expense Tracker</h1>
          <div className="header-stats">
            <div className="summary-card">
              <div className="summary-content">
                <span className="summary-label">Total Spent This Month</span>
                <span className="summary-amount">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="expenses-content">
        <div className="content-grid">
          {/* Add Expense Form */}
          <section className="form-section">
            <div className="form-card">
              <h2 className="section-title">{editingId ? "Edit Expense" : "Add New Expense"}</h2>
              <form onSubmit={handleSubmit} className="expense-form">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">Title *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Enter expense title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category" className="form-label">Category</label>
                  <input
                    id="category"
                    type="text"
                    placeholder="Enter category (e.g., Food, Travel)"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="amount" className="form-label">Amount *</label>
                  <div className="amount-input-wrapper">
                    {/* <span className="currency-symbol">PKR</span> */}
                    <input
                      id="amount"
                      type="number"
                      placeholder="PKR 0.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="form-input amount-input"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    id="notes"
                    placeholder="Additional notes (optional)"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="add-button"
                    disabled={loading}
                  >
                    {editingId ? (loading ? "Updating..." : "Update Expense") : (loading ? "Adding..." : "Add Expense")}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* Expenses List */}
          <section className="list-section">
            <div className="list-card">
              <div className="list-header">
                <h2 className="section-title">Recent Expenses</h2>
                <div className="filter-controls">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">All Categories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notifications */}
              {error && (
                <div className="notification error">
                  <span className="notification-icon">⚠️</span>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="notification success">
                  <span className="notification-icon">✅</span>
                  {success}
                </div>
              )}

              {/* Loading State */}
              {loading && expenses.length === 0 && (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading expenses...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredExpenses.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <p>No expenses found</p>
                  <span>Start by adding your first expense above</span>
                </div>
              )}

              {/* Expenses Table */}
              {!loading && filteredExpenses.length > 0 && (
                <div className="table-container">
                  <table className="expenses-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="table-row">
                          <td className="date-cell">
                            {expense.date ? new Date(expense.date).toLocaleDateString() : "—"}
                          </td>
                          <td className="title-cell">{expense.title}</td>
                          <td className="category-cell">
                            <span 
                              className="category-badge"
                              style={{ 
                                backgroundColor: getCategoryColor(expense.category) + '20',
                                color: getCategoryColor(expense.category)
                              }}
                            >
                              {expense.category}
                            </span>
                          </td>
                          <td className="amount-cell">
                            {formatCurrency(parseFloat(expense.amount))}
                          </td>
                          <td className="notes-cell">
                            {expense.notes || "-"}
                          </td>
                          <td className="actions-cell">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="action-button edit-button text-black"
                              title="Edit expense"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="action-button delete-button text-black"
                              title="Delete expense"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total Footer */}
              {filteredExpenses.length > 0 && (
                <div className="table-footer">
                  <div className="total-display">
                    <span className="total-label">
                      Total {filterCategory !== "All" ? `(${filterCategory})` : ""}:
                    </span>
                    <span className="total-amount">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
