import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AuthenticatedUser } from "../types/express.js";

/**
 * Authentication middleware that extracts the user identity from Clerk JWT
 * or developer test headers and populates req.user from PostgreSQL.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let clerkId: string | null = null;
    const authHeader = req.headers.authorization;

    // 1. Check for Bearer token in Authorization header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      // If a real Clerk Secret Key is set (not the placeholder), we can parse/verify
      if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY !== "sk_test_placeholder") {
        try {
          // For standard Clerk JWTs, Clerk populates sub with the Clerk User ID
          // Basic payload decode if not full network verification
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
            clerkId = payload.sub || payload.userId || null;
          }
        } catch {
          // fallback
        }
      }

      // If token itself is a direct clerkId or mock ID (common during local dev/testing)
      if (!clerkId && token) {
        clerkId = token;
      }
    }

    // 2. Local development header fallback (for easy Postman/cURL testing)
    if (!clerkId) {
      const devClerkId = req.headers["x-user-clerk-id"] as string;
      const devUserId = req.headers["x-user-id"] as string;

      if (devUserId) {
        const user = await prisma.user.findUnique({
          where: { id: devUserId },
          include: { providerProfile: true },
        });
        if (user) {
          req.user = user as AuthenticatedUser;
          return next();
        }
      }

      if (devClerkId) {
        clerkId = devClerkId;
      }
    }

    // 3. If clerkId was identified, resolve User from PostgreSQL
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { providerProfile: true },
      });

      if (user) {
        req.user = user as AuthenticatedUser;
      }
    }

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    next(error);
  }
}

/**
 * Middleware requiring that the user is authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication is required to access this resource. Please provide a valid Bearer token or Clerk session.",
    });
    return;
  }
  next();
}

/**
 * Middleware requiring the authenticated user to have one of the specified roles.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}
