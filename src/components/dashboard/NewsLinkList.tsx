
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface NewsItem {
  id: string;
  title: string;
  published_date: string;
  link: string;
}

const NewsLinkList = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        
        // Fetch news from our Supabase Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('openai-news');
        
        if (functionError) {
          console.error("Error invoking Edge Function:", functionError);
          throw new Error('Failed to fetch news from Edge Function');
        }
        
        // Check if the response contains data
        if (data && data.data && Array.isArray(data.data)) {
          // Validate and fix each link before setting state
          const processedItems = data.data.map((item: NewsItem) => {
            let link = item.link || "";
            
            // Ensure link starts with http
            if (link && !link.startsWith('http')) {
              link = `https://openai.com${link.startsWith('/') ? '' : '/'}${link}`;
            }
            
            return {
              ...item,
              link: link || "https://openai.com/blog"
            };
          });
          
          setNewsItems(processedItems);
          console.log("Successfully fetched news from Edge Function:", processedItems.length, "items");
          processedItems.forEach((item, i) => {
            console.log(`Item ${i}: ${item.title} - Link: ${item.link}`);
          });
        } else {
          console.error("Invalid response format from Edge Function:", data);
          throw new Error('Invalid response format from Edge Function');
        }
        
        // Check if there's an error message from the Edge Function
        if (data && data.error) {
          console.warn("Edge Function returned an error:", data.error);
          setError(data.error);
        }
      } catch (error) {
        console.error("Error fetching OpenAI news:", error);
        setError("Failed to load news feed");
        
        // Fallback to static data if Edge Function fails
        const mockNews = [
          { id: '1', title: 'OpenAI Announces GPT-4o', published_date: 'Wed, 15 May 2024 10:00:00 GMT', link: 'https://openai.com/blog/gpt-4o' },
          { id: '2', title: 'ChatGPT can now see, hear, and speak', published_date: 'Mon, 25 Sep 2023 14:30:00 GMT', link: 'https://openai.com/blog/chatgpt-can-now-see-hear-and-speak' },
          { id: '3', title: 'DALL·E 3 is now available in ChatGPT Plus and Enterprise', published_date: 'Fri, 13 Oct 2023 09:15:00 GMT', link: 'https://openai.com/blog/dall-e-3-is-now-available-in-chatgpt-plus-and-enterprise' },
          { id: '4', title: 'GPTs are now available to all ChatGPT Plus and Team users', published_date: 'Wed, 06 Nov 2023 08:45:00 GMT', link: 'https://openai.com/blog/introducing-gpts' }
        ];
        
        setNewsItems(mockNews);
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
      <h3 className="text-xl font-semibold mb-4">OpenAI Latest News</h3>
      
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
                  <div className="flex items-center mt-1 text-xs text-gray-400">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    <span>{formatDate(news.published_date)}</span>
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
          <span>View all OpenAI news</span>
          <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default NewsLinkList;
