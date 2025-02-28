# Stripe Price ID Configuration

## Product Information
- **Product ID**: `prod_RrGq7yAIjtfBHy`
- **Annual Price ID**: `price_1QxYIYRdb4qpGphFhXDsnDLT`

## Billing Options
Currently, only annual billing is available for this product. The monthly billing option has been disabled in the user interface.

## Configuration Status
The correct product ID and price ID have been configured in:
- `supabase/functions/create-checkout-session/index.ts` (updated to only use annual billing)
- Referenced in `.env.local`
- The PricingTable component has been updated to disable the monthly billing option

## If You Need to Add Monthly Pricing
1. Log in to your Stripe Dashboard
2. Go to Products > Find the product with ID `prod_RrGq7yAIjtfBHy`
3. Add a new price with monthly billing interval
4. Update the Edge Function in Supabase Dashboard:
   - Go to https://supabase.com/dashboard/project/blnaxvnuzikfelwcwzft/functions
   - Click on create-checkout-session
   - Update the code to include both monthly and annual price IDs
5. Save and deploy the function
6. Update the PricingTable component to enable the monthly billing option

## Testing Subscription Flow
- Use the test card number: 4242 4242 4242 4242
- Any future expiration date
- Any 3-digit CVC
- Any billing information
