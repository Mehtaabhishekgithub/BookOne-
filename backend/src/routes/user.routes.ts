import { Router } from "express";
import { getMe, updateRole, syncUser } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Public / Client sync endpoint
router.post("/sync", syncUser);

// Protected routes (require valid authentication)
router.get("/me", requireAuth, getMe);
router.post("/role", requireAuth, updateRole);

export default router;
