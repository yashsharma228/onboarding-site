import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import api from "../services/api.js";
<<<<<<< HEAD
import AlertBanner from "../components/AlertBanner.jsx";
=======
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

const AdminDashboard = () => {
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [banner, setBanner] = useState(null);

  const fetchSignups = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/signups");
      if (response.data.success) {
        setSignups(response.data.data || []);
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to load registrations from MySQL database.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignups();
  }, []);

  const handleUpdateStatus = async (id, status, companyName) => {
    setActionLoadingId(id);
    setBanner(null);
    try {
      const response = await api.patch(`/admin/signups/${id}/status`, { status });
      if (response.data.success) {
        setSignups((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status, reviewed_at: new Date().toISOString() } : item))
        );
        setBanner({
          type: "success",
          message: response.data.message || `${companyName} has been marked as ${status}.`,
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || `Failed to update status to ${status}.`,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, companyName) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the registration for "${companyName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoadingId(id);
    setBanner(null);
    try {
      const response = await api.delete(`/admin/signups/${id}`);
      if (response.data.success) {
        setSignups((prev) => prev.filter((item) => item.id !== id));
        setBanner({
          type: "success",
          message: response.data.message || `${companyName} has been permanently deleted.`,
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to delete registration.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered and searched signups
  const filteredSignups = signups.filter((item) => {
    const matchesFilter = filterStatus === "All" || item.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.company_name?.toLowerCase().includes(query) ||
      item.contact_name?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.business_type?.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: signups.length,
    pending: signups.filter((s) => s.status === "Pending").length,
    approved: signups.filter((s) => s.status === "Approved").length,
    rejected: signups.filter((s) => s.status === "Rejected").length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/80 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Top Header matching theme in image */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            New Client <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">Sign-Ups</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Review, approve, and manage incoming client onboarding registrations and portal credentials.
          </p>
        </div>
      </div>

      {/* Alert Banner */}
<<<<<<< HEAD
      <AlertBanner banner={banner} onClose={() => setBanner(null)} />
=======
      {banner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center justify-between shadow-xs ${
            banner.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-semibold">
            {banner.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-4"
          >
            &times;
          </button>
        </motion.div>
      )}
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

      {/* Table Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === status
                  ? "bg-purple-100/90 text-purple-700 border border-purple-200/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {status}
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/70 text-slate-700">
                {status === "All"
                  ? counts.all
                  : status === "Pending"
                  ? counts.pending
                  : status === "Approved"
                  ? counts.approved
                  : counts.rejected}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:w-72 sm:flex-none">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, contact, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Registrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-semibold">Loading registrations from database...</p>
          </div>
        ) : filteredSignups.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700">No registrations found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? "Try refining your search query." : "New client signups will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-4 px-6">Company & Type</th>
                  <th className="py-4 px-6">Contact Name</th>
                  <th className="py-4 px-6">Work Email</th>
                  <th className="py-4 px-6">Date Submitted</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSignups.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div>{item.company_name}</div>
                      {item.business_type && (
                        <span className="text-xs font-normal text-slate-400">
                          {item.business_type}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {item.contact_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <a
                        href={`mailto:${item.email}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {item.email}
                      </a>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === "Pending" && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, "Approved", item.company_name)}
                            disabled={actionLoadingId === item.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {item.status === "Pending" && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, "Rejected", item.company_name)}
                            disabled={actionLoadingId === item.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id, item.company_name)}
                          disabled={actionLoadingId === item.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                          title="Permanently Delete Registration"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
