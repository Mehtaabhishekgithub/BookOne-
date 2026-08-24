import { Router } from "express";
import { getPublicProfile, getPublicSlots } from "../controllers/public.controller.js";

const router = Router();

// GET /api/public/:handle - View public provider landing page data
router.get("/:handle", getPublicProfile);

// GET /api/public/:handle/slots?serviceId=...&date=YYYY-MM-DD&timezone=...
router.get("/:handle/slots", getPublicSlots);

export default router;
