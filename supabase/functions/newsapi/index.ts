import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Google Alerts RSS feed URL
const RSS_FEED_URL = 'https://www.google.com/alerts/feeds/02761415313750958672/11169420478330193957';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log("Fetching AI news from Google Alerts RSS feed");
    
    // Fetch the RSS feed with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(RSS_FEED_URL, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIUnlockedBot/1.0)',
        'Accept': 'application/xml, text/xml, */*'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`RSS feed error: ${response.status}`);
      throw new Error(`RSS feed returned status ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log("Successfully fetched RSS feed, text length:", xmlText.length);
    
    if (xmlText.length < 100) {
      console.error("RSS feed response too short:", xmlText);
      throw new Error("Invalid RSS feed response");
    }
    
    // Log a sample of the XML to help debug
    console.log("XML sample:", xmlText.substring(0, 300));
    
    // Parse the XML using regex
    const items = parseRSSFeed(xmlText);
    console.log(`Parsed ${items.length} news items`);
    
    if (items.length === 0) {
      throw new Error("No items found in RSS feed");
    }
    
    // Return the response with CORS headers
    return new Response(JSON.stringify({ data: items }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Error processing RSS feed:", error.message);
    
    // Return error response with CORS headers
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Please check the Edge Function logs"
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

// Simple XML parser function using regex
function parseRSSFeed(xmlText) {
  const items = [];
  
  try {
    // Extract entry elements using regex
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let entryMatch;
    let counter = 1;
    
    while ((entryMatch = entryRegex.exec(xmlText)) !== null) {
      const entryContent = entryMatch[1];
      
      // Extract title, link, published date, and content
      const titleMatch = /<title>(.*?)<\/title>/i.exec(entryContent);
      const linkMatch = /<link.*?href="(.*?)".*?\/>/i.exec(entryContent);
      const publishedMatch = /<published>(.*?)<\/published>/i.exec(entryContent);
      const contentMatch = /<content.*?>([\s\S]*?)<\/content>/i.exec(entryContent);
      
      // Extract source from content if possible
      let source = "Google Alerts";
      if (contentMatch && contentMatch[1]) {
        const sourceMatch = contentMatch[1].match(/<a href=.*?>([^<]+)<\/a>/i);
        if (sourceMatch && sourceMatch[1]) {
          source = sourceMatch[1];
        }
      }
      
      items.push({
        id: counter.toString(),
        title: titleMatch ? titleMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : "News Item",
        link: linkMatch ? linkMatch[1] : "#",
        published_date: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
        source: source
      });
      
      counter++;
    }
    
    return items;
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    return [];
  }
}
