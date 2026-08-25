import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { stripe, isStripeConfigured } from "../services/stripe.service.js";
import { BookingStatus } from "@prisma/client";

const CheckoutSessionSchema = z.object({
  providerHandle: z.string().min(1, "providerHandle is required"),
  serviceId: z.string().optional(),
  startTimeUTC: z.string().datetime({ message: "startTimeUTC must be a valid ISO 8601 UTC timestamp" }),
  endTimeUTC: z.string().datetime({ message: "endTimeUTC must be a valid ISO 8601 UTC timestamp" }),
  clientName: z.string().min(2, "Client name must be at least 2 characters"),
  clientEmail: z.string().email("A valid client email is required"),
  clientTimezone: z.string().default("UTC"),
});

/**
 * Creates a pending booking and generates a Stripe Checkout session.
 * POST /api/public/checkout/session
 */
export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const parseResult = CheckoutSessionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation Error", details: parseResult.error.flatten() });
    return;
  }

  const {
    providerHandle,
    serviceId,
    startTimeUTC,
    endTimeUTC,
    clientName,
    clientEmail,
    clientTimezone,
  } = parseResult.data;

  const start = new Date(startTimeUTC);
  const end = new Date(endTimeUTC);

  // Ensure start time is before end time and not in the past
  if (start >= end) {
    res.status(400).json({ error: "Invalid Timespan", message: "startTimeUTC must be strictly before endTimeUTC." });
    return;
  }

  if (start.getTime() <= Date.now()) {
    res.status(400).json({ error: "Invalid Slot", message: "Cannot book a time slot in the past." });
    return;
  }

  try {
    // 1. Fetch Provider Profile and Service
    const provider = await prisma.providerProfile.findUnique({
      where: { handle: providerHandle },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        services: {
          where: {
            isActive: true,
            ...(serviceId && { id: serviceId }),
          },
        },
      },
    });

    if (!provider) {
      res.status(404).json({ error: "Provider not found." });
      return;
    }

    const service = provider.services[0];
    if (!service) {
      res.status(404).json({ error: serviceId ? `Service with ID '${serviceId}' not found.` : "Provider has no active services." });
      return;
    }

    // 2. Overlap Verification (Check for active bookings at this time)
    const existingConflict = await prisma.booking.findFirst({
      where: {
        providerId: provider.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (existingConflict) {
      res.status(409).json({
        error: "Slot Unavailable",
        message: "This slot is no longer available. Please select another time window.",
      });
      return;
    }

    // 3. Create a temporary Booking in status PENDING
    const pendingBooking = await prisma.booking.create({
      data: {
        providerId: provider.id,
        serviceId: service.id,
        clientName,
        clientEmail,
        startTime: start,
        endTime: end,
        status: BookingStatus.PENDING,
      },
    });

    // 4. Generate Stripe Checkout Session
    if (isStripeConfigured()) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const unitAmountCents = Math.round(Number(service.price) * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: clientEmail,
        line_items: [
          {
            price_data: {
              currency: service.currency.toLowerCase(),
              product_data: {
                name: `${service.title} with ${provider.user.firstName || "Provider"}`,
                description: service.description || `${service.durationMinutes}-minute session`,
              },
              unit_amount: unitAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: pendingBooking.id,
          providerId: provider.id,
          serviceId: service.id,
          clientEmail,
          clientTimezone,
        },
        success_url: `${frontendUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${pendingBooking.id}`,
        cancel_url: `${frontendUrl}/booking/cancel?booking_id=${pendingBooking.id}`,
      });

      // Update booking with stripeSessionId
      await prisma.booking.update({
        where: { id: pendingBooking.id },
        data: { stripeSessionId: session.id },
      });

      res.status(200).json({
        success: true,
        bookingId: pendingBooking.id,
        checkoutUrl: session.url,
        sessionId: session.id,
        mock: false,
      });
    } else {
      // Mock mode for local testing without active Stripe API keys
      const mockSessionId = `cs_mock_${Date.now()}_${pendingBooking.id.substring(0, 8)}`;
      
      await prisma.booking.update({
        where: { id: pendingBooking.id },
        data: { stripeSessionId: mockSessionId },
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const mockCheckoutUrl = `${frontendUrl}/booking/success?mock_session=true&session_id=${mockSessionId}&booking_id=${pendingBooking.id}`;

      res.status(200).json({
        success: true,
        message: "Stripe test mode: mock session created.",
        bookingId: pendingBooking.id,
        checkoutUrl: mockCheckoutUrl,
        sessionId: mockSessionId,
        mock: true,
      });
    }
  } catch (error: any) {
    console.error("Checkout session creation error:", error);
    res.status(500).json({ error: "Failed to create checkout session", message: error.message });
  }
}

/**
 * Retrieve booking confirmation and invoice details by ID.
 * GET /api/public/bookings/:id
 */
export async function getBookingDetails(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        invoice: true,
        provider: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch booking details", message: error.message });
  }
}
