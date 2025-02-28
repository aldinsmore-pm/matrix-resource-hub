
import { useState, useEffect } from "react";
import { Link as LinkIcon, Trash2, PencilLine, Plus, Search, X, Link as LinkIconFull } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  created_at: string;
}

interface LinkFormData {
  title: string;
  url: string;
  category: string;
  description: string;
}

const LinksSection = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<LinkFormData>({
    title: "",
    url: "",
    category: "",
    description: ""
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const openModal = (link?: Link) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        title: link.title,
        url: link.url,
        category: link.category,
        description: link.description || ""
      });
    } else {
      setEditingLink(null);
      setFormData({
        title: "",
        url: "",
        category: "",
        description: ""
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLink(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to add links");
        return;
      }

      if (editingLink) {
        // Update existing link
        const { error } = await supabase
          .from('links')
          .update({
            title: formData.title,
            url: formData.url,
            category: formData.category,
            description: formData.description
          })
          .eq('id', editingLink.id);

        if (error) throw error;
        toast.success("Link updated successfully");
      } else {
        // Add new link
        const { error } = await supabase
          .from('links')
          .insert({
            title: formData.title,
            url: formData.url,
            category: formData.category,
            description: formData.description,
            author_id: userData.user.id
          });

        if (error) throw error;
        toast.success("Link added successfully");
      }

      closeModal();
      fetchLinks();
    } catch (error: any) {
      console.error('Error saving link:', error);
      toast.error(error.message || 'Failed to save link');
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLinks(links.filter(link => link.id !== id));
      toast.success("Link deleted successfully");
    } catch (error: any) {
      console.error('Error deleting link:', error);
      toast.error(error.message || 'Failed to delete link');
    }
  };

  const filteredLinks = links.filter(link => {
    const searchLower = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(searchLower) ||
      link.category.toLowerCase().includes(searchLower) ||
      (link.description && link.description.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const categories = Array.from(new Set(links.map(link => link.category)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white pipboy-text">Links Management</h2>
          <p className="text-gray-400 pipboy-text">Manage your collection of useful AI resources and references</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center px-4 py-2 bg-matrix-primary/20 text-matrix-primary rounded-md border border-matrix-primary/30 hover:bg-matrix-primary/30 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          <span className="pipboy-text">Add New Link</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-matrix-bg-alt border border-matrix-border/50 rounded-md focus:outline-none focus:border-matrix-primary/50 text-white"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Links Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card-container border border-matrix-border/50 rounded-lg overflow-hidden">
          {filteredLinks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-matrix-border/50">
                <thead className="bg-matrix-bg-alt/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider pipboy-text">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider pipboy-text">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider pipboy-text hidden md:table-cell">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider pipboy-text hidden lg:table-cell">Added On</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider pipboy-text">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-matrix-border/30">
                  {filteredLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-matrix-muted/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white pipboy-text">{link.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 pipboy-text">
                        <span className="px-2 py-1 rounded-full text-xs bg-matrix-muted/50 text-matrix-primary">{link.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-matrix-primary/80 hidden md:table-cell pipboy-text">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-matrix-primary">
                          <span className="truncate max-w-[200px]">{link.url}</span>
                          <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden lg:table-cell pipboy-text">{formatDate(link.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button 
                            onClick={() => openModal(link)} 
                            className="text-blue-400 hover:text-blue-300"
                            title="Edit"
                          >
                            <PencilLine className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteLink(link.id)} 
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <LinkIconFull className="w-12 h-12 text-matrix-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2 pipboy-text">No links found</h3>
              <p className="text-gray-400 mb-6 pipboy-text">
                {searchQuery ? 'No links match your search criteria' : 'Add some links to get started'}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-matrix-muted/30 text-matrix-primary rounded-md hover:bg-matrix-muted/40 transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Link Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-matrix-bg-alt border border-matrix-border rounded-lg w-full max-w-md p-6 relative animate-fade-in-up">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-white pipboy-text">
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1 pipboy-text">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. PyTorch Documentation"
                    className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded-md focus:outline-none focus:border-matrix-primary/50 text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1 pipboy-text">URL</label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    required
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded-md focus:outline-none focus:border-matrix-primary/50 text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1 pipboy-text">Category</label>
                  {categories.length > 0 ? (
                    <div className="relative">
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded-md focus:outline-none focus:border-matrix-primary/50 text-white appearance-none"
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                        <option value="custom">Add custom category...</option>
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g. Framework, Documentation, Research"
                      className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded-md focus:outline-none focus:border-matrix-primary/50 text-white"
                    />
                  )}
                  
                  {formData.category === 'custom' && (
                    <input
                      type="text"
                      name="category"
                      value=""
                      onChange={handleInputChange}
                      placeholder="Enter custom category name"
                      className="w-full px-3 py-2 mt-2 bg-matrix-bg border border-matrix-border rounded-md focus:outline-none focus:border-matrix-primary/50 text-white"
                    />
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1 pipboy-text">Description (optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the resource"
                    rows={3}
                    className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded-md focus:outline-none focus:border-matrix-primary/50 text-white"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-matrix-border/50 rounded-md hover:bg-matrix-muted/20 text-white transition-colors pipboy-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-matrix-primary/20 text-matrix-primary border border-matrix-primary/30 rounded-md hover:bg-matrix-primary/30 transition-colors pipboy-text"
                  >
                    {editingLink ? 'Update Link' : 'Add Link'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinksSection;
