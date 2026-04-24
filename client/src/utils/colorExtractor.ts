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
  private cache = new Map<string, ColorPalette>();

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
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Fresh canvas per call — shared canvas causes race conditions when
        // multiple cards extract colors concurrently on initial render.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = Math.max(1, Math.floor(img.width * scale));
        canvas.height = Math.max(1, Math.floor(img.height * scale));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = this.analyzeColors(imageData);
          this.cache.set(imageUrl, colors);
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

  // Generate a deterministic fallback palette for any project ID using the
  // golden-angle hue distribution so each project gets a distinct colour.
  static getFallbackColors(projectId: number): ColorPalette {
    const hue = Math.round((projectId * 137.508) % 360);
    const h2 = (hue + 30) % 360;
    const h3 = (hue + 60) % 360;
    return {
      primary:   `hsl(${hue}, 70%, 55%)`,
      secondary: `hsl(${h2},  60%, 65%)`,
      accent:    `hsl(${h3},  80%, 50%)`,
      vibrant:   `hsl(${hue}, 85%, 58%)`,
    };
  }
}

export const colorExtractor = new ColorExtractor();