
import { useState } from "react";
import { Newspaper, Settings } from "lucide-react";
import PublishedResources from "./PublishedResources";
import ResourcesContent from "./ResourcesContent";

const ResourcesSection = () => {
  const [mode, setMode] = useState<"view" | "manage">("view");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Resources</h3>
        <div className="flex bg-matrix-bg rounded-lg overflow-hidden">
          <button
            onClick={() => setMode("view")}
            className={`px-4 py-2 flex items-center text-sm ${
              mode === "view"
                ? "bg-matrix-primary text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Newspaper className="w-4 h-4 mr-2" />
            View Resources
          </button>
          <button
            onClick={() => setMode("manage")}
            className={`px-4 py-2 flex items-center text-sm ${
              mode === "manage"
                ? "bg-matrix-primary text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Content
          </button>
        </div>
      </div>
      
      {mode === "view" ? (
        <PublishedResources />
      ) : (
        <ResourcesContent />
      )}
    </div>
  );
};

export default ResourcesSection;
