import { useState, useRef, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Columns2, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import ContactSection from "@/components/ContactSection";
import WaterRipples from "../components/WaterRipples";
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

export default function Portfolio() {
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
    return (
      <div className="min-h-screen neural-network-bg flex items-center justify-center">
        <div className="glass-effect rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-500 mx-auto"></div>
          <p className="text-gray-300 mt-4 text-center">Loading portfolio...</p>
        </div>
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
                            <div
                              className="text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: expandedInRow.simplifiedDescription
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                              }}
                            />
                            <Button
                              onClick={() => {
                                trackProjectClick(expandedInRow.id, 'view');
                                window.location.href = `/projects/${expandedInRow.id}`;
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
    </div>
  );
}
