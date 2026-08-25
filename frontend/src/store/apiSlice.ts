import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  User,
  ProviderProfile,
  Service,
  Availability,
  Booking,
  AvailableSlotsResponse,
} from "../types/index.js";

// Helper to get active clerk ID header (defaults to mock provider for easy live demo)
const getDevClerkHeader = () => {
  return localStorage.getItem("bookone_clerk_id") || "user_mock_provider_01";
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const devClerkId = getDevClerkHeader();
      if (devClerkId) {
        headers.set("x-user-clerk-id", devClerkId);
      }
      return headers;
    },
  }),
  tagTypes: ["User", "ProviderProfile", "Services", "Availability", "Bookings", "Slots"],
  endpoints: (builder) => ({
    // 1. Health
    getHealth: builder.query<any, void>({
      query: () => "/health",
    }),

    // 2. Current User
    getMe: builder.query<{ success: boolean; data: User }, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),

    // 3. Public Provider Profile
    getPublicProfile: builder.query<{ success: boolean; data: ProviderProfile }, string>({
      query: (handle) => `/public/${handle}`,
      providesTags: (_res, _err, handle) => [{ type: "ProviderProfile", id: handle }],
    }),

    // 4. Public Timezone-Safe Available Slots
    getPublicSlots: builder.query<
      { success: boolean; data: AvailableSlotsResponse },
      { handle: string; date: string; timezone: string; serviceId?: string }
    >({
      query: ({ handle, date, timezone, serviceId }) => {
        let url = `/public/${handle}/slots?date=${date}&timezone=${encodeURIComponent(timezone)}`;
        if (serviceId) url += `&serviceId=${serviceId}`;
        return url;
      },
      providesTags: ["Slots"],
    }),

    // 5. Create Checkout Session
    createCheckoutSession: builder.mutation<
      { success: boolean; bookingId: string; checkoutUrl: string; sessionId: string; mock?: boolean },
      {
        providerHandle: string;
        serviceId?: string;
        startTimeUTC: string;
        endTimeUTC: string;
        clientName: string;
        clientEmail: string;
        clientTimezone: string;
      }
    >({
      query: (body) => ({
        url: "/public/checkout/session",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Slots", "Bookings"],
    }),

    // 6. Booking Details
    getBookingDetails: builder.query<{ success: boolean; data: Booking }, string>({
      query: (id) => `/public/bookings/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Bookings", id }],
    }),

    // 7. Provider: Profile
    getProviderProfile: builder.query<{ success: boolean; data: ProviderProfile }, void>({
      query: () => "/provider/profile",
      providesTags: ["ProviderProfile"],
    }),
    updateProviderProfile: builder.mutation<
      { success: boolean; message: string; data: ProviderProfile },
      Partial<ProviderProfile>
    >({
      query: (body) => ({
        url: "/provider/profile",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProviderProfile", "User"],
    }),

    // 8. Provider: Services
    getProviderServices: builder.query<{ success: boolean; data: Service[] }, void>({
      query: () => "/provider/services",
      providesTags: ["Services"],
    }),
    createProviderService: builder.mutation<
      { success: boolean; message: string; data: Service },
      Omit<Service, "id" | "providerId" | "createdAt">
    >({
      query: (body) => ({
        url: "/provider/services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Services", "Slots"],
    }),
    updateProviderService: builder.mutation<
      { success: boolean; message: string; data: Service },
      { id: string; data: Partial<Service> }
    >({
      query: ({ id, data }) => ({
        url: `/provider/services/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Services", "Slots"],
    }),
    deleteProviderService: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/provider/services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Services", "Slots"],
    }),

    // 9. Provider: Availability
    getProviderAvailability: builder.query<{ success: boolean; data: Availability[] }, void>({
      query: () => "/provider/availability",
      providesTags: ["Availability"],
    }),
    updateProviderAvailability: builder.mutation<
      { success: boolean; message: string; data: Availability[] },
      { availabilities: Omit<Availability, "id" | "providerId">[] }
    >({
      query: (body) => ({
        url: "/provider/availability",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Availability", "Slots"],
    }),

    // 10. Provider: Bookings
    getProviderBookings: builder.query<{ success: boolean; data: Booking[] }, { status?: string } | void>({
      query: (params) => {
        let url = "/provider/bookings";
        if (params?.status) url += `?status=${params.status}`;
        return url;
      },
      providesTags: ["Bookings"],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetMeQuery,
  useGetPublicProfileQuery,
  useGetPublicSlotsQuery,
  useCreateCheckoutSessionMutation,
  useGetBookingDetailsQuery,
  useGetProviderProfileQuery,
  useUpdateProviderProfileMutation,
  useGetProviderServicesQuery,
  useCreateProviderServiceMutation,
  useUpdateProviderServiceMutation,
  useDeleteProviderServiceMutation,
  useGetProviderAvailabilityQuery,
  useUpdateProviderAvailabilityMutation,
  useGetProviderBookingsQuery,
} = apiSlice;
