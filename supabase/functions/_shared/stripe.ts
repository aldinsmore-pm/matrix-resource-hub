
import Stripe from "https://esm.sh/stripe@13.11.0";

// Initialize Stripe with the secret key from environment variables
export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16", // Use the latest stable API version
  httpClient: Stripe.createFetchHttpClient(),
});
