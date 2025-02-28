# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/589d003d-74bc-4c45-9525-8f7f826ed286

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/589d003d-74bc-4c45-9525-8f7f826ed286) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Environment Variables Setup

This project uses environment variables for Supabase and Stripe configurations. Follow these steps to set them up:

1. Copy `.env.example` to create your environment variable files:
   ```sh
   cp .env.example .env.local
   cp .env.example .env.development
   cp .env.example .env.staging
   cp .env.example .env.production
   ```

2. Fill in the appropriate values for each environment:
   - `.env.local` - For your local development
   - `.env.development` - For development environment
   - `.env.staging` - For staging environment testing
   - `.env.production` - For production deployment

3. For Supabase Edge Functions:
   - Set up environment variables in the Supabase Dashboard
   - Navigate to Edge Functions > Settings > Environment Variables
   - Add the necessary server-side keys (STRIPE_SECRET_KEY, etc.)

4. To use a specific environment configuration:
   ```sh
   # For development (default)
   npm run dev
   
   # For staging
   npm run dev -- --mode staging
   
   # For production
   npm run build -- --mode production
   ```

## Testing Authentication and Subscription Flows

To properly test the authentication and subscription flows in a staging environment:

1. Set up a Stripe test account and create test products/prices
2. Replace the placeholder price IDs in `supabase/functions/create-checkout-session/index.ts`
3. Deploy the Edge Functions to your Supabase staging project
4. Configure webhook endpoints in the Stripe dashboard pointing to your Supabase webhook URL
5. Test the complete flow:
   - User registration
   - User login
   - Subscription selection
   - Payment process (using Stripe test cards)
   - Subscription status verification
   - Renewal and cancellation scenarios

6. Common test scenarios:
   - New user signup and subscription
   - Existing user login and subscription
   - Subscription upgrade/downgrade
   - Subscription cancellation
   - Failed payment handling
   - Subscription renewal

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Authentication and Database)
- Stripe (Payment Processing)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/589d003d-74bc-4c45-9525-8f7f826ed286) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
