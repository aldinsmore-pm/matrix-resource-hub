# How to Deploy the Updated Edge Function to Fix Stripe Integration

The current issue is that we've updated the price ID locally, but those changes need to be deployed to Supabase's Edge Functions to take effect. Here are the steps to fix this:

## Option 1: Deploy Using Supabase CLI (Requires Docker)

1. Install Docker Desktop if you don't have it: https://www.docker.com/products/docker-desktop/
2. Start Docker Desktop
3. Run the following commands in your terminal:
   ```bash
   # Login to Supabase
   supabase login

   # Deploy the function
   supabase functions deploy create-checkout-session --project-ref blnaxvnuzikfelwcwzft
   ```

## Option 2: Manual Update via Supabase Dashboard

1. Log in to the Supabase Dashboard: https://supabase.com/dashboard/project/blnaxvnuzikfelwcwzft
2. Navigate to Edge Functions
3. Click on the "create-checkout-session" function
4. Update the code to use the correct price ID:
   ```typescript
   // Look for this code block:
   const productPrices = {
     annually: 'price_1QxYIYRdb4qpGphFhXDsnDLT' // Correct annual price ID
   };

   // Always use annual billing since that's the only option available
   const priceId = productPrices.annually;
   
   // Inform if user attempted to use monthly billing
   if (billingCycle === 'monthly') {
     console.log('Monthly billing requested but only annual billing is available. Defaulting to annual billing.');
   }
   ```
5. Click "Save" and deploy the function

## Until Deployment is Completed

Until the Edge Function is properly deployed, the application will use the test mode fallback when users attempt to subscribe. This allows users to continue using the application without disruption.

Test mode creates subscription records directly in the database without processing payments through Stripe. 