
import React, { useState, useEffect } from "react";
import { ArrowLeft, Tag } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ResourcesContentProps {
  resourceId: string;
  onBack: () => void;
}

const ResourcesContent = ({ resourceId, onBack }: ResourcesContentProps) => {
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("id", resourceId)
          .single();

        if (error) throw error;
        setResource(data);
      } catch (err: any) {
        console.error("Error fetching resource:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [resourceId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Function to format content with proper styling
  const formatContent = (content: string) => {
    if (!content) return null;
    
    // Split by double newlines to separate paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    return paragraphs.map((paragraph, index) => {
      // For headings (lines that start with # or ##)
      if (paragraph.startsWith('# ')) {
        return (
          <h2 key={index} className="text-xl font-bold my-4 text-matrix-primary">
            {paragraph.replace('# ', '')}
          </h2>
        );
      } else if (paragraph.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold my-3 text-matrix-primary/90">
            {paragraph.replace('## ', '')}
          </h3>
        );
      } else if (paragraph.startsWith('### ')) {
        return (
          <h4 key={index} className="text-base font-medium my-2 text-matrix-primary/80">
            {paragraph.replace('### ', '')}
          </h4>
        );
      }
      
      // For lists
      else if (paragraph.includes('\n- ')) {
        const listItems = paragraph.split('\n- ');
        const introText = listItems.shift();
        
        return (
          <div key={index} className="my-3">
            {introText && introText !== '- ' && (
              <p className="mb-2">{introText.replace('- ', '')}</p>
            )}
            <ul className="list-disc pl-5 space-y-1">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300">{item}</li>
              ))}
            </ul>
          </div>
        );
      }
      
      // For numbered lists
      else if (paragraph.includes('\n1. ') || paragraph.match(/^\d+\.\s/)) {
        const listItems = paragraph.split(/\n\d+\.\s/);
        const introText = listItems.shift();
        
        return (
          <div key={index} className="my-3">
            {introText && !introText.match(/^\d+\.\s/) && (
              <p className="mb-2">{introText}</p>
            )}
            <ol className="list-decimal pl-5 space-y-1">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300">{item}</li>
              ))}
            </ol>
          </div>
        );
      }
      
      // For code blocks
      else if (paragraph.includes('```')) {
        const parts = paragraph.split('```');
        return (
          <div key={index} className="my-4">
            {parts.map((part, i) => {
              if (i % 2 === 0) {
                return part && <p key={`p-${i}`} className="mb-2">{part}</p>;
              } else {
                return (
                  <pre key={`code-${i}`} className="bg-matrix-bg p-3 rounded-md font-mono text-sm text-gray-300 overflow-x-auto my-2 border border-matrix-border/50">
                    <code>{part}</code>
                  </pre>
                );
              }
            })}
          </div>
        );
      }
      
      // Handle single newlines within a paragraph (for line breaks)
      else if (paragraph.includes('\n')) {
        return (
          <p key={index} className="my-3 text-gray-300">
            {paragraph.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < paragraph.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      }
      
      // Regular paragraphs
      else {
        return (
          <p key={index} className="my-3 text-gray-300">
            {paragraph}
          </p>
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-matrix-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error}. <button onClick={onBack} className="underline">Go back</button>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center p-4">
        Resource not found. <button onClick={onBack} className="underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-matrix-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to resources
      </button>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">{resource.title}</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-2 py-1 bg-matrix-primary/20 text-matrix-primary rounded text-sm">
            {resource.category}
          </span>
          <span className="text-sm text-gray-400">
            Added on {formatDate(resource.created_at)}
          </span>
        </div>
        
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400" />
            {resource.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-matrix-bg-alt border border-matrix-border/50 rounded-full text-xs text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <p className="text-gray-300 border-l-2 border-matrix-primary pl-4 py-1">
          {resource.description}
        </p>
        
        {resource.image_url && (
          <img
            src={resource.image_url}
            alt={resource.title}
            className="w-full max-h-60 object-cover rounded-md my-4"
          />
        )}
        
        <div className="mt-8 text-gray-300 prose prose-invert max-w-none">
          {formatContent(resource.content)}
        </div>
      </div>
    </div>
  );
};

export default ResourcesContent;
