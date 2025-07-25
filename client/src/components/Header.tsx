import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SiteSettings } from "@shared/schema";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { AudioToggle } from "@/components/AudioToggle";


interface HeaderProps {
  siteSettings?: SiteSettings;
}

export default function Header({ siteSettings }: HeaderProps) {
  const { isAuthenticated } = useAuth();
  const [titleBoxTilt, setTitleBoxTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const titleBoxRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const currentReflectionRef = useRef({
    x: 30, y: 30, 
    secondaryX: 70, secondaryY: 70, 
    angle: 135
  });
  const targetReflectionRef = useRef({
    x: 30, y: 30, 
    secondaryX: 70, secondaryY: 70, 
    angle: 135
  });

  const animateReflections = () => {
    const current = currentReflectionRef.current;
    const target = targetReflectionRef.current;
    
    // Improved speed based on hover state for better responsiveness
    const speed = isHovered ? 0.15 : 0.1; // Faster when hovering, slower when leaving
    
    // Smoothly interpolate to target values
    current.x += (target.x - current.x) * speed;
    current.y += (target.y - current.y) * speed;
    current.secondaryX += (target.secondaryX - current.secondaryX) * speed;
    current.secondaryY += (target.secondaryY - current.secondaryY) * speed;
    current.angle += (target.angle - current.angle) * speed;
    
    // Apply to DOM - update both faces of the flip container
    if (titleBoxRef.current) {
      const frontFace = titleBoxRef.current.querySelector('.title-face-front');
      const backFace = titleBoxRef.current.querySelector('.title-face-back');
      
      if (frontFace) {
        frontFace.style.setProperty('--reflection-x', `${current.x}%`);
        frontFace.style.setProperty('--reflection-y', `${current.y}%`);
        frontFace.style.setProperty('--secondary-reflection-x', `${current.secondaryX}%`);
        frontFace.style.setProperty('--secondary-reflection-y', `${current.secondaryY}%`);
        frontFace.style.setProperty('--highlight-angle', `${current.angle}deg`);
      }
      
      if (backFace) {
        backFace.style.setProperty('--reflection-x', `${current.x}%`);
        backFace.style.setProperty('--reflection-y', `${current.y}%`);
        backFace.style.setProperty('--secondary-reflection-x', `${current.secondaryX}%`);
        backFace.style.setProperty('--secondary-reflection-y', `${current.secondaryY}%`);
        backFace.style.setProperty('--highlight-angle', `${current.angle}deg`);
      }
    }
    
    // Continue animation if values haven't converged
    const threshold = 0.05; // Reduced threshold for smoother completion
    if (Math.abs(target.x - current.x) > threshold ||
        Math.abs(target.y - current.y) > threshold ||
        Math.abs(target.secondaryX - current.secondaryX) > threshold ||
        Math.abs(target.secondaryY - current.secondaryY) > threshold ||
        Math.abs(target.angle - current.angle) > threshold) {
      animationFrameRef.current = requestAnimationFrame(animateReflections);
    } else {
      // Clear animation frame when completed
      animationFrameRef.current = undefined;
    }
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleTitleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!titleBoxRef.current) return;
    
    // Set hovered state if not already set
    if (!isHovered) {
      setIsHovered(true);
    }
    
    const rect = titleBoxRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate tilt - box tilts away from mouse position (reduced intensity)
    const tiltX = -(mouseY / rect.height) * 12; // Reduced from 20 to 12
    const tiltY = (mouseX / rect.width) * 12;   // Reduced from 20 to 12
    
    setTitleBoxTilt({ x: tiltX, y: tiltY });
    

    
    // Calculate reflection positions based on tilt with gradual transition
    // When box tilts, reflections shift opposite to the tilt direction
    const reflectionX = 50 - (tiltY * 5.5); // Increased responsiveness to compensate for reduced tilt
    const reflectionY = 50 - (tiltX * 5.5); // Increased responsiveness to compensate for reduced tilt
    const secondaryReflectionX = 50 + (tiltY * 4.5); // Secondary reflection shifts with tilt
    const secondaryReflectionY = 50 + (tiltX * 4.5);
    const highlightAngle = 135 + (tiltY * 10); // Increased angle change for better visual feedback
    
    // Set target reflection values for smooth animation
    targetReflectionRef.current = {
      x: Math.max(10, Math.min(90, reflectionX)),
      y: Math.max(10, Math.min(90, reflectionY)),
      secondaryX: Math.max(10, Math.min(90, secondaryReflectionX)),
      secondaryY: Math.max(10, Math.min(90, secondaryReflectionY)),
      angle: highlightAngle
    };
    
    // Start animation if not already running
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateReflections);
    }
  };

  const handleTitleMouseLeave = () => {
    setTitleBoxTilt({ x: 0, y: 0 });
    setIsHovered(false);
    
    // Reset reflections to default positions with smooth animation
    targetReflectionRef.current = {
      x: 30, y: 30, 
      secondaryX: 70, secondaryY: 70, 
      angle: 135
    };
    
    // Start animation if not already running
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateReflections);
    }
  };

  const handleTitleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <header className="relative z-10 pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Administrative Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <AudioToggle />
          {isAuthenticated ? (
            <Button
              variant="outline"
              onClick={() => window.location.href = "/admin"}
              className="glass-effect border-gray-600 text-gray-300 hover:text-white"
            >
              Admin
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/login"}
              className="glass-effect border-gray-600 text-gray-300 hover:text-white"
            >
              Admin
            </Button>
          )}
        </div>
        
        {/* Main Title */}
        <div className="text-center mx-auto min-h-[60vh] flex flex-col justify-center">
          <motion.div 
            ref={titleBoxRef}
            className="mx-auto w-fit cursor-pointer relative"
            onMouseMove={handleTitleMouseMove}
            onMouseLeave={handleTitleMouseLeave}
            onClick={handleTitleClick}
            animate={{
              rotateX: titleBoxTilt.x,
              rotateY: titleBoxTilt.y,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            <div 
              className="title-flip-container"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Front Face */}
              <div 
                className="title-face-front stained-glass-box rounded-2xl px-6 sm:px-8 md:px-12 lg:px-16 py-8 md:py-12"
                style={{
                  backfaceVisibility: 'hidden',
                  '--reflection-x': '30%',
                  '--reflection-y': '30%',
                  '--secondary-reflection-x': '70%',
                  '--secondary-reflection-y': '70%',
                  '--highlight-angle': '135deg'
                }}
              >
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="volter-black-title text-4xl sm:text-5xl md:text-7xl lg:text-9xl mb-8 md:mb-12 text-[#242931] leading-tight"
                >
                  Kuan-I (Brian) Lu
                </motion.h1>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="suika-title text-2xl sm:text-3xl md:text-4xl lg:text-6xl text-[#242931] leading-tight font-bold"
                >
                  Data Science Project Portfolio
                </motion.h2>
              </div>

              {/* Back Face */}
              <div 
                className="title-face-back absolute inset-0 stained-glass-box rounded-2xl px-6 sm:px-8 md:px-12 lg:px-16 py-8 md:py-12 flex flex-col justify-center sm:justify-end items-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  '--reflection-x': '30%',
                  '--reflection-y': '30%',
                  '--secondary-reflection-x': '70%',
                  '--secondary-reflection-y': '70%',
                  '--highlight-angle': '135deg'
                }}
              >
                <div className="flex flex-col items-center mt-auto sm:mt-0">
                  <motion.p 
                    className="suika-title text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#242931] font-light mb-4 text-center leading-relaxed"
                    animate={{ 
                      textShadow: isHovered 
                        ? "0 0 15px rgba(36, 41, 49, 0.4)" 
                        : "0 0 8px rgba(36, 41, 49, 0.2)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="block sm:inline">Scroll Down to See</span>{" "}
                    <span className="block sm:inline">My Data Science Journey</span>
                  </motion.p>
                  <motion.div
                    className="flex justify-center"
                    animate={{ 
                      y: [0, -8, 0],
                      filter: isHovered 
                        ? "drop-shadow(0 0 8px rgba(36, 41, 49, 0.6))" 
                        : "drop-shadow(0 0 4px rgba(36, 41, 49, 0.4))"
                    }}
                    transition={{ 
                      y: { 
                        repeat: Infinity, 
                        duration: 2,
                        ease: "easeInOut"
                      },
                      filter: { duration: 0.3 }
                    }}
                  >
                    <ChevronDown className="w-12 h-12 text-[#242931]" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
