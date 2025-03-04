# Matrix Resource Hub

A modern web application for managing and accessing AI implementation resources and tools. Built with React, Supabase, and Stripe integration.

## Project Overview

Matrix Resource Hub is a subscription-based platform that provides access to curated AI resources, implementation guides, and tools. The application features user authentication, subscription management, and a dynamic resource library.

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Payment Processing**: Stripe
- **Deployment**: Vercel
- **Edge Functions**: Supabase Edge Functions for serverless operations

## Project Structure

### Core Application Files

```
src/
├── App.tsx                 # Main application component with routing setup
├── main.tsx               # Application entry point
├── index.html             # HTML template with Stripe.js integration
```

### Components

```
src/components/
├── auth/
│   └── LoginForm.tsx      # Authentication form component
├── dashboard/
│   └── Dashboard.tsx      # Main dashboard interface
├── subscription/
│   └── SubscriptionPage.tsx # Subscription management component
├── Navbar.tsx             # Navigation component with responsive design
└── Payment.tsx            # Payment processing component
```

### Supabase Integration

```
src/lib/
└── supabase.ts           # Supabase client configuration and utility functions

supabase/
├── functions/            # Edge Functions
│   ├── create-stripe-customer/  # Create Stripe customer on signup
│   ├── manage-subscription/     # Redirect to Stripe Customer Portal
│   ├── simple-stripe-webhook/   # Stripe webhook handler
│   ├── newsapi/         # News API integration
│   └── openai-news/     # OpenAI integration for news
├── migrations/          # Database migrations
└── config.toml         # Supabase configuration
```

### Database Schema

The application uses the following main tables:

- `profiles`: User profile information
- `subscriptions`: Subscription status and details
- `resources`: AI implementation resources
- `links`: Curated external links and references

### Database Schema Details

#### Auth Schema (Managed by Supabase)
```sql
-- auth.users (managed by Supabase)
-- This table is automatically managed by Supabase Auth
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token TEXT,
  recovery_sent_at TIMESTAMPTZ,
  email_change_token TEXT,
  email_change TEXT,
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  phone TEXT UNIQUE,
  phone_confirmed_at TIMESTAMPTZ,
  phone_change TEXT,
  phone_change_token TEXT,
  phone_change_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  email_change_confirm_status SMALLINT,
  banned_until TIMESTAMPTZ,
  reauthentication_token TEXT,
  reauthentication_sent_at TIMESTAMPTZ
);

-- Reference this in other tables using:
-- user_id UUID REFERENCES auth.users(id)
```

#### Public Schema Tables

##### Profiles Table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX profiles_email_idx ON public.profiles(email);
```

##### Subscriptions Table
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'trialing', 'past_due')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_stripe_subscription_id_idx ON public.subscriptions(stripe_subscription_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
```

##### Resources Table
```sql
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_url TEXT,
  category TEXT,
  tags TEXT[],
  user_id UUID REFERENCES auth.users(id),
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX resources_user_id_idx ON public.resources(user_id);
CREATE INDEX resources_category_idx ON public.resources(category);
CREATE INDEX resources_tags_idx ON public.resources USING GIN(tags);
```

##### Links Table
```sql
CREATE TABLE public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX links_user_id_idx ON public.links(user_id);
CREATE INDEX links_category_idx ON public.links(category);
```

#### Database Functions
```sql
-- Automatically update timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check subscription status
CREATE OR REPLACE FUNCTION public.check_subscription(uid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = uid
    AND status = 'active'
    AND current_period_end > now()
    AND (cancel_at IS NULL OR cancel_at > now())
  );
END;
$$;
```

### Scripts

```
scripts/
├── fix_rls_policies.sql        # Row Level Security policy setup
├── create_subscriptions_table.sql # Subscription table creation
├── create_profiles_table.sql   # Profile table creation
├── create_resources_table.sql  # Resource table creation
├── create_links_table.sql      # Links table creation
└── various test scripts        # Testing utilities
```

## Key Features

1. **Authentication**
   - Email/password authentication
   - Protected routes
   - Profile management

2. **Subscription Management**
   - Stripe integration
   - Subscription status tracking
   - Payment processing

3. **Resource Access**
   - Curated AI resources
   - Implementation guides
   - External links library

4. **Security**
   - Row Level Security (RLS) policies
   - Protected API endpoints
   - Secure payment processing

## Stripe Integration & Payment Processing

### Subscription Flow
1. **Customer Creation**
   - When a user signs up:
     - Database trigger creates a Stripe customer
     - User ID is stored in the Stripe customer metadata

