import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import api from "../services/api.js";

const ClientProfile = () => {
  const directToken = new URLSearchParams(window.location.search).get("token");
  const isDirectLink = Boolean(directToken);

  const [profile, setProfile] = useState({
    login_id: "",
    company_name: "",
    contact_name: "",
    email: "",
    business_type: "",
    signature_status: "",
    project_status: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password change state
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const url = isDirectLink
        ? `/client/direct-profile?token=${encodeURIComponent(directToken)}`
        : "/client/profile";
      const res = await api.get(url);
      if (res.data.success && res.data.data) {
        setProfile({
          login_id: res.data.data.login_id || "",
          company_name: res.data.data.company_name || "",
          contact_name: res.data.data.contact_name || "",
          email: res.data.data.email || "",
          business_type: res.data.data.business_type || "",
          signature_status: res.data.data.signature_status || "Awaiting",
          project_status: res.data.data.project_status || "Not Started",
        });
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to load profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [directToken]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    if (profileSuccess) setProfileSuccess("");
    if (profileError) setProfileError("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const payload = {
        company_name: profile.company_name,
        contact_name: profile.contact_name,
        business_type: profile.business_type,
      };

      const res = await api.put("/client/profile", payload);
      if (res.data.success) {
        setProfileSuccess(res.data.message || "Profile updated successfully.");
        // Refresh local storage client data
        if (res.data.data) {
          sessionStorage.setItem("clientData", JSON.stringify(res.data.data));
        }
      } else {
        setProfileError(res.data.message || "Could not update profile.");
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (passwords.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/client/change-password", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });

      if (res.data.success) {
        setPasswordSuccess(res.data.message || "Password updated successfully.");
        setPasswords({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        setPasswordError(res.data.message || "Failed to update password.");
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to update password. Verify current password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg
          className="animate-spin h-10 w-10 text-indigo-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
        >
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
        <p className="text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Client Profile Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your organization details and security credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
              {profile.company_name ? profile.company_name.charAt(0).toUpperCase() : "C"}
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">{profile.company_name}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{profile.contact_name}</p>

            <div className="mt-3 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-mono font-bold">
              ID: {profile.login_id}
            </div>

            <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-3 text-left">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Agreement Status
                </span>
                <p className="mt-0.5 text-xs font-bold text-slate-700">
                  {profile.signature_status}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Project Status
                </span>
                <p className="mt-0.5 text-xs font-bold text-slate-700">
                  {profile.project_status}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-bold mb-1.5">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Email Protection</span>
            </div>
            Your registered email address is locked to maintain account integrity and secure billing communications. If your company email needs to be changed, please reach out to your account executive.
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Edit Profile Data */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Company & Contact Info</h2>
            <p className="text-xs text-slate-500 mb-6">
              Update your corporate title, primary representative, and sector
            </p>

            {profileSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3"
              >
                <svg className="w-5 h-5 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{profileSuccess}</span>
              </motion.div>
            )}

            {profileError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3"
              >
                <svg className="w-5 h-5 shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{profileError}</span>
              </motion.div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Login ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.login_id}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono text-sm cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Registered Email</span>
                    <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Read-Only
                    </span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  required
                  value={profile.company_name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Representative <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    required
                    value={profile.contact_name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Business Sector / Type
                  </label>
                  <input
                    type="text"
                    name="business_type"
                    value={profile.business_type}
                    onChange={handleProfileChange}
                    placeholder="e.g. Technology, Retail, Healthcare"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-md shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Change Password */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Security & Password</h2>
            <p className="text-xs text-slate-500 mb-6">
              Update your client portal login password
            </p>

            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3"
              >
                <svg className="w-5 h-5 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{passwordSuccess}</span>
              </motion.div>
            )}

            {passwordError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3"
              >
                <svg className="w-5 h-5 shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{passwordError}</span>
              </motion.div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={passwords.current_password}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current_password: e.target.value })
                    }
                    placeholder="Enter current password"
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  >
                    {showCurrentPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={passwords.new_password}
                      onChange={(e) =>
                        setPasswords({ ...passwords, new_password: e.target.value })
                      }
                      placeholder="At least 6 characters"
                      className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    >
                      {showNewPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.confirm_password}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm_password: e.target.value })
                    }
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-black active:scale-[0.99] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {savingPassword ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
