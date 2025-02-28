
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";

interface ResourceFormProps {
  resourceId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

const ResourceForm = ({ resourceId, onComplete, onCancel }: ResourceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    if (resourceId) {
      loadResource();
    }
    
    // Fetch all existing tags for suggestions
    fetchAllTags();
  }, [resourceId]);

  async function fetchAllTags() {
    try {
      const { data, error } = await supabase
        .rpc('get_top_tags', { limit_count: 20 });
      
      if (error) throw error;
      
      if (data) {
        // Extract just the tag names from the returned data
        setAllTags(data.map(item => item.tag));
      }
    } catch (error: any) {
      console.error("Error fetching tags:", error);
    }
  }

  async function loadResource() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("id", resourceId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setContent(data.content);
        setCategory(data.category);
        setImageUrl(data.image_url || "");
        setPublished(data.published);
        setTags(data.tags || []);
      }
    } catch (error: any) {
      toast.error(`Error loading resource: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !content || !category) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error("You must be logged in to save resources");
        return;
      }
      
      const resourceData = {
        title,
        description,
        content,
        category,
        image_url: imageUrl,
        published,
        tags,
        author_id: user.user.id
      };
      
      let error;
      
      if (resourceId) {
        // Update existing resource
        const { error: updateError } = await supabase
          .from("resources")
          .update(resourceData)
          .eq("id", resourceId);
          
        error = updateError;
      } else {
        // Create new resource
        const { error: insertError } = await supabase
          .from("resources")
          .insert([resourceData]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      toast.success(`Resource ${resourceId ? "updated" : "created"} successfully!`);
      onComplete();
    } catch (error: any) {
      console.error("Error saving resource:", error);
      toast.error(`Error saving resource: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    // Fix: Get the trimmed tag from the current input value
    const trimmedTag = tagInput.trim().toLowerCase();
    
    // Only add if the tag is not empty and not already in the list
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput(""); // Clear the input after adding
      console.log("Added tag:", trimmedTag, "Current tags:", [...tags, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      addTag();
    }
  };

  return (
    <div className="bg-matrix-bg-alt rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">
        {resourceId ? "Edit Resource" : "Create New Resource"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 bg-matrix-bg border border-matrix-border rounded text-white"
            placeholder="Resource title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-matrix-bg border border-matrix-border rounded text-white"
            required
          >
            <option value="">Select a category</option>
            <option value="Framework">Framework</option>
            <option value="Toolkit">Toolkit</option>
            <option value="Guide">Guide</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Tool">Tool</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-matrix-bg border border-matrix-border rounded text-white"
            rows={2}
            placeholder="Short description"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 bg-matrix-bg border border-matrix-border rounded text-white"
            rows={6}
            placeholder="Full content of the resource"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 bg-matrix-bg border border-matrix-border rounded text-white"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <div 
                key={tag} 
                className="flex items-center bg-matrix-primary/20 text-matrix-primary px-2 py-1 rounded-full text-sm"
              >
                <span>#{tag}</span>
                <button 
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-matrix-primary hover:text-matrix-primary/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 p-2 bg-matrix-bg border border-matrix-border rounded-l text-white"
              placeholder="Add tags (press Enter to add)"
            />
            <button
              type="button"
              onClick={() => addTag()}
              className="px-3 py-2 bg-matrix-primary/20 text-matrix-primary border-y border-r border-matrix-border rounded-r hover:bg-matrix-primary/30"
            >
              Add
            </button>
          </div>
          
          {allTags.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-400 mb-1">Popular tags:</p>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => {
                      // Fix: Directly add the tag when clicking on a popular tag
                      if (!tags.includes(tag)) {
                        setTags([...tags, tag]);
                      }
                    }}
                    className="text-xs px-2 py-1 bg-matrix-bg-alt border border-matrix-border/50 rounded-full hover:bg-matrix-primary/10 hover:border-matrix-primary/30"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="published" className="text-sm">
            Publish this resource (make it visible to all users)
          </label>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-matrix-border rounded hover:bg-matrix-muted transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90 transition-colors"
            disabled={loading}
          >
            {loading ? "Saving..." : resourceId ? "Update Resource" : "Create Resource"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourceForm;
