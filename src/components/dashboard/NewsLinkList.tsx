
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ArrowUpRight, CalendarIcon } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  published_date: string;
}

const NewsLinkList = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        // This is a placeholder - in a real app, you'd fetch from a news table
        // For now, we'll simulate with some static data
        // Replace this with real data fetching when you have a news table
        
        const mockNews = [
          { id: '1', title: 'New AI Regulations Impact Enterprise Adoption', published_date: '2023-05-15' },
          { id: '2', title: 'Machine Learning Models Show 30% Improvement with New Framework', published_date: '2023-05-10' },
          { id: '3', title: 'Case Study: How Company X Saved $2M with AI Automation', published_date: '2023-05-05' },
          { id: '4', title: 'The Future of AI in Healthcare: New Research Insights', published_date: '2023-05-01' }
        ];
        
        // Simulate network delay
        setTimeout(() => {
          setNewsItems(mockNews);
          setLoading(false);
        }, 1000);
        
        // When you have a real news table, use this instead:
        /*
        const { data, error } = await supabase
          .from('news')
          .select('id, title, published_date')
          .order('published_date', { ascending: false })
          .limit(4);

        if (error) {
          throw error;
        }

        setNewsItems(data || []);
        */
      } catch (error) {
        console.error("Error fetching news:", error);
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
      <h3 className="text-xl font-semibold mb-4">Latest News</h3>
      
      {newsItems.length > 0 ? (
        <ul className="space-y-3">
          {newsItems.map((news) => (
            <li key={news.id} className="card-container p-3 rounded-lg transform transition-all hover:-translate-y-1">
              <a 
                href={`/news/${news.id}`} 
                className="flex items-center justify-between"
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
        <a href="/news" className="text-matrix-primary hover:underline inline-flex items-center">
          <span>View all news</span>
          <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default NewsLinkList;
