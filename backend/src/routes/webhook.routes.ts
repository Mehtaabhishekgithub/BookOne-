import { Router } from "express";
import { handleClerkWebhook } from "../controllers/webhook.controller.js";
import { handleStripeWebhook } from "../controllers/stripe-webhook.controller.js";

const router = Router();

// POST /api/webhooks/clerk - Syncs Clerk user lifecycle
router.post("/clerk", handleClerkWebhook);

// POST /api/webhooks/stripe - Handles Stripe payment completion
router.post("/stripe", handleStripeWebhook);

export default router;
