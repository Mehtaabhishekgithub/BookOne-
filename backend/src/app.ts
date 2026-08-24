import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import apiRouter from "./routes/index.js";

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );
  
  // Note: Webhook routes will need raw bodies for cryptographic signatures;
  // standard json parsing is applied here, while webhooks will use custom body parser.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  // API Routes
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
