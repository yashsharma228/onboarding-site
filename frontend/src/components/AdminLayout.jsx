<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AlertBanner from "./AlertBanner.jsx";
=======
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
<<<<<<< HEAD
  const [flashBanner, setFlashBanner] = useState(() => {
    try {
      const stored = sessionStorage.getItem("flashBanner");
      if (stored) {
        sessionStorage.removeItem("flashBanner");
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    const handleCustomBanner = (e) => {
      if (e.detail) {
        setFlashBanner(e.detail);
      }
    };
    window.addEventListener("show-banner", handleCustomBanner);
    return () => window.removeEventListener("show-banner", handleCustomBanner);
  }, []);
=======
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");
    navigate("/login");
  };

  const navItems = [
    {
      name: "New Sign-Ups",
      path: "/admin",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      name: "Client Accounts",
      path: "/admin/clients",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
    },
    {
      name: "Add Client",
      path: "/admin/add-client",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      name: "Add Plans",
      path: "/admin/plans",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: "Terms & Conditions",
      path: "/admin/terms",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Profile",
      path: "/admin/profile",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-['Quicksand'] text-slate-800">
      {/* Mobile Top Header (Light Theme) */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between shadow-xs">
        <Link to="/admin">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Drawer (Light Theme) */}
      <aside
        className={`${mobileMenuOpen ? "block" : "hidden"
          } md:block w-full md:w-64 bg-white text-slate-800 flex-shrink-0 flex flex-col justify-between border-r border-slate-200/80 min-h-screen md:sticky md:top-0 z-30 shadow-2xs`}
      >
        <div>
          {/* Logo Branding - Clean logo only without text */}
          <div className="p-6 border-b border-slate-100 hidden md:flex items-center justify-center">
            <Link to="/admin" className="transition-transform">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-13 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              MANAGEMENT
            </div>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all border ${isActive
                    ? "bg-purple-50/90 border-purple-200/90 text-purple-700 shadow-xs"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <span className={`${isActive ? "text-purple-600" : "text-slate-400"}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Logout Button (Profile info box removed) */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

<<<<<<< HEAD
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {flashBanner && (
            <div className="max-w-7xl mx-auto mb-6">
              <AlertBanner banner={flashBanner} onClose={() => setFlashBanner(null)} />
            </div>
          )}
=======
      {/* Main Content Area - Header removed as requested */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
