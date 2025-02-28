
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarIcon, NewspaperIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

interface NewsItem {
  id: string;
  title: string;
  published_date: string;
  link: string;
  source?: string;
}

const NewsLinkList = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        setError(null);
        console.log("Dashboard: Fetching AI news");
        
        // First try to fetch from our OpenAI news Edge Function
        try {
          const { data, error: functionError } = await supabase.functions.invoke('openai-news');
          
          if (functionError) {
            console.error("Error from Edge Function:", functionError);
            throw new Error("Failed to fetch from Edge Function");
          }
          
          if (data && data.data && Array.isArray(data.data)) {
            // Format the data
            const formattedData = data.data.map((item: any) => ({
              ...item,
              source: extractSourceFromUrl(item.link)
            }));
            
            setNewsItems(formattedData);
            console.log("Successfully fetched AI news from Edge Function");
            return;
          }
          
          throw new Error("Invalid data format from Edge Function");
        } catch (edgeFunctionError) {
          console.error("Edge Function error:", edgeFunctionError);
          // Continue to fallback method
        }
        
        // Fallback: Try a direct fetch to the news API
        try {
          const response = await fetch("https://api.spaceflightnewsapi.net/v4/articles?limit=5&search=ai%20artificial%20intelligence");
          
          if (!response.ok) {
            throw new Error(`Failed to fetch news: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Received news data from API:", data);
          
          if (data && data.results && Array.isArray(data.results)) {
            // Map to our NewsItem format and filter for AI-related news
            const transformedData = data.results
              .filter((item: any) => 
                item.title.toLowerCase().includes('ai') || 
                item.summary.toLowerCase().includes('artificial intelligence') ||
                item.summary.toLowerCase().includes('machine learning')
              )
              .map((item: any, index: number) => ({
                id: index.toString(),
                title: item.title,
                published_date: item.published_at || new Date().toISOString(),
                link: item.url,
                source: item.news_site
              }));
            
            if (transformedData.length > 0) {
              setNewsItems(transformedData);
              console.log("Transformed AI-filtered news data:", transformedData);
              return;
            }
          }
          
          throw new Error("No AI-related news found");
        } catch (apiError) {
          console.error("API error:", apiError);
          // Continue to static fallback
        }
        
        // If all else fails, use static data
        useStaticFallback();
      } catch (error: any) {
        console.error("Error in news fetch process:", error);
        setError(error.message || "Failed to load news");
        toast.error("Failed to load news feed, showing cached content");
        useStaticFallback();
      } finally {
        setLoading(false);
      }
    }
    
    // Extract source name from URL
    function extractSourceFromUrl(url: string): string {
      try {
        const hostname = new URL(url).hostname;
        // Remove www. and get the domain name
        const domain = hostname.replace(/^www\./i, '');
        // Get the main part (e.g., 'openai' from 'openai.com')
        const parts = domain.split('.');
        if (parts.length >= 2) {
          // Capitalize first letter
          return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
        }
        return domain;
      } catch {
        return "News Source";
      }
    }
    
    // Static fallback data when all else fails
    function useStaticFallback() {
      const fallbackNews = [
        { id: '1', title: 'OpenAI Announces GPT-4o', published_date: '2024-05-15T10:00:00Z', link: 'https://openai.com/blog/gpt-4o', source: 'OpenAI' },
        { id: '2', title: 'Introducing the OpenAI Overview', published_date: '2024-04-22T14:30:00Z', link: 'https://openai.com/blog/introducing-the-openai-overview', source: 'OpenAI' },
        { id: '3', title: 'Sora: Video generation model', published_date: '2024-02-15T09:15:00Z', link: 'https://openai.com/sora', source: 'OpenAI' },
        { id: '4', title: 'ChatGPT can now see, hear, and speak', published_date: '2023-09-25T14:30:00Z', link: 'https://openai.com/blog/chatgpt-can-now-see-hear-and-speak', source: 'OpenAI' }
      ];
      
      setNewsItems(fallbackNews);
    }

    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">AI News</h3>
      
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md mb-4">
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-xs text-gray-400 mt-1">Showing cached content</p>
        </div>
      )}
      
      {newsItems.length > 0 ? (
        <ul className="space-y-3">
          {newsItems.map((news) => (
            <li key={news.id} className="card-container p-3 rounded-lg transform transition-all hover:-translate-y-1">
              <a 
                href={news.link} 
                className="flex items-center justify-between"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div>
                  <h4 className="font-medium text-white">{news.title}</h4>
                  <div className="flex items-center mt-1 text-xs text-gray-400 space-x-3">
                    <div className="flex items-center">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      <span>{formatDate(news.published_date)}</span>
                    </div>
                    {news.source && (
                      <div className="flex items-center">
                        <NewspaperIcon className="w-3 h-3 mr-1" />
                        <span>{news.source}</span>
                      </div>
                    )}
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-matrix-primary" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center p-6 text-gray-400 card-container rounded-lg">
          <p>No news found.</p>
        </div>
      )}
      
      <div className="mt-4 text-right">
        <a 
          href="https://openai.com/blog" 
          className="text-matrix-primary hover:underline inline-flex items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Latest AI News</span>
          <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default NewsLinkList;
