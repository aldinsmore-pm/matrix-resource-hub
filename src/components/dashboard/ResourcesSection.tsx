
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ResourcesList from "./ResourcesList";
import ResourceForm from "./ResourceForm";
import PublishedResources from "./PublishedResources";
import { toast } from "sonner";

interface ResourcesSectionProps {
  initialResourceId?: string;
  initialView?: string;
}

const ResourcesSection = ({ initialResourceId, initialView }: ResourcesSectionProps) => {
  const [activeTab, setActiveTab] = useState("published");
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Handle initial resource and view if provided
    if (initialResourceId) {
      setSelectedResourceId(initialResourceId);
      
      if (initialView === "detail") {
        setActiveTab("published");
        setEditMode(false);
        setCreateMode(false);
      } else if (initialView === "edit") {
        setActiveTab("my-resources");
        setEditMode(true);
        setCreateMode(false);
      }
    }
  }, [initialResourceId, initialView]);

  const handleSaveComplete = () => {
    setEditMode(false);
    setCreateMode(false);
    // Trigger a refresh of the resources list
    setRefreshTrigger(prev => prev + 1);
    toast.success("Resource saved successfully!");
  };

  const handleCancel = () => {
    setEditMode(false);
    setCreateMode(false);
    setSelectedResourceId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold pipboy-text">Resources</h2>
        {!editMode && !createMode && (
          <button
            onClick={() => {
              setCreateMode(true);
              setSelectedResourceId(null);
            }}
            className="px-4 py-2 bg-matrix-primary text-black rounded hover:bg-opacity-90 transition-colors"
          >
            Create New Resource
          </button>
        )}
      </div>

      {createMode ? (
        <ResourceForm onComplete={handleSaveComplete} onCancel={handleCancel} />
      ) : editMode ? (
        <ResourceForm resourceId={selectedResourceId || undefined} onComplete={handleSaveComplete} onCancel={handleCancel} />
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-matrix-bg-alt grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="published">Published Resources</TabsTrigger>
            <TabsTrigger value="my-resources">My Resources</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="published" className="mt-0">
              <PublishedResources />
            </TabsContent>
            
            <TabsContent value="my-resources" className="mt-0">
              <ResourcesList 
                onCreateNew={() => {
                  setCreateMode(true);
                  setSelectedResourceId(null);
                }}
                onEdit={(id) => {
                  setSelectedResourceId(id);
                  setEditMode(true);
                }}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
};

export default ResourcesSection;
