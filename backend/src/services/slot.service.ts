import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { addMinutes, isBefore, parseISO, isWithinInterval, max, min } from "date-fns";
import { prisma } from "../lib/prisma.js";
import { BookingStatus } from "@prisma/client";

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

/**
 * Timezone-Safe Slot Generation Engine
 * Generates discrete, non-overlapping booking slots for a given provider, service, date, and client timezone.
 */
export async function calculateAvailableSlots(params: {
  providerId: string;
  serviceId?: string;
  dateStr: string; // "YYYY-MM-DD"
  clientTimezone: string; // e.g. "Asia/Kolkata", "America/New_York"
}): Promise<AvailableSlotsResponse> {
  const { providerId, serviceId, dateStr, clientTimezone } = params;

  // 1. Fetch Provider Profile and Services
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: {
      availabilities: true,
      services: {
        where: {
          isActive: true,
          ...(serviceId && { id: serviceId }),
        },
      },
    },
  });

  if (!provider) {
    throw new Error("Provider profile not found.");
  }

  const service = provider.services[0];
  if (!service) {
    throw new Error(serviceId ? `Service with ID '${serviceId}' not found or inactive.` : "Provider has no active services.");
  }

  const providerTimezone = provider.timezone || "UTC";
  const duration = service.durationMinutes;

  // 2. Define the 24-hour target day window in the Client's timezone
  // Client's day starts at 00:00:00 and ends at 23:59:59 in clientTimezone
  const clientDayStart = fromZonedTime(`${dateStr}T00:00:00.000`, clientTimezone);
  const clientDayEnd = fromZonedTime(`${dateStr}T23:59:59.999`, clientTimezone);

  // 3. We check the provider's working days across dates that could overlap with this UTC window
  // Because timezones can differ by up to 14 hours (+/- 1 day), we evaluate target date and adjacent days
  const candidateSlots: { startUTC: Date; endUTC: Date }[] = [];

  // Generate date strings for previous day, current day, and next day in provider's timezone
  const daysToCheck = [-1, 0, 1];

  for (const dayOffset of daysToCheck) {
    // Calculate reference date
    const baseDate = new Date(clientDayStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const providerDateStr = formatInTimeZone(baseDate, providerTimezone, "yyyy-MM-dd");
    const dayOfWeek = parseInt(formatInTimeZone(baseDate, providerTimezone, "i"), 10) % 7; // 0=Sunday, 1=Monday, ... 6=Saturday

    // Find provider working blocks for this day of week
    const workingBlocks = provider.availabilities.filter((a) => a.dayOfWeek === dayOfWeek);

    for (const block of workingBlocks) {
      // Parse block start and end time in Provider's timezone
      const blockStartUTC = fromZonedTime(`${providerDateStr}T${block.startTime}:00.000`, providerTimezone);
      const blockEndUTC = fromZonedTime(`${providerDateStr}T${block.endTime}:00.000`, providerTimezone);

      // Slice working block into duration-sized intervals
      let currentSlotStart = blockStartUTC;

      while (true) {
        const currentSlotEnd = addMinutes(currentSlotStart, duration);
        if (currentSlotEnd > blockEndUTC) {
          break;
        }

        // Only include candidate slot if its start falls within the requested client day
        if (currentSlotStart >= clientDayStart && currentSlotStart <= clientDayEnd) {
          candidateSlots.push({
            startUTC: currentSlotStart,
            endUTC: currentSlotEnd,
          });
        }

        currentSlotStart = currentSlotEnd;
      }
    }
  }

  // 4. Fetch all existing active bookings for this provider in this UTC range
  const existingBookings = await prisma.booking.findMany({
    where: {
      providerId: provider.id,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      },
      startTime: {
        lte: clientDayEnd,
      },
      endTime: {
        gte: clientDayStart,
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const nowUTC = new Date();

  // 5. Exclude candidate slots that overlap with existing bookings or are in the past
  const availableSlots: SlotWindow[] = [];

  for (const slot of candidateSlots) {
    // Exclude slots in the past
    if (slot.startUTC <= nowUTC) {
      continue;
    }

    // Check if slot overlaps with any active booking
    const hasOverlap = existingBookings.some((booking) => {
      // Overlap condition: slot.start < booking.end AND slot.end > booking.start
      return slot.startUTC < booking.endTime && slot.endUTC > booking.startTime;
    });

    if (!hasOverlap) {
      availableSlots.push({
        startTimeUTC: slot.startUTC.toISOString(),
        endTimeUTC: slot.endUTC.toISOString(),
        localStartTime: formatInTimeZone(slot.startUTC, clientTimezone, "HH:mm"),
        localEndTime: formatInTimeZone(slot.endUTC, clientTimezone, "HH:mm"),
        clientTimezone,
        providerTimezone,
      });
    }
  }

  // Sort slots chronologically
  availableSlots.sort((a, b) => new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime());

  return {
    date: dateStr,
    clientTimezone,
    providerTimezone,
    service: {
      id: service.id,
      title: service.title,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      currency: service.currency,
    },
    totalSlots: availableSlots.length,
    availableSlots,
  };
}
