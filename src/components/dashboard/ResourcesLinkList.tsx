
import { useState, useEffect } from "react";
import { Book, ChevronRight, Tag as TagIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

interface Resource {
  id: string;
  title: string;
  category: string;
  created_at: string;
  tags: string[];
}

interface TopTag {
  tag: string;
  count: number;
}

const ResourcesLinkList = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [topTags, setTopTags] = useState<TopTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedResources();
    loadTopTags();
  }, []);

  async function loadPublishedResources() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, category, created_at, tags")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (data) {
        setResources(data);
      }
    } catch (error) {
      console.error("Error loading resources:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTopTags() {
    try {
      const { data, error } = await supabase
        .rpc('get_top_tags', { limit_count: 5 });
      
      if (error) throw error;
      
      if (data) {
        setTopTags(data);
      }
    } catch (error) {
      console.error("Error loading top tags:", error);
    }
  }

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
      // Filter resources by tag
      filterResourcesByTag(tag);
    }
  };

  const filterResourcesByTag = async (tag: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, category, created_at, tags")
        .eq("published", true)
        .contains('tags', [tag])
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (data) {
        setResources(data);
      }
    } catch (error) {
      console.error("Error filtering resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    }
  };

  const viewAll = () => {
    navigate('/dashboard', { state: { section: 'resources' } });
  };

  const handleResourceClick = (resourceId: string) => {
    console.log("Navigating to resource:", resourceId);
    navigate('/dashboard', { 
      state: { 
        section: 'resources',
        view: 'detail',
        resourceId: resourceId 
      } 
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-white pipboy-text flex items-center">
          <Book className="w-4 h-4 mr-2 text-matrix-primary" />
          AI Resources
        </h4>
        <button 
          onClick={viewAll}
          className="text-xs text-matrix-primary hover:underline flex items-center pipboy-text"
        >
          View all <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      {/* Top tags */}
      {topTags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <TagIcon className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400 pipboy-text">Popular tags:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topTags.map(tagData => (
              <button
                key={tagData.tag}
                onClick={() => handleTagClick(tagData.tag)}
                className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedTag === tagData.tag
                    ? "bg-matrix-primary text-black"
                    : "bg-matrix-muted/50 text-gray-300 hover:bg-matrix-muted/80"
                } pipboy-text`}
              >
                {tagData.tag}
                <span className="ml-1 opacity-70">({tagData.count})</span>
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => {
                  setSelectedTag(null);
                  loadPublishedResources();
                }}
                className="text-xs text-gray-400 hover:text-white pipboy-text underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resources list */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-12 bg-matrix-muted/20 rounded"></div>
          ))}
        </div>
      ) : resources.length > 0 ? (
        <div className="space-y-2">
          {resources.map(resource => (
            <div 
              key={resource.id}
              onClick={() => handleResourceClick(resource.id)}
              className="p-2 hover:bg-matrix-muted/20 rounded cursor-pointer transition-colors"
            >
              <div className="font-medium text-white text-sm pipboy-text">{resource.title}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs bg-matrix-muted/40 px-1.5 py-0.5 rounded text-matrix-primary/80 pipboy-text">{resource.category}</span>
                <span className="text-xs text-gray-500 pipboy-text">{formatDate(resource.created_at)}</span>
              </div>
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {resource.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-matrix-primary/70 pipboy-text">{tag}</span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="text-xs text-gray-500 pipboy-text">+{resource.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400 pipboy-text">
          {selectedTag ? (
            <p>No resources found with tag {selectedTag}</p>
          ) : (
            <p>No resources available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourcesLinkList;
