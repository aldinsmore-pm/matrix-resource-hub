declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.39.3' {
  export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/stripe@13.11.0' {
  export * from 'stripe';
  export default Stripe;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
}; 