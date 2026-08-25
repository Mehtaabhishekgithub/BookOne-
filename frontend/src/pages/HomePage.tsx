import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Globe2,
  CreditCard,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useGetHealthQuery } from "../store/apiSlice.js";

export const HomePage: React.FC = () => {
  const { data: health, isSuccess } = useGetHealthQuery();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-b border-slate-200/70">
        {/* Glow background decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-300/30 to-purple-300/30 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-sm border border-indigo-100 text-xs font-semibold text-indigo-700 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Production-Grade SaaS Architecture Engine</span>
            {isSuccess && (
              <span className="hidden sm:inline text-slate-400 font-normal">
                | API: <strong className="text-emerald-600">{health?.status}</strong>
              </span>
            )}
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            SaaS Booking & Automated{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Invoicing Engine
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A full-stack multi-tenant booking platform built for tutors, consultants, and creators. Featuring timezone-safe slot algorithms, Stripe checkout transactions, and instant PDF invoice generation.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/p/alex-morgan"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Client Booking Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-slate-800 font-semibold shadow-sm border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all"
            >
              <span>Provider Admin Dashboard</span>
            </Link>
          </div>

          {/* Seeded Quick Demo Card */}
          <div className="mt-14 max-w-xl mx-auto p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
                AM
              </div>
              <div>
                <h4 className="font-heading font-bold text-slate-900">Alex Morgan</h4>
                <p className="text-xs text-slate-500">Live Seeded Provider (@alex-morgan) • UTC-4</p>
              </div>
            </div>
            <Link
              to="/p/alex-morgan"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <span>Book Call</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CORE ARCHITECTURE PILLARS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Precision & Production Scale
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg">
              Every layer adheres to relational integrity, mathematical timezone projection, and idempotent payment state transitions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:shadow-lg hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">
                Timezone-Safe Core
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seamlessly maps provider working windows across day boundaries to any client local timezone with zero double-booking bugs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:shadow-lg hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">
                Stripe Payments & Webhooks
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hosted Stripe Checkout sessions with cryptographically verified webhook transitions: locks slots on pending and confirms on payment.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:shadow-lg hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">
                Dynamic PDF Invoicing
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Built-in PDFKit document generation streaming high-fidelity, branded A4 invoices directly to the customer’s browser.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:shadow-lg hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">
                Clerk Multi-Tenant Sync
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Svix-verified webhook listeners synchronizing user registration, roles, and profile slugs directly into PostgreSQL / MySQL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STEP BY STEP FLOW */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              From Calendar to Paid Invoice in Seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/80 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h4 className="font-heading font-bold text-lg text-white mb-2">
                1. Browse & Pick Slot
              </h4>
              <p className="text-sm text-slate-400">
                Clients pick a service offering and view open slots dynamically translated into their local timezone.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/80 relative">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h4 className="font-heading font-bold text-lg text-white mb-2">
                2. Transactional Checkout
              </h4>
              <p className="text-sm text-slate-400">
                Slot is temporarily reserved in PENDING status while client completes card checkout via Stripe.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/80 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h4 className="font-heading font-bold text-lg text-white mb-2">
                3. Instant Confirmation & PDF
              </h4>
              <p className="text-sm text-slate-400">
                Webhook transitions booking to CONFIRMED, issues a PAID invoice, and generates a downloadable PDF receipt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
