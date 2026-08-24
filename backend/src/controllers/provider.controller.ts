import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { BookingStatus } from "@prisma/client";

// Zod Schemas
const UpdateProfileSchema = z.object({
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  timezone: z.string().min(1, "Timezone is required").optional(),
  handle: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, "Handle must only contain lowercase letters, numbers, and hyphens").optional(),
});

const ServiceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(1000).optional().nullable(),
  durationMinutes: z.number().int().min(15).max(480), // 15 min to 8 hrs
  price: z.number().min(0, "Price cannot be negative"),
  currency: z.string().default("USD"),
  isActive: z.boolean().default(true),
});

const AvailabilityBlockSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be HH:mm (24-hr)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be HH:mm (24-hr)"),
}).refine((data) => data.startTime < data.endTime, {
  message: "Start time must be strictly before end time",
  path: ["endTime"],
});

const UpdateAvailabilitySchema = z.object({
  availabilities: z.array(AvailabilityBlockSchema),
});

/**
 * Get provider profile and configurations.
 * GET /api/provider/profile
 */
export async function getProviderProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      include: {
        services: true,
        availabilities: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    if (!profile) {
      res.status(404).json({ error: "Provider profile not found." });
      return;
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch provider profile", message: error.message });
  }
}

/**
 * Update provider business details, timezone, or handle.
 * POST /api/provider/profile
 */
export async function updateProviderProfile(req: Request, res: Response): Promise<void> {
  const parse = UpdateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation Error", details: parse.error.flatten() });
    return;
  }

  const user = req.user!;
  const data = parse.data;

  try {
    const updated = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        handle: data.handle || `${(user.firstName || "provider").toLowerCase()}-${user.id.substring(0, 6)}`,
        headline: data.headline,
        bio: data.bio,
        timezone: data.timezone || "UTC",
      },
    });

    res.status(200).json({ success: true, message: "Provider profile updated", data: updated });
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "Conflict", message: "This handle is already in use by another provider." });
      return;
    }
    res.status(500).json({ error: "Failed to update profile", message: error.message });
  }
}

/**
 * List all services belonging to provider.
 * GET /api/provider/services
 */
export async function getProviderServices(req: Request, res: Response): Promise<void> {
  try {
    const profile = req.user?.providerProfile;
    if (!profile) {
      res.status(404).json({ error: "Provider profile not initialized." });
      return;
    }

    const services = await prisma.service.findMany({
      where: { providerId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: services });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch services", message: error.message });
  }
}

/**
 * Create a new service offering.
 * POST /api/provider/services
 */
export async function createService(req: Request, res: Response): Promise<void> {
  const parse = ServiceSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation Error", details: parse.error.flatten() });
    return;
  }

  const profile = req.user?.providerProfile;
  if (!profile) {
    res.status(404).json({ error: "Provider profile not initialized." });
    return;
  }

  const { title, description, durationMinutes, price, currency, isActive } = parse.data;

  try {
    const service = await prisma.service.create({
      data: {
        providerId: profile.id,
        title,
        description,
        durationMinutes,
        price,
        currency,
        isActive,
      },
    });

    res.status(201).json({ success: true, message: "Service created successfully", data: service });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create service", message: error.message });
  }
}

/**
 * Update an existing service.
 * PUT /api/provider/services/:id
 */
export async function updateService(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parse = ServiceSchema.partial().safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation Error", details: parse.error.flatten() });
    return;
  }

  const profile = req.user?.providerProfile;
  if (!profile) {
    res.status(404).json({ error: "Provider profile not initialized." });
    return;
  }

  try {
    const existing = await prisma.service.findFirst({
      where: { id, providerId: profile.id },
    });

    if (!existing) {
      res.status(404).json({ error: "Service not found." });
      return;
    }

    const updated = await prisma.service.update({
      where: { id },
      data: parse.data,
    });

    res.status(200).json({ success: true, message: "Service updated", data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update service", message: error.message });
  }
}

/**
 * Delete or archive service.
 * DELETE /api/provider/services/:id
 */
export async function deleteService(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const profile = req.user?.providerProfile;
  if (!profile) {
    res.status(404).json({ error: "Provider profile not initialized." });
    return;
  }

  try {
    // Check if there are active bookings for this service
    const activeBookingsCount = await prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    if (activeBookingsCount > 0) {
      // Soft-archive instead of hard deleting to preserve booking history
      const archived = await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      res.status(200).json({
        success: true,
        message: "Service has active bookings. It has been deactivated/archived rather than deleted.",
        data: archived,
      });
      return;
    }

    await prisma.service.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Service successfully deleted." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete service", message: error.message });
  }
}

/**
 * Get provider's weekly availability schedule.
 * GET /api/provider/availability
 */
export async function getAvailability(req: Request, res: Response): Promise<void> {
  const profile = req.user?.providerProfile;
  if (!profile) {
    res.status(404).json({ error: "Provider profile not initialized." });
    return;
  }

  try {
    const availabilities = await prisma.availability.findMany({
      where: { providerId: profile.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    res.status(200).json({ success: true, data: availabilities });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch availability", message: error.message });
  }
}

/**
 * Replace / configure weekly working availability blocks.
 * PUT /api/provider/availability
 */
export async function updateAvailability(req: Request, res: Response): Promise<void> {
  const parse = UpdateAvailabilitySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation Error", details: parse.error.flatten() });
    return;
  }

  const profile = req.user?.providerProfile;
  if (!profile) {
    res.status(404).json({ error: "Provider profile not initialized." });
    return;
  }

  const { availabilities } = parse.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Remove existing working blocks
      await tx.availability.deleteMany({
        where: { providerId: profile.id },
      });

      // 2. Insert new blocks
      if (availabilities.length > 0) {
        await tx.availability.createMany({
          data: availabilities.map((a) => ({
            providerId: profile.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          })),
        });
      }

      return tx.availability.findMany({
        where: { providerId: profile.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    });

    res.status(200).json({
      success: true,
      message: "Weekly availability schedule successfully updated.",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update availability schedule", message: error.message });
  }
}

/**
 * List all bookings for provider with filters.
 * GET /api/provider/bookings
 */
export async function getProviderBookings(req: Request, res: Response): Promise<void> {
  const profile = req.user?.providerProfile;
  if (!profile) {
    res.status(404).json({ error: "Provider profile not initialized." });
    return;
  }

  const status = req.query.status as BookingStatus | undefined;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        ...(status && { status }),
      },
      include: {
        service: true,
        invoice: true,
      },
      orderBy: { startTime: "asc" },
    });

    res.status(200).json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch bookings", message: error.message });
  }
}
