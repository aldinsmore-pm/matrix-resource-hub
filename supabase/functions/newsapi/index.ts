
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
    console.log("Fetching AI news from Google Alerts RSS feed");
    
    // Fetch the RSS feed
    const response = await fetch(RSS_FEED_URL);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RSS feed error: ${response.status} - ${errorText}`);
      throw new Error(`RSS feed returned status ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log("Successfully fetched RSS feed");
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    if (!xmlDoc) {
      throw new Error("Failed to parse RSS feed XML");
    }
    
    // Extract entries
    const entries = xmlDoc.querySelectorAll("entry");
    
    if (!entries || entries.length === 0) {
      console.error("No entries found in the RSS feed");
      throw new Error("No entries found in RSS feed");
    }
    
    console.log(`Found ${entries.length} entries in the RSS feed`);
    
    // Transform data to match our application's expected format
    const transformedData = Array.from(entries).slice(0, 10).map((entry, index) => {
      // Extract data from entry
      const title = entry.querySelector("title")?.textContent || "News Title";
      const link = entry.querySelector("link")?.getAttribute("href") || "#";
      const published = entry.querySelector("published")?.textContent || new Date().toISOString();
      const content = entry.querySelector("content")?.textContent || "";
      
      // Extract source from content if possible
      const sourceMatcher = content.match(/<a href=.*?>([^<]+)<\/a>/);
      const source = sourceMatcher ? sourceMatcher[1] : "Google Alerts";
      
      return {
        id: (index + 1).toString(),
        title: title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        published_date: published,
        link: link,
        source: source
      };
    });
    
    console.log("Transformed data:", transformedData);
    
    return new Response(JSON.stringify({ data: transformedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    
    // Fallback data in case of feed failure
    const fallbackNews = [
      { id: '1', title: 'OpenAI Announces GPT-4o', published_date: '2024-05-15T10:00:00Z', link: 'https://openai.com/blog/gpt-4o', source: 'OpenAI' },
      { id: '2', title: 'Introducing the OpenAI Overview', published_date: '2024-04-22T14:30:00Z', link: 'https://openai.com/blog/introducing-the-openai-overview', source: 'OpenAI' },
      { id: '3', title: 'Sora: Video generation model', published_date: '2024-02-15T09:15:00Z', link: 'https://openai.com/sora', source: 'OpenAI' },
      { id: '4', title: 'ChatGPT can now see, hear, and speak', published_date: '2023-09-25T14:30:00Z', link: 'https://openai.com/blog/chatgpt-can-now-see-hear-and-speak', source: 'OpenAI' }
    ];
    
    return new Response(JSON.stringify({ 
      data: fallbackNews,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 even on error so the frontend gets the fallback data
    });
  }
});
