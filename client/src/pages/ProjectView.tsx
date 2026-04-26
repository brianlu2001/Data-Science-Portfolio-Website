import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";
import { Project } from "@shared/schema";
import { useEffect, useState, useRef } from "react";
import { useAnalytics } from "@/utils/analytics";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { trackPageViewDebounced, trackProjectClick } = useAnalytics();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (id && !isAuthenticated) {
      trackPageViewDebounced(`/projects/${id}`);
    }
  }, [id, trackPageViewDebounced, isAuthenticated]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: [`/api/project-by-id?id=${id}`],
    enabled: !!id,
  });

  useEffect(() => {
    if (project?.projectUrl) {
      setReportUrl(project.projectUrl.replace(/ /g, '%20'));
    }
  }, [project]);

  const getReportType = (url: string) => (url.endsWith('.pdf') ? 'pdf' : 'html');

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
            onClick={() => navigate('/')}
            className="bg-royal-500 hover:bg-royal-600 text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Portfolio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neural-network-bg">
      <Helmet>
        <title>{project.title} | Brian Lu AI/ML Portfolio</title>
        <meta name="description" content={project.simplifiedDescription || project.title} />
        <meta property="og:title" content={`${project.title} | Brian Lu AI/ML Portfolio`} />
        <meta property="og:description" content={project.simplifiedDescription || project.title} />
        <meta property="og:url" content={`https://www.luki90.com/projects/${id}`} />
        {project.imageUrl && <meta property="og:image" content={`https://www.luki90.com${project.imageUrl}`} />}
        <link rel="canonical" href={`https://www.luki90.com/projects/${id}`} />
      </Helmet>
      <NeuralNetworkBackground />
      <header className="glass-effect border-b border-gray-600 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Portfolio
            </Button>

            <div className="flex gap-3">
              {reportUrl && (
                <Button
                  onClick={() => {
                    if (id && !isAuthenticated) trackProjectClick(parseInt(id), 'report');
                    window.open(reportUrl!, '_blank');
                  }}
                  className="bg-royal-500 hover:bg-royal-600 text-white"
                >
                  <FileText size={16} className="mr-2" />
                  View Full Report
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
            <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg prose-strong:text-white prose-em:text-gray-200">
              <ReactMarkdown>{project.fullDescription}</ReactMarkdown>
            </div>

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
                    <div className="w-full md:h-[800px] h-[calc(100vh-100px)] relative overflow-hidden">
                      {!pdfError ? (
                        <iframe
                          ref={iframeRef}
                          src={reportUrl}
                          className="w-full h-full"
                          title={`${project.title} Report`}
                          style={{
                            border: 'none',
                            transform: isMobile ? 'scale(0.4)' : 'scale(1)',
                            transformOrigin: isMobile ? 'top left' : 'center',
                            width: isMobile ? '250%' : '100%',
                            height: isMobile ? '250%' : '100%',
                            touchAction: 'manipulation',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            WebkitTouchCallout: 'none'
                          }}
                          onLoad={() => {
                            if (iframeRef.current) {
                              try {
                                const doc = iframeRef.current.contentDocument;
                                if (!doc || doc.body.innerHTML === '') {
                                  setPdfError(true);
                                }
                              } catch {
                                // Cross-origin — PDF is loading as expected
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
                          className="bg-gray-800/95 hover:bg-royal-600 text-gray-200 hover:text-white border border-gray-600 hover:border-royal-500 shadow-lg backdrop-blur-sm transition-all duration-200"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full md:h-[800px] h-[calc(100vh-100px)] relative overflow-hidden">
                      <iframe
                        src={reportUrl}
                        className="w-full h-full"
                        title={`${project.title} Report`}
                        style={{
                          border: 'none',
                          transform: isMobile ? 'scale(0.4)' : 'scale(1)',
                          transformOrigin: isMobile ? 'top left' : 'center',
                          width: isMobile ? '250%' : '100%',
                          height: isMobile ? '250%' : '100%',
                          touchAction: 'manipulation',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          WebkitTouchCallout: 'none'
                        }}
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          onClick={() => window.open(reportUrl, '_blank')}
                          size="sm"
                          className="bg-gray-800/95 hover:bg-royal-600 text-gray-200 hover:text-white border border-gray-600 hover:border-royal-500 shadow-lg backdrop-blur-sm transition-all duration-200"
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
        </motion.div>
      </main>
    </div>
  );
}
