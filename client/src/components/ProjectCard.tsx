
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Project } from "@shared/schema";
import { useRef } from "react";
import { useMagicalGlow } from "@/hooks/useMagicalGlow";
import ReactMarkdown from "react-markdown";

interface ProjectCardProps {
  project: Project;
  isFlipped: boolean;
  onToggleFlipped: () => void;
  onViewProject: () => void;
  showViewButton: boolean;
}

export default function ProjectCard({
  project,
  isFlipped,
  onToggleFlipped,
  onViewProject,
  showViewButton,
}: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const magicalGlow = useMagicalGlow({
    imageUrl: project.imageUrl,
    projectId: project.id,
    enableSound: true,
    enableShimmer: true,
    intensity: 1.2,
  });

  const handleImageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleFlipped();
    }
  };

  return (
    <div ref={cardRef} data-project-card className="h-full">
      <div
        className="h-full"
        onMouseEnter={magicalGlow.handlers.onMouseEnter}
        onMouseLeave={magicalGlow.handlers.onMouseLeave}
      >
        <div
          ref={magicalGlow.elementRef}
          className={`${magicalGlow.glowClasses} h-full`}
          style={magicalGlow.glowStyles}
        >
          {/* Perspective wrapper — owns the 3D context for the flip */}
          <div style={{ perspective: '1200px', height: '100%' }}>
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.55, type: 'spring', stiffness: 70, damping: 18 }}
              style={{ transformStyle: 'preserve-3d', height: '100%', position: 'relative' }}
            >

              {/* ── FRONT FACE ── */}
              <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', height: '100%' }}>
                <Card className="glass-effect border-gray-600 overflow-hidden group hover:shadow-2xl hover:shadow-royal-500/20 transition-all duration-300 h-full flex flex-col">
                  <div className="aspect-video overflow-hidden flex-shrink-0 relative">
                    <img
                      src={project.imageUrl || '/placeholder-project.svg'}
                      alt={project.title}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={onToggleFlipped}
                      tabIndex={0}
                      role="button"
                      aria-label="Flip card to see project details"
                      onKeyDown={handleImageKeyDown}
                    />
                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center pointer-events-none"
                      aria-hidden
                    >
                      <ChevronDown
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
                        size={36}
                      />
                    </div>
                    {/* Gradient fade — subtle bleed into card body */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h3 className="suika-fallback text-lg xl:text-xl font-bold text-white leading-tight">
                        {project.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleFlipped}
                        className="text-gray-400 hover:text-white flex-shrink-0 mt-0.5"
                      >
                        <ChevronDown size={20} />
                      </Button>
                    </div>

                    {project.category && (
                      <div className="mb-2">
                        <span className="inline-block bg-blue-900 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full suika-fallback">
                          {project.category}
                        </span>
                      </div>
                    )}

                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-auto pt-3">
                        {project.technologies.slice(0, 4).map((tech, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-900 text-green-200 text-xs font-semibold px-2 py-1 rounded suika-fallback"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 4 && (
                          <span className="inline-block bg-green-900 text-green-200 text-xs font-semibold px-2 py-1 rounded suika-fallback">
                            +{project.technologies.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── BACK FACE ── */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: 'absolute',
                  inset: 0,
                }}
              >
                <Card
                  className="glass-effect border-gray-600 h-full flex flex-col overflow-hidden cursor-pointer"
                  style={{ borderTop: '2px solid var(--glow-color-4, rgba(99,130,225,0.7))' }}
                  onClick={onToggleFlipped}
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <h3 className="suika-fallback text-base font-bold text-white mb-3 leading-tight">
                      {project.title}
                    </h3>

                    <div className="prose prose-invert prose-sm max-w-none flex-1 overflow-hidden prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1 prose-strong:text-white prose-em:text-gray-200">
                      <ReactMarkdown>{project.simplifiedDescription}</ReactMarkdown>
                    </div>

                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
                        {project.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="inline-block text-xs font-semibold px-2 py-0.5 rounded suika-fallback border"
                            style={{
                              borderColor: 'var(--glow-color-1, rgba(99,130,225,0.5))',
                              color: 'var(--glow-color-1, #93c5fd)',
                              background: 'rgba(0,0,0,0.3)',
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {showViewButton && (
                      <div className="pt-2 border-t border-white/10 mt-auto">
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onViewProject(); }}
                          className="bg-royal-500 hover:bg-royal-600 text-white"
                        >
                          <ExternalLink size={13} className="mr-1.5" />
                          View Full Project
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
