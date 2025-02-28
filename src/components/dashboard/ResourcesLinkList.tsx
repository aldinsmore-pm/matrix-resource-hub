
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ArrowUpRight } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

const ResourcesLinkList = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('id, title, category, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }

        setResources(data || []);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Popular Resources</h3>
      
      {resources.length > 0 ? (
        <ul className="space-y-3">
          {resources.map((resource) => (
            <li key={resource.id} className="card-container p-3 rounded-lg transform transition-all hover:-translate-y-1">
              <a 
                href={`/resources/${resource.id}`} 
                className="flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium text-white">{resource.title}</h4>
                  <span className="text-xs px-2 py-0.5 inline-block mt-1 bg-matrix-muted text-matrix-primary rounded">
                    {resource.category}
                  </span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-matrix-primary" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center p-6 text-gray-400 card-container rounded-lg">
          <p>No resources found.</p>
        </div>
      )}
      
      <div className="mt-4 text-right">
        <a href="/resources" className="text-matrix-primary hover:underline inline-flex items-center">
          <span>View all resources</span>
          <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default ResourcesLinkList;
