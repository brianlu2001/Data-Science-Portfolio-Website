import { usePortfolioMotion } from "@/hooks/usePortfolioMotion";
import { useEffect, useRef } from 'react';

// Contours form three continuous, tiled planes. Each has a different scroll
// velocity, giving the page depth without a particle field or a busy idle loop.
function contourTexture(mirrored = false) {
  const paths = Array.from({ length: 15 }, (_, i) => {
    const shift = i * 29;
    return `<path d="M -250 ${80 + shift} C 140 ${-210 + shift}, 330 ${620 + shift}, 740 ${400 + shift} S 1060 ${20 + shift}, 1550 ${340 + shift}"/>`;
  }).join('');
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1300 1300"><g fill="none" stroke="#8fa9d6" stroke-width="1" opacity=".3" ${mirrored ? 'transform="translate(1300 1300) rotate(180)"' : ''}>${paths}</g></svg>`)}")`;
}
const CONTOURS = contourTexture();
const REVERSE_CONTOURS = contourTexture(true);

export default function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = usePortfolioMotion();
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-depth]'));
    let frame = 0;
    let x = 0, y = 0, scroll = window.scrollY;
    let targetX = 0, targetY = 0;
    const draw = () => {
      frame = 0;
      x += (targetX - x) * 0.075;
      y += (targetY - y) * 0.075;
      scroll += (window.scrollY - scroll) * 0.12;
      for (const layer of layers) {
        const depth = Number(layer.dataset.depth);
        layer.style.backgroundPosition = `50% ${reducedMotion ? 0 : -scroll * depth}px`;
        layer.style.transform = reducedMotion ? 'none' : `translate3d(${x * depth * 80}px, ${y * depth * 55}px, 0)`;
      }
      if (!reducedMotion && !document.hidden && (Math.abs(scroll - window.scrollY) > 0.15 || Math.abs(x - targetX) > 0.001 || Math.abs(y - targetY) > 0.001)) frame = requestAnimationFrame(draw);
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      targetX = event.clientX / window.innerWidth - 0.5;
      targetY = event.clientY / window.innerHeight - 0.5;
      schedule();
    };
    const visibility = () => { cancelAnimationFrame(frame); frame = 0; if (!document.hidden) schedule(); };
    draw();
    if (!reducedMotion) {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('pointermove', move, { passive: true });
      document.addEventListener('visibilitychange', visibility);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [reducedMotion]);
  return (
    <div ref={ref} className="ambient-background" aria-hidden="true">
      <div className="parallax-layer parallax-wash" data-depth="0.08" />
      <div className="parallax-layer parallax-contours parallax-contours-far" data-depth="0.2" style={{ backgroundImage: CONTOURS }} />
      <div className="parallax-layer parallax-contours parallax-contours-near" data-depth="0.42" style={{ backgroundImage: REVERSE_CONTOURS }} />
      <div className="parallax-vignette" />
    </div>
  );
}