2. **Subscription Management**
   - Users manage subscriptions through the Stripe Customer Portal:
     - `manage-subscription` Edge Function creates a portal session
     - Users can update payment methods, change plans, or cancel

3. **Webhook Processing**
   - Stripe webhooks are handled by the `simple-stripe-webhook` Edge Function
   - Key events processed:
     - `customer.subscription.created`: Creates initial subscription
     - `customer.subscription.updated`: Updates subscription status
     - `customer.subscription.deleted`: Handles cancellations
     - `invoice.payment_succeeded`: Processes successful payments
     - `invoice.payment_failed`: Handles failed payments

### Edge Functions
1. **Stripe Integration Functions**
   - `create-stripe-customer`: Creates Stripe customers when users sign up
   - `manage-subscription`: Redirects users to Stripe Customer Portal
   - `simple-stripe-webhook`: Processes Stripe webhook events

2. **Resource Access**
   - Protected routes check subscription status
   - RLS policies enforce access control
   - Automatic profile creation on signup

### Supabase Edge Functions
```
supabase/functions/
├── create-stripe-customer/
│   ├── index.ts                      # Stripe customer creation
│   └── function.ts                   # Function configuration
├── manage-subscription/
│   ├── index.ts                      # Stripe Customer Portal redirection
│   └── function.ts                   # Function configuration
├── simple-stripe-webhook/
│   ├── index.ts                      # Stripe webhook event handling
│   └── function.ts                   # Webhook configuration
├── newsapi/
│   ├── index.ts                      # News API integration
│   └── function.ts                   # API configuration
└── openai-news/
    ├── index.ts                      # OpenAI integration
    └── function.ts                   # OpenAI configuration
```

### Stripe Integration
```
src/components/
├── subscription/
│   └── SubscriptionPage.tsx          # Subscription UI and Customer Portal flow
└── Payment.tsx                       # Payment processing component

src/lib/
└── supabase.ts                       # Subscription and profile management functions

scripts/
├── test-complete-subscription.js     # Subscription system testing
├── check-subscriptions.js            # Subscription verification
└── forward-stripe-events.sh          # Local webhook forwarding
```

## Environment Variables

Required environment variables:

```
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_STRIPE_PRICE_ID=your_stripe_price_id
```

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Deployment

The application is configured for deployment on Vercel with the following setup:

- Automatic deployments from the main branch
- Environment variables configured in Vercel dashboard
- Edge functions deployed to Supabase

## Database Management

The application uses Supabase as the backend with:

- Automated user profile creation
- Subscription tracking
- Resource management
- Row Level Security policies

## Testing

Various test scripts are available in the `scripts/` directory for:

- Webhook testing
- Subscription management
- Database operations
- RLS policy verification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## Implementation Files

### Database & RLS Policies
```
scripts/
├── create_profiles_table.sql          # Profile table creation and RLS
├── create_subscriptions_table.sql     # Subscription table creation and RLS
├── create_resources_table.sql         # Resources table creation and RLS
├── create_links_table.sql            # Links table creation and RLS
├── fix_rls_policies.sql              # RLS policy fixes and updates
└── check_subscriptions_table.sql     # Subscription table verification
```

### Supabase Edge Functions
```
supabase/functions/
├── create-stripe-customer/
│   ├── index.ts                      # Stripe customer creation
│   └── function.ts                   # Function configuration
├── manage-subscription/
│   ├── index.ts                      # Stripe Customer Portal redirection
│   └── function.ts                   # Function configuration
├── simple-stripe-webhook/
│   ├── index.ts                      # Stripe webhook event handling
│   └── function.ts                   # Webhook configuration
├── newsapi/
│   ├── index.ts                      # News API integration
│   └── function.ts                   # API configuration
└── openai-news/
    ├── index.ts                      # OpenAI integration
    └── function.ts                   # OpenAI configuration
```

### Stripe Integration
```
src/components/
├── subscription/
│   └── SubscriptionPage.tsx          # Subscription UI and Customer Portal flow
└── Payment.tsx                       # Payment processing component

src/lib/
└── supabase.ts                       # Subscription and profile management functions

scripts/
├── test-complete-subscription.js     # Subscription system testing
├── check-subscriptions.js            # Subscription verification
└── forward-stripe-events.sh          # Local webhook forwarding
```

### Testing & Verification
```
scripts/
├── test-supabase-connection.js       # Database connection testing
├── test-insert-subscription.js       # Subscription creation testing
├── test-logs.js                      # Webhook logging utilities
├── check_direct_subscription.js      # Direct subscription verification
└── apply_rls_fixes.js               # RLS policy application
```

## License

[Add your license information here]