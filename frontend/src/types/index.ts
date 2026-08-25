export type Role = "CLIENT" | "PROVIDER" | "ADMIN";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type InvoiceStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: Role;
  createdAt: string;
  providerProfile?: ProviderProfile | null;
  _count?: {
    bookings?: number;
    services?: number;
  };
}

export interface ProviderProfile {
  id: string;
  userId: string;
  handle: string;
  name?: string;
  headline?: string | null;
  bio?: string | null;
  timezone: string;
  createdAt: string;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  services?: Service[];
  availabilities?: Availability[];
  _count?: {
    services?: number;
    bookings?: number;
  };
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  price: number | string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface Availability {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0=Sunday ... 6=Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface Booking {
  id: string;
  providerId: string;
  clientId?: string | null;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  stripeSessionId?: string | null;
  createdAt: string;
  service?: Service;
  invoice?: Invoice | null;
  provider?: {
    handle: string;
    headline?: string | null;
    timezone: string;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      email: string;
    };
  };
}

export interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  amount: number | string;
  currency: string;
  status: InvoiceStatus;
  pdfUrl?: string | null;
  createdAt: string;
}

export interface SlotWindow {
  startTimeUTC: string;
  endTimeUTC: string;
  localStartTime: string;
  localEndTime: string;
  clientTimezone: string;
  providerTimezone: string;
}

export interface AvailableSlotsResponse {
  date: string;
  clientTimezone: string;
  providerTimezone: string;
  service: {
    id: string;
    title: string;
    durationMinutes: number;
    price: number;
    currency: string;
  };
  totalSlots: number;
  availableSlots: SlotWindow[];
}
