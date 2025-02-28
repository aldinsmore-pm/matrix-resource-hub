
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  created_at: string;
}

const PublishedResources = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [resourceContent, setResourceContent] = useState("");

  useEffect(() => {
    loadPublishedResources();
  }, []);

  async function loadPublishedResources() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, description, category, image_url, created_at")
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

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">
        AI Resources
      </h3>
      
      {loading ? (
        <div className="text-center py-8">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No published resources available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 card-container rounded-lg p-4 h-fit">
            <h4 className="font-semibold border-b border-matrix-border pb-2 mb-4">Available Resources</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {resources.map(resource => (
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
                    <div className="flex items-center mb-6">
                      <span className="text-xs px-2 py-0.5 bg-matrix-muted text-matrix-primary rounded">
                        {resources.find(r => r.id === selectedResource)?.category}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDate(resources.find(r => r.id === selectedResource)?.created_at || "")}
                      </span>
                    </div>
                    <div className="prose prose-invert">
                      {resourceContent.split('\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
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
