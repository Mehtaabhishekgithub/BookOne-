import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  LayoutDashboard,
  Sparkles,
  LogOut,
  User,
  Check,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useGetMeQuery, apiSlice } from "../store/apiSlice.js";
import { useDispatch } from "react-redux";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDashboard = location.pathname.startsWith("/dashboard");

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fetch logged in user profile
  const { data: userData } = useGetMeQuery();
  const user = userData?.data;

  // Active dev user ID
  const activeClerkId = localStorage.getItem("bookone_clerk_id") || "user_mock_provider_01";

  const handleSwitchUser = (clerkId: string | null) => {
    if (clerkId) {
      localStorage.setItem("bookone_clerk_id", clerkId);
    } else {
      localStorage.removeItem("bookone_clerk_id");
    }
    dispatch(apiSlice.util.resetApiState());
    setIsUserMenuOpen(false);
    navigate(clerkId === "user_mock_provider_01" ? "/dashboard" : "/");
  };

  const handleSignOut = () => {
    handleSwitchUser(null);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
              BookOne
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
              SaaS Engine
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/p/alex-morgan"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="hidden md:inline">Client Booking Demo</span>
            <span className="md:hidden">Demo</span>
          </Link>

          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
              isDashboard
                ? "bg-indigo-600 text-white shadow-indigo-500/20 ring-2 ring-indigo-600/30"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Provider Dashboard</span>
          </Link>

          {/* User Account / Sign Out Dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 transition-all text-xs font-semibold text-slate-800"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                {user?.firstName?.[0] || "A"}
              </div>
              <span className="hidden sm:inline">{user?.firstName || "Alex"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 animate-scale-up text-xs z-50">
                <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                    Role: {user?.role || "PROVIDER"}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Demo Account
                  </div>
                  <button
                    onClick={() => handleSwitchUser("user_mock_provider_01")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 ${
                      activeClerkId === "user_mock_provider_01" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <span>Alex Morgan (Provider)</span>
                    {activeClerkId === "user_mock_provider_01" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>

                  <button
                    onClick={() => handleSwitchUser("user_mock_client_01")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 ${
                      activeClerkId === "user_mock_client_01" ? "bg-indigo-50/70 text-indigo-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    <span>Sarah Jenkins (Client)</span>
                    {activeClerkId === "user_mock_client_01" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out (Clear Session)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
