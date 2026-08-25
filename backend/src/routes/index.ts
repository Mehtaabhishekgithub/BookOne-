import { Router } from "express";
import healthRouter from "./health.routes.js";
import webhookRouter from "./webhook.routes.js";
import userRouter from "./user.routes.js";
import providerRouter from "./provider.routes.js";
import publicRouter from "./public.routes.js";
import invoiceRouter from "./invoice.routes.js";

const apiRouter = Router();

// Mount sub-routes
apiRouter.use("/", healthRouter);
apiRouter.use("/webhooks", webhookRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/provider", providerRouter);
apiRouter.use("/public", publicRouter);
apiRouter.use("/invoices", invoiceRouter);

export default apiRouter;
