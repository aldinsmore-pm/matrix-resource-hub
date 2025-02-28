
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

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        
        // Fetch news from our Supabase Edge Function with NewsAPI integration
        const { data, error: functionError } = await supabase.functions.invoke('newsapi');
        
        if (functionError) {
          console.error("Error invoking Edge Function:", functionError);
          throw new Error('Failed to fetch news from Edge Function');
        }
        
        // Check if the response contains data
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setNewsItems(data.data);
          console.log("Successfully fetched news:", data.data.length, "items");
        } else {
          console.error("Invalid or empty response from Edge Function:", data);
          throw new Error('Invalid response from Edge Function');
        }
      } catch (error) {
        console.error("Error fetching AI news:", error);
        toast.error("Failed to load news");
        
        // Fallback to static data if Edge Function fails
        const fallbackNews = [
          { id: '1', title: 'OpenAI Announces GPT-4o', published_date: '2024-05-15T10:00:00Z', link: 'https://openai.com/blog/gpt-4o', source: 'OpenAI' },
          { id: '2', title: 'Introducing the OpenAI Overview', published_date: '2024-04-22T14:30:00Z', link: 'https://openai.com/blog/introducing-the-openai-overview', source: 'OpenAI' },
          { id: '3', title: 'Sora: Video generation model', published_date: '2024-02-15T09:15:00Z', link: 'https://openai.com/sora', source: 'OpenAI' },
          { id: '4', title: 'ChatGPT can now see, hear, and speak', published_date: '2023-09-25T14:30:00Z', link: 'https://openai.com/blog/chatgpt-can-now-see-hear-and-speak', source: 'OpenAI' }
        ];
        
        setNewsItems(fallbackNews);
      } finally {
        setLoading(false);
      }
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
          href="https://newsapi.org" 
          className="text-matrix-primary hover:underline inline-flex items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Powered by NewsAPI</span>
          <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default NewsLinkList;
