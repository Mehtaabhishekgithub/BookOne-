import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  getProviderProfile,
  updateProviderProfile,
  getProviderServices,
  createService,
  updateService,
  deleteService,
  getAvailability,
  updateAvailability,
  getProviderBookings,
} from "../controllers/provider.controller.js";

const router = Router();

// Apply provider auth guard to all routes in this router
router.use(requireAuth);
router.use(requireRole(Role.PROVIDER));

// Profile management
router.get("/profile", getProviderProfile);
router.post("/profile", updateProviderProfile);

// Service offering management
router.get("/services", getProviderServices);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

// Working hours & availability management
router.get("/availability", getAvailability);
router.put("/availability", updateAvailability);

// Bookings oversight
router.get("/bookings", getProviderBookings);

export default router;
