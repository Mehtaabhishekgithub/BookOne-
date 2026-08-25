import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  User,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useGetBookingDetailsQuery } from "../store/apiSlice.js";
import { format } from "date-fns";

export const BookingSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id") || "234154f3-1693-4670-8cd4-0209ad1ae4a6";
  const isMock = searchParams.get("mock") === "true";

  const { data: bookingData, isLoading, isError } = useGetBookingDetailsQuery(bookingId, {
    skip: !bookingId,
    pollingInterval: 3000, // Poll every 3 seconds while waiting for webhook confirmation
  });

  const booking = bookingData?.data;
  const invoice = booking?.invoice;

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Retrieving booking confirmation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* SUCCESS CARD */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center relative overflow-hidden">
          {/* Top banner glow */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

          {/* Animated Success Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Your appointment has been successfully scheduled and payment received.
          </p>

          {isMock && (
            <div className="mt-4 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-700 inline-block font-medium">
              Demo Checkout Mode: Payment simulated successfully
            </div>
          )}

          {/* BOOKING DETAILS CARD */}
          <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 text-left space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultant</span>
              <span className="text-sm font-bold text-slate-900">
                {booking?.provider?.user?.firstName || "Alex"} {booking?.provider?.user?.lastName || "Morgan"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Service</span>
              <span className="text-sm font-semibold text-slate-900">{booking?.service?.title || "Architecture Consultation"}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</span>
              <span className="text-sm font-medium text-slate-800">
                {booking?.clientName} ({booking?.clientEmail})
              </span>
            </div>

            {booking?.startTime && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Date & Time</span>
                <span className="text-sm font-bold text-indigo-600">
                  {format(new Date(booking.startTime), "EEEE, MMMM dd, yyyy @ HH:mm")} UTC
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
              <span className="font-heading font-extrabold text-emerald-600 text-base">
                ${Number(booking?.service?.price || 75).toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* INVOICE DOWNLOAD SECTION */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-tr from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Official Receipt</span>
                <h4 className="font-heading font-bold text-slate-900 text-sm">
                  Invoice #{invoice?.invoiceNumber || "INV-2026-0002"}
                </h4>
                <p className="text-[11px] text-slate-500">Includes complete session breakdown and payment stamp.</p>
              </div>
            </div>

            <a
              href={`/api/invoices/${invoice?.invoiceNumber || "INV-2026-0002"}/download`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>

          {/* Back Home CTA */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-4">
            <Link
              to="/p/alex-morgan"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              ← Book Another Session
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              to="/dashboard"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Go to Provider Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
