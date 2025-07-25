import { useRef, useEffect } from 'react';
import WaterWave from 'react-water-wave';

interface WaterEffectProps {
  children: React.ReactNode;
  onWaterReady?: (drop: (x: number, y: number, radius: number, strength: number) => void) => void;
}

export default function WaterEffect({ children, onWaterReady }: WaterEffectProps) {
  const waterRef = useRef<any>(null);
  
  useEffect(() => {
    // Wait for the water effect to be ready
    const timer = setTimeout(() => {
      if (onWaterReady) {
        // Pass the drop function to parent components
        onWaterReady((x: number, y: number, radius: number = 20, strength: number = 0.04) => {
          if (waterRef.current && waterRef.current.drop) {
            waterRef.current.drop(x, y, radius, strength);
          }
        });
      }
    }, 500); // Give time for the water effect to initialize
    
    return () => clearTimeout(timer);
  }, [onWaterReady]);
  
  return (
    <WaterWave
      imageUrl="" // Empty string to use default background
      dropRadius={20}
      perturbance={0.02}
      interactive={false}
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1,
        background: '#242931',
      }}
    >
      {(methods) => {
        waterRef.current = methods;
        return (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%',
            background: '#242931'
          }}>
            {children}
          </div>
        );
      }}
    </WaterWave>
  );
}