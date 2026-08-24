import { PrismaClient, Role, BookingStatus, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting BookOne database seeding...");

  // Clean existing records in reverse order of foreign key dependencies
  await prisma.invoice.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.service.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing tables.");

  // 1. Create a Provider User
  const providerUser = await prisma.user.create({
    data: {
      clerkId: "user_mock_provider_01",
      email: "alex.morgan@example.com",
      firstName: "Alex",
      lastName: "Morgan",
      role: Role.PROVIDER,
      providerProfile: {
        create: {
          handle: "alex-morgan",
          headline: "Senior Software Architect & Full-Stack Consultant",
          bio: "Helping SaaS founders and engineering teams build reliable, high-scale web platforms, cloud architecture, and modern TypeScript ecosystems.",
          timezone: "America/New_York",
          availabilities: {
            create: [
              // Monday (1) to Friday (5) from 09:00 to 17:00
              { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 5, startTime: "09:00", endTime: "16:00" },
            ],
          },
          services: {
            create: [
              {
                title: "30-Min Rapid Architecture Consultation",
                description: "Quick architectural review, tech stack sanity check, and unblocking difficult technical decisions.",
                durationMinutes: 30,
                price: 75.0,
                currency: "USD",
                isActive: true,
              },
              {
                title: "60-Min Deep Dive & Code Review",
                description: "Comprehensive code inspection, database indexing recommendations, API design, and performance optimizations.",
                durationMinutes: 60,
                price: 150.0,
                currency: "USD",
                isActive: true,
              },
              {
                title: "90-Min Strategy & Production Roadmap",
                description: "End-to-end milestone breakdown, system architecture diagrams, deployment pipelines, and scaling strategy.",
                durationMinutes: 90,
                price: 220.0,
                currency: "USD",
                isActive: true,
              },
            ],
          },
        },
      },
    },
    include: {
      providerProfile: {
        include: {
          services: true,
          availabilities: true,
        },
      },
    },
  });

  console.log(`✅ Created Provider: ${providerUser.firstName} ${providerUser.lastName} (@${providerUser.providerProfile?.handle})`);

  // 2. Create a Client User
  const clientUser = await prisma.user.create({
    data: {
      clerkId: "user_mock_client_01",
      email: "sarah.jenkins@example.com",
      firstName: "Sarah",
      lastName: "Jenkins",
      role: Role.CLIENT,
    },
  });

  console.log(`✅ Created Client: ${clientUser.firstName} ${clientUser.lastName}`);

  // 3. Create a Sample Confirmed Booking & Invoice
  const profile = providerUser.providerProfile!;
  const primaryService = profile.services[0]; // 30-min consultation

  // Set booking for tomorrow at 14:00 UTC
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(14, 0, 0, 0);

  const bookingEnd = new Date(tomorrow.getTime() + primaryService.durationMinutes * 60 * 1000);

  const sampleBooking = await prisma.booking.create({
    data: {
      providerId: profile.id,
      clientId: clientUser.id,
      clientName: `${clientUser.firstName} ${clientUser.lastName}`,
      clientEmail: clientUser.email,
      serviceId: primaryService.id,
      startTime: tomorrow,
      endTime: bookingEnd,
      status: BookingStatus.CONFIRMED,
      stripeSessionId: "cs_test_mock_session_123456",
      invoice: {
        create: {
          invoiceNumber: `INV-${new Date().getFullYear()}-0001`,
          amount: primaryService.price,
          currency: primaryService.currency,
          status: InvoiceStatus.PAID,
        },
      },
    },
    include: {
      invoice: true,
    },
  });

  console.log(`✅ Created Sample Booking & Invoice #${sampleBooking.invoice?.invoiceNumber}`);
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
