import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type React from 'react';
import { colorExtractor, ColorExtractor } from '@/utils/colorExtractor';
import { audioManager, snakePosition } from '@/utils/audioManager';

interface GlowColors {
  primary: string;
  secondary: string;
  accent: string;
  vibrant: string;
}

interface MagicalGlowOptions {
  imageUrl?: string | null;
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

  // CSS variables are applied via glowStyles so React owns them fully —
  // using setProperty() here gets wiped on re-renders with a new style object.

  // Event handlers
  const handleMouseEnter = async () => {
    setIsHovered(true);
    
    if (enableSound && audioManager.isAudioEnabled()) {
      const card = elementRef.current?.closest('[data-project-card]');
      const grid = card?.closest('[data-project-grid]');
      if (card && grid) {
        const cards = Array.from(grid.querySelectorAll('[data-project-card]'));
        const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
        await audioManager.playHoverSound(snakePosition(cards.indexOf(card), columns, cards.length));
      }
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
      await audioManager.playGlowSound();
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

  // Get inline styles for intensity + all color CSS variables
  const getGlowStyles = (): React.CSSProperties => {
    const base: Record<string, string> = {
      '--glow-intensity': intensity.toString(),
    };
    if (colors) {
      base['--glow-color-1'] = colors.primary;
      base['--glow-color-2'] = colors.secondary;
      base['--glow-color-3'] = colors.accent;
      base['--glow-color-4'] = colors.vibrant;
      base['--project-glow-color'] = colors.vibrant;
    }
    return base as React.CSSProperties;
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
  useEffect(() => {
    const warmup = (event: Event) => {
      // The sound button handles its own gesture. Otherwise pointerdown could
      // enable audio before its click handler runs and immediately mute it again.
      if (event.target instanceof Element && event.target.closest('[data-audio-toggle]')) return;
      if (audioManager.getSnapshot() === 'pending') void audioManager.preload();
    };
    window.addEventListener('pointerdown', warmup, { passive: true });
    window.addEventListener('click', warmup);
    window.addEventListener('keydown', warmup);
    return () => {
      window.removeEventListener('pointerdown', warmup);
      window.removeEventListener('click', warmup);
      window.removeEventListener('keydown', warmup);
    };
  }, []);
  const state = useSyncExternalStore(audioManager.subscribe, audioManager.getSnapshot, () => 'pending');
  const isEnabled = state === 'ready';

  const toggle = () => {
    audioManager.setEnabled(!isEnabled);
    if (!isEnabled) void audioManager.playClickSound();
  };

  return { isEnabled, toggle };
}
