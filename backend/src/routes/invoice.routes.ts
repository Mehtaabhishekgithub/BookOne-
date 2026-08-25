import { Router } from "express";
import { downloadInvoicePDF, getInvoiceDetails } from "../controllers/invoice.controller.js";

const router = Router();

// GET /api/invoices/:id/download - Stream dynamic PDF invoice
router.get("/:id/download", downloadInvoicePDF);

// GET /api/invoices/:id - Get invoice JSON details
router.get("/:id", getInvoiceDetails);

export default router;
