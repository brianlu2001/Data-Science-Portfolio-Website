import { usePortfolioMotion } from "@/hooks/usePortfolioMotion";
import { useEffect, useState } from 'react';


const ROLES = ['AI Engineer', 'Data Scientist', 'Machine Learning Engineer', 'Forward Deployed Engineer', 'Tech Consultant', 'AI Practitioner', 'Hip-hop Dancer', 'Homecook'];

export default function RoleTypewriter() {
  const { reducedMotion } = usePortfolioMotion();
  const [text, setText] = useState('');

  useEffect(() => {
    if (reducedMotion) return;
    let role = 0, length = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      length += deleting ? -1 : 1;
      setText(ROLES[role].slice(0, length));
      let delay = deleting ? 38 : 85;
      if (!deleting && length === ROLES[role].length) { deleting = true; delay = 1700; }
      else if (deleting && length === 0) { deleting = false; role = (role + 1) % ROLES.length; delay = 350; }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <div className="role-typewriter flex items-center justify-center text-center">
      <span className="sr-only">{ROLES.join(', ')}</span>
      <span aria-hidden="true" className="portfolio-serif text-lg sm:text-2xl md:text-3xl font-bold tracking-wide text-blue-100/90">
        {reducedMotion ? ROLES[0] : text}<span className={`typing-caret${reducedMotion ? " is-paused" : ""}`} />
      </span>
    </div>
  );
}
