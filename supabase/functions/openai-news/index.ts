
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
    const rssUrl = 'https://openai.com/blog/rss.xml'; // Updated to blog RSS feed which is more reliable
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
      
      // Extract link - ensure it's getting the correct URL
      let link = item.querySelector("link")?.textContent || "";
      
      // If link is empty, try to get it from guid if it's a permalink
      if (!link) {
        const guid = item.querySelector("guid");
        if (guid && guid.getAttribute("isPermaLink") === "true") {
          link = guid.textContent || "";
        }
      }
      
      // Ensure the link is absolute
      if (link && !link.startsWith('http')) {
        link = `https://openai.com${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
      // Fallback if link is still empty
      if (!link) {
        link = `https://openai.com/blog`;
      }
      
      const id = item.querySelector("guid")?.textContent || `news-${i}`;
      
      newsItems.push({
        id: id,
        title: title,
        published_date: pubDate,
        link: link
      });
      
      console.log(`Processed item ${i}:`, { title, link });
    }
    
    return new Response(JSON.stringify({ data: newsItems }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing OpenAI news feed:", error);
    
    // Fallback data with correct links
    const fallbackNews = [
      { id: '1', title: 'OpenAI Announces GPT-4o', published_date: 'Wed, 15 May 2024 10:00:00 GMT', link: 'https://openai.com/blog/gpt-4o' },
      { id: '2', title: 'ChatGPT can now see, hear, and speak', published_date: 'Mon, 25 Sep 2023 14:30:00 GMT', link: 'https://openai.com/blog/chatgpt-can-now-see-hear-and-speak' },
      { id: '3', title: 'DALL·E 3 is now available in ChatGPT Plus and Enterprise', published_date: 'Fri, 13 Oct 2023 09:15:00 GMT', link: 'https://openai.com/blog/dall-e-3-is-now-available-in-chatgpt-plus-and-enterprise' },
      { id: '4', title: 'GPTs are now available to all ChatGPT Plus and Team users', published_date: 'Wed, 06 Nov 2023 08:45:00 GMT', link: 'https://openai.com/blog/introducing-gpts' }
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
