
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Project } from "@shared/schema";
import { useRef } from "react";
import { useMagicalGlow } from "@/hooks/useMagicalGlow";

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export default function ProjectCard({ project, isExpanded, onToggleExpanded }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const magicalGlow = useMagicalGlow({
    imageUrl: project.imageUrl,
    projectId: project.id,
    enableSound: true,
    enableShimmer: true,
    intensity: 1.2,
  });

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
          <Card className="glass-effect border-gray-600 overflow-hidden group hover:shadow-2xl hover:shadow-royal-500/20 transition-all duration-300 h-full flex flex-col">
            <div className="aspect-video overflow-hidden flex-shrink-0">
              <img
                src={project.imageUrl || 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=600'}
                alt={project.title}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={onToggleExpanded}
              />
            </div>

            <CardContent className="p-6 flex flex-col flex-1">
              {/* Title + chevron — title wraps naturally, no fixed height */}
              <div className="flex justify-between items-start gap-2 mb-3">
                <h3 className="suika-fallback text-lg xl:text-xl font-bold text-white leading-tight">
                  {project.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpanded}
                  className="text-gray-400 hover:text-white flex-shrink-0 mt-0.5"
                >
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </Button>
              </div>

              {/* Category badge */}
              {project.category && (
                <div className="mb-2">
                  <span className="inline-block bg-blue-900 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full suika-fallback">
                    {project.category}
                  </span>
                </div>
              )}

              {/* Tech tags — pushed to bottom so they never overlap the title */}
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
      </div>
    </div>
  );
}
