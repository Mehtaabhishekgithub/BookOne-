import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  Globe2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useGetPublicProfileQuery,
  useGetPublicSlotsQuery,
  useCreateCheckoutSessionMutation,
} from "../store/apiSlice.js";
import { format, addDays, startOfToday } from "date-fns";
import { Service, SlotWindow } from "../types/index.js";

// Common worldwide timezones for quick selection
const POPULAR_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export const PublicBookingPage: React.FC = () => {
  const { handle = "alex-morgan" } = useParams<{ handle: string }>();
  const navigate = useNavigate();

  // 1. Fetch Provider Profile
  const { data: profileData, isLoading: isProfileLoading, isError: isProfileError } =
    useGetPublicProfileQuery(handle);

  const provider = profileData?.data;

  // Selected Service state
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Auto-detect client local timezone
  const [clientTimezone, setClientTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  // Selected Date state (defaults to tomorrow)
  const [selectedDate, setSelectedDate] = useState<Date>(() => addDays(startOfToday(), 1));
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Selected Slot
  const [selectedSlot, setSelectedSlot] = useState<SlotWindow | null>(null);

  // Client checkout details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Set default service once loaded
  useEffect(() => {
    if (provider?.services && provider.services.length > 0 && !selectedService) {
      setSelectedService(provider.services[0]);
    }
  }, [provider, selectedService]);

  // 2. Fetch Available Slots for selected date & service
  const {
    data: slotsData,
    isLoading: isSlotsLoading,
    isFetching: isSlotsFetching,
    refetch: refetchSlots,
  } = useGetPublicSlotsQuery(
    {
      handle,
      date: dateStr,
      timezone: clientTimezone,
      serviceId: selectedService?.id,
    },
    { skip: !provider || !selectedService }
  );

  const slots = slotsData?.data?.availableSlots || [];

  // 3. Checkout Mutation
  const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutSessionMutation();

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedService) return;

    setBookingError(null);
    try {
      const res = await createCheckout({
        providerHandle: handle,
        serviceId: selectedService.id,
        startTimeUTC: selectedSlot.startTimeUTC,
        endTimeUTC: selectedSlot.endTimeUTC,
        clientName,
        clientEmail,
        clientTimezone,
      }).unwrap();

      if (res.success) {
        // If mock session or immediate success
        if (res.mock) {
          navigate(`/booking/success?booking_id=${res.bookingId}&mock=true`);
        } else if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        } else {
          navigate(`/booking/success?booking_id=${res.bookingId}`);
        }
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err?.data?.message || err?.data?.error || "Failed to initiate booking. Please try another slot.");
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading booking portal...</p>
      </div>
    );
  }

  if (isProfileError || !provider) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Provider Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          No active service provider exists at <code>/p/{handle}</code>. Please check the username handle or view the demo.
        </p>
      </div>
    );
  }

  // Next 14 days list for date picker tabs
  const upcomingDays = Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i + 1));

  const providerDisplayName =
    provider.name ||
    `${provider.user?.firstName || "Alex"} ${provider.user?.lastName || "Morgan"}`.trim() ||
    "Alex Morgan";

  const providerInitials =
    providerDisplayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AM";

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* PROVIDER HEADER CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-heading font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              {providerInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{providerDisplayName}</h1>
                <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-100 flex-shrink-0" />
              </div>
              <p className="text-sm font-medium text-indigo-600 mt-0.5">{provider.headline || "Consultant & Expert"}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xl line-clamp-2">{provider.bio}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/70 text-xs text-slate-600">
            <Globe2 className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="font-semibold block text-slate-900">Provider Timezone</span>
              <span>{provider.timezone}</span>
            </div>
          </div>
        </div>

        {/* MAIN BOOKING WORKFLOW GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: 1. SELECT SERVICE */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-slate-900">1. Select Service</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {provider.services?.length || 0} offerings
              </span>
            </div>

            <div className="space-y-3">
              {provider.services?.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => {
                      setSelectedService(srv);
                      setSelectedSlot(null);
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-600 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-600/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-heading font-bold text-slate-900 text-base">{srv.title}</h4>
                      <span className="font-heading font-extrabold text-indigo-600 text-lg">
                        ${Number(srv.price).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2.5">
                      <span className="flex items-center gap-1 font-medium bg-white px-2 py-1 rounded-md border border-slate-200/60">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {srv.durationMinutes} minutes
                      </span>
                      <span className="uppercase font-semibold text-slate-400">{srv.currency}</span>
                    </div>

                    {srv.description && (
                      <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: 2. SELECT DATE & AVAILABLE SLOTS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              {/* Top Controls: Date & Timezone Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">2. Choose Date & Time</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing available slots for <strong>{format(selectedDate, "MMMM dd, yyyy")}</strong>
                  </p>
                </div>

                {/* Client Timezone Selector Dropdown */}
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <select
                    value={clientTimezone}
                    onChange={(e) => {
                      setClientTimezone(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {!POPULAR_TIMEZONES.includes(clientTimezone) && (
                      <option value={clientTimezone}>{clientTimezone} (Auto-detected)</option>
                    )}
                    {POPULAR_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz} {tz === clientTimezone ? "(Your Timezone)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Horizontal Date Picker Strip */}
              <div className="py-4 overflow-x-auto flex items-center gap-2.5 no-scrollbar">
                {upcomingDays.map((day) => {
                  const isSelected = format(day, "yyyy-MM-dd") === dateStr;
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                      }}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-2xl text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25 scale-105"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-80">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-base font-extrabold mt-0.5">{format(day, "d")}</span>
                      <span className="text-[9px] opacity-75">{format(day, "MMM")}</span>
                    </button>
                  );
                })}
              </div>

              {/* SLOTS GRID */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Open Time Slots ({slots.length})
                  </span>
                  {(isSlotsLoading || isSlotsFetching) && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating timezone slots...
                    </span>
                  )}
                </div>

                {slots.length === 0 && !isSlotsLoading && !isSlotsFetching ? (
                  <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-700">No open slots on this date</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      All provider working hours are either booked or this is a scheduled blackout day. Please try picking another date above.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTimeUTC === slot.startTimeUTC;
                      return (
                        <button
                          key={slot.startTimeUTC}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 scale-[1.02]"
                              : "bg-white hover:bg-indigo-50/50 hover:border-indigo-300 text-slate-800 border-slate-200"
                          }`}
                        >
                          <span className="text-sm">
                            {slot.localStartTime} - {slot.localEndTime}
                          </span>
                          <span className={`text-[10px] font-normal ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                            {clientTimezone.split("/")[1] || clientTimezone}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BOOKING ACTION BAR */}
              {selectedSlot && selectedService && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 animate-fade-in">
                  <div>
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Selected Call</span>
                    <h5 className="font-heading font-extrabold text-slate-900 text-sm sm:text-base">
                      {selectedService.title} • {selectedSlot.localStartTime} ({clientTimezone})
                    </h5>
                    <p className="text-xs text-slate-500">
                      Total: <strong className="text-slate-900">${Number(selectedService.price).toFixed(2)} USD</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                  >
                    <span>Proceed to Confirm</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CHECKOUT / CONFIRMATION MODAL */}
      {isBookingModalOpen && selectedSlot && selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-extrabold text-xl text-slate-900">Complete Your Booking</h3>
                <p className="text-xs text-slate-500">Session with {providerDisplayName}</p>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Appointment summary recap */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{selectedService.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-900">
                  {format(selectedDate, "MMM dd, yyyy")} @ {selectedSlot.localStartTime} ({clientTimezone})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-heading font-extrabold text-indigo-600 text-sm">
                  ${Number(selectedService.price).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Client Input Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="michael.scott@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Confirmation and instant PDF invoice will be sent here.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCheckingOut}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Locking Slot & Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Confirm & Pay via Stripe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
