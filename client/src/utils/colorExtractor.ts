interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  vibrant: string;
}

interface ExtractedColor {
  r: number;
  g: number;
  b: number;
  count: number;
}

export class ColorExtractor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  private isBlackWhiteOrGray(r: number, g: number, b: number): boolean {
    const threshold = 30;
    const grayThreshold = 50;
    
    // Check if it's very dark (close to black)
    if (r < threshold && g < threshold && b < threshold) return true;
    
    // Check if it's very light (close to white)
    if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) return true;
    
    // Check if it's gray (RGB values are close to each other)
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return diff < grayThreshold;
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number, l: number;

    l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  private getColorVibrancy(r: number, g: number, b: number): number {
    const [, s, l] = this.rgbToHsl(r, g, b);
    return s * (1 - Math.abs(l - 50) / 50);
  }

  async extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Set canvas size
        const maxSize = 100; // Reduce size for performance
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        this.canvas.width = img.width * scale;
        this.canvas.height = img.height * scale;

        // Draw image
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

        try {
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          const colors = this.analyzeColors(imageData);
          resolve(colors);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  private analyzeColors(imageData: ImageData): ColorPalette {
    const data = imageData.data;
    const colorCounts: Map<string, ExtractedColor> = new Map();

    // Sample pixels (skip some for performance)
    for (let i = 0; i < data.length; i += 16) { // Skip 4 pixels each time
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels and black/white/gray
      if (a < 128 || this.isBlackWhiteOrGray(r, g, b)) continue;

      // Quantize colors to reduce noise
      const quantized = {
        r: Math.floor(r / 32) * 32,
        g: Math.floor(g / 32) * 32,
        b: Math.floor(b / 32) * 32
      };

      const key = `${quantized.r},${quantized.g},${quantized.b}`;
      
      if (colorCounts.has(key)) {
        colorCounts.get(key)!.count++;
      } else {
        colorCounts.set(key, { 
          r: quantized.r, 
          g: quantized.g, 
          b: quantized.b, 
          count: 1 
        });
      }
    }

    // Sort by count and vibrancy
    const sortedColors = Array.from(colorCounts.values())
      .sort((a, b) => {
        const vibrancyA = this.getColorVibrancy(a.r, a.g, a.b);
        const vibrancyB = this.getColorVibrancy(b.r, b.g, b.b);
        return (b.count * vibrancyB) - (a.count * vibrancyA);
      });

    // Extract different types of colors
    const primary = sortedColors[0] || { r: 65, g: 105, b: 225 };
    const secondary = sortedColors[1] || { r: 32, g: 178, b: 170 };
    const accent = sortedColors[2] || { r: 255, g: 140, b: 0 };
    
    // Find most vibrant color
    const vibrant = sortedColors.reduce((prev, curr) => {
      const prevVibrancy = this.getColorVibrancy(prev.r, prev.g, prev.b);
      const currVibrancy = this.getColorVibrancy(curr.r, curr.g, curr.b);
      return currVibrancy > prevVibrancy ? curr : prev;
    }, sortedColors[0] || { r: 255, g: 215, b: 0 });

    return {
      primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
      secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`,
      accent: `rgb(${accent.r}, ${accent.g}, ${accent.b})`,
      vibrant: `rgb(${vibrant.r}, ${vibrant.g}, ${vibrant.b})`
    };
  }

  // Fallback colors for each project based on our previous analysis
  static getFallbackColors(projectId: number): ColorPalette {
    const fallbacks: Record<number, ColorPalette> = {
      1: { primary: 'rgb(139, 92, 246)', secondary: 'rgb(167, 139, 250)', accent: 'rgb(124, 58, 237)', vibrant: 'rgb(139, 92, 246)' },
      2: { primary: 'rgb(0, 191, 255)', secondary: 'rgb(135, 206, 235)', accent: 'rgb(30, 144, 255)', vibrant: 'rgb(0, 191, 255)' },
      3: { primary: 'rgb(159, 182, 214)', secondary: 'rgb(191, 219, 254)', accent: 'rgb(96, 165, 250)', vibrant: 'rgb(159, 182, 214)' },
      4: { primary: 'rgb(32, 178, 170)', secondary: 'rgb(94, 234, 212)', accent: 'rgb(45, 212, 191)', vibrant: 'rgb(32, 178, 170)' },
      5: { primary: 'rgb(65, 105, 225)', secondary: 'rgb(147, 197, 253)', accent: 'rgb(59, 130, 246)', vibrant: 'rgb(65, 105, 225)' },
      6: { primary: 'rgb(255, 140, 0)', secondary: 'rgb(251, 191, 36)', accent: 'rgb(245, 158, 11)', vibrant: 'rgb(255, 140, 0)' },
      7: { primary: 'rgb(255, 69, 0)', secondary: 'rgb(252, 165, 165)', accent: 'rgb(239, 68, 68)', vibrant: 'rgb(255, 69, 0)' },
      8: { primary: 'rgb(29, 185, 84)', secondary: 'rgb(134, 239, 172)', accent: 'rgb(34, 197, 94)', vibrant: 'rgb(29, 185, 84)' },
      9: { primary: 'rgb(255, 215, 0)', secondary: 'rgb(253, 224, 71)', accent: 'rgb(234, 179, 8)', vibrant: 'rgb(255, 215, 0)' },
      10: { primary: 'rgb(65, 105, 225)', secondary: 'rgb(147, 197, 253)', accent: 'rgb(59, 130, 246)', vibrant: 'rgb(65, 105, 225)' }
    };

    return fallbacks[projectId] || fallbacks[1];
  }
}

export const colorExtractor = new ColorExtractor();