
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
        console.log("Dashboard: Fetching news from Edge Function");
        
        // Try the primary method first
        let success = await tryFetchWithFunction();
        
        // If that fails, try the fallback with direct fetching
        if (!success) {
          console.log("Primary method failed, trying direct XML fetch...");
          success = await tryDirectFetch();
        }
        
        // If both methods fail, use static data
        if (!success) {
          console.log("All fetch methods failed, using fallback data");
          useStaticFallback();
        }
      } catch (error: any) {
        console.error("Error in news fetch process:", error);
        useStaticFallback();
      } finally {
        setLoading(false);
      }
    }
    
    // Primary method: Using our newsapi Edge Function
    async function tryFetchWithFunction(): Promise<boolean> {
      try {
        const { data, error: functionError } = await supabase.functions.invoke('newsapi');
        
        if (functionError) {
          console.error("Error invoking Edge Function:", functionError);
          return false;
        }
        
        console.log("Dashboard: Received response from Edge Function", data);
        
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setNewsItems(data.data);
          console.log("Dashboard: Successfully fetched news:", data.data.length, "items");
          return true;
        } else {
          console.error("Invalid or empty response from Edge Function:", data);
          return false;
        }
      } catch (error) {
        console.error("Error in tryFetchWithFunction:", error);
        return false;
      }
    }
    
    // Fallback method: Direct RSS feed parsing on client
    async function tryDirectFetch(): Promise<boolean> {
      try {
        const { data: xmlText, error: functionError } = await supabase.functions.invoke('direct-rss');
        
        if (functionError || !xmlText) {
          console.error("Error getting raw RSS:", functionError);
          return false;
        }
        
        // Parse the RSS feed on the client side
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText as string, "text/xml");
        
        if (!xmlDoc) {
          console.error("Failed to parse XML");
          return false;
        }
        
        const entries = xmlDoc.querySelectorAll("entry");
        console.log(`Found ${entries.length} entries in RSS feed`);
        
        if (!entries || entries.length === 0) {
          console.error("No entries found in RSS feed");
          return false;
        }
        
        const newsData = Array.from(entries).slice(0, 10).map((entry, index) => {
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
        
        setNewsItems(newsData);
        return true;
      } catch (error) {
        console.error("Error in tryDirectFetch:", error);
        return false;
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
      setError("Couldn't load live news feed");
      toast.error("Failed to load news feed, showing cached content");
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
          href="https://www.google.com/alerts" 
          className="text-matrix-primary hover:underline inline-flex items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Powered by Google Alerts</span>
          <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default NewsLinkList;
