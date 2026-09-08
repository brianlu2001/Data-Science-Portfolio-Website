import { usePortfolioMotion } from "@/hooks/usePortfolioMotion";
import { Button } from "@/components/ui/button";
import { SiteSettings } from "@shared/schema";
import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { AudioToggle } from "@/components/AudioToggle";
import RoleTypewriter from "@/components/RoleTypewriter";

const SLIDE_OUT_MS = 380;
const TURN_MS = 940;
const SLIDE_HOME_MS = 320;
const FLIP_MS = SLIDE_OUT_MS + TURN_MS + SLIDE_HOME_MS;
const SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
// Keep the approved slide / left-edge turn / return path on one native
// transform timeline, so phone frames don't depend on JavaScript updates.
const FLIP_KEYFRAMES: Keyframe[] = [
  { transform: 'translate3d(0%, 0, 0) rotateY(0deg)', offset: 0, easing: SLIDE_EASING },
  ...[0, -32, -72, -93, -117, -151, -180, -177, -180].map((angle, index) => ({
    transform: `translate3d(50%, 0, 0) rotateY(${angle}deg)`,
    offset: (SLIDE_OUT_MS + TURN_MS * [0, 0.18, 0.38, 0.56, 0.68, 0.8, 0.89, 0.94, 1][index]) / FLIP_MS,
    easing: index === 8 ? SLIDE_EASING : 'linear',
  })),
  { transform: 'translate3d(100%, 0, 0) rotateY(-180deg)', offset: 1 },
];

export default function Header({ siteSettings }: { siteSettings?: SiteSettings }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const turning = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const flipAnimation = useRef<Animation | null>(null);
  // Normalize the two faces after each turn. Both directions then use the same
  // visible left edge as the hinge, instead of reversing an accumulated rotation.
  useLayoutEffect(() => {
    // Swap faces and release the filled final transform before the same paint.
    flipAnimation.current?.cancel();
    flipAnimation.current = null;
    turning.current = false;
  }, [isFlipped]);
  useLayoutEffect(() => () => {
    turning.current = false;
    flipAnimation.current?.cancel();
    flipAnimation.current = null;
  }, []);
  const { reducedMotion, toggleMotion } = usePortfolioMotion();

  const flip = () => {
    const card = cardRef.current;
    if (turning.current || !card) return;
    turning.current = true;
    if (reducedMotion || typeof card.animate !== 'function') {
      setIsFlipped(value => !value);
      return;
    }
    const animation = card.animate(FLIP_KEYFRAMES, {
      duration: FLIP_MS,
      fill: 'both',
    });
    flipAnimation.current = animation;
    animation.onfinish = () => {
      if (flipAnimation.current === animation) setIsFlipped(value => !value);
    };
  };

  return (
    <header className="portfolio-header relative z-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMotion}
            aria-label={reducedMotion ? 'Enable animations' : 'Pause animations'}
            title={reducedMotion ? 'Enable animations' : 'Pause animations'} aria-pressed={!reducedMotion}
            className="text-gray-400 hover:text-white"><Sparkles size={18} /></Button>
          <AudioToggle />
          <Button variant="outline" onClick={() => window.location.href = '/admin'}
            className="glass-effect border-gray-600 text-gray-300 hover:text-white">Admin</Button>
        </div>
        <div className="text-center mx-auto">
          <div className="title-table mx-auto w-fit max-w-full relative"
            style={{ perspective: '2600px', transformStyle: 'preserve-3d' }}>
            <div ref={cardRef}
              className="title-card relative cursor-pointer rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-blue-200 focus-visible:outline-offset-4"
              role="button" tabIndex={0} aria-label="Flip introduction card" aria-pressed={isFlipped}
              onClick={flip} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void flip(); } }}
            >
              <div className="title-face-front stained-glass-box rounded-2xl px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8 md:py-12"
                aria-hidden={isFlipped} style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <h1 className="volter-black-title text-3xl sm:text-5xl md:text-7xl lg:text-9xl mb-4 sm:mb-8 md:mb-12 text-[#242931] leading-tight">Kuan-I (Brian) Lu</h1>
                <h2 className="portfolio-serif text-xl sm:text-3xl md:text-4xl lg:text-6xl text-[#242931] leading-tight font-bold">AI/ML/DS Project Portfolio</h2>
              </div>
              <div className="title-face-back stained-glass-box rounded-2xl px-4 sm:px-8 md:px-12 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-5 flex flex-col items-center justify-between"
                aria-hidden={!isFlipped}
                style={{ position: 'absolute', inset: 0, transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <div className="flex-1" />
                <div className="flex shrink-0 items-center justify-center gap-4 sm:gap-8 md:gap-12 w-full">
                  {siteSettings?.logoUrls?.map((url, i) => (
                    <div key={url + i} className="relative h-9 sm:h-14 md:h-20 max-w-[40%]">
                      <img src={url} alt="" className="h-full w-auto max-w-full invisible" />
                      <div className="absolute inset-0" style={{ backgroundColor: '#242931', mask: `url("${url}") center / contain no-repeat`, WebkitMask: `url("${url}") center / contain no-repeat` }} />
                    </div>
                  ))}
                </div>
                <div className="flex-[2]" />
                <div className="title-card-prompt flex shrink-0 flex-col items-center pt-3 sm:pt-4">
                  <p className="portfolio-serif font-bold text-xs sm:text-xl md:text-2xl lg:text-3xl text-[#242931] text-center">Scroll Down to See My Data Science Journey</p>
                  <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 text-[#242931] mt-1 md:mt-2 shrink-0" />
                </div>
              </div>
            </div>
          </div>
          <RoleTypewriter />
        </div>
      </div>
    </header>
  );
}
