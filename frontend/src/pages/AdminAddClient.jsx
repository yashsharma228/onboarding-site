import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api.js";
import AlertBanner from "../components/AlertBanner.jsx";

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

const AdminAddClient = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [signatureFilter, setSignatureFilter] = useState("All");
  const [banner, setBanner] = useState(null);

  // Add Client Form Modal
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    business_type: "",
    password: "",
    plan_ids: [],
  });

  // Action Modals
  const [activeModal, setActiveModal] = useState(null); // 'view' | 'addPlan' | 'delete' | null
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);

  // Add Plan modal state
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [savingPlans, setSavingPlans] = useState(false);

  // Direct Link Modal state
  const [directLinkModal, setDirectLinkModal] = useState({
    open: false,
    client: null,
    directUrl: "",
    emailSent: false,
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingDirectEmail, setSendingDirectEmail] = useState(false);

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
  const [viewTab, setViewTab] = useState("plans"); // 'plans' | 'agreement'

  // Fetch all clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/clients?source=admin");
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

  // Fetch available plans
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
  }, []);

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

  // Handle Form Change
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Add Client Form (Saves to `clients` with source='admin')
  const handleCreateClientSubmit = async (e) => {
    e.preventDefault();
    setCreatingClient(true);
    setBanner(null);

    try {
      const response = await api.post("/admin/clients", formData);
      if (response.data.success) {
        const newClient = response.data.data;
        setBanner({
          type: "success",
          message: `Client "${newClient.company_name}" added successfully with Login ID ${newClient.login_id} (Source: admin). Temporary Password: ${newClient.temp_password}`,
        });
        // Reset form
        setFormData({
          company_name: "",
          contact_name: "",
          email: "",
          business_type: "",
          password: "",
          plan_ids: [],
        });
        setShowAddClientModal(false);
        await fetchClients();
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to add client.",
      });
    } finally {
      setCreatingClient(false);
    }
  };


  // Open View Modal
  const handleOpenView = async (client, initialTab = "plans") => {
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

  // Generate & Copy Direct Link
  const handleCopyDirectLink = async (client) => {
    try {
      const res = await api.post(`/admin/clients/${client.id}/direct-link`);
      if (res.data.success && res.data.direct_url) {
        const url = res.data.direct_url;
        try {
          await navigator.clipboard.writeText(url);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 3000);
        } catch (clipboardErr) {
          console.warn("Clipboard write failed, displaying modal:", clipboardErr);
        }
        setDirectLinkModal({
          open: true,
          client,
          directUrl: url,
          emailSent: false,
        });
        setBanner({
          type: "success",
          message: `Direct link for "${client.company_name}" ready and copied to clipboard!`,
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to generate direct access link.",
      });
    }
  };

  // Generate & Send Direct Email
  const handleSendDirectEmail = async (client) => {
    try {
      setSendingDirectEmail(true);
      const res = await api.post(`/admin/clients/${client.id}/send-direct-email`);
      if (res.data.success) {
        const url = res.data.direct_url;
        setDirectLinkModal({
          open: true,
          client,
          directUrl: url,
          emailSent: true,
        });
        setBanner({
          type: "success",
          message: res.data.message || `Direct profile link sent successfully to ${client.email}!`,
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.response?.data?.message || "Failed to send email with direct link.",
      });
    } finally {
      setSendingDirectEmail(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (client) => {
    setSelectedClient(client);
    setActiveModal("delete");
  };

  // Confirm Delete
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

  // Update Project Status
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

  // Record Payment Submit
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

  // Filter clients
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto font-['Quicksand'] pb-12"
    >
      {/* Alert Banner */}
      <AlertBanner banner={banner} onClose={() => setBanner(null)} />

      {/* Header and Add Client Primary Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Add <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">Client</span>
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Admin Registered
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create and onboard new client accounts directly with source admin, assign plans, and manage ledgers
          </p>
        </div>

        <button
          onClick={() => setShowAddClientModal(true)}
          className="px-5 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Client</span>
        </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-16 text-center text-slate-400">
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
                  <td colSpan="10" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <p className="font-bold text-slate-600">No client accounts found.</p>
                      <p className="text-xs text-slate-400">
                        Click "Add New Client" above to create and register a client with source admin.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-4 text-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {client.company_name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {client.business_type && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {client.business_type}
                          </span>
                        )}
                      </div>
                    </td>

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

                    <td className="py-4 px-4 whitespace-nowrap min-w-[120px]">
                      <code className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 whitespace-nowrap inline-block tracking-normal select-all">
                        {client.login_id}
                      </code>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                      {client.assigned_plans && client.assigned_plans.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenView(client, "plans")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/60 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="whitespace-nowrap">View All</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAddPlan(client)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer whitespace-nowrap"
                        >
                          + Assign
                        </button>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {getSignatureBadge(client.signature_status)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {getPaymentBadge(client.payment_status)}
                    </td>

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
                    </td>

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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD NEW CLIENT FORM MODAL (Saves to `clients` and `client_plans` with source='admin') */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAddClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Add New Client Account
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register a client account directly with source=admin
                  </p>
                </div>
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateClientSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleFormChange}
                      placeholder="e.g. Apex Innovations Ltd"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleFormChange}
                      placeholder="e.g. Sanjay Verma"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="e.g. sanjay@apexinnovations.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Type / Industry
                    </label>
                    <input
                      type="text"
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleFormChange}
                      placeholder="e.g. Software & Cloud"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>


                {/* Footer buttons inside form */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Source will be saved as <code className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">admin</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddClientModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingClient}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-60 transition-all cursor-pointer"
                    >
                      {creatingClient ? "Saving Client..." : "Save Client Account"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlanIds.includes(plan.id);
                  return (
                    <div
                      key={plan.id}
                      onClick={() =>
                        setSelectedPlanIds((prev) =>
                          prev.includes(plan.id) ? prev.filter((id) => id !== plan.id) : [...prev, plan.id]
                        )
                      }
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${isSelected
                          ? "bg-indigo-50/50 border-indigo-600 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
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
                })}
              </div>

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
        {/* DIRECT ACCESS LINK MODAL (Screen 3: Link generated and emailed automatically) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {directLinkModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Private Client Link Generated
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {directLinkModal.client?.company_name} ({directLinkModal.client?.email})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDirectLinkModal({ open: false, client: null, directUrl: "", emailSent: false })}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {directLinkModal.emailSent ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Link has been automatically emailed to <strong>{directLinkModal.client?.email}</strong></span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>This private link allows direct passwordless access. Copy or share it directly.</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Private Direct Access Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={directLinkModal.directUrl}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs select-all focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(directLinkModal.directUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 3000);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        {copiedLink ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Hello ${directLinkModal.client?.contact_name || directLinkModal.client?.company_name}, here is your private link to view your onboarding profile: ${directLinkModal.directUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      <span>Share on WhatsApp</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* ========================================================================= */}
      {/* VIEW CLIENT DETAILS MODAL */}
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

              <div className="px-6 border-b border-slate-100 flex items-center gap-6 overflow-x-auto text-xs font-bold">
                {[
                  { id: "plans", label: "Assigned Plans" },
                  { id: "agreement", label: "Agreement & Signature" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setViewTab(tab.id)}
                    className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${viewTab === tab.id
                        ? "border-indigo-600 text-indigo-600 font-extrabold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto flex-1">
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
                        </div>
                      </div>
                    )}



                  </>
                ) : null}
              </div>

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
      {/* DELETE CONFIRMATION MODAL */}
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
                        handleSendDirectEmail(c);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span>Send Mail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const c = actionMenu.client;
                        setActionMenu(null);
                        handleCopyDirectLink(c);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span>Copy Link</span>
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
    </motion.div>
  );
};

export default AdminAddClient;
