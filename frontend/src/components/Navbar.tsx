import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, LayoutDashboard, Sparkles, UserCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

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
        </nav>
      </div>
    </header>
  );
};
