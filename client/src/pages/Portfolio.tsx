import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Columns2, Columns3, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import ContactSection from "@/components/ContactSection";
import { Project, SiteSettings } from "@shared/schema";
import { useAnalytics } from "@/utils/analytics";

type GridColumns = 1 | 2 | 3;

const GRID_COLS_KEY = 'portfolio-grid-columns';

const GRID_CLASS: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
};

const DENSITY_ICONS = [
  { cols: 2 as GridColumns, Icon: Columns2, label: '2 columns' },
  { cols: 3 as GridColumns, Icon: Columns3, label: '3 columns' },
];

function SkeletonCard() {
  return (
    <div className="glass-effect border border-gray-600 rounded-xl overflow-hidden h-full flex flex-col animate-pulse">
      <div className="aspect-video bg-gray-700/40 flex-shrink-0" />
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex justify-between items-start gap-2">
          <div className="h-5 bg-gray-700/50 rounded w-2/3" />
          <div className="h-8 w-8 bg-gray-700/30 rounded" />
        </div>
        <div className="h-5 bg-gray-700/30 rounded w-1/3" />
        <div className="flex gap-2 mt-auto pt-3">
          <div className="h-6 w-16 bg-gray-700/30 rounded" />
          <div className="h-6 w-20 bg-gray-700/30 rounded" />
          <div className="h-6 w-14 bg-gray-700/30 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [, navigate] = useLocation();
  const [activeStatus, setActiveStatus] = useState<'finished' | 'ongoing'>('finished');
  const [flippedProject, setFlippedProject] = useState<number | null>(null);
  const [bioBoxTilt, setBioBoxTilt] = useState({ x: 0, y: 0 });
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [gridColumns, setGridColumnsState] = useState<GridColumns>(() => {
    try {
      const stored = localStorage.getItem(GRID_COLS_KEY);
      return stored === '3' ? 3 : 2;
    } catch { return 2; }
  });

  const { trackPageViewDebounced, trackProjectClick } = useAnalytics();
  const bioBoxRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const setGridColumns = (cols: GridColumns) => {
    setGridColumnsState(cols);
    try { localStorage.setItem(GRID_COLS_KEY, String(cols)); } catch {}
  };

  useEffect(() => {
    trackPageViewDebounced('/');
  }, [trackPageViewDebounced]);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsLandscapeMobile(isMobile && isLandscape);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // Un-flip card when clicking outside any card
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      if (!target.closest('[data-project-card]')) {
        setFlippedProject(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleBioMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bioBoxRef.current) return;
    const rect = bioBoxRef.current.getBoundingClientRect();
    const tiltX = -((e.clientY - rect.top - rect.height / 2) / rect.height) * 15;
    const tiltY = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 15;
    setBioBoxTilt({ x: tiltX, y: tiltY });
  };

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects-simple"],
  });

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings-simple"],
  });

  if (projectsLoading) {
    const skeletonCount = gridColumns * 2;
    return (
      <div className="min-h-screen neural-network-bg">
        <Header siteSettings={siteSettings} />
        <main className={`container mx-auto py-12 ${isLandscapeMobile ? 'px-0' : 'px-4 sm:px-6'}`}>
          <div className="mb-24 max-w-4xl mx-auto">
            <div className="blue-glow rounded-2xl p-4 sm:p-6 md:p-8 animate-pulse">
              <div className="h-5 bg-gray-700/40 rounded w-full mb-3" />
              <div className="h-5 bg-gray-700/40 rounded w-4/5 mx-auto" />
            </div>
          </div>
          <div className="mb-8 text-center">
            <div className="h-10 bg-gray-700/30 rounded w-52 mx-auto mb-4 animate-pulse" />
            <div className="w-24 h-1 bg-royal-500 mx-auto rounded-full mb-8" />
          </div>
          <div className={`grid ${GRID_CLASS[gridColumns]} gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto ${isLandscapeMobile ? 'px-2' : 'px-4 sm:px-0'}`}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const filteredProjects = projects.filter(p => (p.status || 'finished') === activeStatus);
  const showViewButton = activeStatus === 'finished';

  return (
    <div className="min-h-screen neural-network-bg">
      <Header siteSettings={siteSettings} />
      <main className={`container mx-auto py-12 ${isLandscapeMobile ? 'px-0' : 'px-4 sm:px-6'}`}>

        {/* Bio Section */}
        {siteSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-24 max-w-4xl mx-auto"
          >
            <motion.div
              ref={bioBoxRef}
              className={`blue-glow rounded-2xl p-4 sm:p-6 md:p-8 text-center cursor-pointer ${isLandscapeMobile ? 'mx-2' : 'mx-4 sm:mx-0'}`}
              onMouseMove={handleBioMouseMove}
              onMouseLeave={() => setBioBoxTilt({ x: 0, y: 0 })}
              animate={{ rotateX: bioBoxTilt.x, rotateY: bioBoxTilt.y }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <p className="text-gray-300 text-lg sm:text-xl leading-relaxed suika-fallback">
                {siteSettings.bio}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* My Projects Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-center"
        >
          <h2 className="suika-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            My Projects
          </h2>
          <div className="w-24 h-1 bg-royal-500 mx-auto rounded-full mb-8" />

          <div className="flex flex-col items-center gap-3">
            {/* Finished / Ongoing pill toggle */}
            <div className="project-status-toggle">
              <motion.div
                className="project-status-thumb"
                animate={{ x: activeStatus === 'finished' ? 0 : '100%' }}
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
              />
              <button
                onClick={() => { setActiveStatus('finished'); setFlippedProject(null); }}
                className={`project-status-label${activeStatus === 'finished' ? ' active' : ''}`}
              >
                Finished
              </button>
              <button
                onClick={() => { setActiveStatus('ongoing'); setFlippedProject(null); }}
                className={`project-status-label${activeStatus === 'ongoing' ? ' active' : ''}`}
              >
                Ongoing
              </button>
            </div>

            {/* Grid density picker — desktop only */}
            <div
              className="hidden md:flex items-center gap-0.5 rounded-full px-2 py-1.5"
              style={{
                background: 'rgba(15, 20, 38, 0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '4px 4px 10px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.015), inset 2px 2px 5px rgba(0,0,0,0.3)',
              }}
            >
              {DENSITY_ICONS.map(({ cols, Icon, label }) => (
                <button
                  key={cols}
                  type="button"
                  title={label}
                  onClick={() => { setGridColumns(cols); setFlippedProject(null); }}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    gridColumns === cols
                      ? 'text-royal-300 shadow-[0_0_8px_hsla(225,73%,70%,0.3)]'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                  style={gridColumns === cols ? { background: 'rgba(65,105,225,0.2)' } : {}}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Project Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStatus}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className={`grid ${GRID_CLASS[gridColumns]} gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto relative z-10 ${isLandscapeMobile ? 'px-2' : 'px-4 sm:px-0'}`}
          >
            {filteredProjects.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="suika-title text-2xl text-gray-500">Coming soon...</p>
              </div>
            ) : (
              filteredProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, rotateX: 30, y: 50 }}
                  whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{
                    delay: idx * 0.07,
                    duration: 0.7,
                    type: 'spring',
                    stiffness: 70,
                    damping: 18,
                  }}
                  style={{ transformPerspective: 900 }}
                  className="h-full"
                >
                  <ProjectCard
                    project={project}
                    isFlipped={flippedProject === project.id}
                    onToggleFlipped={() =>
                      setFlippedProject(flippedProject === project.id ? null : project.id)
                    }
                    onViewProject={() => {
                      trackProjectClick(project.id, 'view');
                      navigate(`/projects/${project.id}`);
                    }}
                    showViewButton={showViewButton}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ContactSection siteSettings={siteSettings} isLandscapeMobile={isLandscapeMobile} />

      <AnimatePresence>
        {scrollY > 400 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-royal-500/80 hover:bg-royal-500 text-white shadow-lg backdrop-blur-sm transition-colors duration-200"
            aria-label="Scroll to top"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
