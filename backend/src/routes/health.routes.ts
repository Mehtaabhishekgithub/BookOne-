import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  let dbStatus = "disconnected";
  let dbLatencyMs: number | null = null;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = `error: ${error?.message || "unknown"}`;
  }

  res.status(dbStatus === "connected" ? 200 : 503).json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    service: "BookOne API Engine",
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    uptime: process.uptime(),
  });
});

export default router;
