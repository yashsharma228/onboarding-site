import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import api from "../services/api.js";
import AlertBanner from "../components/AlertBanner.jsx";

const AdminProfile = () => {
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    full_name: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profileFeedback, setProfileFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Load Admin Profile
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await api.get("/admin/profile");
      if (response.data.success && response.data.data) {
        const { username, email, full_name } = response.data.data;
        setProfileData({
          username: username || "",
          email: email || "",
          full_name: full_name || "",
        });
      }
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to load admin profile from database.",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Profile Details
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFeedback(null);

    try {
      const response = await api.put("/admin/profile", {
        full_name: profileData.full_name,
        email: profileData.email,
      });

      if (response.data.success) {
        setProfileFeedback({
          type: "success",
          message: "Profile details updated successfully.",
        });
        // Update stored session if present
        const stored = sessionStorage.getItem("adminUser");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            sessionStorage.setItem(
              "adminUser",
              JSON.stringify({ ...parsed, full_name: profileData.full_name, email: profileData.email })
            );
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordFeedback({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await api.put("/admin/password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      if (response.data.success) {
        setPasswordFeedback({
          type: "success",
          message: "Password changed successfully! Keep your new credentials safe.",
        });
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      }
    } catch (err) {
      setPasswordFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm font-semibold">Loading profile information...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">Profile</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Manage your administrative credentials and security settings.
          </p>
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl uppercase">
            {profileData.username?.[0] || "A"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Admin Account Information</h3>
            <p className="text-xs text-slate-400">
              Update your registered name and administrative contact email
            </p>
          </div>
        </div>

        <AlertBanner
          banner={profileFeedback}
          onClose={() => setProfileFeedback(null)}
          className="mb-6"
        />

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Username <span className="text-slate-400 font-normal lowercase">(read-only)</span>
              </label>
              <input
                type="text"
                disabled
                value={profileData.username}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                placeholder="e.g. System Administrator"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="admin@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {profileSaving ? "Saving..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Security & Password Management</h3>
            <p className="text-xs text-slate-400">
              Verify your current password to establish a new strong password
            </p>
          </div>
        </div>

        <AlertBanner
          banner={passwordFeedback}
          onClose={() => setPasswordFeedback(null)}
          className="mb-6"
        />

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              placeholder="Enter your current password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {passwordSaving ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AdminProfile;
