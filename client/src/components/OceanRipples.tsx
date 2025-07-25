import { useEffect, useRef, useState } from 'react';

interface OceanRipplesProps {
  onRippleReady?: (rippleInstance: any) => void;
}

export default function OceanRipples({ onRippleReady }: OceanRipplesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rippleInstance, setRippleInstance] = useState<any>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  useEffect(() => {
    // Load jQuery and the ripples library
    const loadLibraries = async () => {
      // Load jQuery from CDN
      const jqueryScript = document.createElement('script');
      jqueryScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
      jqueryScript.onload = () => {
        // Load the ripples library
        const ripplesScript = document.createElement('script');
        ripplesScript.src = '/js/jquery.ripples.min.js';
        ripplesScript.onload = () => {
          setIsLibraryLoaded(true);
        };
        document.head.appendChild(ripplesScript);
      };
      document.head.appendChild(jqueryScript);
    };

    loadLibraries();

    return () => {
      // Cleanup scripts
      const scripts = document.querySelectorAll('script[src*="jquery"], script[src*="ripples"]');
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (isLibraryLoaded && containerRef.current && (window as any).$) {
      const $ = (window as any).$;
      const $container = $(containerRef.current);
      
      // Initialize ripples effect
      $container.ripples({
        resolution: 512,
        dropRadius: 30,
        perturbance: 0.04,
        interactive: true,
        automatic: false,
        crossOrigin: ''
      });

      // Store the ripple instance
      const instance = $container.data('ripples');
      setRippleInstance(instance);

      return () => {
        // Cleanup
        try {
          if ($container.data('ripples')) {
            $container.ripples('destroy');
          }
        } catch (e) {
          console.log('Ripples cleanup error:', e);
        }
      };
    }
  }, [isLibraryLoaded, onRippleReady]);

  // Method to manually create ripples
  const createRipple = (x: number, y: number, radius: number = 40, strength: number = 0.08) => {
    if (rippleInstance && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const localX = x - rect.left;
      const localY = y - rect.top;
      
      // Use the ripple instance to create a drop
      rippleInstance.dropAt(localX, localY, radius, strength);
    }
  };

  // Create ripple instance object to pass to parent
  useEffect(() => {
    if (rippleInstance && onRippleReady) {
      const rippleObject = {
        createRipple,
        instance: rippleInstance
      };
      onRippleReady(rippleObject);
    }
  }, [rippleInstance, onRippleReady]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==)',
        zIndex: 0
      }}
    />
  );
}

// Add the ocean gradient animation to the global styles
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes oceanGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(style);
}