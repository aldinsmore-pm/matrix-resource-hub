
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  published: boolean;
  created_at: string;
  author_id: string;
}

interface ResourcesListProps {
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  refreshTrigger: number;
}

const ResourcesList = ({ onCreateNew, onEdit, refreshTrigger }: ResourcesListProps) => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadResources();
  }, [refreshTrigger]);

  async function loadResources() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setResources(data as Resource[]);
      }
    } catch (error: any) {
      console.error("Error loading resources:", error);
      toast.error(`Error loading resources: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function togglePublishStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("resources")
        .update({ published: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      // Update local state
      setResources(resources.map(resource => 
        resource.id === id ? { ...resource, published: !currentStatus } : resource
      ));
      
      toast.success(`Resource ${currentStatus ? "unpublished" : "published"} successfully`);
    } catch (error: any) {
      console.error("Error updating resource:", error);
      toast.error(`Error updating resource: ${error.message}`);
    }
  }

  async function deleteResource(id: string) {
    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      // Update local state
      setResources(resources.filter(resource => resource.id !== id));
      toast.success("Resource deleted successfully");
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      toast.error(`Error deleting resource: ${error.message}`);
    } finally {
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="bg-matrix-bg-alt rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Your Resources</h3>
        <button
          onClick={onCreateNew}
          className="flex items-center px-3 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>You haven't created any resources yet.</p>
          <button
            onClick={onCreateNew}
            className="mt-4 text-matrix-primary hover:underline"
          >
            Create your first resource
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-matrix-border">
                <th className="pb-2">Title</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id} className="border-b border-matrix-border">
                  <td className="py-3">
                    <div className="font-medium">{resource.title}</div>
                    <div className="text-sm text-gray-400 truncate max-w-xs">{resource.description}</div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-matrix-muted text-matrix-primary">
                      {resource.category}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resource.published 
                        ? "bg-green-900/30 text-green-400" 
                        : "bg-yellow-900/30 text-yellow-400"
                    }`}>
                      {resource.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => togglePublishStatus(resource.id, resource.published)}
                        className="p-1 text-gray-400 hover:text-white"
                        title={resource.published ? "Unpublish" : "Publish"}
                      >
                        {resource.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => onEdit(resource.id)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {deleteConfirm === resource.id ? (
                        <>
                          <button
                            onClick={() => deleteResource(resource.id)}
                            className="p-1 text-red-500 hover:text-red-400"
                            title="Confirm Delete"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1 text-gray-400 hover:text-white"
                            title="Cancel"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(resource.id)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResourcesList;
