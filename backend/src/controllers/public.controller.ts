import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { calculateAvailableSlots } from "../services/slot.service.js";

const SlotQuerySchema = z.object({
  serviceId: z
    .preprocess((val) => (Array.isArray(val) ? val[0] : val), z.string())
    .optional()
    .transform((val) => (val === "PASTE_SERVICE_ID_HERE" || !val ? undefined : val)),
  date: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
  ),
  timezone: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().min(1, "timezone is required").default("UTC")
  ),
});

/**
 * Get public provider profile and active service offerings.
 * GET /api/public/:handle
 */
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  const { handle } = req.params;

  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { handle },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            durationMinutes: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({
        error: "Not Found",
        message: `Provider with handle '${handle}' was not found.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: profile.id,
        handle: profile.handle,
        name: `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim() || "Provider",
        email: profile.user.email,
        headline: profile.headline,
        bio: profile.bio,
        timezone: profile.timezone,
        services: profile.services,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch public profile", message: error.message });
  }
}

/**
 * Compute and return available booking slots adjusted to the client's local timezone.
 * GET /api/public/:handle/slots?serviceId=...&date=YYYY-MM-DD&timezone=...
 */
export async function getPublicSlots(req: Request, res: Response): Promise<void> {
  const { handle } = req.params;
  const parse = SlotQuerySchema.safeParse(req.query);

  if (!parse.success) {
    res.status(400).json({ error: "Validation Error", details: parse.error.flatten() });
    return;
  }

  const { serviceId, date, timezone } = parse.data;

  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { handle },
    });

    if (!profile) {
      res.status(404).json({ error: "Provider not found." });
      return;
    }

    // Validate client timezone using Intl API
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      res.status(400).json({
        error: "Invalid Timezone",
        message: `The timezone '${timezone}' is not a valid IANA timezone identifier.`,
      });
      return;
    }

    const slotResults = await calculateAvailableSlots({
      providerId: profile.id,
      serviceId,
      dateStr: date,
      clientTimezone: timezone,
    });

    res.status(200).json({
      success: true,
      data: slotResults,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to calculate slots", message: error.message });
  }
}
