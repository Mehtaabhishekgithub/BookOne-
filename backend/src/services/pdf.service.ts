import PDFDocument from "pdfkit";
import { format } from "date-fns";

export interface InvoicePDFData {
  invoiceNumber: string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: Date;
  provider: {
    name: string;
    email: string;
    handle: string;
    headline?: string | null;
    timezone: string;
  };
  client: {
    name: string;
    email: string;
  };
  service: {
    title: string;
    description?: string | null;
    durationMinutes: number;
  };
  booking: {
    startTime: Date;
    endTime: Date;
  };
}

/**
 * Generates a clean, professional, branded PDF Invoice buffer.
 */
export async function generateInvoicePDFBuffer(data: InvoicePDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const primaryColor = "#2563EB"; // Royal Blue
    const darkColor = "#1E293B"; // Slate Dark
    const grayColor = "#64748B"; // Slate Gray
    const lightBg = "#F8FAFC"; // Slate Light
    const successColor = "#16A34A"; // Emerald Green

    // --- 1. HEADER & BRANDING ---
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("BookOne", 50, 45)
      .fillColor(grayColor)
      .fontSize(9)
      .font("Helvetica")
      .text("Automated SaaS Invoicing Engine", 50, 72);

    // Invoice Title & Badge (Right Aligned)
    doc
      .fillColor(darkColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 45, { align: "right" })
      .fillColor(grayColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`#${data.invoiceNumber}`, 400, 70, { align: "right" })
      .text(`Date: ${format(data.createdAt, "MMMM dd, yyyy")}`, 400, 85, { align: "right" });

    // Status Stamp Badge
    if (data.status === "PAID") {
      doc
        .roundedRect(460, 105, 85, 22, 4)
        .fillAndStroke("#DCFCE7", successColor)
        .fillColor(successColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("PAID", 460, 110, { width: 85, align: "center" });
    }

    doc.moveDown(3);

    // Divider Line
    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(50, 140)
      .lineTo(545, 140)
      .stroke();

    // --- 2. BILLED BY & BILLED TO SECTION ---
    const startY = 160;

    // Left Column: Provider Info (Billed By)
    doc
      .fillColor(grayColor)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("ISSUED BY:", 50, startY)
      .fillColor(darkColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(data.provider.name, 50, startY + 15)
      .fillColor(grayColor)
      .fontSize(9)
      .font("Helvetica")
      .text(data.provider.headline || "Consultant & Service Provider", 50, startY + 32)
      .text(`Handle: @${data.provider.handle}`, 50, startY + 46)
      .text(`Email: ${data.provider.email}`, 50, startY + 60);

    // Right Column: Client Info (Billed To)
    doc
      .fillColor(grayColor)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("BILLED TO:", 350, startY)
      .fillColor(darkColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(data.client.name, 350, startY + 15)
      .fillColor(grayColor)
      .fontSize(9)
      .font("Helvetica")
      .text(`Email: ${data.client.email}`, 350, startY + 32)
      .text(`Timezone: ${data.provider.timezone}`, 350, startY + 46);

    // --- 3. SESSION / BOOKING SUMMARY BOX ---
    const sessionBoxY = 250;
    doc
      .roundedRect(50, sessionBoxY, 495, 45, 6)
      .fillAndStroke(lightBg, "#E2E8F0");

    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Scheduled Appointment:", 65, sessionBoxY + 12)
      .font("Helvetica")
      .fillColor(grayColor)
      .text(
        `${format(data.booking.startTime, "EEEE, MMMM dd, yyyy")} from ${format(data.booking.startTime, "HH:mm")} to ${format(data.booking.endTime, "HH:mm")} UTC`,
        65,
        sessionBoxY + 26
      );

    // --- 4. LINE ITEMS TABLE ---
    const tableTop = 320;

    // Table Header Background
    doc
      .rect(50, tableTop, 495, 24)
      .fill(primaryColor);

    // Table Header Text
    doc
      .fillColor("#FFFFFF")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("DESCRIPTION", 65, tableTop + 7)
      .text("DURATION", 310, tableTop + 7, { width: 60, align: "center" })
      .text("RATE", 380, tableTop + 7, { width: 60, align: "right" })
      .text("AMOUNT", 460, tableTop + 7, { width: 70, align: "right" });

    // Table Row
    const rowY = tableTop + 34;
    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(data.service.title, 65, rowY)
      .fillColor(grayColor)
      .fontSize(8)
      .font("Helvetica")
      .text(data.service.description || "Professional Consultation & Strategy Session", 65, rowY + 14, { width: 230 });

    doc
      .fillColor(darkColor)
      .fontSize(9)
      .text(`${data.service.durationMinutes} mins`, 310, rowY + 4, { width: 60, align: "center" })
      .text(`$${Number(data.amount).toFixed(2)}`, 380, rowY + 4, { width: 60, align: "right" })
      .font("Helvetica-Bold")
      .text(`$${Number(data.amount).toFixed(2)} ${data.currency}`, 460, rowY + 4, { width: 70, align: "right" });

    // Table Bottom Line
    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(50, rowY + 40)
      .lineTo(545, rowY + 40)
      .stroke();

    // --- 5. SUMMARY & TOTALS ---
    const totalY = rowY + 55;
    doc
      .fillColor(grayColor)
      .fontSize(10)
      .font("Helvetica")
      .text("Subtotal:", 380, totalY, { width: 80, align: "right" })
      .fillColor(darkColor)
      .text(`$${Number(data.amount).toFixed(2)}`, 460, totalY, { width: 70, align: "right" });

    doc
      .fillColor(grayColor)
      .text("Tax (0%):", 380, totalY + 18, { width: 80, align: "right" })
      .fillColor(darkColor)
      .text("$0.00", 460, totalY + 18, { width: 70, align: "right" });

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(380, totalY + 36)
      .lineTo(545, totalY + 36)
      .stroke();

    doc
      .fillColor(darkColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Total Paid:", 350, totalY + 44, { width: 110, align: "right" })
      .fillColor(primaryColor)
      .text(`$${Number(data.amount).toFixed(2)} ${data.currency}`, 460, totalY + 44, { width: 70, align: "right" });

    // --- 6. FOOTER ---
    const footerY = 730;
    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .stroke();

    doc
      .fillColor(grayColor)
      .fontSize(8)
      .font("Helvetica")
      .text("Thank you for your business! This is an electronically generated invoice issued via BookOne Engine.", 50, footerY + 12, { align: "center" })
      .text("Questions? Contact your service provider directly.", 50, footerY + 24, { align: "center" });

    doc.end();
  });
}
