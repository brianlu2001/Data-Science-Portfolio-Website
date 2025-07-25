import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Github, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";
import { Project, ProjectFile } from "@shared/schema";
import { useEffect, useState, useRef } from "react";
import { useAnalytics } from "@/utils/analytics";

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { trackPageViewDebounced, trackProjectClick } = useAnalytics();

  // Track page view
  useEffect(() => {
    if (id) {
      trackPageViewDebounced(`/projects/${id}`);
    }
  }, [id, trackPageViewDebounced]);
  
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
    enabled: !!id,
  });

  const { data: projectFiles = [] } = useQuery<ProjectFile[]>({
    queryKey: ["/api/projects", id, "files"],
    enabled: !!id,
  });

  // Use project URL directly from the database
  useEffect(() => {
    if (project?.projectUrl) {
      setReportUrl(project.projectUrl);
    }
  }, [project]);

  const getReportType = (url: string) => {
    return url.endsWith('.pdf') ? 'pdf' : 'html';
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen neural-network-bg flex items-center justify-center">
        <NeuralNetworkBackground />
        <div className="glass-effect rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-500 mx-auto"></div>
          <p className="text-gray-300 mt-4 text-center">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen neural-network-bg flex items-center justify-center">
        <NeuralNetworkBackground />
        <div className="glass-effect rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
          <p className="text-gray-300 mb-6">The project you're looking for doesn't exist.</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-royal-500 hover:bg-royal-600 text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Portfolio
          </Button>
        </div>
      </div>
    );
  }

  const displayDescription = project.fullDescription;

  return (
    <div className="min-h-screen neural-network-bg">
      <NeuralNetworkBackground />
      <header className="glass-effect border-b border-gray-600 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Portfolio
            </Button>
            
            <div className="flex gap-3">
              {reportUrl && (
                <Button
                  onClick={() => {
                    trackProjectClick(parseInt(id!), 'report');
                    window.open(reportUrl, '_blank');
                  }}
                  className="bg-royal-500 hover:bg-royal-600 text-white"
                >
                  <FileText size={16} className="mr-2" />
                  View Full Report
                </Button>
              )}
              {project.githubUrl && (
                <Button
                  onClick={() => {
                    trackProjectClick(parseInt(id!), 'github');
                    window.open(project.githubUrl, '_blank');
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:text-white"
                >
                  <Github size={16} className="mr-2" />
                  GitHub
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <div className="glass-effect rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 suika-fallback">
              {project.title}
            </h1>
            <p 
              className="text-gray-300 leading-relaxed text-lg"
              dangerouslySetInnerHTML={{
                __html: displayDescription
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br>')
              }}
            />
            
            <div className="flex flex-wrap gap-2 mt-6">
              {project.technologies.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-royal-500/20 text-royal-300 text-sm rounded-full border border-royal-500/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {project.imageUrl && (
            <Card className="glass-effect border-gray-600 mb-8">
              <CardContent className="p-6">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-auto rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {reportUrl && (
            <Card className="glass-effect border-gray-600 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-white suika-fallback">Full Project Report</h2>
                </div>
                
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                  {getReportType(reportUrl) === 'pdf' ? (
                    <div className="w-full h-[800px] relative">
                      {!pdfError ? (
                        <iframe
                          ref={iframeRef}
                          src={reportUrl}
                          className="w-full h-full"
                          title={`${project.title} Report`}
                          style={{ border: 'none' }}
                          onLoad={() => {
                            // Check if PDF loaded successfully
                            if (iframeRef.current) {
                              try {
                                // Try to access the content to see if it loaded
                                const doc = iframeRef.current.contentDocument;
                                if (!doc || doc.body.innerHTML === '') {
                                  setPdfError(true);
                                }
                              } catch (e) {
                                // Cross-origin error means PDF is loading properly
                                console.log('PDF loading (cross-origin expected)');
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8">
                          <div className="text-center">
                            <h3 className="text-xl font-semibold text-white mb-2">Preview Not Available</h3>
                            <p className="text-gray-400 mb-4">
                              Unable to display the report preview. Open it in a new tab for better viewing.
                            </p>
                            <div className="flex gap-3 justify-center">
                              <Button
                                onClick={() => window.open(reportUrl, '_blank')}
                                className="bg-royal-500 hover:bg-royal-600 text-white"
                              >
                                <ExternalLink size={16} className="mr-2" />
                                Open in New Tab
                              </Button>
                              <Button
                                onClick={() => setPdfError(false)}
                                variant="outline"
                                className="border-gray-600 text-gray-400 hover:text-white"
                              >
                                Try Preview Again
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          onClick={() => window.open(reportUrl, '_blank')}
                          size="sm"
                          className="bg-royal-500/90 hover:bg-royal-600 text-white shadow-lg"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-[800px] relative">
                      <iframe
                        src={reportUrl}
                        className="w-full h-full"
                        title={`${project.title} Report`}
                        style={{ border: 'none' }}
                        onError={() => {
                          // Show fallback for HTML reports that fail to load
                          const container = document.createElement('div');
                          container.className = 'w-full h-full flex flex-col items-center justify-center p-8';
                          container.innerHTML = `
                            <div class="text-center">
                              <h3 class="text-xl font-semibold text-white mb-2">Report Preview Unavailable</h3>
                              <p class="text-gray-400 mb-4">Unable to load the report preview. Click below to open it in a new tab.</p>
                              <button onclick="window.open('${reportUrl}', '_blank')" class="bg-royal-500 hover:bg-royal-600 text-white px-4 py-2 rounded flex items-center justify-center">
                                <span>Open in New Tab</span>
                              </button>
                            </div>
                          `;
                        }}
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          onClick={() => window.open(reportUrl, '_blank')}
                          size="sm"
                          className="bg-royal-500/90 hover:bg-royal-600 text-white shadow-lg"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {projectFiles.length > 0 && (
            <Card className="glass-effect border-gray-600">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Additional Files</h2>
                <div className="space-y-3">
                  {projectFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <span className="text-gray-300">{file.filename}</span>
                      <Button
                        onClick={() => window.open(file.fileUrl, '_blank')}
                        size="sm"
                        className="bg-royal-500 hover:bg-royal-600 text-white"
                      >
                        <ExternalLink size={14} className="mr-2" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}