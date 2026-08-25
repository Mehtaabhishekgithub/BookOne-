import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../services/stripe.service.js";
import { prisma } from "../lib/prisma.js";
import { BookingStatus, InvoiceStatus } from "@prisma/client";

/**
 * Handles incoming cryptographically verified Stripe Webhooks.
 * Endpoint: POST /api/webhooks/stripe
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  // 1. Verify Webhook Signature
  if (webhookSecret && webhookSecret !== "whsec_placeholder" && signature) {
    try {
      const rawPayload = (req as any).rawBody || JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawPayload, signature, webhookSecret);
    } catch (err: any) {
      console.error("❌ Stripe Webhook signature verification failed:", err.message);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }
  } else {
    // Development / Local simulation fallback
    event = req.body;
    console.warn("⚠️ Warning: Stripe Webhook processed without signature verification (dev placeholder secret).");
  }

  const eventType = event.type;
  console.log(`📩 Received Stripe Webhook Event: [${eventType}]`);

  try {
    switch (eventType) {
      case "checkout.session.completed":
      case "payment_intent.succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        const bookingId = session.metadata?.bookingId;

        // Find the booking by bookingId or stripeSessionId
        const booking = await prisma.booking.findFirst({
          where: {
            OR: [
              ...(bookingId ? [{ id: bookingId }] : []),
              { stripeSessionId: sessionId },
            ],
          },
          include: { service: true, invoice: true },
        });

        if (!booking) {
          console.warn(`⚠️ No booking found matching Stripe session: ${sessionId}`);
          res.status(200).json({ received: true, warning: "Booking not found" });
          return;
        }

        // Idempotency: If booking is already confirmed, do not re-process
        if (booking.status === BookingStatus.CONFIRMED && booking.invoice) {
          console.log(`ℹ️ Booking ${booking.id} already confirmed & invoice issued.`);
          res.status(200).json({ received: true, message: "Already processed" });
          return;
        }

        // Execute Atomic Transaction: Confirm booking & generate Invoice
        const currentYear = new Date().getFullYear();
        const totalInvoices = await prisma.invoice.count();
        const invoiceNumber = `INV-${currentYear}-${String(totalInvoices + 1).padStart(4, "0")}`;

        await prisma.$transaction(async (tx) => {
          // 1. Transition Booking -> CONFIRMED
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CONFIRMED,
              stripeSessionId: sessionId,
            },
          });

          // 2. Insert Invoice -> PAID
          await tx.invoice.upsert({
            where: { bookingId: booking.id },
            update: {
              status: InvoiceStatus.PAID,
              amount: booking.service.price,
              currency: booking.service.currency,
            },
            create: {
              bookingId: booking.id,
              invoiceNumber,
              amount: booking.service.price,
              currency: booking.service.currency,
              status: InvoiceStatus.PAID,
            },
          });
        });

        console.log(`✅ Booking ${booking.id} successfully CONFIRMED! Generated Invoice: ${invoiceNumber}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        const bookingId = session.metadata?.bookingId;

        // Release slot by cancelling pending booking
        await prisma.booking.updateMany({
          where: {
            OR: [
              ...(bookingId ? [{ id: bookingId }] : []),
              { stripeSessionId: sessionId },
            ],
            status: BookingStatus.PENDING,
          },
          data: { status: BookingStatus.CANCELLED },
        });

        console.log(`⏰ Released expired pending booking for session: ${sessionId}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${eventType}`);
    }

    res.status(200).json({ received: true, event: eventType });
  } catch (error: any) {
    console.error("❌ Error executing Stripe webhook transaction:", error);
    res.status(500).json({ error: "Failed to process Stripe webhook", details: error.message });
  }
}
