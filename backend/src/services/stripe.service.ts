import Stripe from "stripe";

// Initialize Stripe instance with configured secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia" as any,
  typescript: true,
});

export const isStripeConfigured = (): boolean => {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && key !== "sk_test_placeholder" && key.startsWith("sk_"));
};

export default stripe;
