import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  const root = createRoot(rootElement);
  
  try {
    console.log("Rendering React application...");
    
    // Wrap the app in an error boundary at the root level
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
    });
    
    root.render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    console.log("React application rendered successfully");
  } catch (error) {
    console.error("Error rendering React application:", error);
  }
}
