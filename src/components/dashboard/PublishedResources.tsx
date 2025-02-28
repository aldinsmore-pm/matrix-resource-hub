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

  const formatContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    const formattedElements = [];
    let inCodeBlock = false;
    let currentCodeBlock = '';
    let currentParagraph = '';
    let inList = false;
    let listItems = [];
    let listType: 'ordered' | 'unordered' | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```') || line.trim().endsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {processBoldText(currentParagraph)}
              </p>
            );
            currentParagraph = '';
          }
          
          currentCodeBlock = line.replace(/```/g, '');
        } else {
          inCodeBlock = false;
          formattedElements.push(
            <pre key={`code-${formattedElements.length}`} className="bg-matrix-bg p-3 rounded-md font-mono text-sm text-gray-300 overflow-x-auto my-2 border border-matrix-border/50 pipboy-text">
              <code>{currentCodeBlock.replace(/```/g, '')}</code>
            </pre>
          );
          currentCodeBlock = '';
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeBlock += line + '\n';
        continue;
      }

      if (line.match(/^\*\*[\d]+\.\s.+\*\*$/) || line.match(/^\*\*.+\*\*$/)) {
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        
        const headingText = line.replace(/^\*\*|\*\*$/g, '');
        formattedElements.push(
          <h3 key={`h-${formattedElements.length}`} className="text-lg font-bold my-3 text-[#14b859] pipboy-text">
            {headingText}
          </h3>
        );
        continue;
      }

      if (line.startsWith('# ')) {
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h2 key={`h1-${formattedElements.length}`} className="text-xl font-bold my-4 text-[#14b859] pipboy-text">
            {line.substring(2)}
          </h2>
        );
        continue;
      }

      if (line.startsWith('## ')) {
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h3 key={`h2-${formattedElements.length}`} className="text-lg font-semibold my-3 text-[#14b859] pipboy-text">
            {line.substring(3)}
          </h3>
        );
        continue;
      }

      if (line.startsWith('### ')) {
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h4 key={`h3-${formattedElements.length}`} className="text-base font-medium my-2 text-[#14b859] pipboy-text">
            {line.substring(4)}
          </h4>
        );
        continue;
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        if (!inList) {
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {processBoldText(currentParagraph)}
              </p>
            );
            currentParagraph = '';
          }
          inList = true;
          listType = 'unordered';
          listItems = [];
        }
        
        const bulletText = line.trim().startsWith('- ') 
          ? line.trim().substring(2) 
          : line.trim().substring(2);
          
        listItems.push(processBoldText(bulletText));
        
        if (i === lines.length - 1 || 
            !(lines[i+1].trim().startsWith('- ') || 
              lines[i+1].trim().startsWith('• ') || 
              lines[i+1].startsWith('  '))) {
          formattedElements.push(
            <ul key={`ul-${formattedElements.length}`} className="list-disc pl-5 space-y-1 my-3">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-gray-300">{item}</li>
              ))}
            </ul>
          );
          inList = false;
          listItems = [];
        }
        
        continue;
      }

      if (/^\d+\.\s/.test(line)) {
        if (!inList) {
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {processBoldText(currentParagraph)}
              </p>
            );
            currentParagraph = '';
          }
          inList = true;
          listType = 'ordered';
          listItems = [];
        }
        
        listItems.push(processBoldText(line.replace(/^\d+\.\s/, '')));
        
        if (i === lines.length - 1 || 
            !(/^\d+\.\s/.test(lines[i+1]) || lines[i+1].startsWith('  '))) {
          formattedElements.push(
            <ol key={`ol-${formattedElements.length}`} className="list-decimal pl-5 space-y-1 my-3">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-gray-300">{item}</li>
              ))}
            </ol>
          );
          inList = false;
          listItems = [];
        }
        
        continue;
      }

      if (line.startsWith('> ')) {
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        
        formattedElements.push(
          <blockquote key={`quote-${formattedElements.length}`} className="border-l-4 border-[#14b859] pl-4 py-1 my-4 italic text-gray-300 pipboy-text">
            {processBoldText(line.substring(2))}
          </blockquote>
        );
        continue;
      }

      if (line.trim() === '') {
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        continue;
      }

      if (currentParagraph) {
        currentParagraph += ' ' + line;
      } else {
        currentParagraph = line;
      }

      if (i === lines.length - 1 && currentParagraph.trim()) {
        formattedElements.push(
          <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
            {processBoldText(currentParagraph)}
          </p>
        );
      }
    }

    return formattedElements;
  };

  const processBoldText = (text: string) => {
    if (!text) return text;
    
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    if (parts.length === 1) return text;
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-[#14b859]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const filteredResources = resources.filter(resource => {
    if (selectedTags.length === 0) return true;
    
    return selectedTags.some(tag => 
      resource.tags && resource.tags.includes(tag)
    );
  });

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">
        AI Resources
      </h3>
      
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
                  <div className="font-medium pipboy-text">{resource.title}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded pipboy-text">
                      {resource.category}
                    </span>
                    <span className="text-xs text-gray-500 pipboy-text">
                      {formatDate(resource.created_at)}
                    </span>
                  </div>
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {resource.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs px-1.5 py-0.5 bg-matrix-primary/10 text-matrix-primary/80 rounded-full pipboy-text"
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
                    <h4 className="font-bold text-xl mb-2 pipboy-text">
                      {resources.find(r => r.id === selectedResource)?.title}
                    </h4>
                    <div className="flex items-center mb-2">
                      <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded pipboy-text">
                        {resources.find(r => r.id === selectedResource)?.category}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 pipboy-text">
                        {formatDate(resources.find(r => r.id === selectedResource)?.created_at || "")}
                      </span>
                    </div>
                    
                    {resources.find(r => r.id === selectedResource)?.tags && 
                     resources.find(r => r.id === selectedResource)?.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resources.find(r => r.id === selectedResource)?.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs px-2 py-0.5 bg-matrix-primary/10 text-matrix-primary/80 rounded-full pipboy-text"
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
                <p className="pipboy-text">Select a resource to view its content</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedResources;
