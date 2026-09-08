import { usePortfolioMotion } from '@/hooks/usePortfolioMotion';
import { useEffect, useRef } from 'react';

type Texture = { canvas: HTMLCanvasElement; width: number; height: number; depth: number };

// Cache the artwork once per viewport width. Each frame copies only the visible
// parts of these tiles, avoiding large SVG/gradient repaints and translucent layers.
function createTextures(viewportWidth: number, ratio: number): Texture[] {
  const planeWidth = viewportWidth + 140;
  return [
    { width: planeWidth, height: 1400, depth: 0.08 },
    { width: Math.max(planeWidth * 1.2, 950), height: 1300, depth: 0.2 },
    { width: Math.max(planeWidth * 1.55, 1200), height: 1800, depth: 0.42 },
  ].map((layer, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(layer.width * ratio);
    canvas.height = Math.ceil(layer.height * ratio);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(ratio, ratio);
    const { width, height } = layer;

    if (index === 0) {
      const extent = (width + height) / 4;
      const diagonal = ctx.createLinearGradient(width / 2 - extent, height / 2 - extent, width / 2 + extent, height / 2 + extent);
      diagonal.addColorStop(0.35, 'rgba(93,124,181,0)');
      diagonal.addColorStop(0.49, 'rgba(93,124,181,.045)');
      diagonal.addColorStop(0.63, 'rgba(93,124,181,0)');
      ctx.fillStyle = diagonal;
      ctx.fillRect(0, 0, width, height);
      for (const glow of [
        { x: 0.85, y: 0.77, color: '89,114,167', alpha: 0.17, end: 0.47 },
        { x: 0.12, y: 0.26, color: '67,105,164', alpha: 0.24, end: 0.49 },
      ]) {
        ctx.save();
        ctx.translate(width * glow.x, height * glow.y);
        ctx.scale(width * Math.max(glow.x, 1 - glow.x) * Math.SQRT2, height * Math.max(glow.y, 1 - glow.y) * Math.SQRT2);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        gradient.addColorStop(0, `rgba(${glow.color},${glow.alpha})`);
        gradient.addColorStop(glow.end, `rgba(${glow.color},0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      }
    } else {
      // Match the original SVG's centered viewBox and mirrored second tile.
      const scale = Math.min(width, height) / 1300;
      ctx.translate((width - 1300 * scale) / 2, (height - 1300 * scale) / 2);
      ctx.scale(scale, scale);
      if (index === 2) { ctx.translate(1300, 1300); ctx.rotate(Math.PI); }
      ctx.strokeStyle = `rgba(143,169,214,${0.3 * (index === 1 ? 0.31 : 0.19)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 15; i++) {
        const shift = i * 29;
        ctx.moveTo(-250, 80 + shift);
        ctx.bezierCurveTo(140, -210 + shift, 330, 620 + shift, 740, 400 + shift);
        ctx.bezierCurveTo(1150, 180 + shift, 1060, 20 + shift, 1550, 340 + shift);
      }
      ctx.stroke();
    }
    return { ...layer, canvas };
  });
}

export default function AmbientBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = usePortfolioMotion();

  useEffect(() => {
    const canvas = ref.current;
    const root = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !root || !ctx) return;
    let textures: Texture[] = [];
    let width = 0, height = 0, ratio = 1;
    let needsResize = true, frame = 0;
    let x = 0, y = 0, scroll = window.scrollY;
    let targetX = 0, targetY = 0, targetScroll = scroll;

    const draw = () => {
      frame = 0;
      if (needsResize) {
        const nextWidth = root.clientWidth;
        // Bound high-DPI memory and drawing cost for this decorative artwork.
        const nextRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        if (nextWidth !== width || nextRatio !== ratio) textures = createTextures(nextWidth, nextRatio);
        width = nextWidth;
        height = root.clientHeight;
        ratio = nextRatio;
        canvas.width = Math.ceil(width * ratio);
        canvas.height = Math.ceil(height * ratio);
        needsResize = false;
      }
      x += (targetX - x) * 0.075;
      y += (targetY - y) * 0.075;
      scroll += (targetScroll - scroll) * 0.12;
      ctx.fillStyle = '#242931';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const tile of textures) {
        const left = (width - tile.width) / 2 + (reducedMotion ? 0 : x * tile.depth * 80);
        const offset = reducedMotion ? 0 : ((scroll * tile.depth) % tile.height + tile.height) % tile.height;
        let top = -70 - offset + (reducedMotion ? 0 : y * tile.depth * 55);
        top = ((top % tile.height) + tile.height) % tile.height - tile.height;
        for (; top < height; top += tile.height) {
          const visibleLeft = Math.max(0, left), visibleTop = Math.max(0, top);
          const visibleWidth = Math.min(width, left + tile.width) - visibleLeft;
          const visibleHeight = Math.min(height, top + tile.height) - visibleTop;
          if (visibleWidth <= 0 || visibleHeight <= 0) continue;
          ctx.drawImage(tile.canvas,
            (visibleLeft - left) * ratio, (visibleTop - top) * ratio, visibleWidth * ratio, visibleHeight * ratio,
            visibleLeft * ratio, visibleTop * ratio, visibleWidth * ratio, visibleHeight * ratio);
        }
      }
      if (!reducedMotion && !document.hidden && (Math.abs(scroll - targetScroll) > 0.15 || Math.abs(x - targetX) > 0.001 || Math.abs(y - targetY) > 0.001)) frame = requestAnimationFrame(draw);
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); };
    const onScroll = () => { targetScroll = window.scrollY; schedule(); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      targetX = event.clientX / window.innerWidth - 0.5;
      targetY = event.clientY / window.innerHeight - 0.5;
      schedule();
    };
    const visibility = () => { cancelAnimationFrame(frame); frame = 0; if (!document.hidden) schedule(); };
    const resize = new ResizeObserver(() => { needsResize = true; schedule(); });
    resize.observe(root);
    document.addEventListener('visibilitychange', visibility);
    draw();
    if (!reducedMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pointermove', move, { passive: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [reducedMotion]);

  return (
    <div className="ambient-background" aria-hidden="true">
      <canvas ref={ref} className="ambient-canvas" />
      <div className="parallax-vignette" />
    </div>
  );
}
