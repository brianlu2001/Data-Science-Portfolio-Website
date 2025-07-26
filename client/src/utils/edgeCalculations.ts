export function calculateSinkingEdge(intensity: number = 1): string {
  // Simple edge calculation for sinking effect
  return `${intensity * 2}px ${intensity * 2}px ${intensity * 4}px rgba(0, 0, 0, 0.3)`;
} 