# BookOne 📅⚡

**SaaS Booking & Automated Invoicing Engine**

A modern multi-tenant SaaS booking platform enabling freelance professionals and service providers (tutors, consultants, coaches) to manage service offerings, dynamic availability schedules, automated client bookings, Stripe payment collection, and instant PDF invoice generation.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Redux Toolkit (RTK) & RTK Query
- **Authentication**: Clerk Auth (JWT verification & user webhook synchronization)
- **Backend API**: Node.js, Express.js (TypeScript, ESM)
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Payments**: Stripe (Hosted checkout sessions & cryptographic webhooks)
- **Document Generation**: PDFKit (dynamic PDF invoices)
- **Validation**: Zod
- **Date/Time Calculations**: `date-fns`, `date-fns-tz`

---

## 📂 Project Structure

```
BookOne/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (User, ProviderProfile, Service, Availability, Booking, Invoice)
│   │   └── seed.ts             # Realistic database seed data
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts       # Singleton Prisma client
│   │   ├── routes/
│   │   │   ├── health.routes.ts# Health check endpoint
│   │   │   └── index.ts        # Central API router
│   │   ├── app.ts              # Express application factory & middleware
│   │   └── server.ts           # Server bootstrap & shutdown handling
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your PostgreSQL database connection URL:
```bash
cp .env.example .env
```

### 3. Database Migration & Seeding
```bash
npx prisma db push
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

API will be running at `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`).
