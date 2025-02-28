
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
const API_URL = 'https://newsapi.org/v2/everything';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching AI news from NewsAPI.org");
    
    if (!NEWS_API_KEY) {
      console.error("NEWS_API_KEY is not defined");
      throw new Error("API key not configured");
    }
    
    // Calculate date for last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Build the query parameters for AI-related news
    const params = new URLSearchParams({
      q: '(artificial intelligence OR AI OR machine learning OR OpenAI OR GPT OR LLM)',
      sortBy: 'publishedAt',
      language: 'en',
      from: fromDate,
      pageSize: '5',
      apiKey: NEWS_API_KEY,
    });
    
    console.log(`Making request to ${API_URL}?${params.toString().replace(NEWS_API_KEY, "API_KEY_HIDDEN")}`);
    
    // Fetch news from NewsAPI
    const response = await fetch(`${API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NewsAPI error: ${response.status} - ${errorText}`);
      throw new Error(`NewsAPI returned status ${response.status}: ${errorText}`);
    }
    
    const newsData = await response.json();
    console.log(`Successfully fetched ${newsData.articles?.length || 0} news articles`);
    
    if (!newsData.articles || !Array.isArray(newsData.articles)) {
      console.error("Invalid response structure from NewsAPI:", newsData);
      throw new Error("Unexpected response format from NewsAPI");
    }
    
    // Transform data to match our application's expected format
    const transformedData = newsData.articles.slice(0, 5).map((article: any, index: number) => ({
      id: (index + 1).toString(),
      title: article.title,
      published_date: article.publishedAt,
      link: article.url,
      source: article.source?.name || "News Source"
    }));
    
    console.log("Transformed data:", transformedData);
    
    return new Response(JSON.stringify({ data: transformedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    
    // Fallback data in case of API failure
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
