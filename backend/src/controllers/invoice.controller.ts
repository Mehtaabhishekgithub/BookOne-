import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { generateInvoicePDFBuffer } from "../services/pdf.service.js";

/**
 * Streams dynamic PDF invoice directly to the client/browser.
 * GET /api/public/invoices/:id/download
 */
export async function downloadInvoicePDF(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    // 1. Fetch Invoice with relations (supports lookup by invoice.id, invoiceNumber, or bookingId)
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id },
          { bookingId: id },
        ],
      },
      include: {
        booking: {
          include: {
            service: true,
            provider: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Not Found", message: "Invoice not found." });
      return;
    }

    const { booking } = invoice;
    const { provider, service } = booking;

    const providerName =
      `${provider.user.firstName || ""} ${provider.user.lastName || ""}`.trim() ||
      "Service Provider";

    // 2. Generate PDF Buffer
    const pdfBuffer = await generateInvoicePDFBuffer({
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      createdAt: invoice.createdAt,
      provider: {
        name: providerName,
        email: provider.user.email,
        handle: provider.handle,
        headline: provider.headline,
        timezone: provider.timezone,
      },
      client: {
        name: booking.clientName,
        email: booking.clientEmail,
      },
      service: {
        title: service.title,
        description: service.description,
        durationMinutes: service.durationMinutes,
      },
      booking: {
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
    });

    // 3. Set Response Headers for browser streaming / PDF preview
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.status(200).end(pdfBuffer);
  } catch (error: any) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate invoice PDF", message: error.message });
  }
}

/**
 * Get JSON details of an invoice.
 * GET /api/public/invoices/:id
 */
export async function getInvoiceDetails(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }, { bookingId: id }],
      },
      include: {
        booking: {
          include: {
            service: true,
            provider: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Not Found", message: "Invoice not found." });
      return;
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch invoice", message: error.message });
  }
}
