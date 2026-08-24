import dotenv from "dotenv";
import { createApp } from "./app.js";

// Load environment variables from .env
dotenv.config();

const PORT = parseInt(process.env.PORT || "5000", 10);
const app = createApp();

const server = app.listen(PORT, () => {
  console.log("==========================================");
  console.log(`🚀 BookOne API Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log("==========================================");
});

// Graceful shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully terminating BookOne server...`);
  server.close(() => {
    console.log("Server stopped. Exiting process.");
    process.exit(0);
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
