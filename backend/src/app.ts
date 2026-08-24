import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import apiRouter from "./routes/index.js";
import { authenticate } from "./middleware/auth.middleware.js";

export function createApp(): Express {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );

  // Parse raw body for webhook signature verification (Svix / Stripe)
  app.use(
    express.json({
      verify: (req: Request, _res: Response, buf: Buffer) => {
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  // Global user resolution middleware
  app.use("/api", authenticate);

  // Mount API Routes
  app.use("/api", apiRouter);

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: "The requested endpoint does not exist on BookOne API.",
    });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled API Error:", err);
    res.status(err.status || 500).json({
      error: err.name || "InternalServerError",
      message: err.message || "An unexpected server error occurred.",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  return app;
}

export default createApp;
