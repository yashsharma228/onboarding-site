import React, { useState, useEffect, useMemo } from "react";
<<<<<<< HEAD
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api.js";
import AlertBanner from "../components/AlertBanner.jsx";
=======
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api.js";
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

// Currency formatter helper
const formatCurrency = (amount, currency = "INR") => {
  const num = Number(amount) || 0;
  const symbolMap = {
    INR: "₹",
    GBP: "£",
    EUR: "€",
    USD: "$",
  };
  const symbol = symbolMap[currency] || (currency === "INR" ? "₹" : `${currency} `);
  return `${symbol}${num.toLocaleString("en-IN")}`;
};

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [signatureFilter, setSignatureFilter] = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [banner, setBanner] = useState(null);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'view' | 'addPlan' | 'delete' | null
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
<<<<<<< HEAD
=======
  const [actionMenu, setActionMenu] = useState(null);
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

  // Add Plan modal state
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [savingPlans, setSavingPlans] = useState(false);

  // Record Payment state (inside View Modal)
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "Bank Transfer",
    transaction_id: "",
    notes: "",
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // View modal tab
<<<<<<< HEAD
  const [viewTab, setViewTab] = useState("plans"); // 'plans' | 'agreement'
=======
  const [viewTab, setViewTab] = useState("overview"); // 'overview' | 'plans' | 'payments' | 'agreement' | 'activity'
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

  // Fetch all clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/clients?source=signup_form&archived=${showArchived}`);
      if (response.data.success) {
        setClients(response.data.data || []);
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to load client accounts from database.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all existing plans for the Add Plan popup
  const fetchPlans = async () => {
    try {
      const response = await api.get("/admin/plans");
      if (response.data.success) {
        setAvailablePlans(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchPlans();
  }, [showArchived]);

<<<<<<< HEAD
  // Open View Modal and fetch comprehensive client details
  const handleOpenView = async (client, initialTab = "plans") => {
=======
  useEffect(() => {
    const handleClose = () => setActionMenu(null);
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActionMenu(null);
    };
    window.addEventListener("click", handleClose);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggleActionMenu = (e, client) => {
    e.stopPropagation();
    if (actionMenu?.client?.id === client.id) {
      setActionMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 190;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > menuHeight;

    setActionMenu({
      client,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      right: Math.max(16, window.innerWidth - rect.right),
    });
  };

  // Open View Modal and fetch comprehensive client details
  const handleOpenView = async (client, initialTab = "overview") => {
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
    setSelectedClient(client);
    setActiveModal("view");
    setViewTab(initialTab);
    setLoadingDetails(true);
    setShowPaymentForm(false);
    try {
      const response = await api.get(`/admin/clients/${client.id}`);
      if (response.data.success) {
        setClientDetails(response.data.data);
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to load complete client details.",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Add Plan Modal
  const handleOpenAddPlan = (client) => {
    setSelectedClient(client);
    // Pre-populate with currently assigned plan IDs
    const currentIds = (client.assigned_plans || []).map((p) => p.id);
    setSelectedPlanIds(currentIds);
    setActiveModal("addPlan");
  };

  // Save Assigned Plans
  const handleSavePlans = async () => {
    if (!selectedClient) return;
    setSavingPlans(true);
    try {
      const response = await api.post(`/admin/clients/${selectedClient.id}/plans`, {
        plan_ids: selectedPlanIds,
      });
      if (response.data.success) {
        setBanner({
          type: "success",
          message: response.data.message || "Assigned plans updated successfully.",
        });
        setActiveModal(null);
        await fetchClients();
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to update assigned plans.",
      });
    } finally {
      setSavingPlans(false);
    }
  };

  // Toggle plan selection in Add Plan modal
  const handleTogglePlan = (planId) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  // Open Delete / Archive Confirmation Dialog
  const handleOpenDelete = (client) => {
    setSelectedClient(client);
    setActiveModal("delete");
  };

  // Execute Delete / Archive
  const handleConfirmDelete = async () => {
    if (!selectedClient) return;
    try {
      const response = await api.delete(`/admin/clients/${selectedClient.id}`);
      if (response.data.success) {
        setBanner({
          type: "success",
          message: response.data.message,
        });
        setActiveModal(null);
        await fetchClients();
      } else {
        setBanner({
          type: "error",
          message: response.data.message || "Failed to delete client.",
        });
        setActiveModal(null);
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to delete client.",
      });
      setActiveModal(null);
    }
  };

  // Restore an archived client
  const handleRestoreClient = async (id, companyName) => {
    try {
      const response = await api.patch(`/admin/clients/${id}/restore`);
      if (response.data.success) {
        setBanner({
          type: "success",
          message: response.data.message || `${companyName} has been restored.`,
        });
        await fetchClients();
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to restore client.",
      });
    }
  };

  // Update Project Status directly
  const handleUpdateProjectStatus = async (clientId, newStatus) => {
    try {
      const response = await api.patch(`/admin/clients/${clientId}/status`, {
        project_status: newStatus,
      });
      if (response.data.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, project_status: newStatus } : c))
        );
        if (clientDetails && clientDetails.id === clientId) {
          setClientDetails((prev) => ({ ...prev, project_status: newStatus }));
        }
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to update project status.",
      });
    }
  };


  // Toggle Signature Status
  const handleToggleSignature = async (clientId, currentStatus) => {
    const nextStatus = currentStatus === "Signed" ? "Awaiting" : "Signed";
    try {
      const response = await api.patch(`/admin/clients/${clientId}/status`, {
        signature_status: nextStatus,
        signature_name: selectedClient?.contact_name || "Authorized Signer",
      });
      if (response.data.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, signature_status: nextStatus } : c))
        );
        if (clientDetails && clientDetails.id === clientId) {
          setClientDetails((prev) => ({
            ...prev,
            signature_status: nextStatus,
            signature_date: nextStatus === "Signed" ? new Date().toISOString() : null,
          }));
        }
        setBanner({
          type: "success",
          message: `Signature status marked as ${nextStatus}.`,
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to update signature status.",
      });
    }
  };

  // Record a payment inside the View Modal
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    setRecordingPayment(true);
    try {
      const response = await api.post(`/admin/clients/${selectedClient.id}/payments`, paymentForm);
      if (response.data.success) {
        setBanner({
          type: "success",
          message: response.data.message || "Payment recorded successfully.",
        });
        setPaymentForm({
          amount: "",
          payment_method: "Bank Transfer",
          transaction_id: "",
          notes: "",
        });
        setShowPaymentForm(false);
        // Refresh details & list
        const res = await api.get(`/admin/clients/${selectedClient.id}`);
        if (res.data.success) setClientDetails(res.data.data);
        await fetchClients();
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to record payment.",
      });
    } finally {
      setRecordingPayment(false);
    }
  };

  // Filter clients based on search & drop downs
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.company_name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.login_id?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.assigned_plans_names?.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesPayment = paymentFilter === "All" || c.payment_status === paymentFilter;
      const matchesProject = projectFilter === "All" || c.project_status === projectFilter;
      const matchesSignature = signatureFilter === "All" || c.signature_status === signatureFilter;

      return matchesSearch && matchesPayment && matchesProject && matchesSignature;
    });
  }, [clients, searchQuery, paymentFilter, projectFilter, signatureFilter]);


  // Badges
  const getPaymentBadge = (status) => {
    switch (status) {
      case "Fully Paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Fully Paid
          </span>
        );
      case "Advance Paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Advance Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Not Paid
          </span>
        );
    }
  };

  const getSignatureBadge = (status) => {
    if (status === "Signed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Signed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Awaiting
      </span>
    );
  };

  const getProjectStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Completed
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Not Started
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto font-['Quicksand'] pb-12"
    >
      {/* Alert Banner */}
