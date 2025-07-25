import { useEffect, useState, useCallback } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  timestamp: number;
  rings: number; // Number of concentric rings for wave effect
}

interface SimpleRipplesProps {
  onRippleReady?: (createRipple: (x: number, y: number, size?: number) => void) => void;
}

export default function SimpleRipples({ onRippleReady }: SimpleRipplesProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  // Create ripple function
  const createRipple = useCallback((x: number, y: number, size: number = 100) => {
    // Guard against null/undefined coordinates
    if (!x || !y) {
      console.log('Invalid ripple coordinates:', x, y);
      return;
    }
    
    console.log('Creating ripple at:', x, y, 'with size:', size); // Debug log
    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
      opacity: 0.7, // Subtle opacity for realistic water
      timestamp: Date.now(),
      rings: 3 // Create 3 elliptical waves
    };
    
    setRipples(prev => {
      const updated = [...prev, newRipple];
      console.log('Total ripples:', updated.length); // Debug log
      return updated;
    });
    
    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 4000);
  }, []);
  
  // Pass the createRipple function to parent
  useEffect(() => {
    if (onRippleReady) {
      onRippleReady(createRipple);
    }
  }, [createRipple]); // Only depend on createRipple
  
  // Add keyframes animation to document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rippleExpand {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 0.8;
        }
        50% {
          opacity: 0.4;
        }
        100% {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }
      
      @keyframes wavePattern {
        0% {
          transform: translate(-50%, -50%) rotateX(60deg) scale(0.3);
          opacity: 0;
        }
        15% {
          opacity: 0.7;
        }
        50% {
          opacity: 0.4;
        }
        100% {
          transform: translate(-50%, -50%) rotateX(60deg) scale(2.5);
          opacity: 0;
        }
      }
      
      @keyframes oceanGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {/* Ripples appear on the ocean surface */}
      
      {/* Realistic water ripples */}
      {ripples.map((ripple, rippleIndex) => (
        <div key={ripple.id} className="absolute" style={{ left: ripple.x, top: ripple.y }}>
          {/* Multiple elliptical waves for realistic water effect */}
          {Array.from({ length: ripple.rings }).map((_, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                width: `${ripple.size + (index * 80)}px`,
                height: `${(ripple.size + (index * 80)) * 0.4}px`, // Elliptical shape
                transform: 'translate(-50%, -50%) rotateX(60deg)', // 3D perspective
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                background: `radial-gradient(ellipse at center, 
                  transparent 45%, 
                  rgba(255, 255, 255, ${0.05 - index * 0.01}) 50%, 
                  rgba(200, 220, 240, ${0.03 - index * 0.005}) 60%, 
                  transparent 70%)`,
                filter: 'blur(1px)',
                animation: `wavePattern 3s ease-out ${index * 0.2}s forwards`,
                opacity: ripple.opacity - (index * 0.25),
              }}
            />
          ))}
          {/* Additional distortion waves */}
          <div
            className="absolute"
            style={{
              width: `${ripple.size * 1.5}px`,
              height: `${ripple.size * 0.6}px`,
              transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(45deg)',
              border: '0.5px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              animation: `wavePattern 3s ease-out 0.1s forwards`,
              opacity: ripple.opacity * 0.5,
            }}
          />
        </div>
      ))}
    </div>
  );
}