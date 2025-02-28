
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Remove the DOMParser import since it's causing issues

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Alerts RSS feed URL
const RSS_FEED_URL = 'https://www.google.com/alerts/feeds/02761415313750958672/11169420478330193957';

// Simple XML parser function using regex
function parseRSSFeed(xmlText: string) {
  const items = [];
  
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
}

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
      console.error(`RSS feed error: ${response.status}`);
      throw new Error(`RSS feed returned status ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log("Successfully fetched RSS feed, text length:", xmlText.length);
    
    // Use regex-based parser instead of DOMParser
    try {
      const transformedData = parseRSSFeed(xmlText);
      console.log(`Parsed ${transformedData.length} entries from RSS feed`);
      
      if (transformedData.length === 0) {
        throw new Error("No entries found in RSS feed");
      }
      
      return new Response(JSON.stringify({ data: transformedData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parsingError) {
      console.error("XML parsing error:", parsingError);
      throw parsingError;
    }
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    
    // Fallback data in case of feed failure
    const fallbackNews = [
      { id: '1', title: 'OpenAI Announces GPT-4o', published_date: '2024-05-15T10:00:00Z', link: 'https://openai.com/blog/gpt-4o', source: 'OpenAI' },
      { id: '2', title: 'Introducing the OpenAI Overview', published_date: '2024-04-22T14:30:00Z', link: 'https://openai.com/blog/introducing-the-openai-overview', source: 'OpenAI' },
      { id: '3', title: 'Sora: Video generation model', published_date: '2024-02-15T09:15:00Z', link: 'https://openai.com/sora', source: 'OpenAI' },
      { id: '4', title: 'ChatGPT can now see, hear, and speak', published_date: '2023-09-25T14:30:00Z', link: 'https://openai.com/blog/chatgpt-can-now-see-hear-and-speak', source: 'OpenAI' }
    ];
    
    console.log("Using fallback news data due to error");
    
    return new Response(JSON.stringify({ 
      data: fallbackNews,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 even on error so the frontend gets the fallback data
    });
  }
});
