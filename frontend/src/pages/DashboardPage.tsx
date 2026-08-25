import React, { useState } from "react";
import {
  useGetProviderProfileQuery,
  useGetProviderServicesQuery,
  useCreateProviderServiceMutation,
  useUpdateProviderServiceMutation,
  useDeleteProviderServiceMutation,
  useGetProviderAvailabilityQuery,
  useUpdateProviderAvailabilityMutation,
  useGetProviderBookingsQuery,
  useUpdateProviderProfileMutation,
} from "../store/apiSlice.js";
import {
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  FileText,
  Download,
  ExternalLink,
  Globe2,
  Settings,
  Layers,
  Users,
  Loader2,
  AlertCircle,
  Save,
  Shield,
} from "lucide-react";
import { format } from "date-fns";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"services" | "availability" | "bookings" | "settings">("services");

  // RTK Queries
  const { data: profileData, isLoading: isProfileLoading } = useGetProviderProfileQuery();
  const { data: servicesData, isLoading: isServicesLoading } = useGetProviderServicesQuery();
  const { data: availabilityData, isLoading: isAvailLoading } = useGetProviderAvailabilityQuery();
  const { data: bookingsData, isLoading: isBookingsLoading } = useGetProviderBookingsQuery();

  // RTK Mutations
  const [createService, { isLoading: isCreatingService }] = useCreateProviderServiceMutation();
  const [updateService] = useUpdateProviderServiceMutation();
  const [deleteService] = useDeleteProviderServiceMutation();
  const [updateAvailability, { isLoading: isUpdatingAvail }] = useUpdateProviderAvailabilityMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProviderProfileMutation();

  // Local state for modals & forms
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    durationMinutes: 30,
    price: 50,
    currency: "USD",
    isActive: true,
  });

  const [settingsForm, setSettingsForm] = useState({
    headline: "",
    bio: "",
    timezone: "UTC",
    handle: "",
  });

  const profile = profileData?.data;
  const services = servicesData?.data || [];
  const availabilities = availabilityData?.data || [];
  const bookings = bookingsData?.data || [];

  // Metrics
  const totalRevenue = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((acc, b) => acc + Number(b.service?.price || 0), 0);
  const confirmedBookingsCount = bookings.filter((b) => b.status === "CONFIRMED").length;

  // Initialize settings once profile loads
  React.useEffect(() => {
    if (profile) {
      setSettingsForm({
        headline: profile.headline || "",
        bio: profile.bio || "",
        timezone: profile.timezone || "UTC",
        handle: profile.handle || "",
      });
    }
  }, [profile]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createService(newService).unwrap();
      setIsServiceModalOpen(false);
      setNewService({ title: "", description: "", durationMinutes: 30, price: 50, currency: "USD", isActive: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(settingsForm).unwrap();
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update profile");
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Provider Dashboard...</p>
      </div>
    );
  }

  // Handle Client role attempting to view Provider Dashboard
  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 ring-8 ring-indigo-50/50">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Provider Account Required</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md">
          You are currently signed in as a <strong>Client</strong> or in guest mode. The Dashboard is reserved for Service Providers.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              localStorage.setItem("bookone_clerk_id", "user_mock_provider_01");
              window.location.reload();
            }}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all"
          >
            Switch to Demo Provider (Alex Morgan)
          </button>
          <a
            href="/p/alex-morgan"
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
          >
            Go to Client Booking Portal
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. TOP HEADER & PROFILE BANNER */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              AM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {profile?.user?.firstName || "Alex"} {profile?.user?.lastName || "Morgan"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Provider Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Timezone: <strong>{profile?.timezone || "UTC"}</strong> • Public Handle: <strong>@{profile?.handle}</strong>
              </p>
            </div>
          </div>

          <a
            href={`/p/${profile?.handle || "alex-morgan"}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <span>View Public Booking Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 2. OVERVIEW METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-slate-900">
              ${totalRevenue.toFixed(2)} USD
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">From confirmed bookings</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Confirmed Bookings</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-slate-900">{confirmedBookingsCount}</h3>
            <span className="text-[11px] text-slate-400 mt-1 block">{bookings.length} total requests</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Services</span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-slate-900">
              {services.filter((s) => s.isActive).length}
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">{services.length} total services</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Working Days</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-slate-900">{availabilities.length} days/wk</h3>
            <span className="text-[11px] text-slate-400 mt-1 block">Recurring availability</span>
          </div>
        </div>

        {/* 3. TABS NAVIGATION */}
        <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "services", label: "Service Offerings", icon: Layers },
            { id: "availability", label: "Availability Schedule", icon: Clock },
            { id: "bookings", label: "Bookings & Invoices", icon: FileText },
            { id: "settings", label: "Profile Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 bg-white rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. TAB CONTENTS */}

        {/* TAB 1: SERVICES */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">Service Catalogue</h3>
                <p className="text-xs text-slate-500">Manage the consultations and packages your clients can book.</p>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Service</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-heading font-bold text-slate-900 text-base">{srv.title}</h4>
                      <span className="font-heading font-extrabold text-indigo-600 text-lg">
                        ${Number(srv.price).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {srv.durationMinutes} mins
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          srv.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {srv.isActive ? "Active" : "Archived"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                      {srv.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => updateService({ id: srv.id, data: { isActive: !srv.isActive } })}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
                    >
                      {srv.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this service?")) deleteService(srv.id);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AVAILABILITY SCHEDULE */}
        {activeTab === "availability" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl">
            <h3 className="font-heading font-bold text-xl text-slate-900 mb-1">Weekly Working Schedule</h3>
            <p className="text-xs text-slate-500 mb-6">
              Define the days and time windows you are available. All slots will be dynamically adjusted to your clients' timezones.
            </p>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                const block = availabilities.find((a) => a.dayOfWeek === dayIndex);
                const isWorking = Boolean(block);

                return (
                  <div
                    key={dayName}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isWorking ? "bg-indigo-50/30 border-indigo-200" : "bg-slate-50/50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isWorking}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...availabilities, { dayOfWeek: dayIndex, startTime: "09:00", endTime: "17:00" }]
                            : availabilities.filter((a) => a.dayOfWeek !== dayIndex);

                          updateAvailability({
                            availabilities: updated.map((a) => ({
                              dayOfWeek: a.dayOfWeek,
                              startTime: a.startTime,
                              endTime: a.endTime,
                            })),
                          });
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="font-heading font-bold text-sm text-slate-900 w-28">{dayName}</span>
                    </div>

                    {isWorking ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">{block?.startTime}</span>
                        <span>to</span>
                        <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">{block?.endTime}</span>
                        <span className="text-slate-400 font-normal ml-2">({profile?.timezone})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Unavailable / Blackout Day</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BOOKINGS & INVOICES */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="font-heading font-bold text-xl text-slate-900 mb-1">Bookings & Paid Invoices</h3>
            <p className="text-xs text-slate-500 mb-6">Real-time oversight of confirmed and pending client appointments.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Service</th>
                    <th className="pb-3 font-semibold">Scheduled Time (UTC)</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 font-bold text-slate-900">
                        {b.clientName}
                        <span className="block text-[11px] font-normal text-slate-400">{b.clientEmail}</span>
                      </td>
                      <td className="py-4 text-slate-700">{b.service?.title || "Consultation"}</td>
                      <td className="py-4 font-medium text-slate-600">
                        {format(new Date(b.startTime), "MMM dd, yyyy @ HH:mm")}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : b.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {b.invoice ? (
                          <a
                            href={`/api/invoices/${b.invoice.invoiceNumber}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{b.invoice.invoiceNumber}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No invoice</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl">
            <h3 className="font-heading font-bold text-xl text-slate-900 mb-1">Provider Profile Settings</h3>
            <p className="text-xs text-slate-500 mb-6">Customize your business branding, timezone, and public booking slug.</p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Public Handle (URL slug)</label>
                <div className="flex items-center rounded-xl border border-slate-200 px-3 bg-slate-50">
                  <span className="text-xs text-slate-400 font-semibold">bookone.io/p/</span>
                  <input
                    type="text"
                    value={settingsForm.handle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, handle: e.target.value })}
                    className="w-full px-2 py-2.5 bg-transparent text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Headline</label>
                <input
                  type="text"
                  value={settingsForm.headline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, headline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Biography / About</label>
                <textarea
                  rows={4}
                  value={settingsForm.bio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Operating Timezone</label>
                <input
                  type="text"
                  value={settingsForm.timezone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdatingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* CREATE SERVICE MODAL */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-slate-900">Add New Service Offering</h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45-Min System Architecture Session"
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of what will be covered..."
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    required
                    value={newService.durationMinutes}
                    onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (USD $)</label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    required
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingService}
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700"
                >
                  {isCreatingService ? "Creating..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
