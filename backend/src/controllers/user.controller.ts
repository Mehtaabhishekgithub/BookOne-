import { Request, Response } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// Validation schema for role updates
const UpdateRoleSchema = z.object({
  role: z.nativeEnum(Role),
  handle: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, "Handle must only contain lowercase letters, numbers, and hyphens").optional(),
  timezone: z.string().optional(),
});

// Validation schema for manual on-demand sync from frontend
const SyncUserSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  role: z.nativeEnum(Role).optional(),
});

/**
 * Get profile of current authenticated user.
 * GET /api/users/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;

    // Fetch rich stats
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        providerProfile: {
          include: {
            _count: {
              select: {
                services: true,
                bookings: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: fullUser,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user profile", message: error.message });
  }
}

/**
 * Update user role and initialize ProviderProfile if switching to PROVIDER.
 * POST /api/users/role
 */
export async function updateRole(req: Request, res: Response): Promise<void> {
  const parseResult = UpdateRoleSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation Error",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { role, handle, timezone } = parseResult.data;
  const user = req.user!;

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update user role
      const u = await tx.user.update({
        where: { id: user.id },
        data: { role },
      });

      // 2. If role is PROVIDER, ensure ProviderProfile exists
      if (role === Role.PROVIDER) {
        const defaultSlug = handle || `${(u.firstName || "user").toLowerCase()}-${u.id.substring(0, 6)}`;
        
        await tx.providerProfile.upsert({
          where: { userId: u.id },
          update: {
            ...(handle && { handle }),
            ...(timezone && { timezone }),
          },
          create: {
            userId: u.id,
            handle: defaultSlug,
            headline: "Service Provider & Consultant",
            timezone: timezone || "UTC",
          },
        });
      }

      return tx.user.findUnique({
        where: { id: u.id },
        include: { providerProfile: true },
      });
    });

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}`,
      data: updatedUser,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "Conflict", message: "This provider handle is already taken." });
      return;
    }
    res.status(500).json({ error: "Failed to update role", message: error.message });
  }
}

/**
 * Frontend on-demand user synchronization.
 * Useful when client signs in and ensures DB user record is immediately ready.
 * POST /api/users/sync
 */
export async function syncUser(req: Request, res: Response): Promise<void> {
  const parseResult = SyncUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation Error", details: parseResult.error.flatten() });
    return;
  }

  const { clerkId, email, firstName, lastName, role = Role.CLIENT } = parseResult.data;

  try {
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      create: {
        clerkId,
        email,
        firstName,
        lastName,
        role,
      },
      include: {
        providerProfile: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to sync user", message: error.message });
  }
}