<<<<<<< HEAD
      <AlertBanner banner={banner} onClose={() => setBanner(null)} />
=======
      {banner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center justify-between shadow-xs ${
            banner.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-3">
            {banner.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-semibold">{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            &times;
          </button>
        </motion.div>
      )}
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Client <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">Accounts</span>
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Approved Clients Only
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage active client accounts, assigned plans, onboarding agreements, and payment balances
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, contact, email, login ID, or plan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Payment: All</option>
            <option value="Not Paid">Not Paid</option>
            <option value="Advance Paid">Advance Paid</option>
            <option value="Fully Paid">Fully Paid</option>
          </select>

          {/* Project Status Dropdown */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Project: All</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Signature Status Dropdown */}
          <select
            value={signatureFilter}
            onChange={(e) => setSignatureFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Signature: All</option>
            <option value="Signed">Signed</option>
            <option value="Awaiting">Awaiting</option>
          </select>
        </div>
      </div>

      {/* Main Client Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
<<<<<<< HEAD
          <table className="w-full text-left text-sm border-collapse min-w-[1240px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider whitespace-nowrap">
                <th className="py-4 px-4 w-12 text-center">#</th>
                <th className="py-4 px-4 whitespace-nowrap">Company Name</th>
                <th className="py-4 px-4 whitespace-nowrap">Contact Person</th>
                <th className="py-4 px-4 whitespace-nowrap min-w-[120px]">Login ID</th>
                <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Assigned Plans</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Signature</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Payment Status</th>
                <th className="py-4 px-4 min-w-[170px] whitespace-nowrap">Financial Summary</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Project Status</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Actions</th>
=======
          <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                <th className="py-4 px-4 w-12 text-center">#</th>
                <th className="py-4 px-4">Company Name</th>
                <th className="py-4 px-4">Contact Person</th>
                <th className="py-4 px-4">Email</th>
                <th className="py-4 px-4">Login ID</th>
                <th className="py-4 px-4">Assigned Plans</th>
                <th className="py-4 px-4 text-center">Signature</th>
                <th className="py-4 px-4 text-center">Payment Status</th>
                <th className="py-4 px-4 text-right">Total Amount</th>
                <th className="py-4 px-4 text-right">Amount Paid</th>
                <th className="py-4 px-4 text-right">Pending</th>
                <th className="py-4 px-4 text-center">Project Status</th>
                <th className="py-4 px-4 text-center">Actions</th>
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
<<<<<<< HEAD
                  <td colSpan="10" className="py-16 text-center text-slate-400">
=======
                  <td colSpan="13" className="py-16 text-center text-slate-400">
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                    <div className="flex flex-col items-center gap-3">
                      <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-semibold text-slate-500">Loading client accounts from MySQL...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
<<<<<<< HEAD
                  <td colSpan="10" className="py-16 text-center text-slate-400">
=======
                  <td colSpan="13" className="py-16 text-center text-slate-400">
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="font-bold text-slate-600">No client accounts found.</p>
                      <p className="text-xs text-slate-400">
                        {showArchived
                          ? "There are no archived clients."
                          : "Approved clients from the New SignUp page will automatically appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-4 px-4 text-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Company Name */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {client.company_name}
                      </div>
                      {client.business_type && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {client.business_type}
                        </span>
                      )}
                    </td>

<<<<<<< HEAD
                    {/* Contact Person & Email */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {client.contact_name || "—"}
                      </div>
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="text-xs text-slate-500 hover:text-indigo-600 hover:underline transition-colors block truncate max-w-[200px] mt-0.5"
                          title={client.email}
                        >
                          {client.email}
                        </a>
                      )}
                    </td>

                    {/* Login ID */}
                    <td className="py-4 px-4 whitespace-nowrap min-w-[120px]">
                      <code className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 whitespace-nowrap inline-block tracking-normal select-all">
=======
                    {/* Contact Person */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {client.contact_name}
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 text-slate-600">
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1.5"
                      >
                        <span>{client.email}</span>
                      </a>
                    </td>

                    {/* Login ID */}
                    <td className="py-4 px-4">
                      <code className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                        {client.login_id}
                      </code>
                    </td>

                    {/* Assigned Plans */}
<<<<<<< HEAD
                    <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
=======
                    <td className="py-4 px-4">
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                      {client.assigned_plans && client.assigned_plans.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenView(client, "plans")}
<<<<<<< HEAD
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/60 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="whitespace-nowrap">View All</span>
=======
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/60 shadow-2xs transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View All</span>
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAddPlan(client)}
<<<<<<< HEAD
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
=======
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                        >
                          <span>+ Assign</span>
                        </button>
                      )}
                    </td>

                    {/* Signature Status */}
                    <td className="py-4 px-4 text-center">
                      {getSignatureBadge(client.signature_status)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-4 px-4 text-center">
                      {getPaymentBadge(client.payment_status)}
                    </td>

<<<<<<< HEAD
                    {/* Financial Summary: Total, Paid, Pending */}
                    <td className="py-4 px-4">
                      <div className="min-w-[150px] bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">Total:</span>
                          <span className="font-extrabold text-slate-900">
                            {formatCurrency(client.total_amount, client.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-600">Paid:</span>
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(client.amount_paid, client.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-[11px] font-semibold text-rose-500">Pending:</span>
                          <span
                            className={`font-bold ${
                              Number(client.amount_pending) > 0 ? "text-rose-600" : "text-slate-400"
                            }`}
                          >
                            {formatCurrency(client.amount_pending, client.currency)}
                          </span>
                        </div>
                      </div>
=======
                    {/* Total Amount */}
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(client.total_amount, client.currency)}
                    </td>

                    {/* Amount Paid */}
                    <td className="py-4 px-4 text-right font-extrabold text-emerald-600">
                      {formatCurrency(client.amount_paid, client.currency)}
                    </td>

                    {/* Amount Pending */}
                    <td className="py-4 px-4 text-right font-extrabold text-rose-600">
                      {formatCurrency(client.amount_pending, client.currency)}
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                    </td>

                    {/* Project Status */}
                    <td className="py-4 px-4 text-center">
                      <select
                        value={client.project_status}
                        onChange={(e) => handleUpdateProjectStatus(client.id, e.target.value)}
                        className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

<<<<<<< HEAD
                    {/* Actions: Direct Delete Button Only */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {client.is_archived ? (
                        <button
                          type="button"
                          onClick={() => handleRestoreClient(client.id, client.company_name)}
                          className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs"
                          title="Restore Client"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(client)}
                          className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs"
                          title="Delete Client"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
=======
                    {/* Actions Menu */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleActionMenu(e, client)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer inline-flex items-center justify-center ${
                          actionMenu?.client?.id === client.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-300"
                            : "bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 shadow-2xs"
                        }`}
                        title="Actions Menu"
                      >
                        {/* Hamburger 3-line icon */}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD PLAN POPUP MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeModal === "addPlan" && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Assign Plans — {selectedClient.company_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select plans dynamically from the Plans catalog to assign to this client account
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                {availablePlans.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No plans found in database. Please create plans in the Plans section first.
                  </div>
                ) : (
                  availablePlans.map((plan) => {
                    const isSelected = selectedPlanIds.includes(plan.id);
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleTogglePlan(plan.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                          isSelected
                            ? "bg-indigo-50/50 border-indigo-600 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-sm">{plan.title}</h4>
                            <span className="font-extrabold text-indigo-600 text-sm">
                              {formatCurrency(plan.price, plan.currency)}
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total Calculation Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Selected Plans Total:</span>
                  <div className="text-lg font-extrabold text-slate-900">
                    {formatCurrency(
                      availablePlans
                        .filter((p) => selectedPlanIds.includes(p.id))
                        .reduce((sum, p) => sum + Number(p.price), 0)
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingPlans}
                    onClick={handleSavePlans}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-60 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {savingPlans ? "Saving..." : "Save Assigned Plans"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VIEW CLIENT COMPLETE DETAILS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeModal === "view" && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                    {selectedClient.company_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-slate-900">
                        {selectedClient.company_name}
                      </h3>
                      <code className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700">
                        {selectedClient.login_id}
                      </code>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedClient.contact_name} &bull; {selectedClient.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Navigation Tabs inside View Modal */}
              <div className="px-6 border-b border-slate-100 flex items-center gap-6 overflow-x-auto text-xs font-bold">
                {[
<<<<<<< HEAD
                  { id: "plans", label: "Assigned Plans" },
                  { id: "agreement", label: "Agreement & Signature" },
=======
                  { id: "overview", label: "Overview & Balance" },
                  { id: "plans", label: "Assigned Plans" },
                  { id: "agreement", label: "Agreement & Signature" },
                  { id: "payments", label: "Payment History" },
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setViewTab(tab.id)}
                    className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      viewTab === tab.id
                        ? "border-indigo-600 text-indigo-600 font-extrabold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content Body */}
              <div className="p-6 overflow-y-auto flex-1">
<<<<<<< HEAD
                {banner && (
                  <div className="mb-4">
                    <AlertBanner banner={banner} onClose={() => setBanner(null)} />
                  </div>
                )}
=======
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                {loadingDetails ? (
                  <div className="py-16 text-center text-slate-400">
                    <svg className="animate-spin h-6 w-6 text-indigo-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading comprehensive ledger data...</span>
                  </div>
                ) : clientDetails ? (
                  <>
<<<<<<< HEAD
=======
                    {/* TAB: OVERVIEW */}
                    {viewTab === "overview" && (
                      <div className="space-y-6">
                        {/* Financial Ledger Balance Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Total Contract Value</span>
                            <div className="text-2xl font-extrabold text-slate-900 mt-1">
                              {formatCurrency(clientDetails.total_amount, clientDetails.currency)}
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              {(clientDetails.assigned_plans || []).length} plans assigned
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                            <span className="text-xs font-semibold text-emerald-800 uppercase">Amount Paid</span>
                            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                              {formatCurrency(clientDetails.amount_paid, clientDetails.currency)}
                            </div>
                            <span className="text-[11px] text-emerald-600 mt-1 block">
                              Status: {clientDetails.payment_status}
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                            <span className="text-xs font-semibold text-rose-800 uppercase">Amount Pending</span>
                            <div className="text-2xl font-extrabold text-rose-700 mt-1">
                              {formatCurrency(clientDetails.amount_pending, clientDetails.currency)}
                            </div>
                            <span className="text-[11px] text-rose-600 mt-1 block">
                              Outstanding Due
                            </span>
                          </div>
                        </div>

                        {/* Profile Info Grid */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                          <h4 className="font-extrabold text-slate-900 text-sm">Account Specification</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 block font-semibold">Registered Contact:</span>
                              <span className="font-bold text-slate-800 mt-0.5 block">{clientDetails.contact_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold">Registered Email:</span>
                              <span className="font-bold text-slate-800 mt-0.5 block">{clientDetails.email}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold">Portal Login ID:</span>
                              <span className="font-bold text-indigo-600 mt-0.5 block font-mono">{clientDetails.login_id}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold">Business Sector:</span>
                              <span className="font-bold text-slate-800 mt-0.5 block">{clientDetails.business_type || "General Business"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold">Project Status:</span>
                              <span className="mt-0.5 inline-block">{getProjectStatusBadge(clientDetails.project_status)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold">Agreement Status:</span>
                              <span className="mt-0.5 inline-block">{getSignatureBadge(clientDetails.signature_status)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

                    {/* TAB: ASSIGNED PLANS */}
                    {viewTab === "plans" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-sm">Assigned Plans Ledger</h4>
                          <button
                            onClick={() => {
                              setActiveModal(null);
                              handleOpenAddPlan(selectedClient);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            + Modify Assigned Plans
                          </button>
                        </div>

                        {clientDetails.assigned_plans?.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                            No plans assigned yet. Use the "Add Plan" button to select from the dynamic plans section.
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                            {clientDetails.assigned_plans.map((p) => (
                              <div key={p.assignment_id || p.plan_id} className="p-4 flex items-center justify-between">
                                <div>
                                  <h5 className="font-bold text-slate-900 text-sm">{p.title}</h5>
                                  <p className="text-xs text-slate-500 mt-0.5">{p.description || "Active subscription tier"}</p>
                                </div>
                                <div className="text-right">
                                  <span className="font-extrabold text-slate-900 text-sm">
                                    {formatCurrency(p.price, p.currency)}
                                  </span>
                                  <span className="block text-[11px] text-slate-400">
                                    Assigned on {new Date(p.assigned_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: AGREEMENT & SIGNATURE */}
                    {viewTab === "agreement" && (
                      <div className="space-y-6">
                        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase">Signature Workflow Status</span>
                            <div className="mt-1 flex items-center gap-2">
                              {getSignatureBadge(clientDetails.signature_status)}
                              {clientDetails.signature_date && (
                                <span className="text-xs text-slate-500">
                                  on {new Date(clientDetails.signature_date).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
<<<<<<< HEAD
=======

                          <button
                            onClick={() => handleToggleSignature(clientDetails.id, clientDetails.signature_status)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                          >
                            {clientDetails.signature_status === "Signed" ? "Mark as Awaiting" : "Mark as Signed"}
                          </button>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                          <h5 className="font-bold text-slate-900 text-sm">Digital Agreement Record</h5>
                          <div className="text-xs space-y-2 text-slate-600">
                            <p>
                              <strong>Agreement Document:</strong> {clientDetails.agreement?.terms_title}
                            </p>
                            <p>
                              <strong>Authorized Signatory:</strong> {clientDetails.signature_name || clientDetails.contact_name}
                            </p>
                            <p>
                              <strong>Digital Verification Hash:</strong>{" "}
                              <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                SHA256:{clientDetails.login_id}-AGMT-{clientDetails.id}
                              </code>
                            </p>
                          </div>
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
                        </div>
                      </div>
                    )}

<<<<<<< HEAD

=======
                    {/* TAB: PAYMENT HISTORY */}
                    {viewTab === "payments" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-sm">Recorded Payments</h4>
                          <button
                            onClick={() => setShowPaymentForm(!showPaymentForm)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
                          >
                            {showPaymentForm ? "Cancel" : "+ Record Payment"}
                          </button>
                        </div>

                        {/* Inline Record Payment Form */}
                        {showPaymentForm && (
                          <form
                            onSubmit={handleRecordPaymentSubmit}
                            className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3"
                          >
                            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                              Add New Payment Record
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Amount (₹)
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  step="any"
                                  value={paymentForm.amount}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                  placeholder="e.g. 25000"
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Payment Method
                                </label>
                                <select
                                  value={paymentForm.payment_method}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                                >
                                  <option value="UPI Transfer">UPI Transfer</option>
                                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                                  <option value="Cheque">Cheque</option>
                                  <option value="Cash">Cash</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Transaction ID
                                </label>
                                <input
                                  type="text"
                                  value={paymentForm.transaction_id}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                                  placeholder="e.g. TXN-94812"
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="submit"
                                disabled={recordingPayment}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                              >
                                {recordingPayment ? "Saving..." : "Save Payment"}
                              </button>
                            </div>
                          </form>
                        )}

                        {clientDetails.payments?.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                            No payment transactions recorded for this client yet.
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                            {clientDetails.payments.map((pay) => (
                              <div key={pay.id} className="p-4 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-extrabold text-slate-900 text-sm">
                                    {formatCurrency(pay.amount, pay.currency)}
                                  </span>
                                  <span className="text-slate-500 block mt-0.5">
                                    via {pay.payment_method} &bull; {pay.transaction_id || "N/A"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    {pay.status}
                                  </span>
                                  <span className="block text-[11px] text-slate-400 mt-1">
                                    {new Date(pay.payment_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeModal === "delete" && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">
                  Delete Client Account?
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Are you sure you want to remove <strong>{selectedClient.company_name}</strong>?
                </p>
                {selectedClient.amount_paid > 0 || selectedClient.signature_status === "Signed" ? (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left">
                    <strong>Notice:</strong> This client has recorded payments (
                    {formatCurrency(selectedClient.amount_paid)}) or a signed contract. To protect
                    financial and legal audit integrity, this client will be <strong>archived</strong> rather
                    than permanently erased.
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    This client has no recorded payments or signed contracts.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  {selectedClient.amount_paid > 0 || selectedClient.signature_status === "Signed"
                    ? "Archive Client"
                    : "Delete Client"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
<<<<<<< HEAD
=======

      {/* Floating Portal Action Menu (Never clipped by table scrollbars) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {actionMenu && (
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setActionMenu(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: actionMenu.bottom ? 6 : -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: actionMenu.bottom ? 6 : -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "fixed",
                    top: actionMenu.top,
                    bottom: actionMenu.bottom,
                    right: actionMenu.right,
                  }}
                  className="w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-[9999] text-left divide-y divide-slate-100 ring-1 ring-black/5"
                >
                  {/* Action Items */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        const c = actionMenu.client;
                        setActionMenu(null);
                        handleOpenView(c);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </span>
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const c = actionMenu.client;
                        setActionMenu(null);
                        handleOpenAddPlan(c);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                      <span>Assign Plan</span>
                    </button>
                  </div>

                  <div className="py-1">
                    {actionMenu.client.is_archived ? (
                      <button
                        type="button"
                        onClick={() => {
                          const c = actionMenu.client;
                          setActionMenu(null);
                          handleRestoreClient(c.id, c.company_name);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </span>
                        <span>Restore Client</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const c = actionMenu.client;
                          setActionMenu(null);
                          handleOpenDelete(c);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </span>
                        <span>Delete Client</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
    </motion.div>
  );
};

export default AdminClients;
