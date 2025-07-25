import { useState, useRef, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import ContactSection from "@/components/ContactSection";
import WaterRipples from "../components/WaterRipples";
import { Project, SiteSettings } from "@shared/schema";
import { useAnalytics } from "@/utils/analytics";

export default function Portfolio() {
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [bioBoxTilt, setBioBoxTilt] = useState({ x: 0, y: 0 });
  const { trackPageViewDebounced } = useAnalytics();

  const bioBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackPageViewDebounced('/');
  }, [trackPageViewDebounced]);


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

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
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

  return (
    <div className="min-h-screen neural-network-bg">
      <Header siteSettings={siteSettings} />
      <main className="container mx-auto px-4 sm:px-6 py-12">
        {/* Bio Section with Blue Glow */}
        {siteSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-24 max-w-4xl mx-auto"
          >
            <motion.div 
              ref={bioBoxRef}
              className="blue-glow rounded-2xl p-4 sm:p-6 md:p-8 text-center cursor-pointer mx-4 sm:mx-0"
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
          className="mb-12 text-center"
        >
          <h2 className="suika-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            My Projects
          </h2>
          <div className="w-24 h-1 bg-royal-500 mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto relative z-10 px-4 sm:px-0">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard 
                project={project} 
                isExpanded={expandedProject === project.id}
                onToggleExpanded={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                columnIndex={index % 2}
              />
            </motion.div>
          ))}
        </div>
      </main>
      <ContactSection siteSettings={siteSettings} />
    </div>
  );
}
