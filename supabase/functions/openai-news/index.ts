
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching OpenAI news RSS feed");
    const rssUrl = 'https://openai.com/news/rss.xml';
    const response = await fetch(rssUrl);
    
    if (!response.ok) {
      console.error(`Error fetching RSS: ${response.status} ${response.statusText}`);
      throw new Error('Failed to fetch RSS feed');
    }
    
    const xmlText = await response.text();
    console.log(`Received RSS response (${xmlText.length} bytes)`);
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    if (!xmlDoc) {
      throw new Error('Failed to parse XML document');
    }
    
    const items = xmlDoc.querySelectorAll("item");
    console.log(`Found ${items.length} news items in the feed`);
    
    const newsItems = [];
    
    for (let i = 0; i < items.length && i < 4; i++) {
      const item = items[i];
      const title = item.querySelector("title")?.textContent || "Untitled";
      const pubDate = item.querySelector("pubDate")?.textContent || new Date().toUTCString();
      const link = item.querySelector("link")?.textContent || "#";
      const guid = item.querySelector("guid")?.textContent || `news-${i}`;
      
      newsItems.push({
        id: guid,
        title: title,
        published_date: pubDate,
        link: link
      });
    }
    
    return new Response(JSON.stringify({ data: newsItems }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing OpenAI news feed:", error);
    
    // Fallback data
    const fallbackNews = [
      { id: '1', title: 'OpenAI Announces GPT-4o', published_date: 'Wed, 15 May 2024 10:00:00 GMT', link: 'https://openai.com/blog/gpt4o' },
      { id: '2', title: 'Introducing ChatGPT Enterprise', published_date: 'Mon, 10 May 2024 14:30:00 GMT', link: 'https://openai.com/blog/chatgpt-enterprise' },
      { id: '3', title: 'DALL·E 3 Integration in ChatGPT', published_date: 'Fri, 05 May 2024 09:15:00 GMT', link: 'https://openai.com/blog/dall-e-3-chatgpt' },
      { id: '4', title: 'Research on AI Safety', published_date: 'Wed, 01 May 2024 08:45:00 GMT', link: 'https://openai.com/blog/ai-safety' }
    ];
    
    return new Response(JSON.stringify({ 
      data: fallbackNews,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
