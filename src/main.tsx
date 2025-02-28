
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  const root = createRoot(rootElement);
  
  try {
    console.log("Rendering React application...");
    root.render(<App />);
    console.log("React application rendered successfully");
  } catch (error) {
    console.error("Error rendering React application:", error);
  }
}
