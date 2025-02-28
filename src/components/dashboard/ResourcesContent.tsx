
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

    // Hacker green color for resource content
    const hackerGreen = "#14b859";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.trim().startsWith('```') || line.trim().endsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          
          // If there's any current paragraph text, add it
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {processBoldText(currentParagraph)}
              </p>
            );
            currentParagraph = '';
          }
          
          // Start collecting code
          currentCodeBlock = line.replace(/```/g, '');
        } else {
          // End of code block
          inCodeBlock = false;
          formattedElements.push(
            <pre key={`code-${formattedElements.length}`} className="bg-matrix-bg p-3 rounded-md font-mono text-sm text-gray-300 overflow-x-auto my-2 border border-opacity-50" style={{ borderColor: hackerGreen }}>
              <code>{currentCodeBlock.replace(/```/g, '')}</code>
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

      // Handle headings with asterisks for bold formatting **Heading**
      if (line.match(/^\*\*[\d]+\.\s.+\*\*$/) || line.match(/^\*\*.+\*\*$/)) {
        // Heading with number like **1. Heading** or just **Heading**
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        
        const headingText = line.replace(/^\*\*|\*\*$/g, '');
        formattedElements.push(
          <h3 key={`h-${formattedElements.length}`} className="text-lg font-bold my-3" style={{ color: hackerGreen }}>
            {headingText}
          </h3>
        );
        continue;
      }

      // Handle traditional headings
      if (line.startsWith('# ')) {
        // Finish any current paragraph
        if (currentParagraph.trim()) {
          formattedElements.push(
            <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h2 key={`h1-${formattedElements.length}`} className="text-xl font-bold my-4" style={{ color: hackerGreen }}>
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
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h3 key={`h2-${formattedElements.length}`} className="text-lg font-semibold my-3" style={{ color: `${hackerGreen}E6` }}>
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
              {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        formattedElements.push(
          <h4 key={`h3-${formattedElements.length}`} className="text-base font-medium my-2" style={{ color: `${hackerGreen}CC` }}>
            {line.substring(4)}
          </h4>
        );
        continue;
      }

      // Handle unordered lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        // If we're not already in a list, start a new one
        if (!inList) {
          // Finish any current paragraph
          if (currentParagraph.trim()) {
            formattedElements.push(
              <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
                {processBoldText(currentParagraph)}
              </p>
            );
            currentParagraph = '';
          }
          inList = true;
          listType = 'unordered';
          listItems = [];
        }
        
        // Remove the bullet character and trim
        const bulletText = line.trim().startsWith('- ') 
          ? line.trim().substring(2) 
          : line.trim().substring(2);
          
        // Add this item to the list with proper formatting for any bold text within it
        listItems.push(processBoldText(bulletText));
        
        // If this is the last line or the next line is not a list item, end the list
        if (i === lines.length - 1 || 
            !(lines[i+1].trim().startsWith('- ') || 
              lines[i+1].trim().startsWith('• ') || 
              lines[i+1].startsWith('  '))) {
          formattedElements.push(
            <ul key={`ul-${formattedElements.length}`} className="list-disc pl-5 space-y-1 my-3" style={{ color: `${hackerGreen}99` }}>
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
                {processBoldText(currentParagraph)}
            </p>
          );
          currentParagraph = '';
        }
        inList = true;
        listType = 'ordered';
        listItems = [];
      }
      
      // Add this item to the list, removing the number and period
      listItems.push(processBoldText(line.replace(/^\d+\.\s/, '')));
      
      // If this is the last line or the next line is not a list item, end the list
      if (i === lines.length - 1 || 
          !(/^\d+\.\s/.test(lines[i+1]) || lines[i+1].startsWith('  '))) {
        formattedElements.push(
          <ol key={`ol-${formattedElements.length}`} className="list-decimal pl-5 space-y-1 my-3" style={{ color: `${hackerGreen}99` }}>
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

    // Handle special block quotes (like the example prompt with >)
    if (line.startsWith('> ')) {
      if (currentParagraph.trim()) {
        formattedElements.push(
          <p key={`p-${formattedElements.length}`} className="my-3 text-gray-300">
            {processBoldText(currentParagraph)}
          </p>
        );
        currentParagraph = '';
      }
      
      formattedElements.push(
        <blockquote key={`quote-${formattedElements.length}`} className="pl-4 py-1 my-4 italic text-gray-300" style={{ borderLeft: `4px solid ${hackerGreen}` }}>
          {processBoldText(line.substring(2))}
        </blockquote>
      );
      continue;
    }

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

// Process bold text with ** markers
const processBoldText = (text: string) => {
  if (!text) return text;
  
  // Split the text by bold markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  if (parts.length === 1) return text;
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // This is a bold text section - use the hacker green color
      return <strong key={index} className="font-bold" style={{ color: "#14b859" }}>{part.slice(2, -2)}</strong>;
    }
    return part;
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
