
/**
 * Test Mode Implementation for Subscription Flow
 * 
 * This module provides a test implementation for the subscription flow
 * to be used when running locally without Stripe integration.
 * 
 * For production, test mode should be disabled and the real Stripe integration used.
 * However, the fallback mode can be used when the Edge Function is not properly configured.
 */

import { supabase } from "../../lib/supabase";

// Flag to enable test mode for subscription flow
// Set to true to bypass Stripe and create subscriptions directly
export const SUBSCRIPTION_TEST_MODE = true;

// Flag for fallback mode that can be enabled when the Edge Function fails
// Set to true to allow fallback to test mode when Stripe integration fails
export const ENABLE_FALLBACK_ON_ERROR = true;

// Function to create a test subscription without going through Stripe
export async function createTestSubscription(
  plan: string, 
  userId: string, 
  billingCycle: 'monthly' | 'annually' = 'monthly',
  isFallback: boolean = false
) {
  try {
    const mode = isFallback ? "[FALLBACK MODE]" : "[TEST MODE]";
    console.log(`${mode} Creating subscription for plan: ${plan}, billing cycle: ${billingCycle}`);
    
    // Calculate end date (30 days for monthly, 365 for annually)
    const durationDays = billingCycle === 'monthly' ? 30 : 365;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    
    // Create a subscription record in the database
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        customer_id: isFallback ? `fallback_customer_${Date.now()}` : `test_customer_${Date.now()}`,
        subscription_id: isFallback ? `fallback_subscription_${Date.now()}` : `test_subscription_${Date.now()}`,
        status: 'active',
        plan: plan,
        current_period_end: endDate.toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error(`${mode} Error creating subscription:`, error);
      throw error;
    }
    
    console.log(`${mode} Subscription created successfully:`, data);
    return data;
    
  } catch (error) {
    console.error(`${isFallback ? "[FALLBACK MODE]" : "[TEST MODE]"} Error in createTestSubscription:`, error);
    throw error;
  }
}

// Function to simulate Stripe checkout process
export async function simulateCheckout(
  plan: string,
  userId: string,
  email: string,
  billingCycle: 'monthly' | 'annually' = 'monthly',
  isFallback: boolean = false
) {
  // In a real implementation, this would redirect to Stripe
  // For test mode, we'll create a subscription directly
  
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create subscription
    const subscription = await createTestSubscription(plan, userId, billingCycle, isFallback);
    
    const mode = isFallback ? "[FALLBACK MODE]" : "[TEST MODE]";
    const modeMessage = isFallback 
      ? "as a temporary solution until Stripe is configured" 
      : "as a fallback option";
    
    // Return success response similar to what the real API would return
    return {
      success: true,
      subscription,
      message: `${mode} Successfully subscribed to ${plan} plan (${billingCycle}) ${modeMessage}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: `${isFallback ? "[FALLBACK MODE]" : "[TEST MODE]"} Failed to create subscription`
    };
  }
}
