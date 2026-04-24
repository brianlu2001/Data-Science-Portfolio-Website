import { useState, useRef, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import ContactSection from "@/components/ContactSection";
import WaterRipples from "../components/WaterRipples";
import { Project, SiteSettings } from "@shared/schema";
import { useAnalytics } from "@/utils/analytics";

export default function Portfolio() {
  const [activeStatus, setActiveStatus] = useState<'finished' | 'ongoing'>('finished');
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [bioBoxTilt, setBioBoxTilt] = useState({ x: 0, y: 0 });
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const { trackPageViewDebounced } = useAnalytics();

  const bioBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackPageViewDebounced('/');
  }, [trackPageViewDebounced]);

  // Detect mobile landscape orientation
  useEffect(() => {
    const checkLandscapeMobile = () => {
      const isMobile = window.innerWidth < 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsLandscapeMobile(isMobile && isLandscape);
    };
    
    checkLandscapeMobile();
    window.addEventListener('resize', checkLandscapeMobile);
    window.addEventListener('orientationchange', checkLandscapeMobile);
    
    return () => {
      window.removeEventListener('resize', checkLandscapeMobile);
      window.removeEventListener('orientationchange', checkLandscapeMobile);
    };
  }, []);

  // Close expanded project when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      
      // Check if the click is outside all project cards
      const isInsideProjectCard = target.closest('[data-project-card]');
      
      if (!isInsideProjectCard && expandedProject !== null) {
        setExpandedProject(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [expandedProject]);


  const handleBioMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bioBoxRef.current) return;
    
    const rect = bioBoxRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate tilt - box tilts away from mouse position
    const tiltX = -(mouseY / rect.height) * 15; // Gentler tilt for bio box
    const tiltY = (mouseX / rect.width) * 15;
    
    setBioBoxTilt({ x: tiltX, y: tiltY });
    

  };

  const handleBioMouseLeave = () => {
    setBioBoxTilt({ x: 0, y: 0 });
  };

  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ["/api/projects-simple"],
  });

  const { data: siteSettings, error: settingsError } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings-simple"],
  });

  // Debug logging
  useEffect(() => {
    console.log('Portfolio page - Projects data:', { 
      projects: projects?.length || 0, 
      isLoading: projectsLoading, 
      error: projectsError 
    });
    console.log('Portfolio page - Site settings:', { 
      settings: !!siteSettings, 
      error: settingsError 
    });
  }, [projects, projectsLoading, projectsError, siteSettings, settingsError]);

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

  return (
    <div className="min-h-screen neural-network-bg">
      <Header siteSettings={siteSettings} />
      <main className={`container mx-auto py-12 ${isLandscapeMobile ? 'px-0' : 'px-4 sm:px-6'}`}>
        {/* Bio Section with Blue Glow */}
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
              onMouseLeave={handleBioMouseLeave}
              animate={{
                rotateX: bioBoxTilt.x,
                rotateY: bioBoxTilt.y,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              <p className="text-gray-300 text-lg sm:text-xl leading-relaxed suika-fallback">
                {siteSettings.bio}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* My Projects Section Header */}
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

          {/* Status toggle */}
          <div className="flex justify-center">
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
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStatus}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto relative z-10 ${isLandscapeMobile ? 'px-2' : 'px-4 sm:px-0'}`}
          >
            {projects.filter(p => (p.status || 'finished') === activeStatus).length === 0 ? (
              <div className="col-span-2 text-center py-20">
                <p className="suika-title text-2xl text-gray-500">Coming soon...</p>
              </div>
            ) : (
              projects
                .filter(p => (p.status || 'finished') === activeStatus)
                .map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <ProjectCard
                      project={project}
                      isExpanded={expandedProject === project.id}
                      onToggleExpanded={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                      columnIndex={index % 2}
                    />
                  </motion.div>
                ))
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <ContactSection siteSettings={siteSettings} isLandscapeMobile={isLandscapeMobile} />
    </div>
  );
}
