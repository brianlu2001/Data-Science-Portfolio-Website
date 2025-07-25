import { useEffect, useRef, useState } from 'react';
import { colorExtractor, ColorExtractor } from '@/utils/colorExtractor';
import { audioManager } from '@/utils/audioManager';

interface GlowColors {
  primary: string;
  secondary: string;
  accent: string;
  vibrant: string;
}

interface MagicalGlowOptions {
  imageUrl?: string;
  projectId?: number;
  enableSound?: boolean;
  enableShimmer?: boolean;
  intensity?: number;
}

export function useMagicalGlow(options: MagicalGlowOptions = {}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<GlowColors | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    imageUrl,
    projectId,
    enableSound = true,
    enableShimmer = true,
    intensity = 1
  } = options;

  // Extract colors from image
  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
      colorExtractor.extractColorsFromImage(imageUrl)
        .then(setColors)
        .catch(() => {
          // Use fallback colors if extraction fails
          if (projectId) {
            setColors(ColorExtractor.getFallbackColors(projectId));
          }
        })
        .finally(() => setIsLoading(false));
    } else if (projectId) {
      // Use fallback colors directly
      setColors(ColorExtractor.getFallbackColors(projectId));
    }
  }, [imageUrl, projectId]);

  // Apply glow colors to CSS variables
  useEffect(() => {
    if (colors && elementRef.current) {
      const element = elementRef.current;
      element.style.setProperty('--glow-color-1', colors.primary);
      element.style.setProperty('--glow-color-2', colors.secondary);
      element.style.setProperty('--glow-color-3', colors.accent);
      element.style.setProperty('--glow-color-4', colors.vibrant);
      element.style.setProperty('--project-glow-color', colors.vibrant);
    }
  }, [colors]);

  // Event handlers
  const handleMouseEnter = async () => {
    setIsHovered(true);
    
    if (enableSound && audioManager.isAudioEnabled()) {
      // Play hover sound with frequency based on project ID
      const frequency = projectId ? 400 + (projectId * 100) : 800;
      await audioManager.playHoverSound(frequency);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = async () => {
    if (enableSound && audioManager.isAudioEnabled()) {
      await audioManager.playClickSound();
    }
  };

  const handleGlowActivate = async () => {
    if (enableSound && audioManager.isAudioEnabled()) {
      const baseFrequency = projectId ? 220 + (projectId * 50) : 440;
      await audioManager.playGlowSound(baseFrequency);
    }
  };

  // Get class names for the element
  const getGlowClasses = () => {
    const classes = ['magical-glow-border'];
    
    if (isHovered) {
      classes.push('magical-glow-pulse');
    }
    
    if (enableShimmer) {
      classes.push('magical-shimmer');
    }
    
    if (projectId) {
      classes.push('project-card-glow');
    }
    
    return classes.join(' ');
  };

  // Get inline styles for intensity
  const getGlowStyles = () => {
    if (!colors) return {};
    
    return {
      '--glow-intensity': intensity.toString(),
      // Removed brightness filter to prevent image lighting up
    };
  };

  return {
    elementRef,
    colors,
    isLoading,
    isHovered,
    glowClasses: getGlowClasses(),
    glowStyles: getGlowStyles(),
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
      onGlowActivate: handleGlowActivate,
    },
  };
}

// Hook for managing audio settings
export function useAudioSettings() {
  const [isEnabled, setIsEnabled] = useState(() => 
    audioManager.isAudioEnabled()
  );

  const toggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    audioManager.setEnabled(newState);
  };

  return { isEnabled, toggle };
}