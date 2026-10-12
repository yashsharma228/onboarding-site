import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api.js";
import CKEditorDescription from "../components/CKEditorDescription.jsx";

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);

  // Form state for add / edit: single price with currency prefix
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    currency: "INR",
    price: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Currency helper formatting
  const getCurrencySymbol = (curr) => {
    switch (curr?.toUpperCase()) {
      case "GBP":
        return "£";
      case "EUR":
        return "€";
      case "INR":
      default:
        return "₹";
    }
  };

  const getCurrencyLabel = (curr) => {
    switch (curr?.toUpperCase()) {
      case "GBP":
        return "British Pound (GBP)";
      case "EUR":
        return "Euro (EUR)";
      case "INR":
      default:
        return "Indian Rupee (INR)";
    }
  };

  // Fetch all plans from backend
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/plans");
      if (res.data.success) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to load plans from database.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      currency: "INR",
      price: "",
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || "",
      currency: plan.currency || "INR",
      price: plan.price || "",
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.post("/admin/plans", formData);
      if (res.data.success) {
        setFeedback({
          type: "success",
          message: res.data.message || `Plan "${formData.title}" created successfully!`,
        });
        setIsAddModalOpen(false);
        resetForm();
        fetchPlans();
      } else {
        setFeedback({
          type: "error",
          message: res.data.message || "Failed to create plan.",
        });
      }
    } catch (err) {
      console.error("Error creating plan:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to create plan.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setFormSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.put(`/admin/plans/${editingPlan.id}`, formData);
      if (res.data.success) {
        setFeedback({
          type: "success",
          message: res.data.message || `Plan "${formData.title}" updated successfully!`,
        });
        setEditingPlan(null);
        resetForm();
        fetchPlans();
      } else {
        setFeedback({
          type: "error",
          message: res.data.message || "Failed to update plan.",
        });
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to update plan.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    setFormSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.delete(`/admin/plans/${deletingPlan.id}`);
      if (res.data.success) {
        setFeedback({
          type: "success",
          message: res.data.message || `Plan "${deletingPlan.title}" has been permanently deleted.`,
        });
        setDeletingPlan(null);
        fetchPlans();
      } else {
        setFeedback({
          type: "error",
          message: res.data.message || "Failed to delete plan.",
        });
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to delete plan.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const getPlanPriceValue = (plan) => {
    return Number(plan.price || 0);
  };

  const filteredPlans = plans.filter((p) => {
    const q = searchTerm.toLowerCase();
    const curr = p.currency || "INR";
    const priceVal = getPlanPriceValue(p);
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      curr.toLowerCase().includes(q) ||
      priceVal.toString().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Quicksand']">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Subscription <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">Plans</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure dynamic plans with multi-currency support in Rupees (₹), Pounds (£), and Euro (€)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all shadow-md shadow-purple-600/20 text-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Plan</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search plans by title or price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="text-indigo-600 font-bold">{filteredPlans.length}</span> of {plans.length} plan{plans.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-semibold text-slate-500">Loading plans from database...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700">No Plans Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm ? "No plans match your search query." : "You haven't created any subscription plans yet."}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Create First Plan
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">#</th>
                  <th className="py-3.5 px-6">Plan Title</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPlans.map((plan, idx) => {
                  const curr = plan.currency || "INR";
                  const priceVal = getPlanPriceValue(plan);
                  const symbol = getCurrencySymbol(curr);

                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                        {plan.title}
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-sm truncate" title={(plan.description || "").replace(/<[^>]*>?/gm, "")}>
                        {(plan.description || "").replace(/<[^>]*>?/gm, "").trim() || "—"}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border ${
                            curr === "INR"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : curr === "GBP"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-purple-50 text-purple-700 border-purple-100"
                          }`}
                        >
                          <span className="text-sm">{symbol}</span>
                          <span>
                            {priceVal.toLocaleString(
                              curr === "INR" ? "en-IN" : curr === "GBP" ? "en-GB" : "de-DE",
                              { minimumFractionDigits: 2 }
                            )}
                          </span>
                          <span className="text-[10px] font-semibold opacity-75 uppercase ml-0.5">
                            {curr}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewingPlan(plan)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="View Details"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(plan)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Edit Plan"
                          >
                            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingPlan(plan)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Delete Plan"
                          >
                            <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD NEW PLAN MODAL ================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-xl font-extrabold text-slate-900">Add New Plan</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plan Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starter, Growth, Enterprise"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Description (CKEditor)</span>
                    <span className="text-[11px] font-semibold text-indigo-500 normal-case">Rich text & lists supported</span>
                  </label>
                  <CKEditorDescription
                    key={isAddModalOpen ? "add-plan-editor" : "inactive-editor"}
                    value={formData.description}
                    onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                    placeholder="Brief description of features and services included..."
                  />
                </div>

                {/* Single Price Input with Currency Prefix Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plan Price *
                  </label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-white shadow-2xs">
                    {/* Prefix Dropdown */}
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-3.5 py-2.5 bg-slate-50 text-slate-700 text-sm font-bold border-r border-slate-200 focus:outline-hidden cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <option value="INR">Rupees (₹)</option>
                      <option value="GBP">Pounds (£)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>

                    {/* Single Price Input */}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="flex-1 px-4 py-2.5 text-slate-900 text-sm font-semibold focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select your preferred currency prefix (Rupees, Pounds, or Euro) and enter the amount.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all text-sm shadow-md shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
                  >
                    {formSubmitting ? "Saving..." : "Save Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= EDIT PLAN MODAL ================= */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-xl font-extrabold text-slate-900">Edit Plan: {editingPlan.title}</h3>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plan Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Description (CKEditor)</span>
                    <span className="text-[11px] font-semibold text-indigo-500 normal-case">Rich text & lists supported</span>
                  </label>
                  <CKEditorDescription
                    key={editingPlan ? `edit-plan-${editingPlan.id}` : "inactive-edit"}
                    value={formData.description}
                    onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                    placeholder="Brief description of features and services included..."
                  />
                </div>

                {/* Single Price Input with Currency Prefix Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plan Price *
                  </label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-white shadow-2xs">
                    {/* Prefix Dropdown */}
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-3.5 py-2.5 bg-slate-50 text-slate-700 text-sm font-bold border-r border-slate-200 focus:outline-hidden cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <option value="INR">Rupees (₹)</option>
                      <option value="GBP">Pounds (£)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>

                    {/* Single Price Input */}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="flex-1 px-4 py-2.5 text-slate-900 text-sm font-semibold focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select your preferred currency prefix (Rupees, Pounds, or Euro) and enter the amount.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all text-sm shadow-md shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
                  >
                    {formSubmitting ? "Updating..." : "Update Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= VIEW PLAN MODAL ================= */}
      <AnimatePresence>
        {viewingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">
                    Plan Details
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-2">{viewingPlan.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPlan(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </h4>
                <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  {viewingPlan.description ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-700 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold"
                      dangerouslySetInnerHTML={{ __html: viewingPlan.description }}
                    />
                  ) : (
                    <span className="text-slate-400 italic">No description provided.</span>
                  )}
                </div>
              </div>

              {/* Single Price Card with Currency Details */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Plan Price
                </h4>
                {(() => {
                  const curr = viewingPlan.currency || "INR";
                  const priceVal = getPlanPriceValue(viewingPlan);
                  const symbol = getCurrencySymbol(curr);
                  const label = getCurrencyLabel(curr);

                  return (
                    <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                        {label}
                      </span>
                      <span className="text-3xl font-extrabold text-indigo-900 mt-1 block">
                        {symbol}{" "}
                        {priceVal.toLocaleString(
                          curr === "INR" ? "en-IN" : curr === "GBP" ? "en-GB" : "de-DE",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-400">
                <span>Created: {new Date(viewingPlan.created_at).toLocaleDateString()}</span>
                <button
                  type="button"
                  onClick={() => setViewingPlan(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-extrabold text-slate-900">Delete Plan?</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Are you sure you want to permanently delete plan{" "}
                  <strong className="text-slate-800">"{deletingPlan.title}"</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingPlan(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all text-sm shadow-md shadow-rose-600/20 disabled:opacity-60 cursor-pointer"
                >
                  {formSubmitting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPlans;
