// Main plugin entry point for Framer
// This file handles the plugin initialization and Framer API communication

declare global {
  interface Window {
    framer?: any;
  }
}

// Enhanced Framer API detection
const getFramerAPI = () => {
  console.log('🔍 Plugin: Checking for Framer environment...');
  
  if (typeof window === 'undefined') {
    console.log('⚠️ Plugin: No window object - not in browser');
    return null;
  }
  
  // Check for direct Framer API
  try {
    if ((window as any).framer) {
      console.log('✅ Plugin: Direct Framer API detected!');
      return (window as any).framer;
    }
  } catch (error) {
    console.log('⚠️ Plugin: Error accessing direct framer API:', error);
  }
  
  // Check for parent Framer API
  try {
    if (window.parent && window.parent !== window) {
      const parentFramer = (window.parent as any).framer;
      if (parentFramer) {
        console.log('✅ Plugin: Parent Framer API detected!');
        return parentFramer;
      }
    }
  } catch (error) {
    console.log('⚠️ Plugin: Cross-origin error accessing parent framer:', error.message);
  }
  
  // Check for Framer in top window
  try {
    if (window.top && window.top !== window) {
      const topFramer = (window.top as any).framer;
      if (topFramer) {
        console.log('✅ Plugin: Top window Framer API detected!');
        return topFramer;
      }
    }
  } catch (error) {
    console.log('⚠️ Plugin: Cross-origin error accessing top framer:', error.message);
  }
  
  console.log('ℹ️ Plugin: No Framer API found');
  return null;
};

// Main plugin function that Framer calls
export const main = () => {
  console.log('🚀 Magic Styles Plugin: main() called');
  
  const framerAPI = getFramerAPI();
  
  if (!framerAPI) {
    console.error('❌ Plugin: No Framer API available');
    return;
  }
  
  try {
    // Initialize Framer UI with configuration matching framer.json
    framerAPI.showUI({
      position: 'center',
      width: 400,
      height: 600,
      resizable: true,
      minWidth: 300,
      minHeight: 400,
      maxWidth: 600,
      maxHeight: 800
    });
    
    console.log('✅ Plugin: Framer UI initialized successfully');
    
    // Send message to UI that plugin is ready
    window.postMessage({ type: 'PLUGIN_READY', framerAPI: true }, '*');
    
  } catch (error) {
    console.error('❌ Plugin: Failed to initialize Framer UI:', error);
    if (framerAPI.notify) {
      framerAPI.notify('Failed to initialize Magic Styles plugin', { variant: 'error' });
    }
  }
};

// Export the plugin for Framer
export default { main };