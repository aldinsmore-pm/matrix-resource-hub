
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

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

  useEffect(() => {
    if (resourceId) {
      loadResource();
    }
  }, [resourceId]);

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
