
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Tag, X } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  created_at: string;
  tags: string[];
}

interface TopTag {
  tag: string;
  count: number;
}

const PublishedResources = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [resourceContent, setResourceContent] = useState("");
  const [topTags, setTopTags] = useState<TopTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadPublishedResources();
    loadTopTags();
  }, []);

  async function loadPublishedResources() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, description, category, image_url, created_at, tags")
        .eq("published", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setResources(data as Resource[]);
      }
    } catch (error: any) {
      console.error("Error loading published resources:", error);
      toast.error(`Error loading resources: ${error.message}`);
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
        setTopTags(data as TopTag[]);
      }
    } catch (error: any) {
      console.error("Error loading top tags:", error);
    }
  }

  async function loadResourceContent(id: string) {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("content")
        .eq("id", id)
        .eq("published", true)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setResourceContent(data.content);
        setSelectedResource(id);
      }
    } catch (error: any) {
      console.error("Error loading resource content:", error);
      toast.error(`Error loading resource content: ${error.message}`);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  // Format content with proper styling
  const formatContent = (content: string) => {
    // Split by double newlines to separate paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    return paragraphs.map((paragraph, index) => {
      // For headings (lines that start with # or ##)
      if (paragraph.startsWith('# ')) {
        return (
          <h2 key={index} className="text-xl font-bold my-4 text-matrix-primary">
            {paragraph.replace('# ', '')}
          </h2>
        );
      } else if (paragraph.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold my-3 text-matrix-primary/90">
            {paragraph.replace('## ', '')}
          </h3>
        );
      } else if (paragraph.startsWith('### ')) {
        return (
          <h4 key={index} className="text-base font-medium my-2 text-matrix-primary/80">
            {paragraph.replace('### ', '')}
          </h4>
        );
      }
      
      // For lists
      else if (paragraph.includes('\n- ')) {
        const listItems = paragraph.split('\n- ');
        const introText = listItems.shift();
        
        return (
          <div key={index} className="my-3">
            {introText && introText !== '- ' && (
              <p className="mb-2">{introText.replace('- ', '')}</p>
            )}
            <ul className="list-disc pl-5 space-y-1">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300">{item}</li>
              ))}
            </ul>
          </div>
        );
      }
      
      // For numbered lists
      else if (paragraph.includes('\n1. ') || paragraph.match(/^\d+\.\s/)) {
        const listItems = paragraph.split(/\n\d+\.\s/);
        const introText = listItems.shift();
        
        return (
          <div key={index} className="my-3">
            {introText && !introText.match(/^\d+\.\s/) && (
              <p className="mb-2">{introText}</p>
            )}
            <ol className="list-decimal pl-5 space-y-1">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300">{item}</li>
              ))}
            </ol>
          </div>
        );
      }
      
      // For code blocks
      else if (paragraph.includes('```')) {
        const parts = paragraph.split('```');
        return (
          <div key={index} className="my-4">
            {parts.map((part, i) => {
              if (i % 2 === 0) {
                return part && <p key={`p-${i}`} className="mb-2">{part}</p>;
              } else {
                return (
                  <pre key={`code-${i}`} className="bg-matrix-bg p-3 rounded-md font-mono text-sm text-gray-300 overflow-x-auto my-2 border border-matrix-border/50">
                    <code>{part}</code>
                  </pre>
                );
              }
            })}
          </div>
        );
      }
      
      // Handle single newlines within a paragraph (for line breaks)
      else if (paragraph.includes('\n')) {
        return (
          <p key={index} className="my-3 text-gray-300">
            {paragraph.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < paragraph.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      }
      
      // Regular paragraphs
      else {
        return (
          <p key={index} className="my-3 text-gray-300">
            {paragraph}
          </p>
        );
      }
    });
  };

  const filteredResources = resources.filter(resource => {
    if (selectedTags.length === 0) return true;
    
    // Check if the resource has at least one of the selected tags
    return selectedTags.some(tag => 
      resource.tags && resource.tags.includes(tag)
    );
  });

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">
        AI Resources
      </h3>
      
      {/* Tag filtering */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-medium text-gray-300">Filter by tags:</h4>
          
          {selectedTags.length > 0 && (
            <button 
              onClick={clearTags}
              className="text-xs text-gray-400 hover:text-white ml-auto flex items-center"
            >
              Clear all <X className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {topTags.map(tagData => (
            <button
              key={tagData.tag}
              onClick={() => toggleTag(tagData.tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                selectedTags.includes(tagData.tag)
                  ? "bg-matrix-primary text-black"
                  : "bg-matrix-muted text-gray-300 hover:bg-matrix-muted/80"
              }`}
            >
              {tagData.tag}
              <span className="ml-1 opacity-70">({tagData.count})</span>
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading resources...</div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {selectedTags.length > 0 ? (
            <p>No resources found with the selected tags.</p>
          ) : (
            <p>No published resources available yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 card-container rounded-lg p-4 h-fit">
            <h4 className="font-semibold border-b border-matrix-border pb-2 mb-4">Available Resources</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredResources.map(resource => (
                <div 
                  key={resource.id}
                  onClick={() => loadResourceContent(resource.id)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedResource === resource.id
                      ? "bg-matrix-primary bg-opacity-10 border border-matrix-primary"
                      : "hover:bg-matrix-muted border border-transparent"
                  }`}
                >
                  <div className="font-medium">{resource.title}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded">
                      {resource.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(resource.created_at)}
                    </span>
                  </div>
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {resource.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs px-1.5 py-0.5 bg-matrix-primary/10 text-matrix-primary/80 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2 card-container rounded-lg p-6">
            {selectedResource ? (
              <>
                {resources.find(r => r.id === selectedResource) && (
                  <>
                    <h4 className="font-bold text-xl mb-2">
                      {resources.find(r => r.id === selectedResource)?.title}
                    </h4>
                    <div className="flex items-center mb-2">
                      <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded">
                        {resources.find(r => r.id === selectedResource)?.category}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDate(resources.find(r => r.id === selectedResource)?.created_at || "")}
                      </span>
                    </div>
                    
                    {/* Display tags */}
                    {resources.find(r => r.id === selectedResource)?.tags && 
                     resources.find(r => r.id === selectedResource)?.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resources.find(r => r.id === selectedResource)?.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs px-2 py-0.5 bg-matrix-primary/10 text-matrix-primary/80 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="prose prose-invert max-w-none mt-6">
                      {formatContent(resourceContent)}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Select a resource to view its content</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedResources;
