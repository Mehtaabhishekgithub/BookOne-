import { Request, Response } from "express";
import { Webhook } from "svix";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

/**
 * Handles incoming webhooks from Clerk to synchronize User data in PostgreSQL.
 * Endpoint: POST /api/webhooks/clerk
 */
export async function handleClerkWebhook(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  // Retrieve Svix headers
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  let event: any;

  // Cryptographic signature verification with Svix
  if (webhookSecret && webhookSecret !== "whsec_placeholder") {
    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({ error: "Missing required Svix signature headers." });
      return;
    }

    try {
      const wh = new Webhook(webhookSecret);
      const rawPayload = (req as any).rawBody?.toString("utf8") || JSON.stringify(req.body);
      
      event = wh.verify(rawPayload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as any;
    } catch (err: any) {
      console.error("❌ Clerk Webhook signature verification failed:", err.message);
      res.status(400).json({ error: "Invalid webhook signature." });
      return;
    }
  } else {
    // Development/Test mode when secret is not yet configured in .env
    event = req.body;
    console.warn("⚠️ Warning: Clerk Webhook processed without signature verification (dev placeholder secret).");
  }

  const eventType = event.type;
  const data = event.data;

  console.log(`📩 Received Clerk Webhook Event: [${eventType}] for ID: ${data?.id}`);

  try {
    switch (eventType) {
      case "user.created": {
        const clerkId = data.id;
        const primaryEmailId = data.primary_email_address_id;
        const emailObj = data.email_addresses?.find((e: any) => e.id === primaryEmailId) || data.email_addresses?.[0];
        const email = emailObj?.email_address || `${clerkId}@example.com`;
        const firstName = data.first_name || null;
        const lastName = data.last_name || null;
        
        // Check role in metadata or default to CLIENT
        const metaRole = data.public_metadata?.role?.toUpperCase();
        const role: Role = metaRole === "PROVIDER" ? Role.PROVIDER : metaRole === "ADMIN" ? Role.ADMIN : Role.CLIENT;

        // Upsert User
        const user = await prisma.user.upsert({
          where: { clerkId },
          update: {
            email,
            firstName,
            lastName,
            role,
          },
          create: {
            clerkId,
            email,
            firstName,
            lastName,
            role,
          },
        });

        // If newly created as a Provider, ensure a ProviderProfile exists
        if (role === Role.PROVIDER) {
          const baseSlug = (data.username || firstName || email.split("@")[0] || "provider")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          const uniqueHandle = `${baseSlug}-${user.id.substring(0, 6)}`;

          await prisma.providerProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
              userId: user.id,
              handle: uniqueHandle,
              headline: "Service Provider & Consultant",
              timezone: "UTC",
            },
          });
        }

        console.log(`✅ Synced new user: ${email} (${role})`);
        break;
      }

      case "user.updated": {
        const clerkId = data.id;
        const primaryEmailId = data.primary_email_address_id;
        const emailObj = data.email_addresses?.find((e: any) => e.id === primaryEmailId) || data.email_addresses?.[0];
        const email = emailObj?.email_address;
        const firstName = data.first_name || null;
        const lastName = data.last_name || null;

        const metaRole = data.public_metadata?.role?.toUpperCase();
        const role: Role | undefined = metaRole === "PROVIDER" ? Role.PROVIDER : metaRole === "ADMIN" ? Role.ADMIN : metaRole === "CLIENT" ? Role.CLIENT : undefined;

        await prisma.user.updateMany({
          where: { clerkId },
          data: {
            ...(email && { email }),
            firstName,
            lastName,
            ...(role && { role }),
          },
        });

        console.log(`✅ Updated user sync for Clerk ID: ${clerkId}`);
        break;
      }

      case "user.deleted": {
        const clerkId = data.id;
        if (clerkId) {
          await prisma.user.deleteMany({
            where: { clerkId },
          });
          console.log(`🗑️ Deleted synced user for Clerk ID: ${clerkId}`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Clerk event type: ${eventType}`);
    }

    res.status(200).json({ received: true, event: eventType });
  } catch (error: any) {
    console.error("❌ Error executing Clerk webhook transaction:", error);
    res.status(500).json({ error: "Failed to process webhook event", details: error.message });
  }
}
