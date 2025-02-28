
import { useState } from "react";
import ResourcesList from "./ResourcesList";
import ResourceForm from "./ResourceForm";

const ResourcesContent = () => {
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateNew = () => {
    setEditingId(undefined);
    setView("form");
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setView("form");
  };

  const handleFormComplete = () => {
    setView("list");
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setView("list");
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">
        Content Management
      </h3>
      
      {view === "list" ? (
        <ResourcesList 
          onCreateNew={handleCreateNew} 
          onEdit={handleEdit} 
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <ResourceForm 
          resourceId={editingId} 
          onComplete={handleFormComplete} 
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default ResourcesContent;
