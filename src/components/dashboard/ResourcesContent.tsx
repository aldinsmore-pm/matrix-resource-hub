
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

  // Format content with proper styling
  const formatContent = (content: string) => {
    if (!content) return null;

    // Process special formatting
    const lines = content.split('\n');
    const formattedElements = [];
    let inCodeBlock = false;
    let currentCodeBlock = '';
    let currentParagraph = '';
    let inList = false;
    let listItems = [];
    let listType: 'ordered' | 'unordered' | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.includes('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          
          // If there's any current paragraph text, add it
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {currentParagraph}
              </p>
            );
            currentParagraph = '';
          }
          
          // Start collecting code
          currentCodeBlock = line.replace('```', '');
        } else {
          // End of code block
          inCodeBlock = false;
          formattedElements.push(
            <pre key={`code-${formattedElements.length}`} className="bg-matrix-bg p-3 rounded-md font-mono text-sm text-gray-300 overflow-x-auto my-2 border border-matrix-border/50">
              <code>{currentCodeBlock.replace('```', '')}</code>
            </pre>
          );
          currentCodeBlock = '';
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeBlock += line + '\n';
        continue;
      }

      // Handle headings
      if (line.startsWith('# ')) {
        // Finish any current paragraph
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {currentParagraph}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h2 key={`h1-${formattedElements.length}`} className="text-xl font-bold my-4 text-matrix-primary">
            {line.substring(2)}
          </h2>
        );
        continue;
      }

      if (line.startsWith('## ')) {
        // Finish any current paragraph
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {currentParagraph}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h3 key={`h2-${formattedElements.length}`} className="text-lg font-semibold my-3 text-matrix-primary/90">
            {line.substring(3)}
          </h3>
        );
        continue;
      }

      if (line.startsWith('### ')) {
        // Finish any current paragraph
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {currentParagraph}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h4 key={`h3-${formattedElements.length}`} className="text-base font-medium my-2 text-matrix-primary/80">
            {line.substring(4)}
          </h4>
        );
        continue;
      }

      // Handle unordered lists
      if (line.startsWith('- ')) {
        // If we're not already in a list, start a new one
        if (!inList) {
          // Finish any current paragraph
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {currentParagraph}
              </p>
            );
            currentParagraph = '';
          }
          inList = true;
          listType = 'unordered';
          listItems = [];
        }
        
        // Add this item to the list
        listItems.push(line.substring(2));
        
        // If this is the last line or the next line is not a list item, end the list
        if (i === lines.length - 1 || 
            !(lines[i+1].startsWith('- ') || lines[i+1].startsWith('  '))) {
          formattedElements.push(
            <ul key={`ul-${formattedElements.length}`} className="list-disc pl-5 space-y-1 my-3">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-gray-300">{item}</li>
              ))}
            </ul>
          );
          inList = false;
          listItems = [];
        }
        
        continue;
      }

      // Handle ordered lists
      if (/^\d+\.\s/.test(line)) {
        // If we're not already in a list, start a new one
        if (!inList) {
          // Finish any current paragraph
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {currentParagraph}
              </p>
            );
            currentParagraph = '';
          }
          inList = true;
          listType = 'ordered';
          listItems = [];
        }
        
        // Add this item to the list, removing the number and period
        listItems.push(line.replace(/^\d+\.\s/, ''));
        
        // If this is the last line or the next line is not a list item, end the list
        if (i === lines.length - 1 || 
            !(/^\d+\.\s/.test(lines[i+1]) || lines[i+1].startsWith('  '))) {
          formattedElements.push(
            <ol key={`ol-${formattedElements.length}`} className="list-decimal pl-5 space-y-1 my-3">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-gray-300">{item}</li>
              ))}
            </ol>
          );
          inList = false;
          listItems = [];
        }
        
        continue;
      }

      // Handle bold text
      const processBoldText = (text: string) => {
        // Find all **text** patterns and replace with <strong> tags
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      };

      // Handle empty lines (paragraph breaks)
      if (line.trim() === '') {
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        continue;
      }

      // Regular text (part of a paragraph)
      if (currentParagraph) {
        currentParagraph += ' ' + line;
      } else {
        currentParagraph = line;
      }

      // If this is the last line, add the paragraph
      if (i === lines.length - 1 && currentParagraph.trim()) {
        formattedElements.push(
          <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
            {processBoldText(currentParagraph)}
          </p>
        );
      }
    }

    return formattedElements;
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
