
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarIcon } from "lucide-react";

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
        
        // Using a CORS proxy to fetch the RSS feed
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const rssUrl = 'https://openai.com/news/rss.xml';
        const response = await fetch(`${proxyUrl}${encodeURIComponent(rssUrl)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch RSS feed');
        }
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const items = xmlDoc.querySelectorAll("item");
        const parsedItems: NewsItem[] = [];
        
        items.forEach((item, index) => {
          if (index < 4) { // Limit to 4 items
            const title = item.querySelector("title")?.textContent || "Untitled";
            const pubDate = item.querySelector("pubDate")?.textContent || new Date().toUTCString();
            const link = item.querySelector("link")?.textContent || "#";
            const guid = item.querySelector("guid")?.textContent || `news-${index}`;
            
            parsedItems.push({
              id: guid,
              title: title,
              published_date: pubDate,
              link: link
            });
          }
        });
        
        setNewsItems(parsedItems);
      } catch (error) {
        console.error("Error fetching OpenAI news:", error);
        setError("Failed to load news feed");
        
        // Fallback to static data if RSS feed fails
        const mockNews = [
          { id: '1', title: 'OpenAI Announces GPT-4o', published_date: 'Wed, 15 May 2024 10:00:00 GMT', link: 'https://openai.com/blog/gpt4o' },
          { id: '2', title: 'Introducing ChatGPT Enterprise', published_date: 'Mon, 10 May 2024 14:30:00 GMT', link: 'https://openai.com/blog/chatgpt-enterprise' },
          { id: '3', title: 'DALL·E 3 Integration in ChatGPT', published_date: 'Fri, 05 May 2024 09:15:00 GMT', link: 'https://openai.com/blog/dall-e-3-chatgpt' },
          { id: '4', title: 'Research on AI Safety', published_date: 'Wed, 01 May 2024 08:45:00 GMT', link: 'https://openai.com/blog/ai-safety' }
        ];
        
        setNewsItems(mockNews);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
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
          href="https://openai.com/news" 
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
