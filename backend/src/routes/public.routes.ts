import { Router } from "express";
import { getPublicProfile, getPublicSlots } from "../controllers/public.controller.js";
import { createCheckoutSession, getBookingDetails } from "../controllers/checkout.controller.js";

const router = Router();

// GET /api/public/:handle - Public profile & active service list
router.get("/:handle", getPublicProfile);

// GET /api/public/:handle/slots - Dynamic timezone-adjusted available slots
router.get("/:handle/slots", getPublicSlots);

// POST /api/public/checkout/session - Lock slot and initiate Stripe Checkout
router.post("/checkout/session", createCheckoutSession);

// GET /api/public/bookings/:id - View booking confirmation and invoice status
router.get("/bookings/:id", getBookingDetails);

export default router;
