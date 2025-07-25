
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Project } from "@shared/schema";
import { useRef } from "react";
import { calculateSinkingEdge } from "@/utils/edgeCalculations";
import { useMagicalGlow } from "@/hooks/useMagicalGlow";
import { useAnalytics } from "@/utils/analytics";

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  columnIndex: number;
}

export default function ProjectCard({ project, isExpanded, onToggleExpanded, columnIndex }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { trackProjectClick } = useAnalytics();
  
  // Magic glow effects (hover sound enabled, click sound disabled)
  const magicalGlow = useMagicalGlow({
    imageUrl: project.imageUrl,
    projectId: project.id,
    enableSound: true,
    enableShimmer: true,
    intensity: 1.2
  });

  const handleViewProject = () => {
    trackProjectClick(project.id, 'view');
    window.location.href = `/projects/${project.id}`;
  };

  const handleMouseEnter = () => {
    magicalGlow.handlers.onMouseEnter();
  };

  const handleMouseLeave = () => {
    magicalGlow.handlers.onMouseLeave();
  };

  const handleCardClick = () => {
    // No sound effect on click, just toggle expansion
    onToggleExpanded();
  };

  return (
    <div className="relative">
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={magicalGlow.elementRef}
          className={magicalGlow.glowClasses}
          style={magicalGlow.glowStyles}
        >
          <Card className="glass-effect border-gray-600 overflow-hidden group hover:shadow-2xl hover:shadow-royal-500/20 transition-all duration-300 h-full flex flex-col">
        <div className="aspect-video overflow-hidden">
          <img
            src={project.imageUrl || 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=600'}
            alt={project.title}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
            onClick={handleCardClick}
          />
        </div>
        
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4 h-40">
            <div className="flex-1 flex flex-col h-full">
              <div className="h-20 flex items-start mb-3">
                <h3 className="suika-fallback text-xl md:text-2xl font-bold text-white leading-tight">
                  {project.title}
                </h3>
              </div>
              
              {/* Category indicator */}
              <div className="mb-2">
                {project.category && (
                  <span className="inline-block bg-blue-900 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                    {project.category}
                  </span>
                )}
              </div>
              
              {/* Tech stack indicators */}
              <div className="flex flex-wrap gap-2 flex-1 items-start">
                {project.technologies && project.technologies.length > 0 && (
                  <>
                    {project.technologies.slice(0, 4).map((tech, index) => (
                      <span
                        key={index}
                        className="inline-block bg-green-900 text-green-200 text-xs font-semibold px-2 py-1 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="inline-block bg-green-900 text-green-200 text-xs font-semibold px-2 py-1 rounded">
                        +{project.technologies.length - 4} more
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="text-gray-400 hover:text-white ml-2 flex-shrink-0"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
          </div>
        </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-width expanded description spanning both columns */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full z-[9999] mt-2"
            style={{ 
              left: columnIndex === 0 ? 0 : 'calc(-100% - 2rem)',
              width: 'calc(200% + 2rem)'
            }}
          >
            <div className="glass-effect border-gray-600 rounded-2xl p-6 shadow-2xl">
              <div 
                className="text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: project.simplifiedDescription
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                }}
              />
              
              <Button
                onClick={handleViewProject}
                className="bg-royal-500 hover:bg-royal-600 text-white"
              >
                <ExternalLink size={16} className="mr-2" />
                View Full Project
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
