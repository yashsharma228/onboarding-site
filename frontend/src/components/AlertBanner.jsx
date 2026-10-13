import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * AlertBanner Component
 * Shows an alert banner matching the design, and automatically disappears after duration (5 seconds).
 *
 * @param {Object} props
 * @param {Object|string|null} props.banner - { type: "success" | "error" | "info", message: string } or string
 * @param {Function} props.onClose - callback function when dismissed (setBanner(null))
 * @param {number} [props.duration=5000] - auto-dismiss duration in milliseconds (default 5000ms = 5 seconds)
 * @param {string} [props.className] - optional additional CSS classes
 */
const AlertBanner = ({ banner, onClose, duration = 5000, className = "" }) => {
  useEffect(() => {
    if (!banner) return;

    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [banner, duration, onClose]);

  if (!banner) return null;

  const isSuccess = banner.type === "success" || !banner.type;
  const message = typeof banner === "string" ? banner : banner.message;

  if (!message) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -8, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.995 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`p-4 rounded-2xl flex items-center justify-between border shadow-2xs transition-all ${
          isSuccess
            ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
            : "bg-rose-50/90 border-rose-200 text-rose-900"
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <svg
              className="w-5 h-5 text-emerald-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-rose-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="text-sm font-semibold tracking-tight">{message}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
          }}
          aria-label="Close notification"
          className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition-colors p-1 rounded-lg hover:bg-black/5 ml-3"
        >
          &times;
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertBanner;
