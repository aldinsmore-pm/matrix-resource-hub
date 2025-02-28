
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Alerts RSS feed URL
const RSS_FEED_URL = 'https://www.google.com/alerts/feeds/02761415313750958672/11169420478330193957';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Instead of parsing XML, we'll just serve the raw RSS feed
    // Sometimes XML parsing can be problematic in edge functions
    const response = await fetch(RSS_FEED_URL);
    
    if (!response.ok) {
      throw new Error(`RSS feed returned status ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Return the raw XML
    return new Response(xmlText, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/xml' 
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
