
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@12.6.0'

serve(async (req) => {
  // Get the stripe signature from the request headers
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response(JSON.stringify({ error: 'No signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Get the request body as text
  const body = await req.text()
  
  // Initialize Stripe with the secret key
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  })
  
  try {
    // Verify the webhook signature
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      // Get user ID from the metadata
      const userId = session.metadata?.user_id || session.client_reference_id
      if (!userId) {
        throw new Error('No user ID found in session metadata')
      }
      
      // Get product details
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const item = lineItems.data[0]
      
      if (!item) {
        throw new Error('No line items found in session')
      }
      
      // Set end date to never expire (100 years in the future)
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 100)
      
      // Create a purchase record in the database
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: item.price?.product, // This should be the Stripe product ID
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.id, // Using session ID as reference
          payment_status: 'paid'
        })
      
      if (error) {
        throw new Error(`Error creating subscription record: ${error.message}`)
      }
      
      console.log('Subscription created successfully for user:', userId)
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
