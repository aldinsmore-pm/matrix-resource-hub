import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../lib/stripe';
import { getOrCreateCustomer } from '../../lib/customers';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const { authorization } = req.headers;
    
    if (!authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get token from header
    const token = authorization.split(' ')[1];
    
    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { price, successUrl, cancelUrl } = req.body;

    // Get or create customer
    const customerId = await getOrCreateCustomer(user.id, user.email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
} 