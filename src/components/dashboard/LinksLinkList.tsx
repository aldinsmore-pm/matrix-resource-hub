
import { useState, useEffect } from "react";
import { Link as LinkIcon, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
}

const LinksLinkList = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('links')
        .select('id, title, url, category, description')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      setLinks(data || []);
    } catch (error: any) {
      console.error('Error fetching links:', error);
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="w-6 h-6 border-2 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <LinkIcon className="mr-2 text-matrix-primary" size={18} />
          <h3 className="text-lg font-semibold pipboy-text">Useful Links</h3>
        </div>
        <a
          href="/dashboard/links"
          className="text-xs text-matrix-primary hover:text-matrix-primary/80 transition-colors pipboy-text"
        >
          View all
        </a>
      </div>
      <div className="space-y-3">
        {links.length > 0 ? (
          links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 border border-matrix-border/40 rounded-md hover:bg-matrix-bg-alt hover:border-matrix-primary/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-white mb-1 pipboy-text">{link.title}</h4>
                  <div className="text-xs text-gray-500 pipboy-text">{link.category}</div>
                  {link.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 pipboy-text">{link.description}</p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </div>
            </a>
          ))
        ) : (
          <div className="text-center p-4 text-gray-400 pipboy-text">
            No links found. Add some in the Links section.
          </div>
        )}
      </div>
    </div>
  );
};

export default LinksLinkList;
