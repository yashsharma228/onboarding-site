import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import api from "../services/api.js";
import AlertBanner from "../components/AlertBanner.jsx";

const ClientForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await api.post("/client/auth/forgot-password", { email });
      setStatusMessage(
        response.data.message ||
          "If that email is registered, password reset instructions have been sent."
      );
      setEmail("");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to process request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/30 flex flex-col justify-center items-center px-4 py-12 font-['Quicksand']">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-16 w-auto object-contain mb-4"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            Client Account Recovery
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your registered client email to receive your Login ID and temporary password
          </p>
        </div>

        <AlertBanner
          banner={
            statusMessage
              ? { type: "success", message: statusMessage }
              : errorMessage
              ? { type: "error", message: errorMessage }
              : null
          }
          onClose={() => {
            setStatusMessage("");
            setErrorMessage("");
          }}
          className="mb-6"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Registered Client Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@company.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-md shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Sending Recovery Email...</span>
              </>
            ) : (
              <span>Send Recovery Email</span>
            )}
          </button>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              to="/client/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Client Login</span>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientForgotPassword;
