import { useState, useRef, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Columns2, Columns3, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import ContactSection from "@/components/ContactSection";
import { Project, SiteSettings } from "@shared/schema";
import { useAnalytics } from "@/utils/analytics";
import ReactMarkdown from "react-markdown";

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
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [bioBoxTilt, setBioBoxTilt] = useState({ x: 0, y: 0 });
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [gridColumns, setGridColumnsState] = useState<GridColumns>(() => {
    try {
      const stored = localStorage.getItem(GRID_COLS_KEY);
      // Only accept 2 or 3 — 1-col is mobile-only via CSS
      return stored === '3' ? 3 : 2;
    } catch { return 2; }
  });
  // effectiveCols mirrors what CSS actually renders at the current viewport
  const [effectiveCols, setEffectiveCols] = useState<GridColumns>(1);

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

  // Keep effectiveCols in sync with CSS breakpoints + user preference
  useEffect(() => {
    const compute = () => {
      if (window.matchMedia('(min-width: 1280px)').matches) {
        setEffectiveCols(gridColumns);
      } else if (window.matchMedia('(min-width: 768px)').matches) {
        setEffectiveCols(Math.min(gridColumns, 2) as GridColumns);
      } else {
        setEffectiveCols(1);
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [gridColumns]);

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

  // Close expanded project when clicking outside all cards
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      if (!target.closest('[data-project-card]') && !target.closest('[data-expansion-panel]')) {
        setExpandedProject(null);
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
          {/* Bio skeleton */}
          <div className="mb-24 max-w-4xl mx-auto mx-4 sm:mx-0">
            <div className="blue-glow rounded-2xl p-4 sm:p-6 md:p-8 animate-pulse">
              <div className="h-5 bg-gray-700/40 rounded w-full mb-3" />
              <div className="h-5 bg-gray-700/40 rounded w-4/5 mx-auto" />
            </div>
          </div>
          {/* Section header skeleton */}
          <div className="mb-8 text-center">
            <div className="h-10 bg-gray-700/30 rounded w-52 mx-auto mb-4 animate-pulse" />
            <div className="w-24 h-1 bg-royal-500 mx-auto rounded-full mb-8" />
          </div>
          {/* Grid skeleton */}
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

  // Group into rows matching effectiveCols so the expansion panel lands after the correct row
  const rows: Project[][] = [];
  for (let i = 0; i < filteredProjects.length; i += effectiveCols) {
    rows.push(filteredProjects.slice(i, i + effectiveCols));
  }

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
          <div className="w-24 h-1 bg-royal-500 mx-auto rounded-full mb-8"></div>

          {/* Toggles — stacked vertically, status on top (prominent), density below (subtle) */}
          <div className="flex flex-col items-center gap-3">
            {/* Finished / Ongoing pill toggle */}
            <div className="project-status-toggle">
              <motion.div
                className="project-status-thumb"
                animate={{ x: activeStatus === 'finished' ? 0 : '100%' }}
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
              />
              <button
                onClick={() => { setActiveStatus('finished'); setExpandedProject(null); }}
                className={`project-status-label${activeStatus === 'finished' ? ' active' : ''}`}
              >
                Finished
              </button>
              <button
                onClick={() => { setActiveStatus('ongoing'); setExpandedProject(null); }}
                className={`project-status-label${activeStatus === 'ongoing' ? ' active' : ''}`}
              >
                Ongoing
              </button>
            </div>

            {/* Grid density picker — desktop only, visually secondary */}
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
                  onClick={() => { setGridColumns(cols); setExpandedProject(null); }}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    gridColumns === cols
                      ? 'text-royal-300 shadow-[0_0_8px_hsla(225,73%,70%,0.3)]'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                  style={gridColumns === cols ? {
                    background: 'rgba(65,105,225,0.2)',
                  } : {}}
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
              rows.map((row, rowIdx) => {
                const expandedInRow = row.find(p => p.id === expandedProject) ?? null;
                return (
                  <Fragment key={`row-${rowIdx}`}>
                    {row.map((project, colIdx) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (rowIdx * effectiveCols + colIdx) * 0.08 }}
                        className="h-full"
                      >
                        <ProjectCard
                          project={project}
                          isExpanded={expandedProject === project.id}
                          onToggleExpanded={() =>
                            setExpandedProject(expandedProject === project.id ? null : project.id)
                          }
                        />
                      </motion.div>
                    ))}

                    {/* Expansion panel — spans all columns, appears below the full row */}
                    <AnimatePresence>
                      {expandedInRow && (
                        <motion.div
                          key={`expanded-${expandedInRow.id}`}
                          data-expansion-panel
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ gridColumn: '1 / -1' }}
                          className="overflow-hidden"
                        >
                          <div className="glass-effect border-gray-600 rounded-2xl p-6 shadow-2xl mt-2">
                            <div className="prose prose-invert prose-sm max-w-none mb-4 prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1 prose-strong:text-white prose-em:text-gray-200">
                              <ReactMarkdown>{expandedInRow.simplifiedDescription}</ReactMarkdown>
                            </div>
                            {expandedInRow.technologies && expandedInRow.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-5">
                                {expandedInRow.technologies.map((tech, i) => (
                                  <span
                                    key={i}
                                    className="inline-block bg-green-900 text-green-200 text-xs font-semibold px-2 py-1 rounded suika-fallback"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                            <Button
                              onClick={() => {
                                trackProjectClick(expandedInRow.id, 'view');
                                navigate(`/projects/${expandedInRow.id}`);
                              }}
                              className="bg-royal-500 hover:bg-royal-600 text-white"
                            >
                              <ExternalLink size={16} className="mr-2" />
                              View Full Project
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })
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
